export function createRingBuffer(seconds = 10, sampleRate = 16000) {
  const capacity = Math.max(1, Math.floor(seconds * sampleRate));
  const data = new Float32Array(capacity);

  let writeIdx = 0;
  let size = 0;

  return {
    sampleRate,
    write(chunk) {
      if (!chunk || !chunk.length) return;
      if (chunk.length >= capacity) {
        data.set(chunk.subarray(chunk.length - capacity));
        writeIdx = 0;
        size = capacity;
        return;
      }
      const n = chunk.length;
      const first = Math.min(n, capacity - writeIdx);
      data.set(chunk.subarray(0, first), writeIdx);
      const rest = n - first;
      if (rest > 0) {
        data.set(chunk.subarray(first, first + rest), 0);
      }
      writeIdx = (writeIdx + n) % capacity;
      size = Math.min(capacity, size + n);
    },
    takeLastSeconds(sec) {
      if (size === 0) return new Float32Array(0);
      const need = Math.max(1, Math.floor(sec * sampleRate));
      const count = Math.min(need, size);
      const out = new Float32Array(count);
      const start = (writeIdx - count + capacity) % capacity;
      if (start + count <= capacity) {
        out.set(data.subarray(start, start + count), 0);
      } else {
        const first = capacity - start;
        out.set(data.subarray(start, capacity), 0);
        out.set(data.subarray(0, count - first), first);
      }
      return out;
    },
    clear() {
      writeIdx = 0;
      size = 0;
    },
    get length() {
      return size;
    },
    get capacity() {
      return capacity;
    },
  };
}
