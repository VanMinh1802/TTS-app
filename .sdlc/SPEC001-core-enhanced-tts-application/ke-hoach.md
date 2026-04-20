# Kế Hoạch Kỹ Thuật Nâng Cấp Ứng Dụng TTS

## Tổng Quan Kiến Trúc

### Kiến Trúc Hệ Thống
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Trình Duyệt (Client)                       │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐         │
│  │ Next.js UI │ ←  │TTS Provider│ ←  │  Web Worker (ONNX)   │         │
│  │(shadcn/ui) │    │ (Context)  │    │  TTS Generation     │         │
│  └─────────────┘    └─────────────┘    └──────────────────────┘         │
│         ↑                  ↑                         ↑                  │
│         │                  │                         │                  │
│         └──────────────────┴─────────────────────────┘                  │
│                           ↓                                            │
│                    IndexedDB Cache                                    │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   FastAPI Backend    │
                    │   (Orchestrator)      │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│Cloudflare R2│        │ PostgreSQL  │        │   Redis    │
│(Models/Audio│        │(User/Quota)  │        │(Rate Limit)│
└─────────────┘        └─────────────┘        └─────────────┘
```

---

## Chi Tiết Các Sub-features Để Triển Khai

### Giai Đoạn 1: Nền Tảng (Core Infrastructure) - 8 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F1.1 | FastAPI project setup + auth module | None | P0 |
| F1.2 | PostgreSQL database setup | F1.1 | P0 |
| F1.3 | User authentication (JWT) | F1.2 | P0 |
| F1.4 | Quota management system | F1.3 | P0 |
| F1.5 | Cloudflare R2 signed URL | F1.1 | P0 |
| F1.6 | API key management | F1.4 | P0 |
| F1.7 | Rate limiting với Redis | F1.1 | P0 |
| F1.8 | Basic analytics logging | F1.2 | P1 |

### Giai Đoạn 2: Frontend Core - 7 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F2.1 | Next.js 16 project setup | None | P0 |
| F2.2 | shadcn/ui component library | F2.1 | P0 |
| F2.3 | App Router structure | F2.1 | P0 |
| F2.4 | Authentication flow | F2.3 | P0 |
| F2.5 | Basic TTS generator UI | F2.2 | P0 |
| F2.6 | IndexedDB model caching | F2.5 | P0 |
| F2.7 | ONNX Runtime Web Worker | F2.5 | P0 |

### Giai Đoạn 3: Text Processing - 5 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F3.1 | Backend text normalization | F1.1 | P1 |
| F3.2 | SSML parser in frontend | F2.5 | P1 |
| F3.3 | Domain preset system | F3.1 | P2 |
| F3.4 | Custom dictionary management | F3.3 | P2 |
| F3.5 | Multi-language code-switching | F3.2 | P2 |

### Giai Đoạn 4: Voice Management - 4 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F4.1 | Voice library API | F1.1 | P1 |
| F4.2 | Voice selector component | F2.2 | P1 |
| F4.3 | Voice preview playback | F4.2 | P1 |
| F4.4 | Custom voice presets | F4.1 | P2 |

### Giai Đoạn 5: Project Workflow - 5 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F5.1 | Project CRUD API | F1.2 | P2 |
| F5.2 | Project list UI | F2.2 | P2 |
| F5.3 | Scene/segment editor | F5.2 | P2 |
| F5.4 | Timeline interface | F5.3 | P2 |
| F5.5 | Export functionality | F5.4 | P2 |

### Giai Đoạn 6: Developer Tools - 4 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F6.1 | OpenAPI documentation | F1.1 | P1 |
| F6.2 | TypeScript SDK package | F2.1 | P2 |
| F6.3 | Error code standardization | F1.1 | P1 |
| F6.4 | Integration guides | F6.2 | P2 |

### Giai Đoạn 7: Business & Admin - 4 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F7.1 | Subscription system | F1.3 | P1 |
| F7.2 | Admin dashboard | F1.8 | P1 |
| F7.3 | Usage analytics API | F7.2 | P2 |
| F7.4 | Cloud sync for projects | F5.1 | P2 |

### Giai Đoạn 8: PWA & Polish - 2 Sub-features

| ID | Sub-feature | Phụ Thuộc | Ưu Tiên |
|----|-----------|----------|----------|
| F8.1 | PWA offline capability | F2.1 | P2 |
| F8.2 | Performance optimization | All | P1 |

---

## Thứ Tự Triển Khai (Khuyến Nghị)

```
Giai Đoạn 1 (Nền Tảng)    →    Giai Đoạn 2 (Frontend)
    F1.1 ─────────────────→    F2.1
    F1.2 ─────────────────→    F2.2
    F1.3 ─────────────────→    F2.3
    F1.4                       F2.4
    F1.5                       F2.5
    F1.6                       F2.6
    F1.7                       F2.7
    F1.8 ────────────────────→    Continue to Phase 3-8
```

### Quick Wins (Ship Đầu Tiên)

| Thứ Tự | Sub-feature | Deliverable |
|--------|-----------|-----------|
| 1 | F1.1 + F2.1 | FastAPI + Next.js chạy |
| 2 | F1.3 + F2.4 | Auth hoạt động |
| 3 | F2.5 + F2.7 | TTS generation cơ bản |
| 4 | F1.5 + F2.6 | Model loading từ R2 |
| 5 | F3.1 + F3.2 | SSML support |

### Critical Path (Phải Hoàn Thành)

```
F1.1 → F1.2 → F1.3 → F2.3 → F2.4 → F2.5 → F2.7 = App Cơ Bản Hoạt Động
```

---

### Kiến Trúc Backend (FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   ├── config.py                  # Configuration management
│   └── requirements.txt            # Python dependencies
│
├── src/
│   ├── modules/
│   │   ├── auth/                  # Authentication module
│   │   │   ├── router.py          # Auth endpoints
│   │   │   ├── service.py         # Auth service logic
│   │   │   ├── schemas.py        # Pydantic schemas
│   │   │   └── tests/
│   │   ├── users/                 # User management module
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── models.py         # SQLAlchemy models
│   │   │   ├── schemas.py
│   │   │   └── tests/
│   │   ├── quota/                 # Quota management module
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── tests/
│   │   ├── text/                  # Text preprocessing module
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── normalizer.py       # Text normalization logic
│   │   │   └── tests/
│   │   ├── models/                # Model delivery module
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── signed_url.py      # Signed URL generation
│   │   │   └── tests/
│   │   ├── voice/                 # Voice marketplace module
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── tests/
│   │   ├── rvc/                   # Voice conversion module (premium)
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── tests/
│   │   └── analytics/             # Analytics module
│   │       ├── router.py
│   │       ├── service.py
│   │       └── tests/
│   │
│   ├── core/
│   │   ├── config.py              # App configuration
│   │   ├── database.py           # Database setup
│   │   ├── security.py           # Security utilities
│   │   ├── exceptions.py         # Custom exceptions
│   │   └── logging.py            # Logging setup
│   │
│   └── shared/
│       ├── schemas.py            # Shared Pydantic schemas
│       ├── utils.py             # Shared utilities
│       └── constants.py         # Application constants
│
├── tests/
│   ├── conftest.py              # Pytest fixtures
│   └── coverage.xml             # Coverage report
│
│
├── docker/
│   └── Dockerfile              # Multi-stage build
│
└── scripts/
    ├── migrate.py              # Database migrations
    └── seed.py                 # Database seeding
```

### Kiến Trúc Frontend (Next.js 16) - Theo frontend-arch Skill

#### Nguyên Tắc Cốt Lõi

1. **Feature-Based**: Mỗi feature là module độc lập
2. **Colocation**: Đặt file liên quan cùng folder
3. **Clear Public API**: Chỉ export cần thiết
4. **Server/Client Boundary**: Phân tách rõ ràng

#### Cấu Trúc Thư Mục

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Route group - không shared layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── page.tsx
│   │   ├── (main)/                   # Route group - có shared layout
│   │   │   ├── layout.tsx              # Shared layout (sidebar, header)
│   │   │   ├── page.tsx               # Dashboard/TTS Generator
│   │   │   ├── voice-library/
│   │   │   │   └── page.tsx
│   │   │   ├── project/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── history/
│   │   │       └── page.tsx
│   │   ├── api/                      # API routes (server)
│   │   │   └── [...routes]/
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css
│   │   └── providers.tsx             # Client providers (QueryClient)
│   │
│   ├── components/
│   │   └── ui/                      # shadcn/ui atomic components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Slider.tsx
│   │       ├── Card.tsx
│   │       ├── Dialog.tsx
│   │       ├── DropdownMenu.tsx
│   │       └── index.ts
│   │
│   ├── features/                     # Feature-based modules
│   │   ├── tts/                     # TTS feature
│   │   │   ├── api/
│   │   │   │   ├── generate.ts       # Pure API functions
│   │   │   │   ├── get-voices.ts
│   │   │   │   └── normalize-text.ts
│   │   │   ├── components/              # Feature components
│   │   │   │   ├── TtsGenerator.tsx
│   │   │   │   ├── SmartTextEditor.tsx
│   │   │   │   ├── VoiceSelector.tsx
│   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   ├── SpeedControl.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/               # Feature hooks
│   │   │   │   ├── use-tts.ts
│   │   │   │   ├── use-voices.ts
│   │   │   │   └── use-audio-player.ts
│   │   │   ├── types/              # Feature types
│   │   │   │   └── tts.types.ts
│   │   │   ├── store.ts            # Zustand store
│   │   │   └── index.ts            # Public exports ONLY
│   │   │
│   │   ├── voice/                   # Voice library feature
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   │   ├── VoiceLibrary.tsx
│   │   │   │   ├── VoiceCard.tsx
│   │   │   │   ├── VoicePreview.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-voice-list.ts
│   │   │   │   └── use-voice-preview.ts
│   │   │   ├── types/
│   │   │   │   └── voice.types.ts
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/                   # Authentication feature
│   │   │   ├── api/
│   │   │   │   ├── login.ts
│   │   │   │   ├── register.ts
│   │   │   │   └── refresh.ts
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   └── use-quota.ts
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── project/                 # Project workflow feature
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   ├── ProjectEditor.tsx
│   │   │   │   ├── Timeline.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-projects.ts
│   │   │   │   └── use-project-save.ts
│   │   │   ├── types/
│   │   │   │   └── project.types.ts
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   │
│   │   └── settings/               # User settings feature
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │
│   ├── lib/                        # Shared utilities
│   │   ├── piper/                 # TTS engine (non-feature)
│   │   │   ├── piperTts.ts
│   │   │   ├── piperR2.ts
│   │   │   └── piperCustom.ts
│   │   ├── audio/                # Audio processing
│   │   │   ├── wav.ts
│   │   │   ├── gaplessStreamingPlayer.ts
│   │   │   └── pitchShift.ts
│   │   ├── storage/               # IndexedDB operations
│   │   │   ├── history.ts
│   │   │   ├── modelCache.ts
│   │   │   └── blobUrl.ts
│   │   └── utils/                # Utilities
│   │       ├── cn.ts
│   │       └── format.ts
│   │
│   ├── workers/                   # Web Workers
│   │   └── tts-worker.ts        # TTS generation worker
│   │
│   └── config/                    # App configuration
│       └── index.ts
│
├── public/                         # Static assets
│   ├── tts-model/
│   ├── asr-model/
│   └── locales/
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
```

#### Colocation Principle

```
features/tts/
├── TtsGenerator.tsx           # Component
├── TtsGenerator.test.tsx     # Test cùng folder
├── use-tts.ts               # Hook
├── use-tts.test.ts           # Test cùng folder
├── types/
│   └── tts.types.ts
└── index.ts                 # Public exports
```

#### Server vs Client Components

| Server Components | Client Components |
|-------------------|----------------------|
| `app/(main)/page.tsx` | Interactivity components |
| Layouts | Hooks (useState, useEffect, useQuery) |
| Data fetching (server) | Browser APIs |
| SEO metadata | Event handlers |

#### Shared vs Feature Code

- **components/ui/**: Atomic components (Button, Input, Modal)
- **lib/**: Non-feature utilities (piper, audio, storage wrappers)
- **features/**: Feature-specific everything (api, components, hooks, types, store)

#### Quy Tắc Import

```
✅ features/tts/components → features/tts/hooks → features/tts/types
✅ features/tts/components → lib/piper
✅ components/ui/Button → features/tts/components
❌ features/users/hooks → features/tts/components (forbidden!)
```
└── postcss.config.js
```

## Các API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login            # Login (returns JWT)
POST   /api/auth/refresh          # Refresh token
POST   /api/auth/logout           # Logout
GET    /api/auth/me                # Get current user
POST   /api/auth/google           # Google OAuth
POST   /api/auth/github          # GitHub OAuth
```

### User Management Endpoints
```
GET    /api/users/me               # Get current user profile
PATCH  /api/users/me              # Update profile
DELETE /api/users/me              # Delete account
GET    /api/users/me/projects     # List user's projects
POST   /api/users/me/subscription # Get subscription info
```

### Quota Endpoints
```
GET    /api/quota                 # Get current quota usage
POST   /api/quota/reset           # Reset quota (admin)
GET    /api/quota/history        # Quota usage history
```

### Text Preprocessing Endpoints
```
POST   /api/text/normalize       # Normalize text
POST   /api/text/validate        # Validate text
GET    /api/text/presets         # List domain presets
POST   /api/text/presets         # Create custom preset
```

### Model Delivery Endpoints
```
GET    /api/models               # List available models
GET    /api/models/{id}          # Get model info
GET    /api/models/{id}/config  # Get model config
GET    /api/models/{id}/download # Get signed download URL
GET    /api/models/versions     # Get model versions
```

### Voice Marketplace Endpoints
```
GET    /api/voices              # List all voices
GET    /api/voices/{id}        # Get voice details
POST   /api/voices/{id}/purchase # Purchase premium voice
GET    /api/voices/my           # List purchased voices
GET    /api/voices/categories   # List voice categories
```

### Voice Conversion Endpoints (Premium)
```
POST   /api/rvc/convert         # Convert voice (RVC)
GET    /api/rvc/status/{job_id}  # Get conversion status
GET    /api/rvc/models          # List RVC models
```

### Project Endpoints
```
GET    /api/projects            # List projects
POST   /api/projects           # Create project
GET    /api/projects/{id}      # Get project
PATCH  /api/projects/{id}      # Update project
DELETE /api/projects/{id}      # Delete project
POST   /api/projects/{id}/export # Export project
POST   /api/projects/{id}/duplicate # Duplicate project
```

### Analytics Endpoints
```
GET    /api/analytics/usage           # Usage analytics
GET    /api/analytics/popular-voices  # Popular voices
GET    /api/analytics/geographic     # Geographic data
GET    /api/analytics/errors         # Error rates
```

### Admin Endpoints
```
GET    /api/admin/users              # List all users
PATCH  /api/admin/users/{id}       # Update user (admin)
GET    /api/admin/subscriptions    # List subscriptions
PATCH  /api/admin/subscriptions/{id} # Update subscription
GET    /api/admin/system/health   # System health
GET    /api/admin/system/metrics # System metrics
```

## Schema Database

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'
);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Projects Table
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scenes JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    collaborators UUID[] DEFAULT '{}'
);
```

### Voices Table
```sql
CREATE TABLE voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    model_id VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    region VARCHAR(100),
    gender VARCHAR(50),
    style VARCHAR(100),
    is_premium BOOLEAN DEFAULT FALSE,
    price INTEGER DEFAULT 0,
    sample_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Purchased Voices Table
```sql
CREATE TABLE purchased_voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    voice_id UUID NOT NULL REFERENCES voices(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, voice_id)
);
```

### Usage Logs Table
```sql
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    voice_id VARCHAR(255),
    characters_used INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 1,
    endpoint VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tier VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Các Giai Đoạn Triển Khai

