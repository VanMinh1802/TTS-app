# SPEC: Phase 5 - Project Workflow

> **spec_id:** SDD-2026-016
> **title:** Project Workflow (F5.1 - F5.5)
> **author:** Agent
> **date:** 2026-04-20
> **status:** Draft
> **priority:** P2
> **type:** Feature
> **related_issues:** []
> **related_specs:** [REQ-001, REQ-002, REQ-003, REQ-004, SPEC001-core-enhanced-tts-application]

---

## 1. Introduction

### 1.1 Purpose

Phase 5 introduces project-based workflow features that enable users to organize and manage TTS generation tasks as hierarchical projects with scenes and segments. This enables:

- Multi-segment TTS projects with different voices per segment
- Timeline-based editing and reordering
- Export functionality for single files or chapter-separated outputs

### 1.2 Scope

**In Scope:**
- F5.1: Project CRUD API (backend)
- F5.2: Project list UI (frontend)
- F5.3: Scene/segment editor (frontend)
- F5.4: Timeline interface (frontend)
- F5.5: Export functionality (frontend + backend)

**Out of Scope:**
- F7.4: Cloud sync for projects (future phase)
- Collaboration features (team projects, version history, commenting)
- Template library for common use cases

---

## 2. Proposed Folder Structure

### 2.1 New Files & Directories

```
backend/app/
├── api/
│   └── projects.py              # F5.1: Project CRUD endpoints
├── models/
│   └── project.py              # F5.1: Project database model
├── schemas/
│   └── project.py              # F5.1: Project schemas

frontend/src/
├── app/projects/
│   ├── page.tsx               # F5.2: Project list page
│   └── [id]/
│       └── page.tsx           # F5.3-F5.4: Project editor with timeline
├── components/
│   └── project/
│       ├── ProjectList.tsx    # F5.2: List component
│       ├── ProjectCard.tsx     # F5.2: Card component
│       ├── SceneEditor.tsx     # F5.3: Scene/segment editor
│       ├── SegmentForm.tsx      # F5.3: Segment form
│       ├── Timeline.tsx        # F5.4: Timeline interface
│       └── ExportModal.tsx     # F5.5: Export modal
├── features/
│   └── projects/
│       ├── api/
│       │   ├── projects-api.ts
│       │   └── projects-api.test.ts
│       ├── types/
│       │   └── project-types.ts
│       └── utils/
│           └── project-utils.ts
```

### 2.2 Modified Files

| File | Modification Type | Description |
|------|------------------|-------------|
| `backend/app/main.py` | Modify | Add projects router |
| `backend/app/api/tts.py` | Modify | Add project segment TTS generation |
| `frontend/src/app/studio/page.tsx` | Modify | Link to projects |

---

## 3. User Interactions & Flows

### 3.1 User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|------------------|-----------|---------|
| US-01 | User | Create a new project | I can organize related TTS content | Must Have |
| US-02 | User | Duplicate a project | I can create variations without starting from scratch | Should Have |
| US-03 | User | Add scenes to a project | I can structure multi-part content | Must Have |
| US-04 | User | Add text segments with specific voices | Each segment has appropriate voice | Must Have |
| US-05 | User | Reorder segments via drag-drop | I can adjust timing and flow | Must Have |
| US-06 | User | Export project as single audio | I can download complete output | Must Have |
| US-07 | User | Export project with chapter markers | Output has clear chapter boundaries | Should Have |
| US-08 | User | Generate all segments at once | I can preview entire project audio | Should Have |

### 3.2 User Flows

```
Flow: Create and Export Project
Actor: User

Step 1: User clicks "New Project" button
Step 2: System shows project creation modal with name input
Step 3: User enters project name, clicks "Create"
Step 4: System creates project, navigates to project editor
Step 5: User clicks "Add Scene" button
Step 6: System adds new scene with default name
Step 7: User clicks "Add Segment" on scene
Step 8: System adds new text segment with default text and voice
Step 9: User enters text, selects voice
Step 10: Repeat steps 7-9 for additional segments
Step 11: User drags segments to reorder (optional)
Step 12: User clicks "Export" button
Step 13: System generates audio for all segments sequentially
Step 14: User downloads combined audio file
End: User has exported audio file
```

---

## 4. Functional Requirements

### 4.1 Core Features

#### F5.1: Project CRUD API

**Description:** Backend API for creating, reading, updating, and deleting projects.

**Business Rules:**
- Project belongs to authenticated user only
- Project has many Scenes
- Scene has many Segments
- Segment has: text, voice_id, order (position in timeline)

**Inputs:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | 1-100 characters |
| description | string | No | max 500 characters |

**API Endpoints:**

