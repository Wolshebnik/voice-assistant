import cfg from '../config.js';

export function rms(x) {
  if (!x || x.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
}

export function hasVoiceOnset(slice) {
  const { MIN_SAMPLES } = cfg.ENERGY_GATE;
  if (!slice || slice.length < (MIN_SAMPLES ?? 0)) return false;
  return rms(slice) >= (cfg.COMMAND_RMS_ONSET ?? 0.0065);
}