### Giai Đoạn 1: Nền Tảng (Tuần 1-3)

**Tuần 1: Thiết Lập Dự Án**
- [ ] Khởi tạo cấu trúc dự án FastAPI
- [ ] Thiết lập PostgreSQL database
- [ ] Cấu hình Redis cho caching và rate limiting
- [ ] Triển khai authentication cơ bản (JWT)
- [ ] Thiết lập Docker và docker-compose

**Tuần 2: Backend Cốt Lõi**
- [ ] Triển khai user CRUD operations
- [ ] Tạo hệ thống quota management
- [ ] Thiết lập Cloudflare R2 integration với signed URLs
- [ ] Triển khai basic text normalization endpoints
- [ ] Thiết lập logging và monitoring

**Tuần 3: Admin Dashboard**
- [ ] Tạo admin authentication
- [ ] Xây dựng user management interface
- [ ] Triển khai system health monitoring
- [ ] Tạo basic analytics
- [ ] Thiết lập API key management

### Giai Đoạn 2: Nâng Cấp Frontend (Tuần 4-6)

**Tuần 4: Thiết Lập Next.js**
- [ ] Khởi tạo Next.js 16 project
- [ ] Cài đặt và cấu hình shadcn/ui
- [ ] Thiết lập Tailwind CSS với custom theme
- [ ] Triển khai authentication flow
- [ ] Kết nối với backend APIs

