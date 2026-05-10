# Type2Vibe — AI Text-to-Speech Platform

<div align="center">

**Vietnamese Neural TTS with Piper ONNX + Next.js 16 + FastAPI**

[![Frontend](https://img.shields.io/badge/frontend-next.js%2016-6366F1)](https://nextjs.org)
[![Backend](https://img.shields.io/badge/backend-fastapi-C968F7)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/python-3.11-3776AB)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

</div>

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

## Features

- **Text-to-Speech**: 12+ Vietnamese voices, server-side Piper ONNX + client-side WebAssembly fallback
- **Studio**: Real-time text input, voice/speed control, waveform preview, WAV/MP3 download
- **Library**: Audio history saved locally (IndexedDB) + optional cloud sync to R2
- **Dictionary**: Custom pronunciation dictionary per user, search, import/export
- **Voices**: Browse all voices with region, style, gender metadata + sample previews
- **Dashboard**: Quota usage, tier status, usage history
- **API Keys**: Create/revoke API keys with rate limits and scope control
- **Pricing**: Tiered plans (Free/Basic/Pro/Enterprise) with license activation
- **Admin**: License generation, activation logs
- **Auth**: Google OAuth only, JWT cookie + CSRF protection
- **Dark/Light**: Aether design system with indigo/purple gradients

---

## Project Structure

```
TTS-app-v2/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point + lifespan
│   │   ├── api/                     # Route handlers (12 routers)
│   │   │   ├── auth.py              #   Google login, API keys, token refresh
│   │   │   ├── tts.py               #   TTS generate, voices, MP3 convert
│   │   │   ├── library.py           #   Audio library CRUD + sync
│   │   │   ├── dictionary.py        #   Pronunciation dictionary CRUD
│   │   │   ├── quota.py             #   Quota status + usage recording
│   │   │   ├── models.py            #   R2 model listing + download URLs
│   │   │   ├── voices.py            #   Voice registry API
│   │   │   ├── normalize.py         #   Vietnamese text normalization
│   │   │   ├── language.py          #   Language detection
│   │   │   ├── analytics.py         #   Admin analytics
│   │   │   └── license.py           #   License activation + admin
│   │   ├── core/                    # Cross-cutting concerns
│   │   │   ├── settings.py          #   All env vars (pydantic-settings)
│   │   │   ├── security.py          #   JWT, password, CSRF
│   │   │   ├── redis.py             #   Redis connection pool
│   │   │   ├── di.py                #   Dependency injection
│   │   │   ├── uow.py               #   Unit of Work pattern
│   │   │   ├── csrf.py              #   CSRF validation
│   │   │   ├── scope_map.py         #   API key scope mapping
│   │   │   ├── exceptions.py        #   Domain exceptions + handlers
│   │   │   └── messages.py          #   Backend messages (vi)
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── services/                # Business logic layer
│   │   │   ├── tts_service.py       #   Piper ONNX synthesis
│   │   │   ├── auth_service.py      #   Google OAuth + API key mgmt
│   │   │   ├── quota_service.py     #   Quota check + consume
│   │   │   ├── library_service.py   #   Audio library sync/upload
│   │   │   ├── dictionary_service.py#   Dictionary CRUD
│   │   │   ├── voice_registry.py    #   R2 voice scanner + fallback
│   │   │   ├── license_service.py   #   License generation + activation
│   │   │   ├── r2_service.py        #   R2 S3 client wrapper
│   │   │   ├── rate_limiter.py      #   Redis sliding window limiter
│   │   │   ├── analytics_service.py #   Request logging + aggregation
│   │   │   ├── language_detector.py #   Vi/En language detection
│   │   │   └── normalizer/          #   Vietnamese text normalization
│   │   ├── middleware/              # ASGI middleware
│   │   │   ├── logging.py           #   Request analytics logging
│   │   │   └── csrf.py              #   CSRF enforcement
│   │   ├── db/                      # Database engine + sessions
│   │   ├── repositories/            # Data access layer
│   │   └── utils/                   # Text utilities
│   ├── alembic/                     # Database migrations
│   ├── tests/                       # Pytest test suite (104 tests)
│   ├── requirements.txt             # Python dependencies
│   ├── runtime.txt                  # Python version for Render
│   └── Procfile                     # (optional) Gunicorn config
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── page.tsx             #   Home/Landing
│   │   │   ├── login/               #   Google OAuth login
│   │   │   ├── dashboard/           #   User dashboard + quota
│   │   │   ├── studio/              #   TTS studio (main workspace)
│   │   │   ├── library/             #   Audio library
│   │   │   ├── dictionary/          #   Pronunciation dictionary
│   │   │   ├── voices/              #   Voice browser
│   │   │   ├── pricing/             #   Pricing plans
│   │   │   ├── settings/            #   User settings + profile
│   │   │   ├── api-keys/            #   API key management
│   │   │   ├── admin/               #   Admin panel
│   │   │   └── activate/            #   License activation
│   │   ├── components/
│   │   │   ├── layout/              #   Navbar, DesktopNav, MobileNav
│   │   │   ├── ui/                  #   UiSelect, ConfirmModal, WebGL, etc.
│   │   │   ├── providers/           #   React providers (auth, i18n, toast)
│   │   │   ├── motion/              #   FadeIn, StaggerChildren, TiltCard
│   │   │   └── seo/                 #   StructuredData, metadata
│   │   ├── features/                # Feature modules
│   │   │   ├── tts/                 #   TTS generation hooks + worker
│   │   │   ├── studio/              #   VoiceSelector, TextInput, PreviewPanel
│   │   │   ├── library/             #   Library CRUD, IndexedDB, sync
│   │   │   ├── dictionary/          #   Dictionary API + hooks
│   │   │   ├── voice/               #   Voice types, API, hooks
│   │   │   └── auth/                #   Auth API, hooks, guards
│   │   ├── workers/                 # Web Workers (TTS ONNX client)
│   │   ├── lib/                     # Utilities (piper, text processing)
│   │   ├── shared/                  # i18n, notifications, auth store
│   │   └── messages/                # Translation files (vi.json, en.json)
│   ├── public/
│   │   └── data/                    # Built-in dictionary (17K+ entries)
│   ├── next.config.ts               # Next.js configuration
│   ├── open-next.config.ts          # Cloudflare OpenNext adapter config
│   ├── wrangler.jsonc               # Cloudflare Workers config
│   ├── package.json
│   └── tsconfig.json
│
├── render.yaml                      # Render Blueprint (backend deploy)
├── runtime.txt                      # Python version (repo root)
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- **Python 3.11+** with pip
- **Node.js 20+** with npm
- **PostgreSQL** (local or Neon cloud)
- **Cloudflare R2** account (for TTS models)
- **Google OAuth** credentials (for login)

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

# Create .env file
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET_KEY, R2 credentials, etc.
```

```bash
# Run database migrations (first time)
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

## Environment Variables

### Backend (`backend/.env`)

<details>
<summary>Required variables</summary>

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET_KEY` | JWT signing key (min 16 chars) | `your-super-secret-key-at-least-16-chars` |
| `CORS_ORIGINS` | Comma-separated frontend origins | `https://frontend.workers.dev,http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789-xxx.apps.googleusercontent.com` |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key (models) | `abc123...` |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key (models) | `xyz789...` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | `abc123...` |
| `R2_LIBRARY_ACCESS_KEY_ID` | R2 access key (library bucket) | `def456...` |
| `R2_LIBRARY_SECRET_ACCESS_KEY` | R2 secret key (library bucket) | `uvw012...` |

</details>

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |

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
| `GET` | `/api/library` | User |
| `POST` | `/api/library/sync` | Pro |
| `POST` | `/api/library/upload` | Pro |
| `DELETE` | `/api/library/{id}` | User |
| `GET/POST` | `/api/dictionary` | User |
| `PUT/DELETE` | `/api/dictionary/{id}` | User |
| `GET` | `/api/dictionary/search?q=` | User |
| `POST` | `/api/dictionary/import` | User |
| `GET` | `/api/dictionary/export` | User |

### Quota, Voices, Models, Admin
| Method | Endpoint | Auth |
|---|---|---|
| `GET` | `/api/quota` | User |
| `GET` | `/api/quota/usage` | User |
| `POST` | `/api/quota/record` | User |
| `GET` | `/api/voices` | Public |
| `GET` | `/api/models` | Public |
| `POST` | `/api/subscriptions/activate` | User |
| `GET/POST` | `/api/admin/licenses` | Admin |

Full API documentation available at `/docs` when running.

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

Voice models stored in Cloudflare R2 bucket: `genvoice-models/vi/{voice_id}/`

---

## Vietnamese Text Normalization

Before TTS synthesis, Vietnamese text passes through a multi-step normalization pipeline to convert numbers, dates, currencies, and special characters into readable spoken form:

```
Input: "Ngày 26/03/2026, giá 150.000 đồng"
  → normalizers → numbers, dates, currency, abbreviations, symbols
Output: "Ngày hai mươi sáu tháng ba năm hai nghìn không trăm hai mươi sáu, giá một trăm năm mươi nghìn đồng"
```

| Step | Module | Example |
|---|---|---|
| 1 | Unicode normalization | NFC canonical form |
| 2 | Special characters | `&` → "và", `@` → "a còng" |
| 3 | Punctuation | Standardize quotes, dashes |
| 4 | Thousand separators | `150.000` → `150000` |
| 5 | Date conversion | `26/03/2026` → "ngày hai mươi sáu tháng ba..." |
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

## Training New Voices

New TTS voices can be created via the Piper TTS fine-tuning pipeline. See the comprehensive guide:

📖 **[Voice Training Guide](.sdlc/docs/train-model.md)** — Complete A-Z pipeline from raw audio to deployed ONNX model

**Quick overview:**

```
Raw Audio (MP3/M4A)
  → Convert to WAV
  → Extract vocals (Demucs)
  → Slice into 2-10s chunks
  → Transcribe (Whisper large-v2)
  → Manual correction
  → Piper preprocess
  → Fine-tune from checkpoint (~1000 epochs)
  → Export ONNX
  → Upload to Cloudflare R2 bucket
  → Available instantly in Studio
```

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

Make sure `wrangler.jsonc` has the correct `NEXT_PUBLIC_API_URL` in the `vars` section.

### Backend → Render

The `render.yaml` at the repo root defines the backend service. Deploy via Render Blueprint or manually:

```bash
# Manual deploy on Render:
# Root Directory: backend
# Build Command: pip install -r requirements.txt
# Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

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

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Further Reading

- **[Project Knowledge Base](PROJECT_KNOWLEDGE.md)** — Comprehensive architecture docs, TTS engine internals, audio processing, IndexedDB schema (legacy v1 reference)
- **[Voice Training Guide](.sdlc/docs/train-model.md)** — Complete pipeline from raw audio to deployed ONNX voice model
- **[API Documentation](https://tts-app-imdy.onrender.com/docs)** — Live Swagger UI with all endpoints
- **[Cloudflare Dashboard](https://dash.cloudflare.com)** — Worker & R2 management
- **[Render Dashboard](https://dashboard.render.com)** — Backend service management
