import commandsConfig from './commands.js';

// нормализация текста
function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Возвращает лучший матч по синонимам: { found, score, synonym }
function bestSynonymMatch(hay, needles) {
  const h = norm(hay);
  let best = { found: false, score: -Infinity, synonym: null };
  for (const n of needles || []) {
    if (!n) continue;
    const nn = norm(n);
    if (!nn) continue;
    const idx = h.indexOf(nn);
    if (idx === -1) continue;
    // Проверим границы слов (в нормализованной строке слова разделены пробелами)
    const beforeOk = idx === 0 || h[idx - 1] === ' ';
    const afterOk = idx + nn.length === h.length || h[idx + nn.length] === ' ';
    let score = nn.length; // длиннее — специфичнее
    if (beforeOk && afterOk) score += 10; // полные границы слова — бонус
    // Бонус за совпадение ближе к началу
    score += Math.max(0, 5 - Math.floor(idx / 5));
    if (score > best.score) best = { found: true, score, synonym: n };
  }
  return best;
}

// простая вытяжка URL из текста (и http/https, и bare-домены)
function extractUrl(text) {
  const m = text.match(/https?:\/\/\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i);
  return m ? m[0] : null;
}

// Преобразование русских числительных в число (простые варианты)
const RU_NUMBER_WORDS = new Map([
  ['ноль', 0],
  ['нуль', 0],
  ['один', 1],
  ['одна', 1],
  ['одно', 1],
  ['два', 2],
  ['две', 2],
  ['три', 3],
  ['четыре', 4],
  ['пять', 5],
  ['шесть', 6],
  ['семь', 7],
  ['восемь', 8],
  ['девять', 9],
  ['десять', 10],
  ['одиннадцать', 11],
  ['двенадцать', 12],
  ['тринадцать', 13],
  ['четырнадцать', 14],
  ['пятнадцать', 15],
  ['шестнадцать', 16],
  ['семнадцать', 17],
  ['восемнадцать', 18],
  ['девятнадцать', 19],
  ['двадцать', 20],
  ['тридцать', 30],
  ['сорок', 40],
  ['пятьдесят', 50],
  ['шестьдесят', 60],
]);

function parseSimpleRussianNumber(tokens) {
  // Пытаемся собрать число из одной или двух слов ("двадцать пять")
  if (!tokens || !tokens.length) return null;
  const t0 = tokens[0];
  const v0 = RU_NUMBER_WORDS.get(t0);
  if (v0 == null) return null;
  if (tokens.length >= 2) {
    const v1 = RU_NUMBER_WORDS.get(tokens[1]);
    if (v1 != null && v0 >= 20 && v0 % 10 === 0) {
      return v0 + v1;
    }
  }
  return v0;
}

function extractDurationSeconds(text) {
  const t = norm(text);
  // 1) цифры + единицы: "на 15 сек", "на 2 минуты", "30 секунд"
  const m1 = t.match(
    /(?:на\s+)?(\d{1,3})\s*(сек|секунды|секунд|с|мин|минуты|минут|м)\b/
  );
  if (m1) {
    const n = parseInt(m1[1], 10);
    const unit = m1[2];
    const isMin = /^(мин|минут)/.test(unit) || unit === 'м';
    return isMin ? n * 60 : n;
  }
  // 2) слова-числительные + единицы: "на пятнадцать секунд", "две минуты"
  const words = t.split(' ');
  let numWordWithoutUnits = null;
  for (let i = 0; i < words.length; i++) {
    const num = parseSimpleRussianNumber(words.slice(i, i + 2));
    if (num != null) {
      const next =
        words[i + 1] && RU_NUMBER_WORDS.has(words[i + 1])
          ? words[i + 2]
          : words[i + 1];
      if (next && /(сек|секун)/.test(next)) return num; // секунды
      if (next && /(мин)/.test(next)) return num * 60; // минуты
      // если единиц нет — запомним и используем как секунды, если ничего лучше не найдём
      if (!next || !/(сек|секун|мин)/.test(next)) {
        if (numWordWithoutUnits == null || num > numWordWithoutUnits) {
          numWordWithoutUnits = num;
        }
      }
    }
  }
  if (numWordWithoutUnits != null) return numWordWithoutUnits;
  // 3) без единиц — будем считать секундами, если рядом триггерная фраза
  const m3 = t.match(/(?:на\s+)?(\d{1,3})\b/);
  if (m3) return parseInt(m3[1], 10);
  return null;
}

/**
 * Возвращает { action, args } или null
 */
export function findCommand(text) {
  if (!text) return null;

  const t = norm(text);
  const items = commandsConfig.commands || [];
  const sec = extractDurationSeconds(text);
  const url = extractUrl(text);

  const candidates = [];
  for (const item of items) {
    if (!item || !item.action) continue;
    const syns = Array.isArray(item.synonyms) ? item.synonyms : [];
    const match = bestSynonymMatch(t, syns);
    if (!match.found) continue;

    let action = item.action;
    const args = [];
    let score = match.score;

    // Специфичные правила преобразования
    if (action === 'openUrl') {
      if (url) args.push(url);
      if (args.length) score += 20; // наличие параметра — плюс
      else score -= 10; // без URL — минус
    }
    if (action === 'forward' || action === 'backward') {
      if (sec != null && isFinite(sec) && sec > 0) {
        action = action === 'forward' ? 'forwardBy' : 'backwardBy';
        args.push(sec);
        score += 50; // параметризованный вариант — приоритетнее
      }
    } else if (action === 'forwardBy' || action === 'backwardBy') {
      if (sec != null && isFinite(sec) && sec > 0) {
        args.push(sec);
        score += 40; // есть число — хорошо
      } else {
        score -= 30; // нет числа для By — понижаем
      }
    }

    candidates.push({ action, args, score });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return { action: best.action, args: best.args };
}

/**
 * Возвращает случайную фразу-подтверждение для заданного действия,
 * либо null, если не задано.
 */
export function pickConfirmPhrase(action) {
  const items = commandsConfig.commands || [];
  const found = items.find((x) => x?.action === action);
  const arr = found?.ttsConfirm;
  if (Array.isArray(arr) && arr.length) {
    const i = Math.floor(Math.random() * arr.length);
    return arr[i];
  }
  return null;
}

/**
 * Возвращает случайную фразу после триггера.
 */
export function pickWakePhrase() {
  const arr = commandsConfig?.wake?.phrases;
  if (Array.isArray(arr) && arr.length) {
    const i = Math.floor(Math.random() * arr.length);
    return arr[i];
  }
  return 'Слушаю, сэр';
}