**Tuần 5: Tính Năng TTS Cốt Lõi**
- [ ] Xây dựng Smart Text Editor với SSML support
- [ ] Triển khai Voice Selector component
- [ ] Tạo Audio Player với gapless playback
- [ ] Tích hợp ONNX Runtime Web
- [ ] Triển khai IndexedDB caching

**Tuần 6: Tính Năng Nâng Cao**
- [ ] Xây dựng Voice Library page
- [ ] Triển khai voice preview functionality
- [ ] Tạo History panel
- [ ] Thêm voice preset management
- [ ] Triển khai cấu trúc project

### Giai Đoạn 3: Tính Năng Nâng Cao (Tuần 7-9)

**Tuần 7: Tính Năng Project**
- [ ] Xây dựng Project Editor interface
- [ ] Triển khai Timeline component
- [ ] Tạo Scene management
- [ ] Thêm character assignment
- [ ] Triển khai export functionality

**Tuần 8: Công Cụ Developer**
- [ ] Tạo TypeScript SDK package
- [ ] Triển khai API documentation
- [ ] Xây dựng developer dashboard
- [ ] Thêm API key management UI
- [ ] Tạo usage analytics

**Tuần 9: Voice Marketplace**
- [ ] Xây dựng voice marketplace page
- [ ] Triển khai voice purchase flow
- [ ] Tạo premium voice access
- [ ] Thiết lập voice conversion service
- [ ] Triển khai cloud sync

