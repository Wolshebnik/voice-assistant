import { startCaptureToRing } from './capture.js';
import { createRingBuffer } from './ring-buffer.js';
import { recognizeSamples } from './recognize.js';

export async function recognizeFromMic(
  recognizer,
  { seconds = 1.5, sampleRate = 16000 } = {}
) {
  const ring = createRingBuffer(seconds + 0.2, sampleRate);
  const cap = startCaptureToRing(ring);
  try {
    await new Promise((r) => setTimeout(r, seconds * 1000));
    const slice = ring.takeLastSeconds(seconds);
    const text = recognizeSamples(recognizer, slice, sampleRate);
    return text;
  } finally {
    await cap.stop();
  }
}
