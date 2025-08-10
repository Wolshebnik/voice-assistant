import cfg from '../config.js';
import { rms } from '../recognition/energy.js';

export async function captureByVad(ring) {
  const frameMs = Math.max(40, cfg.VAD.FRAME_MS ?? 80);
  const silenceMsNeed = Math.max(200, cfg.VAD.SILENCE_MS ?? 600);
  const minMs = Math.max(0, cfg.VAD.MIN_COMMAND_MS ?? 350);
  const maxSec = Math.max(1, cfg.VAD.MAX_COMMAND_SEC ?? 6);

  const noiseWinSec = 0.6;
  const noiseFloor = Math.max(
    cfg.VAD.MIN_FLOOR_RMS ?? 0.0025,
    rms(ring.takeLastSeconds(noiseWinSec))
  );
  const onsetThreshold = Math.max(
    cfg.COMMAND_RMS_ONSET ?? 0.0065,
    noiseFloor * (cfg.VAD.NOISE_MULT ?? 3.0)
  );
  const offsetThreshold = onsetThreshold * (cfg.VAD.OFFSET_FACTOR ?? 0.55);
  const preRoll = Math.max(0, cfg.COMMAND_PRE_ROLL_SEC ?? 0);
  const postRollMs = Math.max(0, cfg.VAD.POST_ROLL_MS ?? 220);

  let firstVoiceAt = null;
  let lastVoiceAt = null;
  let silenceStreak = 0;
  const loopStart = Date.now();
  while (true) {
    await new Promise((r) => setTimeout(r, frameMs));
    const frame = ring.takeLastSeconds(frameMs / 1000);
    const level = rms(frame);
    const now = Date.now();

    if (level >= onsetThreshold && firstVoiceAt == null) {
      firstVoiceAt = now;
      lastVoiceAt = now;
      silenceStreak = 0;
      continue;
    }

    if (firstVoiceAt != null) {
      if (level >= offsetThreshold) {
        lastVoiceAt = now;
        silenceStreak = 0;
      } else {
        silenceStreak += frameMs;
      }
    }

    const elapsedFromStartSec = (now - loopStart) / 1000;
    const durMs = Math.max(0, (lastVoiceAt ?? now) - (firstVoiceAt ?? now));
    const hasMin = durMs >= minMs;
    const enoughSilence = silenceStreak >= silenceMsNeed;

    if (
      (firstVoiceAt != null && hasMin && enoughSilence) ||
      elapsedFromStartSec >= maxSec
    ) {
      break;
    }
  }

  const durMsFinal =
    firstVoiceAt == null
      ? (cfg.COMMAND_SEC ?? 2.2) * 1000
      : Math.max(
          minMs,
          Math.min(
            (cfg.VAD.MAX_COMMAND_SEC ?? 6) * 1000,
            (lastVoiceAt ?? Date.now()) - firstVoiceAt
          )
        );
  const totalSec = preRoll + durMsFinal / 1000 + postRollMs / 1000;
  return { totalSec };
}
