# Vietnamese TTS - FastAPI + React

Text-to-Speech application với Piper TTS engine và Vietnamese text processing.

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────────┐
│   React/Vite    │────────▶│    FastAPI Backend  │
│   (Frontend)    │  HTTP   │    (Piper ONNX)     │
└─────────────────┘         └─────────────────────┘
                                    │
                              ┌─────┴─────┐
                              │ R2 Bucket │
                              │ (Models)  │
                              └───────────┘
```

## 🚀 Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Download TTS models (optional)
mkdir models
# Download .onnx và .onnx.json từ https://github.com/rhasspy/piper/releases

# Run server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### 3. Truy cập

- Frontend: http://localhost:5173
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
tts-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + TTS endpoints
│   │   └── ...
│   ├── models/              # TTS model files (.onnx)
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Container build
│   └── wrangler.toml       # Cloudflare config
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main UI component
│   │   └── index.css       # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## 🔧 Configuration

### Environment Variables (Backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `MODELS_DIR` | `models` | Directory chứa TTS models |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |

### Frontend API URL

Tạo file `.env` trong `frontend/`:
```
VITE_API_URL=http://localhost:8000
```

## 🌥️ Cloudflare Deployment

### Backend (Workers + R2)

1. **Tạo R2 Bucket**:
   - Cloudflare Dashboard → R2 → Create bucket
   - Bucket name: `tts-models`

2. **Upload models**:
   ```bash
   wrangler r2 object put vi_VN-vais100_v2.onnx --bucket tts-models
   ```

3. **Deploy**:
   ```bash
   wrangler deploy
   ```

### Frontend (Pages)

```bash
cd frontend
npm run build
wrangler pages deploy dist
```

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tts/generate` | Generate speech |
| GET | `/api/tts/voices` | List available voices |
| GET | `/health` | Health check |

## 🎯 Features

- ✅ Vietnamese text-to-speech
- ✅ Vietnamese text normalization (số, ngày, tiền, điện thoại)
- ✅ Multiple voice support
- ✅ Speed control
- ✅ Audio playback + download
- ✅ History management
- ✅ Dark mode
- ✅ Responsive UI