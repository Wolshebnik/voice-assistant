import cfg from '../config.js';
import { hasVoiceOnset } from '../recognition/energy.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function waitVoiceOnset(ring) {
  const deadline = Date.now() + cfg.COMMAND_VOICE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const s = ring.takeLastSeconds(0.4);
    if (hasVoiceOnset(s)) return true;
    await sleep(cfg.COMMAND_VOICE_CHECK_EVERY_MS);
  }
  return false;
}
