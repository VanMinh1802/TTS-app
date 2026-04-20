# Enhanced TTS Application Plan

## Overview
This document outlines the plan to rebuild the TTS application with a Python FastAPI backend and Next.js/shadcn/ui frontend, maintaining client-side TTS generation while adding enterprise-grade features for a SaaS/PaaS platform.

## Core Architecture Changes

### Backend (FastAPI)
- Text preprocessing service using LLMs/regex for normalization
- License and quota validation middleware
- Pre-signed URL generation for Cloudflare R2 model access
- Premium voice access control (subscription-based)
- Comprehensive API key management and rate limiting
- Analytics and usage tracking systems
- Admin dashboard for monitoring and management

### Frontend (Next.js/shadcn/ui)
- Smart text editor with SSML support and domain-specific presets
- Voice character management with customizable parameters (pitch, speed)
- Project-based workflow for multi-character dialogue creation
- Progressive Web App capabilities for offline usage
- Integrated NPM web SDK (genvoice-web-sdk) for seamless developer integration

## Feature Enhancements

### 1. Smart Text Processing
- SSML support for fine-grained pronunciation control
- Domain-specific presets (medical, legal, technical, etc.)
- Automatic abbreviation and acronym expansion
- Custom pronunciation dictionaries
- Multi-language code-switching support

### 2. Voice Management
- Voice character library with metadata (region, gender, style)
- Custom voice presets (adjustable pitch, speed, volume per voice)
- Premium voices accessible via Pro/Enterprise subscriptions
- Speaking style presets (narration, conversation, announcement, etc.)

### 3. Project Workflow
- Multi-scene project structure
- Character assignment per dialogue segment
- Timeline-based editing interface
- Export options (single file, chapter-separated, stems)
- Collaboration features (team projects, version history)
- Template library for common use cases (ads, audiobooks, podcasts)

### 4. Developer Experience
- Comprehensive OpenAPI/Swagger documentation
- TypeScript SDK with full type definitions
- Clear error handling with standardized error codes
- Environment-specific configuration management
- Testing utilities including mock services and fixtures
- Detailed integration guides and examples

### 5. Business Model & Monetization
- Tiered subscription plans (Free, Pro, Enterprise)
- Voice marketplace with premium/RVC voices
- Usage-based pricing (per character or API call)
- Cloud storage for project synchronization
- Advanced analytics dashboard
- B2B licensing through API key system
- Volume discounts and enterprise SLAs

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3) - 8 Sub-features

| ID | Sub-feature | Deliverable |
|----|-----------|-----------|
| F1.1 | FastAPI project setup with auth module | Working API |
| F1.2 | PostgreSQL database setup | DB connected |
| F1.3 | User authentication (JWT) | Login works |
| F1.4 | Quota management system | Track usage |
| F1.5 | R2 signed URL generation | Model delivery |
| F1.6 | API key management | Developer keys |
| F1.7 | Rate limiting (Redis) | Abuse prevention |
| F1.8 | Basic analytics logging | Usage tracking |

### Phase 2: Frontend Revamp (Weeks 4-6) - 7 Sub-features

| ID | Sub-feature | Deliverable |
|----|-----------|-----------|
| F2.1 | Next.js 16 project setup | Running app |
| F2.2 | shadcn/ui components | UI library |
| F2.3 | App Router structure | Routes work |
| F2.4 | Authentication flow | Login UI |
| F2.5 | Basic TTS generator UI | Text input |
| F2.6 | IndexedDB caching | Model cache |
| F2.7 | ONNX Web Worker | Audio generation |

### Phase 3: Advanced Features (Weeks 7-9) - 9 Sub-features

| ID | Sub-feature | Deliverable |
|----|-----------|-----------|
| F3.1 | Backend text normalization | Better text |
| F3.2 | SSML parser | Pronunciation control |
| F3.3 | Domain presets | Industry modes |
| F3.4 | Voice library API | Voice list |
| F3.5 | Voice selector UI | Voice selection |
| F3.6 | Voice preview | Sample playback |
| F3.7 | Project CRUD API | Save projects |
| F3.8 | Project list UI | Project management |
| F3.9 | Export functionality | Download audio |

### Phase 4: Optimization & Launch (Weeks 10-12) - 6 Sub-features

| ID | Sub-feature | Deliverable |
|----|-----------|-----------|
| F4.1 | TypeScript SDK package | NPM publish |
| F4.2 | Admin dashboard | Monitoring |
| F4.3 | Usage analytics | Stats dashboard |
| F4.4 | Subscription system | Paid tiers |
| F4.5 | PWA offline | Works offline |
| F4.6 | Performance optimization | Fast load |

---

## Detailed Implementation Order

