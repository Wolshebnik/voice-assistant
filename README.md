# Voice Assistant (Node.js + Electron-ready)

Голосовой ассистент с офлайн-распознаванием речи на русском языке, поддержкой триггер-слов и голосовых команд.
Базируется на [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx).

---

## 🧰 Установка

Ассистент требует Node.js (LTS) и SoX (для захвата микрофона).

### Windows

1. Node.js: установите LTS с https://nodejs.org/

2. SoX (любой способ):

- Chocolatey (админ PowerShell):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
choco install sox -y
refreshenv
sox --version
```

- Scoop:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
iwr -useb get.scoop.sh | iex
scoop install sox
sox --version
```

- Вручную: скачайте бинарники SoX для Windows, распакуйте (например, C:\\Tools\\sox) и добавьте путь в PATH. Проверьте `sox --version` в новом PowerShell.

3. Доступ к микрофону: Windows Settings → Privacy → Microphone → разрешите доступ приложениям.

### macOS

1. Node.js: через Homebrew или с https://nodejs.org/

2. SoX:

```bash
brew install sox
sox --version
```

3. Разрешения: System Settings → Privacy & Security → Microphone — разрешите доступ после первого запуска.

### Linux (Debian/Ubuntu)

1. Node.js: из дистрибутива или nvm.

2. SoX:

```bash
sudo apt-get update
sudo apt-get install -y sox
sox --version
```

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