```
POST /api/projects
Authorization: Bearer <jwt>
Body: { name: string, description?: string }
Response: { id: uuid, name: string, description?: string, created_at: datetime, updated_at: datetime }

GET /api/projects
Authorization: Bearer <jwt>
Response: [{ id, name, description?, scene_count, segment_count, created_at, updated_at }]

GET /api/projects/{id}
Authorization: Bearer <jwt>
Response: { id, name, description?, scenes: [{ id, name, order, segments: [{ id, text, voice_id, order }] }] }

PUT /api/projects/{id}
Authorization: Bearer <jwt>
Body: { name?: string, description?: string }
Response: { id, name, description, updated_at }

DELETE /api/projects/{id}
Authorization: Bearer <jwt>
Response: { success: true }

POST /api/projects/{id}/duplicate
Authorization: Bearer <jwt>
Response: { id: uuid, name: string (copy suffix), ... }
```

**Scenes Endpoints:**

```
POST /api/projects/{id}/scenes
Body: { name: string }
Response: { id, name, order, segments: [] }

PUT /api/projects/{id}/scenes/{scene_id}
Body: { name?: string, order?: int }
Response: { id, name, order }

DELETE /api/projects/{id}/scenes/{scene_id}
Response: { success: true }
```

**Segments Endpoints:**

```
POST /api/projects/{id}/scenes/{scene_id}/segments
Body: { text: string, voice_id: string }
Response: { id, text, voice_id, order }

PUT /api/projects/{id}/segments/{segment_id}
Body: { text?: string, voice_id?: string, order?: int }
Response: { id, text, voice_id, order }

DELETE /api/projects/{id}/segments/{segment_id}
Response: { success: true }

POST /api/projects/{id}/segments/reorder
Body: { segment_ids: [uuid, uuid, ...] }
Response: { success: true }
```

#### F5.2: Project List UI

**Description:** Frontend page to display and manage user's projects.

**Components:**

1. **ProjectListPage** (`/projects`)
   - Header with "New Project" button
   - Grid of ProjectCard components
   - Empty state when no projects

2. **ProjectCard**
   - Project name (editable on click)
   - Description preview (truncated to 100 chars)
   - Scene/segment count badges
   - Last modified date (relative: "2 hours ago")
   - Actions: Edit, Duplicate, Delete

**UI States:**
- Loading: Skeleton cards
- Empty: Illustration + "Create your first project" CTA
- Error: Error message + retry button
- Success: Project grid

#### F5.3: Scene/Segment Editor

**Description:** Editor interface for managing scenes and segments within a project.

**Components:**

1. **SceneEditor** (`/projects/[id]`)
   - Sidebar: Scene list with add/delete
   - Main area: Segment list for selected scene
   - Each segment shows: text preview (truncated to 50 chars), voice, duration estimate

2. **SegmentForm**
   - Text input (textarea, max 5000 chars)
   - Voice selector dropdown
   - Character count display
   - Preview audio button
   - Duration estimate: ~150 chars/minute (Piper average)

**Interactions:**
- Click scene → shows segments
- Drag segment → reorder
- Click segment → edit in form
- "Generate All" → generates audio for all segments sequentially
- Each segment auto-saves on blur (debounced 500ms)

#### F5.4: Timeline Interface

**Description:** Visual timeline for reordering and managing segments.

**Components:**

1. **Timeline**
   - Horizontal timeline with scene/segment blocks
   - Drag-drop to reorder
   - Visual duration estimates
   - Zoom in/out controls

**Visual Design:**
- Scenes as colored sections
- Segments as blocks within scenes
- Voice indicator per segment (color dot)
- Play head indicator for preview

#### F5.5: Export Functionality

**Description:** Export project to audio files.

**Export Options:**

1. **Single File**
   - All segments concatenated
   - Single audio file output
   - Filename: `{project_name}.wav`

2. **Chapter Separated**
   - Each scene as separate chapter
   - Silent gap between chapters (optional)
   - ZIP archive with chapter files

3. **Individual Segments**
   - Each segment as separate file
   - ZIP archive with all files

**API:** 

```
POST /api/projects/{id}/export
Authorization: Bearer <jwt>
Body: { format: "single" | "chapters" | "segments", gap_seconds?: number }
Response: { job_id: uuid, status: "processing" | "completed" | "failed" }

GET /api/projects/{id}/export/{job_id}/status
Response: { status: "processing" | "completed" | "failed", progress: number (0-100), error?: string }

GET /api/projects/{id}/export/{job_id}/download (when completed)
Response: File stream download
```

**Export flow:**
1. Client POSTs to /export
2. Server returns job_id, starts async processing
3. Client polls /export/{job_id}/status every 2 seconds
4. When status="completed", client GETs /download
5. Download URL expires in 1 hour

**Frontend:**
- ExportModal component
- Progress indicator during generation
- Download button when ready

