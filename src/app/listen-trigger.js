import { recognizeFromMic, hasWakeWord } from '../recognition/index.js';
import cfg from '../config.js';

/**
 * Записывает короткий кусок и проверяет триггер-слово.
 * Возвращает true/false.
 */
export async function listenForTrigger(recognizer, seconds = cfg.TRIGGER_SEC) {
  // без лишних логов, чтобы в цикле не шуметь
  const text = await recognizeFromMic(recognizer, { seconds });
  return hasWakeWord(text, cfg.WAKE_WORD);
}
