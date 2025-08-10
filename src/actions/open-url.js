import openInBrowser from './_open.js';

export function openUrl(rawUrl) {
  if (!rawUrl) {
    console.log('❗ URL не найден в команде.');
    return;
  }
  // Добавим https:// если пользователь сказал просто "youtube.com"
  let url = String(rawUrl).trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  console.log(`🌐 Открываю: ${url}`);
  openInBrowser(url);
}