### Giai Đoạn 4: Tối Ưu & Ra Mắt (Tu��n 10-12)

**Tuần 10: Hiệu Suất**
- [ ] Triển khai advanced caching strategies
- [ ] Tối ưu database queries
- [ ] Thiết lập CDN cho static assets
- [ ] Triển khai lazy loading
- [ ] Thêm performance monitoring

**Tuần 11: Bảo Mật & Tuân Thủ**
- [ ] Thực hiện security audit
- [ ] Triển khai penetration testing fixes
- [ ] Thiết lập GDPR compliance
- [ ] Tạo privacy policy
- [ ] Triển khai data retention policies

**Tuần 12: Ra Mắt**
- [ ] Hoàn thành documentation
- [ ] Tạo tutorials và guides
- [ ] Thiết lập beta testing
- [ ] Deploy to production
- [ ] Monitor và fix issues
- [ ] Launch marketing campaign

## Service Interfaces

### Text Normalizer Service
```python
class TextNormalizerService:
    async def normalize(
        self,
        text: str,
        preset: str | None = None,
        locale: str = "vi"
    ) -> str:
        """Normalize text using specified preset"""
        
    async def validate(
        self,
        text: str
    ) -> ValidationResult:
        """Validate text for TTS processing"""
        
    def get_presets(self) -> list[TextPreset]:
        """Get available text presets"""
```

