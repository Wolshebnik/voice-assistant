// src/recognition/ring-buffer.js
// Надёжное кольцо для Float32 PCM.
// Хранит последние N секунд и безопасно отдаёт “последние X секунд”.

export function createRingBuffer(seconds, sampleRate) {
  const sr = Math.max(1, Math.floor(sampleRate || 16000));
  const size = Math.max(1, Math.floor((seconds || 1) * sr));
  const buffer = new Float32Array(size);

  let writeIndex = 0; // куда будем писать следующий сэмпл
  let length = 0; // сколько валидных сэмплов реально в буфере (<= size)

  function write(samples) {
    if (!samples || !samples.length) return;
    let n = samples.length;

    // Если пришло больше, чем размер — оставляем только хвост
    if (n >= size) {
      buffer.set(samples.subarray(n - size));
      writeIndex = 0; // всё перезаписали, следующий слот — 0
      length = size;
      return;
    }

    // Пишем в хвост до конца массива
    const tail = Math.min(n, size - writeIndex);
    if (tail > 0) {
      buffer.set(samples.subarray(0, tail), writeIndex);
    }

    // Если не влезло — дописываем с начала
    const rem = n - tail;
    if (rem > 0) {
      buffer.set(samples.subarray(tail, tail + rem), 0);
    }

    writeIndex = (writeIndex + n) % size;
    length = Math.min(size, length + n);
  }

  function takeLastSeconds(sec) {
    const need = Math.floor((Number(sec) || 0) * sr);
    if (!isFinite(need) || need <= 0) return new Float32Array(0);

    const have = Math.min(size, length);
    if (have === 0) return new Float32Array(0);

    const n = Math.min(need, have);
    const out = new Float32Array(n);

    const end = writeIndex; // конец данных = позиция следующей записи
    const start = (end - n + size) % size; // начало окна

    if (start < end) {
      // Окно не пересекает границу
      out.set(buffer.subarray(start, end), 0);
    } else {
      // Окно пересекает границу
      const first = size - start;
      out.set(buffer.subarray(start, size), 0);
      out.set(buffer.subarray(0, end), first);
    }

    return out;
  }

  function clear() {
    buffer.fill(0);
    writeIndex = 0;
    length = 0;
  }

  return {
    sampleRate: sr,
    size,
    write,
    takeLastSeconds,
    clear,
  };
}
