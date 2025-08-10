import * as sherpa from 'sherpa-onnx';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import cfg from '../config.js';

let recognizerSingleton = null;

export function assertModelDir(modelDir) {
  if (!existsSync(modelDir)) {
    throw new Error(`Модель не найдена: ${modelDir}`);
  }
  const files = ['encoder.onnx', 'decoder.onnx', 'joiner.onnx', 'tokens.txt'];
  for (const f of files) {
    const p = resolve(modelDir, f);
    if (!existsSync(p)) throw new Error(`Нет файла модели: ${p}`);
  }
}

export function createOfflineRecognizer({
  modelDir,
  provider = 'cpu',
  numThreads = 1,
  decodingMethod = 'greedy_search',
  maxActivePaths = 4,
}) {
  assertModelDir(modelDir);

  const recognizer = sherpa.createOfflineRecognizer({
    modelConfig: {
      transducer: {
        encoder: resolve(modelDir, 'encoder.onnx'),
        decoder: resolve(modelDir, 'decoder.onnx'),
        joiner: resolve(modelDir, 'joiner.onnx'),
      },
      tokens: resolve(modelDir, 'tokens.txt'),
      numThreads,
      provider,
      debug: Boolean(cfg.ASR_DEBUG),
    },
    recognizerConfig: {
      decodingMethod,
      maxActivePaths,
    },
  });

  return recognizer;
}

export function getOfflineRecognizerOnce(opts) {
  if (!recognizerSingleton) {
    recognizerSingleton = createOfflineRecognizer(opts);
  }
  return recognizerSingleton;
}
