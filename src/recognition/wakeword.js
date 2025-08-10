export function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasWakeWord(text, wake = 'андрон') {
  return norm(text).includes(norm(wake));
}
