import { run } from './app/main.js';

process.on('unhandledRejection', (reason) => {
  console.error('⚠️  UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️  UncaughtException:', err);
});

run().catch((err) => {
  console.error('Fatal run() error:', err);
  process.exit(1);
});