### Model Service
```python
class ModelService:
    async def list_models(
        self,
        filter: ModelFilter
    ) -> list[VoiceModel]:
        """List available voice models"""
        
    async def get_signed_url(
        self,
        model_id: str,
        user_id: str
    ) -> SignedUrlResult:
        """Get pre-signed URL for model download"""
        
    async def check_quota(
        self,
        user_id: str
    ) -> QuotaResult:
        """Check user quota availability"""
```

### Voice Conversion Service
```python
class VoiceConversionService:
    async def convert(
        self,
        audio: bytes,
        source_voice: str,
        target_voice: str,
        user_id: str
    ) -> ConversionJob:
        """Submit voice conversion job"""
        
    async def get_status(
        self,
        job_id: str
    ) -> ConversionStatus:
        """Get conversion job status"""
```

### Analytics Service
```python
class AnalyticsService:
    async def log_usage(
        self,
        user_id: str,
        usage: UsageData
    ) -> None:
        """Log API usage"""
        
    async def get_usage_analytics(
        self,
        user_id: str,
        period: DateRange
    ) -> UsageAnalytics:
        """Get usage analytics"""
        
    async def get_popular_voices(
        self,
        limit: int = 10
    ) -> list[PopularVoice]:
        """Get popular voices statistics"""
```