---

## 5. Data Model

### 5.1 Domain Entities

```
Project
├── id: UUID (PK)
├── user_id: UUID (FK)
├── name: string
├── description: string?
├── created_at: datetime
├── updated_at: datetime
└── relationships
    └── has many: Scene

Scene
├── id: UUID (PK)
├── project_id: UUID (FK)
├── name: string
├── order: int
├── created_at: datetime
└── relationships
    └── belongs to: Project
    └── has many: Segment

Segment
├── id: UUID (PK)
├── scene_id: UUID (FK)
├── text: string (max 5000)
├── voice_id: string
├── order: int
├── audio_url: string? (cached)
├── created_at: datetime
└── relationships
    └── belongs to: Scene
```

### 5.2 Database Schema

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    voice_id VARCHAR(50) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    audio_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_scenes_project ON scenes(project_id);
CREATE INDEX idx_segments_scene ON segments(scene_id, order_index);
```

---

## 6. Edge Cases & Error Handling

### 6.1 Edge Cases

| ID | Scenario | Expected Behavior | Severity |
|----|----------|-------------------|-----------|
| EC-01 | Project name empty | Show validation error, prevent save | High |
| EC-02 | Segment text too long (>5000) | Show character limit error | High |
| EC-03 | No segments to export | Disable export button | Medium |
| EC-04 | Voice not found | Use default voice, show warning | Medium |
| EC-05 | Export fails partially | Report failed segments, allow retry | Medium |
| EC-06 | Delete project with scenes | Cascade delete all scenes/segments | High |

### 6.2 Error Handling

| Error Condition | User Message | System Action |
|----------------|--------------|---------------|
| Project not found | "Project not found" | 404, log warning |
| Access denied | "You don't have access to this project" | 403 |
| Export timeout | "Export taking too long. Try fewer segments." | 504, suggest chunking |
| Voice unavailable | "Voice unavailable. Using default." | Warning, fallback |

---

## 7. Non-Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| NFR-01 | Performance | Project list loads in <1s |
| NFR-02 | Performance | Segment reorder saves in <500ms |
| NFR-03 | Scalability | Support 100+ segments per project |
| NFR-04 | UX | Drag-drop works smoothly on desktop |

---

## 8. Acceptance Criteria

### F5.1: Project CRUD API

- [ ] POST /api/projects creates project, returns 201 with project object
- [ ] GET /api/projects returns array of user's projects with counts
- [ ] GET /api/projects/{id} returns project with nested scenes/segments
- [ ] PUT /api/projects/{id} updates and returns 200
- [ ] DELETE /api/projects/{id} returns 204, cascades to scenes/segments
- [ ] All project endpoints return 401 without valid JWT
- [ ] GET /api/projects returns 403 if project belongs to another user
- [ ] POST /api/projects/{id}/duplicate creates copy with "- copy" suffix

### F5.2: Project List UI

- [ ] GET /projects fetches and displays all user's projects
- [ ] New Project button opens creation modal
- [ ] Creating project navigates automatically to /projects/[id]
- [ ] Clicking project name navigates to editor
- [ ] Clicking Delete shows confirmation dialog
- [ ] Confirming delete removes project, shows success toast
- [ ] When no projects: shows illustration + "Create your first project" CTA
- [ ] During fetch: shows 6 skeleton cards in 3x2 grid

### F5.3: Scene/Segment Editor

- [ ] Can add new scene
- [ ] Can rename scene
- [ ] Can delete scene
- [ ] Can add new segment to scene
- [ ] Can edit segment text
- [ ] Can select voice for segment
- [ ] Can delete segment

### F5.4: Timeline Interface

- [ ] Shows visual timeline of segments
- [ ] Can drag-drop to reorder
- [ ] Shows voice indicator per segment
- [ ] Shows duration estimates

### F5.5: Export Functionality

- [ ] Export button opens modal with format options
- [ ] Selecting format and clicking Export starts async job
- [ ] Progress bar shows job status (poll every 2s)
- [ ] On completion: Download button enabled
- [ ] On failure: Error message + Retry button
- [ ] Single format: single WAV file download
- [ ] Chapters format: ZIP with scene_01.wav, scene_02.wav, etc.
- [ ] Segments format: ZIP with segment_01.wav, segment_02.wav, etc.

---

## 9. Dependencies

### 9.1 Internal Dependencies

| Component | Relationship | Notes |
|-----------|-------------|-------|
| F1.2 PostgreSQL | Required | Database for projects |
| F1.3 Auth | Required | User ownership |
| F2.2 shadcn/ui | Required | UI components |
| F3.3 User Dictionary | Optional | Custom pronunciation |
| F4.1 Voice Library | Required | Voice selection |

### 9.2 External Dependencies

None - all features use existing infrastructure.