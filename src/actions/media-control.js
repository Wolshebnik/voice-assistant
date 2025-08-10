import os from 'node:os';
import { exec } from 'node:child_process';

function sendKeyMac(key) {
  exec(`osascript -e 'tell application "System Events" to key code ${key}'`);
}

function sendKeyWindows(key) {
  // В PowerShell: sendkeys через WScript
  const script = `
    $wshell = New-Object -ComObject wscript.shell
    $wshell.SendKeys("${key}")
  `;
  exec(`powershell -Command "${script}"`);
}

export function mediaPause() {
  console.log('⏯ Пауза/воспроизведение');
  const platform = os.platform();
  if (platform === 'darwin') {
    sendKeyMac(49); // пробел
  } else if (platform === 'win32') {
    sendKeyWindows(' ');
  }
}

export function mediaForward() {
  console.log('⏩ Перемотка вперёд');
  const platform = os.platform();
  if (platform === 'darwin') {
    sendKeyMac(124); // стрелка вправо
  } else if (platform === 'win32') {
    sendKeyWindows('{RIGHT}');
  }
}

export function mediaBackward() {
  console.log('⏪ Перемотка назад');
  const platform = os.platform();
  if (platform === 'darwin') {
    sendKeyMac(123); // стрелка влево
  } else if (platform === 'win32') {
    sendKeyWindows('{LEFT}');
  }
}

// Шаг перемотки одной стрелкой очень зависит от приложения/сайта.
// Обычно: YouTube — 5 сек (лево/право), Shift+> / < — скорость, J/L — 10 сек.
// Для простоты считаем по 5 секунд за одно нажатие стрелки.
const DEFAULT_SEEK_STEP_SEC = 5;

function pressArrowNTimes(direction, times, intervalMs = 100) {
  return new Promise((resolve) => {
    let count = 0;
    const platform = os.platform();
    const timer = setInterval(() => {
      count += 1;
      if (platform === 'darwin') {
        sendKeyMac(direction === 'right' ? 124 : 123);
      } else if (platform === 'win32') {
        sendKeyWindows(direction === 'right' ? '{RIGHT}' : '{LEFT}');
      }
      if (count >= times) {
        clearInterval(timer);
        resolve();
      }
    }, intervalMs);
  });
}

export async function mediaSeekBy(seconds) {
  const raw = Number(seconds) || 0;
  const dir = raw >= 0 ? 'right' : 'left';
  const secAbs = Math.max(1, Math.floor(Math.abs(raw)));
  const times = Math.max(1, Math.round(secAbs / DEFAULT_SEEK_STEP_SEC));
  console.log(
    `⏩ Перемотка ${
      dir === 'right' ? 'вперёд' : 'назад'
    } на ~${secAbs} сек (${times}× стрелка ${dir}).`
  );
  await pressArrowNTimes(dir, times);
}