## Các Thách Thức & Giải Pháp

### Thách Thức Kỹ Thuật

| # | Thách Thức | Mức Độ Rủi Ro | Giải Pháp |
|---|-----------|--------------|-----------|
| T1 | **WebGPU Availability** - Chỉ ~50% users có WebGPU | Cao | Fallback to WebAssembly; feature detection |
| T2 | **Browser Memory Limits** - Tab memory ~2GB max | Trung bình | Chunk text dài; lazy load models |
| T3 | **Cross-Origin COOP/COEP Headers** - Cần cho WASM | Trung bình | Same-origin serving; configure Cloudflare headers |
| T4 | **Model Loading Time** - 50MB lần đầu chậm | Trung bình | Preload model mặc định; cache IndexedDB |
| T5 | **Web Worker Debugging** - Khó debug production | Trung bình | Instrument logging; DevTools for dev |
| T6 | **Cross-Browser Compatibility** - WASM support khác nhau | Trung bình | Feature detection; graceful degradation |
| T7 | **IndexedDB Storage Limits** - Browser-dependent | Thấp | Check storage; implement LRU eviction |

### Thách Thức Tài Nguyên

| # | Thách Thức | Mức Độ Rủi Ro | Giải Pháp |
|---|-----------|--------------|-----------|
| R1 | **Cloud Costs at Scale** - R2 bandwidth + compute | Trung bình | Cloudflare Workers (free tier); caching |
| R2 | **Database Scaling** - PostgreSQL connection limits | Thấp | Connection pooling; Redis for hot data |
| R3 | **Model Storage** - R2 object count limits | Thấp | Organize by prefix; cleanup old versions |

### Thách Thức Thị Trường

