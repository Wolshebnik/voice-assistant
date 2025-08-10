import { resolve } from 'node:path';

export default {
  // === ASR (sherpa-onnx) ===
  MODEL_DIR: resolve('models/ru/sherpa-onnx-small-zipformer-ru-2024-09-18'),
  PROVIDER: 'cpu',
  ASR_DEBUG: false, // подробные логи sherpa-onnx

  // стабильные настройки инициализации
  DECODING_METHOD: 'greedy_search',
  NUM_THREADS: 1,
  MAX_ACTIVE_PATHS: 4,

  // === Wake word ===
  WAKE_WORD: 'андрон',

  // === Ring buffer ===
  RING_SECONDS: 12,

  // === Дежурка (окно проверки триггера) ===
  TRIGGER_SEC: 2.0,
  TRIGGER_OVERSCAN_SEC: 0.3,
  TRIGGER_OVERLAP_SEC: 0.15,
  TRIGGER_CHECKS: 3,
  TRIGGER_REQUIRED_HITS: 1,
  TRIGGER_POLL_MS: 800,

  // === Команда после триггера ===
  COMMAND_PRE_ROLL_SEC: 0.4,
  COMMAND_SEC: 2.2, // fallback-длительность, если VAD отключён
  LOOP_PAUSE_MS: 120,

  // === Захват команды: режимы ===
  COMMAND: {
    USE_STABLE: true, // использовать режим стабильности текста вместо чистого VAD
    STABLE: {
      WINDOW_SEC: 2.6, // окно для распознавания в цикле
      POLL_MS: 220, // период опроса стабильности
      STABLE_ITERS: 3, // сколько подряд одинаковых результатов считать стабильностью
    },
  },

  // === Профили настроек (быстрый переключатель) ===
  // Выбор профиля: переменная окружения VOICE_PROFILE=quiet|noisy|echo
  // или ручная установка PROFILE ниже (переменная окружения приоритетнее)
  PROFILE: null,
  // Альтернативный способ выбора профиля прямо в конфиге — через объект-флаги
  // Пример: voiceProfile.noisy = true
  voiceProfile: {
    quiet: false,
    noisy: true,
    echo: false,
  },
  PROFILES: {
    quiet: {
      COMMAND_RMS_ONSET: 0.005,
      COMMAND_PRE_ROLL_SEC: 0.35,
      VAD: {
        SILENCE_MS: 650,
        MIN_COMMAND_MS: 500,
        OFFSET_FACTOR: 0.55,
        POST_ROLL_MS: 260,
        NOISE_MULT: 1.9,
        MIN_FLOOR_RMS: 0.002,
        WINDOW_SEC: undefined,
      },
      COMMAND: { STABLE: { WINDOW_SEC: 2.3, STABLE_ITERS: 2 } },
      TTS: { MUTE_WHILE_SPEAK_MS: 600 },
    },
    noisy: {
      COMMAND_RMS_ONSET: 0.0068,
      COMMAND_PRE_ROLL_SEC: 0.45,
      VAD: {
        SILENCE_MS: 900,
        MIN_COMMAND_MS: 700,
        OFFSET_FACTOR: 0.65,
        POST_ROLL_MS: 350,
        NOISE_MULT: 2.8,
        MIN_FLOOR_RMS: 0.003,
      },
      COMMAND: { STABLE: { WINDOW_SEC: 2.8, STABLE_ITERS: 3 } },
      TTS: { MUTE_WHILE_SPEAK_MS: 750 },
    },
    echo: {
      COMMAND_RMS_ONSET: 0.0062,
      COMMAND_PRE_ROLL_SEC: 0.5,
      VAD: {
        SILENCE_MS: 850,
        MIN_COMMAND_MS: 650,
        OFFSET_FACTOR: 0.6,
        POST_ROLL_MS: 420,
        NOISE_MULT: 2.4,
        MIN_FLOOR_RMS: 0.0025,
      },
      COMMAND: { STABLE: { WINDOW_SEC: 2.6, STABLE_ITERS: 3 } },
      TTS: { MUTE_WHILE_SPEAK_MS: 800 },
    },
  },

  // === Гейт по энергии (детект начала речи) ===
  ENERGY_GATE: {
    ENABLED: true,
    MIN_SAMPLES: 1600,
    RMS_THRESHOLD: 0.0065,
    PREEMPH: false,
  },

  // ожидание начала речи после триггера
  COMMAND_VOICE_TIMEOUT_MS: 3000,
  COMMAND_VOICE_CHECK_EVERY_MS: 120,
  COMMAND_RMS_ONSET: 0.0055,
  COMMAND_RMS_HANG_MS: 120,

  // === VAD (динамическое завершение команды по тишине) ===
  VAD: {
    ENABLED: true,
    FRAME_MS: 80, // размер шага опроса
    SILENCE_MS: 800, // сколько тишины подряд считаем концом речи
    MIN_COMMAND_MS: 600, // минимальная длительность речи перед завершением
    MAX_COMMAND_SEC: 6, // верхняя граница на длину команды (safeguard)
    OFFSET_FACTOR: 0.6, // множитель для порога оффсета (гистерезис)
    POST_ROLL_MS: 320, // сколько тишины после речи ещё включать в окно
    NOISE_MULT: 2.2, // множитель к шумовому уровню для порога старта
    MIN_FLOOR_RMS: 0.0025, // минимальный пол порога, чтобы не быть слишком чувствительным
  },

  // === KWS (реальной ru-модели пока нет; используем ASR-фолбек) ===
  KWS: {
    ENABLED: true,
    MODEL_DIR: null,
    SAMPLE_RATE: 16000,
    THRESHOLD: 0.5,
    WINDOW_SEC: 1.5,
    COOLDOWN_MS: 800,
    USE_ASR_FALLBACK: true,
  },

  // === TTS (голосовые ответы) ===
  TTS: {
    ENABLED: true,
    VOICE_MAC: null, // примеры: 'Milena', 'Yuri' (say -v ?)
    VOICE_WIN: 'Microsoft Irina Desktop',
    RATE: null, // null = системная скорость
    MUTE_WHILE_SPEAK_MS: 650,
  },
};
