# Voice Assistant (Node.js + Electron-ready)

Голосовой ассистент с офлайн-распознаванием речи на русском языке, поддержкой триггер-слов и голосовых команд.
Базируется на [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx).

---

## 🚀 Запуск проекта

### Windows (быстрая установка)

1. Установите Node.js (LTS) с https://nodejs.org/

2. Установите SoX (для записи с микрофона), один из способов:

- Через Chocolatey (рекомендуется):

```powershell
choco install sox
sox --version
```

- Через Scoop:

```powershell
scoop install sox
sox --version
```

- Вручную: скачайте бинарники SoX для Windows, распакуйте и добавьте папку с sox.exe в PATH. Затем проверьте:

```powershell
sox --version
```

3. Дайте приложению доступ к микрофону (Windows Settings → Privacy → Microphone → Разрешить приложениям доступ к микрофону).

4. Установите зависимости и запустите:

```powershell
npm install
npm start
```

### 1. Установить зависимости

```bash
npm install
```

### 1.1. Системные зависимости (захват микрофона)

- Требуется sox для записи звука из микрофона.
- macOS:

```bash
brew install sox
```

- Linux (Debian/Ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y sox
```

- macOS: после первого запуска дайте приложению доступ к микрофону в System Settings → Privacy & Security → Microphone.

### 2. Скачать русскую ASR-модель (small, 2024-09-18)

Модель берём с официального репозитория `sherpa-onnx`.

**Linux / macOS / WSL**

```bash
mkdir -p models/ru
cd models/ru

curl -L -o model.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-small-zipformer-ru-2024-09-18.tar.bz2
tar -xvjf model.tar.bz2
rm model.tar.bz2
cd ../../
```

**Windows (PowerShell)**

```powershell
mkdir models\ru
cd models\ru

Invoke-WebRequest -Uri https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-small-zipformer-ru-2024-09-18.tar.bz2 -OutFile model.tar.bz2
tar -xvjf model.tar.bz2
Remove-Item model.tar.bz2
cd ..\..\
```

После распаковки в `models/ru/` появится папка:

```
sherpa-onnx-small-zipformer-ru-2024-09-18
```

---

### 3. Запустить ассистента

```bash
npm start
```

---

## 📂 Структура проекта

- `src/` — основной код ассистента
- `models/` — модели распознавания речи
- `package.json` — зависимости проекта
- `config.js` — настройки (триггер-слово, длительности окон, чувствительность и т.д.)

---

## ℹ️ Примечания

- Модель KWS (детектор ключевого слова) для русского языка пока отсутствует в релизах sherpa-onnx (2025). Используется ASR-фолбек.
- Для ускорения распознавания рекомендуется запускать на `NUM_THREADS > 1` при использовании CPU.
