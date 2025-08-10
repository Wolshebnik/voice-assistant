import os from 'node:os';
import say from 'say';

// Обёртка над `say` с промисом и выбором голоса под ОС
export function speak(
  text,
  {
    voiceMac = null, // пример: 'Milena' или 'Yuri'
    voiceWin = null, // пример: 'Microsoft Irina Desktop'
    rate = null, // слова в минуту; macOS ~200 по умолчанию
  } = {}
) {
  const platform = os.platform();
  const voice =
    platform === 'darwin' ? voiceMac : platform === 'win32' ? voiceWin : null;
  return new Promise((resolve, reject) => {
    try {
      // say.speak(text, voice?, speed?, cb)
      say.speak(
        String(text ?? ''),
        voice || undefined,
        rate || undefined,
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

// Остановить текущую озвучку (на случай прерывания)
export function stopSpeak() {
  try {
    say.stop();
  } catch {}
}
