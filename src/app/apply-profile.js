import cfg from '../config.js';

export function applyProfile() {
  let profName = null;
  if (cfg.voiceProfile && typeof cfg.voiceProfile === 'object') {
    for (const k of ['quiet', 'noisy', 'echo']) {
      if (cfg.voiceProfile[k]) {
        profName = k;
        break;
      }
    }
  }
  if (!profName) profName = process.env.VOICE_PROFILE || cfg.PROFILE;
  if (profName && cfg.PROFILES && cfg.PROFILES[profName]) {
    const p = cfg.PROFILES[profName];
    if (p.COMMAND_RMS_ONSET != null)
      cfg.COMMAND_RMS_ONSET = p.COMMAND_RMS_ONSET;
    if (p.COMMAND_PRE_ROLL_SEC != null)
      cfg.COMMAND_PRE_ROLL_SEC = p.COMMAND_PRE_ROLL_SEC;
    if (p.TTS?.MUTE_WHILE_SPEAK_MS != null)
      cfg.TTS.MUTE_WHILE_SPEAK_MS = p.TTS.MUTE_WHILE_SPEAK_MS;
    if (p.VAD) {
      Object.assign(cfg.VAD, {
        SILENCE_MS: p.VAD.SILENCE_MS ?? cfg.VAD.SILENCE_MS,
        MIN_COMMAND_MS: p.VAD.MIN_COMMAND_MS ?? cfg.VAD.MIN_COMMAND_MS,
        OFFSET_FACTOR: p.VAD.OFFSET_FACTOR ?? cfg.VAD.OFFSET_FACTOR,
        POST_ROLL_MS: p.VAD.POST_ROLL_MS ?? cfg.VAD.POST_ROLL_MS,
        NOISE_MULT: p.VAD.NOISE_MULT ?? cfg.VAD.NOISE_MULT,
        MIN_FLOOR_RMS: p.VAD.MIN_FLOOR_RMS ?? cfg.VAD.MIN_FLOOR_RMS,
      });
    }
    if (p.COMMAND?.STABLE) {
      Object.assign(cfg.COMMAND.STABLE, p.COMMAND.STABLE);
    }
    console.log(`🔧 Профиль настроек активирован: ${profName}`);
  }
}
