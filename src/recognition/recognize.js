/**
 * Распознаёт Float32Array (16kHz mono) через offline recognizer.
 * Возвращает строку. Безопасно обрабатывает пустые/короткие срезы.
 */
export function recognizeSamples(recognizer, samples, sampleRate = 16000) {
  try {
    if (!samples || samples.length === 0) return '';

    const stream = recognizer.createStream();
    stream.acceptWaveform(sampleRate, samples);
    recognizer.decode(stream);
    const { text } = recognizer.getResult(stream);
    if (typeof stream.free === 'function') stream.free();
    return (text || '').trim();
  } catch (err) {
    console.error('recognizeSamples error:', err);
    return '';
  }
}