### Critical Path (Must Complete First)
```
F1.1 → F1.2 → F1.3 → F2.1 → F2.3 → F2.4 → F2.5 → F2.7
```
This creates a basic working application with:
- Authenticated TTS generation
- Model loading from R2
- Audio playback

### Quick Wins (Ship Early)
| Order | Feature | User Value |
|-------|---------|----------|
| 1 | F1.1 + F2.1 | Working API + UI |
| 2 | F1.3 + F2.4 | User login |
| 3 | F2.5 + F2.7 | Generate audio |
| 4 | F1.5 + F2.6 | Load models |
| 5 | F3.2 | SSML support |

### Feature Dependencies

```
F1.1 (API Setup)
 ├─→ F1.2 (Database) ───→ F1.3 (Auth) ──→ F1.4 (Quota)
 │                         │              └─→ F1.6 (API Keys)
 │                         └─→ F7.1 (Subscription)
 └─→ F1.5 (R2 URLs) ───→ F2.6 (Model Cache)

F2.1 (Next.js)
 ├─→ F2.2 (shadcn) ──→ F2.5 (TTS UI)
 │                      └─→ F2.4 (Auth Flow)
 └─→ F2.3 (Router) ──→ F2.7 (Worker)

F2.5 + F2.7 (TTS Core)
 ├─→ F3.2 (SSML)
 ├─→ F4.2 (Voice Selector)
 └─→ F3.7 (Projects)
```

---

### Sprint Planning Template

| Sprint | Focus | Sub-features | Goals |
|--------|-------|--------------|-------|
| 1 | Setup | F1.1, F2.1 | Repo running |
| 2 | Database + Auth | F1.2, F1.3, F2.4 | User login |
| 3 | Core TTS | F2.5, F2.7, F1.5 | Generate audio |
| 4 | Model Loading | F2.6, F1.5 | Cache working |
| 5 | Voice Features | F4.1-F4.3 | Voice library |
| 6 | Projects | F3.7-F3.9 | Save & export |
| 7 | SDK + Docs | F6.1, F6.2 | Developer tools |
| 8 | Business | F7.1, F7.2, F7.3 | Admin + billing |
| 9 | Polish | F4.5, F4.6 | PWA + perf |

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis for rate limiting and session storage
- **Storage**: Cloudflare R2 for models and user files
- **Authentication**: Auth.js (NextAuth) with JWT support
- **Background Tasks**: Celery/RabbitMQ (if needed for heavy processing)
- **API Documentation**: OpenAPI/Swagger UI
- **Testing**: Pytest with coverage reporting

### Frontend
- **Framework**: Next.js 16 (React 19) with App Router
- **UI Library**: shadcn/ui with Tailwind CSS
- **Language**: TypeScript with strict mode
- **State Management**: Zustand or React Query
- **TTS Engine**: ONNX Runtime Web in Web Workers
- **Audio Processing**: Web Audio API for gapless playback
- **Storage**: IndexedDB for model and audio caching
- **PWA**: Workbox for service worker implementation
- **Testing**: Jest and React Testing Library

#### Frontend Architecture (Following frontend-arch Skill)

**Core Principles:**
1. **Feature-Based**: Each feature is an independent module in `features/{name}/`
2. **Colocation**: Related files (component + test + types) in same folder
3. **Clear Public API**: Only export from `features/{name}/index.ts`
4. **Server/Client Boundary**: Explicit separation

**Folder Structure:**
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── (main)/           # Dashboard with layout
│   └── providers.tsx    # Client providers
├── components/
│   └── ui/              # shadcn/ui atomic components
├── features/              # Feature-based modules
│   ├── tts/
│   │   ├── api/        # Pure API functions
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── store.ts
│   │   └── index.ts
│   ├── voice/
│   ├── auth/
│   ├── project/
│   └── settings/
├── lib/                  # Shared utilities (non-feature)
│   ├── piper/
│   ├── audio/
│   └── storage/
└── workers/
    └── tts-worker.ts
