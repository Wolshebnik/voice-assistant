import cfg from '../config.js';
import { actions } from '../actions/index.js';
import { findCommand, pickConfirmPhrase } from '../utils/find-command.js';
import { speak } from '../tts/speak.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function executeCommand(cmdText) {
  console.log('📢 Команда:', cmdText || '(пусто)');
  const m = findCommand(cmdText);
  if (m && actions[m.action]) {
    try {
      if (cfg.TTS?.ENABLED) {
        const confirm = pickConfirmPhrase(m.action);
        if (confirm) {
          try {
            await speak(confirm, {
              voiceMac: cfg.TTS.VOICE_MAC,
              voiceWin: cfg.TTS.VOICE_WIN,
              rate: cfg.TTS.RATE,
            });
          } catch (e) {
            console.warn('TTS error:', e?.message || e);
          }
          await sleep(cfg.TTS.MUTE_WHILE_SPEAK_MS ?? 300);
        }
      }
      console.log(`🚀 Действие: ${m.action}`);
      const ret = actions[m.action](...(m.args || []));
      if (ret && typeof ret.then === 'function') await ret;
      return true;
    } catch (actionErr) {
      console.error('❌ Ошибка действия:', actionErr);
      return false;
    }
  } else {
    console.log('🤷 Команда не распознана/не найдена.');
    if (cfg.TTS?.ENABLED) {
      try {
        await speak('Такой команды нет, сэр', {
          voiceMac: cfg.TTS.VOICE_MAC,
          voiceWin: cfg.TTS.VOICE_WIN,
          rate: cfg.TTS.RATE,
        });
      } catch (e) {
        console.warn('TTS error:', e?.message || e);
      }
      await sleep(cfg.TTS.MUTE_WHILE_SPEAK_MS ?? 300);
    }
    return false;
  }
}
