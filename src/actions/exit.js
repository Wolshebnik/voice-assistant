import { shutdown } from '../app/shutdown.js';

export async function exitApp() {
  console.log('🛑 Завершаю работу…');
  await shutdown(0); // сначала остановим микрофон, затем выйдем
}
