import * as sherpa from 'sherpa-onnx';
import fs from 'node:fs';
import cfg from '../config.js';
import { recognizeSamples } from './recognize.js';
import { hasWakeWord } from './wakeword.js';

// ===================
// Helpers (минимум логики — чтобы не мешать распознаванию)
// ===================
function rms(x) {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
}

function preemphasis(x, a = 0.97) {
  const y = new Float32Array(x.length);
  if (x.length === 0) return y;
  y[0] = x[0];
  for (let i = 1; i < x.length; i++) y[i] = x[i] - a * x[i - 1];
  return y;
}

function normalizeToRms(x, target = 0.03) {
  const cur = rms(x);
  if (!isFinite(cur) || cur < 1e-6) return x;
  const g = target / cur;
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    let v = x[i] * g;
    if (v > 1) v = 1;
    else if (v < -1) v = -1;
    y[i] = v;
  }
  return y;
}

function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a, b) {
  const n = a.length,
    m = b.length;
  if (Math.abs(n - m) > 2) return 99;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[n][m];
}

function fuzzyHasWake(text, wake) {
  const t = norm(text);
  const w = norm(wake);
  if (!t) return false;
  if (t.includes(w)) return true;
  const tokens = t.split(' ');
  for (const tok of tokens) {
    if (tok.length >= 4 && editDistance(tok, w) <= 1) return true;
  }
  return false;
}

// ===================
// Main
// ===================
export function createWakeDetector(recognizer) {
  const wakeWord = (cfg.WAKE_WORD || 'андрон').toLowerCase();

  // БАЗА: максимально близко к той версии, что у тебя работала стабильно
  const sr = cfg.KWS?.SAMPLE_RATE ?? 16000;
  const cooldown = cfg.KWS?.COOLDOWN_MS ?? 800;
  const baseWin = cfg.KWS?.WINDOW_SEC ?? cfg.TRIGGER_SEC ?? 1.5;
  const overscan = cfg.TRIGGER_OVERSCAN_SEC ?? 0.3;
  const winSec = baseWin + overscan; // берём немного с хвостом

  // Немного перекрытий, но не слишком часто, чтобы не рвать слово на «буквы»
  const stepSec = Math.max(0.15, cfg.TRIGGER_OVERLAP_SEC ?? 0.15);
  const checksN = Math.max(1, cfg.TRIGGER_CHECKS ?? 3);
  const requiredHits = Math.max(
    1,
    Math.min(checksN, cfg.TRIGGER_REQUIRED_HITS ?? 1)
  );

  // Улучшалки — по умолчанию выключены, кроме FUZZY. Никаких фильтров по длине текста.
  const TUNE = {
    PREEMPH: false, // пусть энергия/форма останутся «как есть»
    NORMALIZE: false, // не меняем уровень (ASR сам справляется)
    FUZZY: true, // терпим «андрoн/андрону/андрн»
    DEBUG_TEXT: false, // при необходимости поставь true, чтобы смотреть текст окна
    TARGET_RMS: 0.03,
  };

  let lastHit = 0;
  let kws = null;
  let usingKws = false;

  // Оставляем поддержку реального KWS (если появится ru-модель)
  const canInitKws =
    cfg.KWS?.ENABLED &&
    cfg.KWS?.MODEL_DIR &&
    fs.existsSync(cfg.KWS.MODEL_DIR) &&
    typeof sherpa.createKws === 'function';

  if (canInitKws) {
    try {
      kws = sherpa.createKws({
        model: cfg.KWS.MODEL_DIR,
        provider: cfg.PROVIDER ?? 'cpu',
        numThreads: cfg.NUM_THREADS ?? 1,
      });
      usingKws = !!kws;
      console.log('🔊 KWS инициализирован и будет использоваться в дежурке.');
    } catch (e) {
      console.warn(
        '⚠️  KWS init failed, falling back to ASR. Reason:',
        e?.message || e
      );
      kws = null;
      usingKws = false;
    }
  }

  return {
    isWake(slice, now = Date.now()) {
      if (!slice || slice.length === 0) return false;
      if (now - lastHit < cooldown) return false;

      // --- ВЕТКА 1: настоящий KWS
      if (usingKws && kws) {
        const need = Math.floor(winSec * sr);
        const start = Math.max(0, slice.length - need);
        const chunk = slice.subarray(start);
        try {
          const score = kws.detect(chunk, sr);
          if (score >= (cfg.KWS?.THRESHOLD ?? 0.5)) {
            lastHit = now;
            return true;
          }
        } catch (_) {}
        return false;
      }

      // --- ВЕТКА 2: ASR-фолбек (стабильная база)
      if (!cfg.KWS?.USE_ASR_FALLBACK) return false;

      // Гейт по энергии — мягкий: не режем слишком рано
      const eg = cfg.ENERGY_GATE || {};
      let x = slice;
      if (eg.ENABLED) {
        const min = eg.MIN_SAMPLES ?? 1200; // чуть мягче
        if (x.length < min) return false;
        if (eg.PREEMPH) x = preemphasis(x, 0.97);
        if (rms(x) < (eg.RMS_THRESHOLD ?? 0.0065)) return false;
      }

      if (TUNE.PREEMPH && !eg.PREEMPH) x = preemphasis(x, 0.97);
      if (TUNE.NORMALIZE) x = normalizeToRms(x, TUNE.TARGET_RMS);

      // Несколько перекрывающихся окон (длинноватых), без фильтра по длине текста
      let hits = 0;
      for (let i = 0; i < checksN; i++) {
        const lenSec = Math.max(0.8, winSec - i * stepSec); // окно не короче 0.8 c
        const need = Math.floor(lenSec * sr);
        const start = Math.max(0, x.length - need);
        const chunk = x.subarray(start);

        const text = (
          recognizeSamples(recognizer, chunk, sr) || ''
        ).toLowerCase();
        if (TUNE.DEBUG_TEXT) console.log('[wake text]', JSON.stringify(text));

        const ok = TUNE.FUZZY
          ? hasWakeWord(text, wakeWord) || fuzzyHasWake(text, wakeWord)
          : hasWakeWord(text, wakeWord);

        if (ok) {
          hits++;
          if (hits >= requiredHits) break;
        }
      }

      const ok = hits >= requiredHits;
      if (ok) lastHit = now;
      return ok;
    },
  };
}