| # | Thách Thức | Mức Độ Rủi Ro | Giải Pháp |
|---|-----------|--------------|-----------|
| M1 | **User Adoption** - Cần educate về client-side benefits | Cao | Marketing về privacy, offline, zero server costs |
| M2 | **Free Alternatives** - Google TTS, Edge TTS | Trung bình | Focus Vietnamese quality; unique voices |
| M3 | **Vietnamese TTS Market** - Underserved | Trung bình | Start free tier; gather metrics |

### Thách Thức Phát Triển

| # | Thách Thức | Mức Độ Rủi Ro | Giải Pháp |
|---|-----------|--------------|-----------|
| D1 | **Complex Tech Stack** - Full-stack nhiều công nghệ | Cao | Phase implementation; proven libraries |
| D2 | **Model Conversion** - Cần expertise | Trung bình | Use pre-trained models |
| D3 | **Testing Complexity** - Browser-specific | Trung bình | Playwright E2E tests |
| D4 | **State Management** - Complex state | Trung bình | Zustand + React Query |

### Thách Thức Pháp Lý

| # | Thách Thức | Mức Độ Rủi Ro | Giải Pháp |
|---|-----------|--------------|-----------|
| L1 | **Voice Licensing** - Must use properly licensed voices | Cao | Verify licenses; commercial rights only |
| L2 | **GDPR for EU Users** - Data protection | Trung bình | Implement deletion; privacy policy |
| L3 | **Content Copyright** - User-generated audio | Thấp | Clear ToS; user responsible |

### Thách Thức Vận Hành

| # | Thách Thức | Mức Độ Rủi Ro | Giải Pháp |
|---|-----------|--------------|-----------|
| O1 | **Monitoring at Scale** - Need observability | Trung bình | Structured logging; Prometheus |
| O2 | **Incident Response** - Bug detection | Trung bình | Sentry; on-call |
| O3 | **Backup & Recovery** - DR planning | Thấp | Automated backups; documented recovery |

---

## Các Quyết Định Trước Khi Triển Khai

### Phải Quyết Định Trước

1. **Database**: Supabase vs Neon vs traditional VPS
2. **Authentication**: Build custom JWT vs Auth0/Clerk
3. **Model Source**: Piper vs Coqui XTTS
4. **Deployment**: Cloudflare Workers vs VPS
5. **Revenue Model**: Subscription-only vs usage-based

### Quyết Định Khuyến Nghị

| Quyết Định | Khuyến Nghị | Lý Do |
|------------|-------------|-----------|
| Database | Supabase | Free tier, built-in Auth |
| Auth | Custom JWT | Full control, no cost |
| Models | Piper | Proven, lightweight |
| Deployment | Cloudflare | Best free tier |
| Pricing | Tiered subscription | Clear differentiation |

---

## Các Follow-up Cần Thiết

1. **Multi-language Expansion** - Kế hoạch thêm ngôn ngữ ngoài Tiếng Việt
2. **Mobile App Development** - React Native hoặc Flutter
3. **Real-time Collaboration** - WebSocket collaboration
4. **Webhook Integration** - Event notifications
5. **Billing Integration** - Stripe/PayPal
6. **Email Notifications** - Transactional email
7. **AI Text Generation** - LLM for prompts

---

## Edge Cases & Cách Xử Lý

### Edge Cases Client-Side TTS