```

**Import Rules:**
- ✅ `features/tts/components` → `features/tts/hooks` → `features/tts/types`
- ✅ `features/tts/components` → `lib/piper`
- ✅ `components/ui/Button` → `features/tts/components`
- ❌ `features/users/hooks` → `features/tts/components` (forbidden)

### DevOps & Infrastructure
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Frontend Hosting**: Cloudflare Pages
- **Backend Hosting**: Cloudflare Workers or traditional VPS
- **Monitoring**: Structured logging with ELK stack or similar
- **Metrics**: Prometheus + Grafana for system monitoring
- **Error Tracking**: Sentry or similar service

## Risk Mitigation

### Privacy & Compliance
- GDPR/CCPA compliance for user data handling
- Clear data retention and deletion policies
- Regular privacy impact assessments
- Data processing agreements for enterprise customers

### Performance & Scalability
- Horizontal scaling design for stateless services
- Efficient caching strategies (Redis, CDN, browser cache)
- Load testing and performance benchmarking
- Auto-scaling configurations for traffic spikes
- Database connection pooling and query optimization

### Security
- Regular security audits and penetration testing
- OWASP Top 10 vulnerability prevention
- Input validation and sanitization
- Secure authentication and authorization
- Regular dependency vulnerability scanning
- Infrastructure security best practices

### Fallback & Reliability
- Graceful degradation for premium features
- Offline mode with core functionality preserved
- Circuit breaker patterns for external dependencies
- Comprehensive logging and monitoring
- Disaster recovery and backup procedures
- Service level agreements for enterprise tiers

## Success Metrics

### Technical Metrics
- Page load time < 3 seconds (LCP)
- Time to first audio < 1 second for short text
- 99.9% uptime SLA for paid tiers
- < 100ms API response time for basic endpoints
- 95% cache hit ratio for model loading
- < 5% error rate in production

### Business Metrics
- User activation rate > 40% (week 1)
- Retention rate > 70% (month 1)
- Conversion rate from free to paid > 15%
- Developer API adoption > 500 active keys/month
- Customer satisfaction score (CSAT) > 4.5/5
- Net Promoter Score (NPS) > 30

This plan maintains the core advantage of client-side TTS processing while adding the enterprise features needed for a successful SaaS/PaaS platform, targeting content creators, developers, and business users as requested.

---

## Challenges & Mitigations

### Technical Challenges

| # | Challenge | Risk Level | Mitigation |
|---|-----------|------------|------------|
| T1 | **WebGPU Availability** - Only ~50% have WebGPU | High | Fallback to WASM; feature detection |
| T2 | **Browser Memory Limits** - ~2GB per tab | Medium | Lazy load; chunk text |
| T3 | **COOP/COEP Headers** - Required for WASM | Medium | Same-origin; Cloudflare config |
| T4 | **Model Loading Time** - 50MB first load | Medium | Preload; IndexedDB cache |
| T5 | **Web Worker Debugging** - Hard to debug | Medium | Instrumentation; DevTools |
| T6 | **Cross-Browser** - WASM support varies | Medium | Feature detection; graceful degradation |
| T7 | **IndexedDB Limits** - Browser dependent | Low | Storage check; LRU eviction |

### Resource Challenges

| # | Challenge | Risk Level | Mitigation |
|---|-----------|------------|------------|
| R1 | **Cloud Costs at Scale** | Medium | Caching; CF free tier |
| R2 | **Database Scaling** | Low | Connection pooling |
| R3 | **Model Storage** | Low | Prefix organization |

### Market Challenges

| # | Challenge | Risk Level | Mitigation |
|---|-----------|------------|------------|
| M1 | **User Adoption** | High | Privacy/offline marketing |
| M2 | **Free Alternatives** | Medium | Vietnamese quality focus |
| M3 | **Market Demand** | Medium | Free tier validation |

### Development Challenges

| # | Challenge | Risk Level | Mitigation |
|---|-----------|------------|------------|
| D1 | **Tech Stack Complexity** | High | Phased implementation |
| D2 | **Model Conversion** | Medium | Pre-trained models |
| D3 | **Testing** | Medium | Playwright E2E |
| D4 | **State Management** | Medium | Zustand boundaries |

### Legal Challenges

| # | Challenge | Risk Level | Mitigation |
|---|-----------|------------|------------|
| L1 | **Voice Licensing** | High | Verify licenses |
| L2 | **GDPR** | Medium | Deletion policy |
| L3 | **Content Copyright** | Low | Clear ToS |

### Operational Challenges

| # | Challenge | Risk Level | Mitigation |
|---|-----------|------------|------------|
| O1 | **Monitoring** | Medium | Prometheus |
| O2 | **Incident Response** | Medium | Sentry |
| O3 | **Backup & Recovery** | Low | Automated |

---

## Key Decision Points Before Implementation

### Must Decide

| Decision | Recommended | Rationale |
|----------|-------------|----------|
| Database | Supabase | Free tier, Auth |
| Auth | Custom JWT | Full control |
| Models | Piper | Proven |
| Deployment | Cloudflare | Best free tier |
| Pricing | Tiered subscription | Clear value |

---

## Feasibility Assessment

| Category | Score | Notes |
|----------|-------|-------|
| Technical | 8/10 | Client-side proven |
| Resource | 9/10 | Free tier sufficient |
| Market | 7/10 | Opportunity exists |
| Legal | 9/10 | No issues |
| Development | 7/10 | Doable |
| **Overall** | **8/10** | **Feasible with planning** |