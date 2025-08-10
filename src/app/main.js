import cfg from '../config.js';
import { createRingBuffer } from '../recognition/ring-buffer.js';
import { startCaptureToRing } from '../recognition/capture.js';
import { recognizeSamples } from '../recognition/recognize.js';
import { createWakeDetector } from '../recognition/kws.js';
import { getOfflineRecognizerOnce } from '../recognition/asr.js';
import { pickWakePhrase } from '../utils/find-command.js';
import { registerOnShutdown, shutdown } from './shutdown.js';
import { speak } from '../tts/speak.js';
import { applyProfile } from './apply-profile.js';
import { sleep } from './sleep.js';
import { normalizeToRms } from './audio-utils.js';
import { captureByStability } from './capture-stable.js';
import { captureByVad } from './capture-vad.js';
import { executeCommand } from './execute-command.js';
import { waitVoiceOnset } from './wait-voice-onset.js';

export async function run() {
  // Применяем профиль настроек
  applyProfile();

  // Мягкое завершение по сигналам
  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));

  // Инициализация офлайн ASR
  const recognizer = getOfflineRecognizerOnce({
    modelDir: cfg.MODEL_DIR,
    provider: cfg.PROVIDER,
    numThreads: cfg.NUM_THREADS,
    decodingMethod: cfg.DECODING_METHOD,
    maxActivePaths: cfg.MAX_ACTIVE_PATHS,
  });

  // Кольцевой буфер + захват микрофона
  const ring = createRingBuffer(cfg.RING_SECONDS, 16000);
  const cap = startCaptureToRing(ring);
  registerOnShutdown(async () => {
    await cap.stop();
  });

  // Детектор триггера
  const wake = createWakeDetector(recognizer);

  console.log(
    `🛡️ Дежурю (ring=${cfg.RING_SECONDS}s). Скажи «${cfg.WAKE_WORD}». (Ctrl+C — выход)`
  );

  while (true) {
    try {
      const slice = ring.takeLastSeconds(cfg.TRIGGER_SEC);
      if (slice.length && wake.isWake(slice)) {
        console.log(`✅ Триггер: «${cfg.WAKE_WORD}»`);

        // Голосовой отклик после триггера — из КОНФИГА КОМАНД
        if (cfg.TTS?.ENABLED) {
          const phrase = pickWakePhrase();
          try {
            await speak(phrase, {
              voiceMac: cfg.TTS.VOICE_MAC,
              voiceWin: cfg.TTS.VOICE_WIN,
              rate: cfg.TTS.RATE,
            });
          } catch (e) {
            console.warn('TTS error:', e?.message || e);
          }
          await sleep(cfg.TTS.MUTE_WHILE_SPEAK_MS ?? 400); // чуть подождём, чтобы не поймать эхо
        }

        // Ждём реальный старт речи по энергии
        const started = await waitVoiceOnset(ring);
        if (!started) {
          console.log('⏳ Команда не началась — возвращаюсь в дежурку.');
          await sleep(cfg.LOOP_PAUSE_MS);
          continue;
        }

        await sleep(cfg.COMMAND_RMS_HANG_MS);

        // Сбор команды: режим стабильности текста (если включён) или VAD/фикс
        let cmdSlice;
        let totalSecUsed;
        if (cfg.COMMAND?.USE_STABLE) {
          // Захват по стабильности текста
          const text = await captureByStability(recognizer, ring);
          await executeCommand(text);
          console.log(`🛡️ Готов. Скажи «${cfg.WAKE_WORD}».`);
          await sleep(cfg.LOOP_PAUSE_MS);
          continue;
        } else if (cfg.VAD?.ENABLED) {
          const { totalSec } = await captureByVad(ring);
          totalSecUsed = totalSec;
          cmdSlice = ring.takeLastSeconds(totalSec);
        } else {
          await sleep((cfg.COMMAND_SEC ?? 2.2) * 1000);
          const totalSec =
            (cfg.COMMAND_PRE_ROLL_SEC ?? 0) + (cfg.COMMAND_SEC ?? 2.2);
          totalSecUsed = totalSec;
          cmdSlice = ring.takeLastSeconds(totalSec);
        }

        // Нормализация уровня для стабильности распознавания
        let cmdText = recognizeSamples(
          recognizer,
          normalizeToRms(cmdSlice, 0.035),
          ring.sampleRate
        );

        // Повторная попытка с чуть большим окном, если текст слишком короткий
        if (!cmdText || cmdText.trim().length < 3) {
          const retrySec = Math.min(
            (totalSecUsed ?? 2.2) + 0.8,
            cfg.VAD?.MAX_COMMAND_SEC ?? 6
          );
          const retrySlice = ring.takeLastSeconds(retrySec);
          cmdText = recognizeSamples(
            recognizer,
            normalizeToRms(retrySlice, 0.035),
            ring.sampleRate
          );
        }
        await executeCommand(cmdText);

        console.log(`🛡️ Готов. Скажи «${cfg.WAKE_WORD}».`);
        await sleep(cfg.LOOP_PAUSE_MS);
        continue;
      }

      await sleep(cfg.TRIGGER_POLL_MS);
    } catch (e) {
      console.error('⚠️ Loop error:', e);
      await sleep(250);
    }
  }
}
