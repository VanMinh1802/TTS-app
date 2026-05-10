# Type2Vibe — AI Text-to-Speech Platform

<div align="center">

**Vietnamese Neural TTS with Piper ONNX + Next.js 16 + FastAPI**

[![Frontend](https://img.shields.io/badge/frontend-next.js%2016-6366F1)](https://nextjs.org)
[![Backend](https://img.shields.io/badge/backend-fastapi-C968F7)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/python-3.11-3776AB)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

</div>

---

## Features

### TTS (Text-to-Speech)

- 🎙️ **Server + Client Hybrid**: Server-side Piper ONNX synthesis + client-side Web Worker fallback via ONNX Runtime Web
- 🇻🇳 **Vietnamese Language Support**: Advanced text processing with automatic conversion of:
  - Numbers to words (0 to billions)
  - Dates, date ranges, and time expressions
  - Currency (VND, USD)
  - Percentages and decimals
  - Phone numbers, ordinals, Roman numerals
  - Numeric ranges with units
- 🎤 **12 Vietnamese Voices**: Male/Female voices across Northern, Central, and Southern dialects with region, style, and gender metadata
- ⚡ **Real-Time Streaming**: Server-side synthesis with client-side audio playback
- 🎚️ **Speed Control**: Adjustable speech speed (0.5x–2.0x)
- 📥 **Audio Export**: Download generated audio as WAV or MP3
- 🎨 **Aether Design System**: Indigo/purple dark mode + soft purple gradient light mode
- 📊 **Dashboard**: Quota usage, tier status, daily usage history
- 📜 **Audio Library**: Save to local IndexedDB + optional cloud sync to R2
- 📖 **Custom Dictionary**: Per-user pronunciation dictionary, search, import/export
- 🔑 **API Keys**: Create/revoke keys with rate limits and scope control
- 💳 **Tiered Plans**: Free/Basic/Pro/Enterprise with license key activation
- 🔐 **Google OAuth**: Secure login with JWT cookie + CSRF protection, token rotation
- 🌐 **i18n**: Vietnamese + English UI (491 translation keys via next-intl)
- 🌙 **Light/Dark Mode**: Aether design system with seamless theme toggle

### Admin

- 🛡️ **License Generation**: Generate and manage license keys
- 📈 **Analytics Dashboard**: Request logs, latency tracking, top users
- 👥 **User Management**: View activation logs and subscription status

---

## Architecture

```
┌──────────────────────────┐     ┌──────────────────────────┐
│  Cloudflare Workers      │     │  Render (Free)           │
│  Next.js 16 (OpenNext)   │────▶│  FastAPI + Piper ONNX    │
│  frontend.workers.dev    │ API │  tts-app.onrender.com    │
└──────────────────────────┘     └──────────┬───────────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │             │             │
                         ┌────┴────┐  ┌─────┴─────┐ ┌────┴────┐
                         │  Neon   │  │ R2 Models │ │  Redis  │
                         │Postgres │  │  Bucket   │ │(Upstash)│
                         └─────────┘  └───────────┘ └─────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion |
| **Backend** | FastAPI (Python 3.11), Uvicorn, Gunicorn |
| **TTS Engine** | Piper TTS (server) + ONNX Runtime Web (client-side) |
| **Database** | PostgreSQL (Neon Serverless) |
| **Storage** | Cloudflare R2 (S3-compatible, 2 buckets) |
| **Cache/Rate** | Redis (Upstash) |
| **Auth** | Google OAuth 2.0 + JWT (cookie-based, token rotation) |
| **i18n** | next-intl (Vietnamese + English, 491 keys) |
| **Deploy** | Cloudflare Workers (frontend) + Render (backend) |

---

## How It Works

### TTS Pipeline

1. **Text Input**: User enters text in the Studio page
2. **Dictionary Application**: User's custom pronunciation dictionary is applied first
3. **Vietnamese Normalization**: Text passes through a 16-step normalization pipeline — numbers, dates, currency, abbreviations, symbols
4. **Model Selection**: User selects a voice from the 12 available Vietnamese voices
5. **Server Synthesis**: Text is sent to the FastAPI backend; Piper ONNX engine performs inference
6. **Client Fallback**: If server is unavailable or for specific voices, the web worker runs ONNX Runtime Web for client-side synthesis
7. **Audio Delivery**: WAV audio is returned as base64 data URL and played in the browser
8. **Library Save**: Audio is saved locally (IndexedDB) with optional cloud sync to R2

### Auth Flow

1. **Google OAuth**: User clicks "Đăng nhập với Google"; implicit flow returns access token
2. **Token Verification**: Backend verifies the Google token via OAuth2 API or ID token
3. **JWT Issuance**: Access token (60min) + Refresh token (7 days) issued as httpOnly cookies
4. **CSRF Protection**: Double-submit cookie pattern for all mutating requests
5. **Token Rotation**: Refresh endpoint rotates both tokens, blacklists old token JTI
6. **API Key Mode**: Alternative authentication via `X-API-Key` header with scope control

---

## Project Structure

```
TTS-app-v2/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point + lifespan
│   │   ├── api/                     # Route handlers (12 routers)
│   │   ├── core/                    # Settings, security, Redis, DI, CSRF, exceptions
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── services/                # TTS, auth, quota, library, dictionary, voice registry
│   │   ├── middleware/              # Logging, CSRF middleware
│   │   ├── db/                      # Database engine + sessions
│   │   ├── repositories/            # Data access layer
│   │   └── utils/                   # Text utilities
│   ├── alembic/                     # Database migrations
│   ├── tests/                       # Pytest test suite (104 tests)
│   ├── requirements.txt             # Python dependencies
│   └── runtime.txt                  # Python version for Render
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # Next.js App Router (12 pages)
│   │   ├── components/              # Layout, UI, Providers, Motion, SEO
│   │   ├── features/                # TTS, Studio, Library, Dictionary, Voice, Auth
│   │   ├── workers/                 # Web Workers (TTS ONNX client)
│   │   ├── lib/                     # Piper TTS, text processing, validators
│   │   ├── shared/                  # i18n, notifications, auth store
│   │   └── messages/                # Translation files (vi.json, en.json)
│   ├── public/data/                 # Built-in dictionary (17K+ entries)
│   ├── next.config.ts
│   ├── open-next.config.ts          # Cloudflare OpenNext adapter
│   ├── wrangler.jsonc               # Cloudflare Workers config
│   └── package.json
│
├── render.yaml                      # Render Blueprint
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- **Python 3.11+** with pip
- **Node.js 20+** with npm
- **PostgreSQL** (local or Neon cloud)
- **Cloudflare R2** account (for TTS models + audio library)
- **Google OAuth** credentials (for login)
- **Redis** (local or Upstash, optional — app falls back without it)

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with required variables
cp .env.example .env  # or create manually
```

Required `.env` variables:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET_KEY=your-secret-key-at-least-16-chars
CORS_ORIGINS=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
R2_LIBRARY_ACCESS_KEY_ID=...
R2_LIBRARY_SECRET_ACCESS_KEY=...
```

```bash
# Run database migrations (first time only)
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id" >> .env.local

# Start dev server
npm run dev
```

### 3. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

## Configuration

### Backend (`backend/.env`)

See all available settings in `backend/app/core/settings.py`. Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `JWT_SECRET_KEY` | **Yes** (min 16 chars) | JWT signing key |
| `CORS_ORIGINS` | **Yes** | Comma-separated frontend origins |
| `GOOGLE_CLIENT_ID` | For auth | Google OAuth client ID |
| `R2_ACCESS_KEY_ID` | For TTS | Cloudflare R2 access key (models) |
| `R2_SECRET_ACCESS_KEY` | For TTS | Cloudflare R2 secret key (models) |
| `R2_ACCOUNT_ID` | For TTS | Cloudflare account ID |
| `R2_LIBRARY_ACCESS_KEY_ID` | For library | R2 access key (audio library) |
| `R2_LIBRARY_SECRET_ACCESS_KEY` | For library | R2 secret key (audio library) |
| `REDIS_HOST` | For rate limit | Redis hostname |
| `REDIS_SSL` | For Upstash | Set to `true` for TLS |
| `AUTH_COOKIE_SECURE` | Production | Set to `true` for HTTPS |
| `AUTH_COOKIE_SAMESITE` | Cross-origin | Set to `none` if frontend on different domain |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## Voice Library

12 Vietnamese voices with region, gender, and style metadata:

| Voice ID | Display Name | Region | Gender | Style |
|---|---|---|---|---|
| `ngochuyen` | Ngọc Huyền | Miền Bắc | Female | Truyền cảm |
| `baouyen` | Bảo Uyên | Miền Bắc | Female | Truyền cảm |
| `banmai` | Ban Mai | Miền Bắc | Female | Tin tức |
| `ngocngan` | Ngọc Ngạn | Miền Bắc | Female | Tin tức |
| `maiphuong` | Mai Phương | Miền Bắc | Female | Quảng cáo |
| `manhdung` | Mạnh Dũng | Miền Nam | Male | Doanh nghiệp |
| `mytam2` | Mỹ Tâm | Miền Nam | Female | Ca hát |
| `chieuthanh` | Chiếu Thành | Miền Nam | Male | Truyền thống |
| `minhquang` | Minh Quang | Miền Trung | Male | Truyền cảm |
| `lacphi` | Lạc Phi | Miền Trung | Female | Du lịch |
| `anhkhoi` | Anh Khôi | Miền Bắc | Male | Hiện đại |
| `minhkhang` | Minh Khang | Miền Bắc | Male | Giáo dục |

Voice models stored in Cloudflare R2: `genvoice-models/vi/{voice_id}/`

### Model File Structure

Each TTS model requires **two files** with the same base name:

```
vi/{voice_id}/
├── {voice_id}.onnx           # ONNX model weights (~50-60 MB)
├── {voice_id}.onnx.json     # Model config (phoneme_id_map, audio settings)
└── sample.wav               # Preview sample (5-10s)
```

The `.onnx.json` config includes:
- `phoneme_id_map` — Vietnamese phoneme to ID mapping
- `audio.sample_rate` — 22050 Hz
- `inference.noise_scale`, `length_scale`, `noise_w` — quality parameters
- `num_speakers`, `speaker_id_map` — multi-speaker support

---

## Vietnamese Text Normalization

Before TTS synthesis, Vietnamese text passes through a 16-step normalization pipeline:

```
Input: "Ngày 26/03/2026, giá 150.000 đồng"
Output: "Ngày hai mươi sáu tháng ba năm hai nghìn không trăm hai mươi sáu, giá một trăm năm mươi nghìn đồng"
```

| Step | Module | Example |
|---|---|---|
| 1 | Unicode normalization | NFC canonical form |
| 2 | Special characters | `&` → "và", `@` → "a còng" |
| 3 | Punctuation | Standardize quotes, dashes |
| 4 | Thousand separators | `150.000` → `150000` |
| 5 | Date conversion | `26/03/2026` → words |
| 6 | Time conversion | `14:30` → "mười bốn giờ ba mươi phút" |
| 7 | Currency conversion | `150.000đ` → "một trăm năm mươi nghìn đồng" |
| 8 | Number conversion | `123` → "một trăm hai mươi ba" |
| 9 | Measurement units | `5km` → "năm ki-lô-mét" |
| 10 | Roman numerals | `III` → "ba" |
| 11 | Ordinal numbers | `tập 5` → "tập năm" |
| 12 | Percentage | `50%` → "năm mươi phần trăm" |
| 13 | Phone numbers | `0901234567` → spoken digits |
| 14 | Decimals | `3.5` → "ba phẩy năm" |
| 15 | Ranges | `10-20m` → "mười đến hai mươi mét" |
| 16 | Whitespace | Trim & collapse |

Implementation: `backend/app/services/normalizer/` (Python) + `frontend/src/lib/text-processing/builtinDictionary.ts` (17K+ entries)

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/auth/login/google` | Public |
| `POST` | `/api/auth/refresh` | Cookie |
| `GET` | `/api/auth/me` | User |
| `POST` | `/api/auth/logout` | Cookie |
| `POST` | `/api/auth/api-keys` | User |
| `GET` | `/api/auth/api-keys` | User |
| `DELETE` | `/api/auth/api-keys/{id}` | User |

### TTS
| Method | Endpoint | Auth |
|---|---|---|
| `POST` | `/api/tts/generate` | User |
| `GET` | `/api/tts/voices` | Optional |
| `POST` | `/api/tts/phonemize` | Public |
| `POST` | `/api/tts/convert-to-mp3` | User |
| `POST` | `/api/tts/normalize` | Public |
| `POST` | `/api/tts/detect-language` | Public |

### Library & Dictionary
| Method | Endpoint | Auth |
|---|---|---|
| `GET/POST/DELETE` | `/api/library` | User/Pro |
| `POST` | `/api/library/sync` | Pro |
| `GET/POST/PUT/DELETE` | `/api/dictionary` | User |
| `GET` | `/api/dictionary/search?q=` | User |
| `POST` | `/api/dictionary/import` | User |
| `GET` | `/api/dictionary/export` | User |

### Quota, Voices, Models, Admin
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/api/quota`, `/api/quota/usage` | User |
| `POST` | `/api/quota/record`, `/api/quota/reset` | User |
| `GET` | `/api/voices` | Public |
| `GET` | `/api/models` | Public |
| `POST` | `/api/subscriptions/activate` | User |
| `GET/POST` | `/api/admin/licenses` | Admin |

Full API documentation at `/docs` when running.

---

## Training New Voices

New TTS voices can be created via the Piper TTS fine-tuning pipeline. Complete A-Z guide:

📖 **[Voice Training Guide](.sdlc/docs/train-model.md)** — Raw audio to deployed ONNX model

**Quick overview:**

```
Raw Audio (MP3/M4A)
  → Convert to WAV
  → Extract vocals (Demucs)
  → Slice into 2-10s chunks
  → Transcribe (Whisper large-v2)
  → Manual correction
  → Piper preprocess (config.json + dataset.jsonl)
  → Fine-tune from checkpoint (~1000 epochs)
  → Export ONNX
  → Upload to Cloudflare R2 bucket (vi/{voice_id}/)
  → Available instantly in Studio
```

**Dataset size:** ~1,000 audio samples recommended for fine-tuning. Pre-trained models available for download with datasets on Google Drive.

---

## Deployment

### Frontend → Cloudflare Workers

```bash
cd frontend

# Build + deploy
npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy

# Or using npm script
npm run deploy
```

Ensure `wrangler.jsonc` has `NEXT_PUBLIC_API_URL` in the `vars` section pointing to your backend URL.

### Backend → Render

The `render.yaml` at the repo root defines the backend service. Deploy via Render Blueprint or manually:

```
Root Directory: backend
Build Command:  pip install -r requirements.txt
Start Command:  uvicorn app.main:app --host 0.0.0.0 --port $PORT
Plan:           Starter ($7/mo) or Standard ($25/mo) for ONNX
```

**Required Render env vars:** `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `GOOGLE_CLIENT_ID`, `R2_*`, `REDIS_*`

---

## Browser Compatibility

- Modern browsers with WebAssembly support (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)
- Web Workers support required (for client-side TTS)
- Cookies enabled (for JWT authentication)

---

## Testing

```bash
# Backend (98 tests)
cd backend
python -m pytest tests/

# Frontend (unit tests)
cd frontend
npx vitest run
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `python -m pytest` (backend), `npx vitest` (frontend)
5. Push and create a pull request

---

## Acknowledgments

- Built on [Piper TTS (GPL)](https://github.com/OHF-Voice/piper1-gpl) by OHF-Voice
- Uses [ONNX Runtime](https://github.com/microsoft/onnxruntime) for cross-platform TTS inference
- Inspiration from [piper-tts-web-demo](https://clowerweb.github.io/piper-tts-web-demo/) by clowerweb
- Uses [Sherpa-ONNX](https://github.com/k2-fsa/sherpa-onnx) for ASR capabilities
- Uses [Cloudflare R2](https://developers.cloudflare.com/r2/) for model storage
- Uses [Neon](https://neon.tech) for serverless PostgreSQL

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Further Reading

- **[Project Knowledge Base](PROJECT_KNOWLEDGE.md)** — Comprehensive architecture docs, TTS engine internals, audio processing, IndexedDB schema (legacy v1 reference)
- **[Voice Training Guide](.sdlc/docs/train-model.md)** — Complete pipeline from raw audio to deployed ONNX voice model
- **[API Documentation](https://tts-app-imdy.onrender.com/docs)** — Live Swagger UI with all endpoints