| # | Edge Case | Phát Hiện | Cách Xử Lý |
|---|----------|----------|------------|
| E1 | **WebGPU không có** | Check `navigator.gpu` | Fallback to WebAssembly |
| E2 | **WASM không hỗ trợ** | Feature detection | Show error; suggest browser |
| E3 | **Web Workers bị chặn** | Check Worker availability | Run on main thread |
| E4 | **IndexedDB không có** | Check `window.indexedDB` | Fallback to localStorage |
| E5 | **Quota IndexedDB vượt** | Catch QuotaExceededError | LRU eviction; prompt user |
| E6 | **AudioContext bị suspend** | Check audioContext.state | Resume on user click |
| E7 | **Download bị gián đoạn** | Check network status | Retry with backoff |
| E8 | **Model file bị lỗi** | Validate ONNX load | Re-download |
| E9 | **Hết memory** | Catch RangeError | Giảm chunk size |
| E10 | **Text quá dài** | Check > 10K chars | Auto-chunk |
| E11 | **Tab bị background** | Check visibilityState | Tiếp tục generate |
| E12 | **Mất network** | Check navigator.onLine | Cache; resume when online |
| E13 | **Generate trùng** | Check busy state | Queue request |
| E14 | **SSML lỗi** | Parse error | Highlight invalid tag |
| E15 | **Text rỗng** | Trim check | Disable button |

### Edge Cases Backend

| # | Edge Case | Phát Hiện | Cách Xử Lý |
|---|----------|----------|------------|
| B1 | **Rate limit vượt** | Check 429 | Countdown; upgrade prompt |
| B2 | **JWT hết hạn** | Check 401 | Redirect login |
| B3 | **API key lỗi** | Check 403 | Regenerate key |
| B4 | **Quota hết** | Check response | Upgrade options |
| B5 | **DB connection lỗi** | Catch error | Retry; maintenance message |
| B6 | **Signed URL hết hạn** | Check 403 | Regenerate URL |
| B7 | **Login trùng** | Track sessions | Invalidate old |
| B8 | **Upload timeout** | Check timeout | Chunk upload |
| B9 | **Server overload** | Check 503 | Queue request |
| B10 | **Subscription lỗi** | Check status | Downgrade features |

### Edge Cases Audio

| # | Edge Case | Phát Hiện | Cách Xử Lý |
|---|----------|----------|------------|
| A1 | **Audio length = 0** | Check duration | Show error |
| A2 | **Audio bị clip** | Check peak | Apply limiter |
| A3 | **Audio quá dài** | Check > 1 hour | Warn; chapter split |
| A4 | **Playback bị gián đoạn** | Check state | Save position |
| A5 | **Multiple audio** | Check sources | Stop previous |
| A6 | **Format không support** | Check support | Convert to WAV |

### Edge Cases Data

| # | Edge Case | Phát Hiện | Cách Xử Lý |
|---|----------|----------|------------|
| D1 | **History đầy** | Check quota | Auto-delete oldest |
| D2 | **Cache bị lỗi** | Validate checksum | Clear; re-download |
| D3 | **Sync conflict** | Check timestamp | Last-write-wins |
| D4 | **Migration cần** | Check version | Run migration |
| D5 | **Sync fails** | Check status | Queue retry |

### Edge Cases Security

| # | Edge Case | Phát Hiện | Cách Xử Lý |
|---|----------|----------|------------|
| S1 | **XSS in text** | Sanitize | Escape HTML |
| S2 | **CSRF** | Check token | Validate origin |
| S3 | **Model tamper** | Check hash | Verify signature |
| S4 | **API key leak** | Detect pattern | Revoke; notify |
| S5 | **DDoS** | Check rate | Rate limit; block IP |
| S6 | **JWT algo** | Check algo | Only RS256 |

### Recovery Procedures

| Tình Huống | Cách Khôi Phục |
|-----------|---------------|
| **Model load lỗi** | 1. Clear cache, 2. Re-download |
| **Playback lỗi** | 1. Recreate AudioContext, 2. Re-decode |
| **Session mất** | 1. Preserve input, 2. Re-auth |
| **Offline data mất** | 1. Check backup, 2. Sync |
| **DB lỗi** | 1. Restore backup |

### Monitoring & Alerting

| Metric | Ngưỡng | Hành Động |
|--------|--------|----------|
| Error rate > 5% | Page | On-call notify |
| Latency > 500ms | P95 | Review |
| Load time > 30s | Incident | Support |
| Storage > 80% | Warning | Cleanup |
| Failed logins > 10/min | Security | Block IP |