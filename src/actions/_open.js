import { exec } from 'node:child_process';
import os from 'node:os';

// Кроссплатформенно открыть URL в браузере по умолчанию (ESM)
export function openInBrowser(url) {
  if (!url) return;

  const platform = os.platform();
  let cmd;

  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    // через cmd.exe, иначе start не сработает из node
    cmd = `cmd /c start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd);
}

export default openInBrowser;
