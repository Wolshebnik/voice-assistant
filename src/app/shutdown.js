// Централизованное завершение: сначала стопим все хендлеры, потом process.exit.
const hooks = [];

/** Зарегистрировать async-хук, который выполнится при завершении */
export function registerOnShutdown(fn) {
  if (typeof fn === 'function') hooks.push(fn);
}

/** Мягкое завершение процесса */
export async function shutdown(code = 0) {
  for (const fn of hooks) {
    try {
      const ret = fn();
      if (ret && typeof ret.then === 'function') {
        await ret; // дождаться async остановки (например, sox)
      }
    } catch (e) {
      console.error('shutdown hook error:', e);
    }
  }
  process.exit(code);
}
