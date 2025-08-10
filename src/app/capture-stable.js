import cfg from '../config.js';
import { recognizeSamples } from '../recognition/recognize.js';
import { normalizeToRms } from './audio-utils.js';
import { sleep } from './sleep.js';

export async function captureByStability(recognizer, ring) {
  const winSec = cfg.COMMAND?.STABLE?.WINDOW_SEC ?? 2.6;
  const pollMs = cfg.COMMAND?.STABLE?.POLL_MS ?? 220;
  const stableItersNeed = Math.max(2, cfg.COMMAND?.STABLE?.STABLE_ITERS ?? 3);
  const preRoll = Math.max(0, cfg.COMMAND_PRE_ROLL_SEC ?? 0);

  let prev = '';
  let stableIters = 0;
  let best = '';
  const start = Date.now();
  const maxMs = (cfg.VAD?.MAX_COMMAND_SEC ?? 6) * 1000;

  while (Date.now() - start < maxMs) {
    await sleep(pollMs);
    const slice = ring.takeLastSeconds(winSec);
    const text = recognizeSamples(
      recognizer,
      normalizeToRms(slice, 0.035),
      ring.sampleRate
    ).trim();
    if (text) best = text;
    if (text && text === prev) {
      stableIters += 1;
      if (stableIters >= stableItersNeed) {
        const totalSec = preRoll + winSec;
        const finalSlice = ring.takeLastSeconds(totalSec);
        return recognizeSamples(
          recognizer,
          normalizeToRms(finalSlice, 0.035),
          ring.sampleRate
        );
      }
    } else {
      stableIters = 0;
      prev = text;
    }
  }
  return best;
}
