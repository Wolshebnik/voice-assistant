import { spawn } from 'node:child_process';

export function startCaptureToRing(ring) {
  const args = [
    '-d',
    '-r',
    '16000',
    '-c',
    '1',
    '-b',
    '16',
    '-e',
    'signed-integer',
    '-t',
    'raw',
    '-',
  ];

  const ps = spawn('sox', args, { stdio: ['ignore', 'pipe', 'inherit'] });
  let closed = false;

  ps.stdout.on('data', (buf) => {
    const int16 = new Int16Array(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength / 2
    );
    const f32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768;
    ring.write(f32);
  });

  ps.on('close', (code) => {
    closed = true;
  });

  return {
    stop() {
      if (closed) return Promise.resolve();
      return new Promise((resolve) => {
        const done = () => resolve();
        ps.once('close', done);
        try {
          ps.kill('SIGTERM');
        } catch {}
        setTimeout(() => {
          if (!closed) {
            try {
              ps.kill('SIGKILL');
            } catch {}
          }
        }, 600);
      });
    },
  };
}
