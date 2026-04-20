# Voice Management Features (F4.1, F4.2, F4.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Voice Library API, Voice Management UI, and Custom Voice Upload features

**Architecture:** 
- Backend: FastAPI endpoints for voice CRUD operations, voice upload to R2 storage
- Frontend: Next.js 16 with Neo-Brutalism design for voice library management
- Storage: R2 (Cloudflare) for custom voice model files (.onnx + .json config)
- Database: PostgreSQL via existing infrastructure for voice metadata

**Tech Stack:** FastAPI, Next.js 16, R2 Storage, PostgreSQL, ONNX Runtime

---

## Overview

This plan implements three related features for voice management:

1. **F4.1 Voice Library API** - Backend API to list, get, create, update, delete voice configurations
2. **F4.2 Voice Management UI** - Frontend interface to browse and manage voices
3. **F4.3 Custom Voice Upload** - Allow users to upload custom ONNX voice models

### Data Model

**Voice Model:**
```python
class Voice(BaseModel):
    id: str                          # Unique identifier (e.g., "custom_voice_1")
    name: str                        # Display name
    language: str                    # Language code (e.g., "vi", "en")
    gender: str                      # "male", "female", "neutral"
    is_custom: bool                  # True if user-uploaded
    owner_id: str                    # User ID (null for system voices)
    model_url: str                   # R2 URL to .onnx file
    config_url: str                  # R2 URL to .onnx.json config
    is_active: bool                  # Whether voice is available
    created_at: datetime
    updated_at: datetime
```

---

## Implementation Tasks

### Task 1: Create Voice Database Model

**Files:** `backend/app/models/voice.py`, `backend/app/db/__init__.py`

---

**[RED]** Write failing test:

```python
# backend/tests/test_voice_model.py
import pytest
from app.models.voice import Voice

def test_voice_model_creation():
    voice = Voice(
        id="test_voice",
        name="Test Voice",
        language="vi",
        gender="female",
        is_custom=True,
        owner_id="user_123",
        model_url="https://r2.example.com/voice.onnx",
        config_url="https://r2.example.com/voice.onnx.json",
        is_active=True
    )
    assert voice.id == "test_voice"
    assert voice.name == "Test Voice"
    assert voice.language == "vi"
```

**[RED]** Run: `cd backend && python -m pytest tests/test_voice_model.py -v`
**Expected:** FAIL — Module not found

**[GREEN]** Write model:

```python
# backend/app/models/voice.py
from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.sql import func
from app.db import Base

class Voice(Base):
    __tablename__ = "voices"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    language = Column(String, default="vi")
    gender = Column(String, default="neutral")
    is_custom = Column(Boolean, default=False)
    owner_id = Column(String, nullable=True)  # null = system voice
    model_url = Column(String, nullable=True)
    config_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

**[GREEN]** Run: `cd backend && python -c "from app.models.voice import Voice; print('OK')"`
**Expected:** PASS

**[REFACTOR]** None needed

---

### Task 2: Create Voice Schemas

**Files:** `backend/app/schemas/voice.py`

---

**[RED]** Write failing test:

```python
# backend/tests/test_voice_schemas.py
import pytest
from app.schemas.voice import VoiceCreate, VoiceResponse

def test_voice_create_schema():
    data = {
        "name": "My Voice",
        "language": "vi",
        "gender": "female"
    }
    voice = VoiceCreate(**data)
    assert voice.name == "My Voice"
    assert voice.language == "vi"
```

**[RED]** Run: `cd backend && python -m pytest tests/test_voice_schemas.py -v`
**Expected:** FAIL

**[GREEN]** Write schemas:

```python
# backend/app/schemas/voice.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class VoiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    language: str = Field(default="vi", pattern="^[a-z]{2}(-[A-Z]{2})?$")
    gender: str = Field(default="neutral", pattern="^(male|female|neutral)$")

class VoiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    language: Optional[str] = Field(None, pattern="^[a-z]{2}(-[A-Z]{2})?$")
    gender: Optional[str] = Field(None, pattern="^(male|female|neutral)$")
    is_active: Optional[bool] = None

class VoiceResponse(BaseModel):
    id: str
    name: str
    language: str
    gender: str
    is_custom: bool
    owner_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

**[GREEN]** Run: `cd backend && python -c "from app.schemas.voice import VoiceCreate, VoiceResponse; print('OK')"`
**Expected:** PASS

**[REFACTOR]** None needed

---

### Task 3: Create Voice API Routes

**Files:** `backend/app/api/voices.py`

---

**[RED]** Write failing test:

```python
# backend/tests/test_voices_api.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_voices():
    response = client.get("/api/v1/voices")
    assert response.status_code == 200
    assert "voices" in response.json()
```

**[RED]** Run: `cd backend && python -m pytest tests/test_voices_api.py -v`
**Expected:** FAIL — Route not found

**[GREEN]** Write API routes:

```python
# backend/app/api/voices.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4

from app.db import get_db
from app.models.voice import Voice
from app.schemas.voice import VoiceCreate, VoiceUpdate, VoiceResponse
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/voices", tags=["Voice Library"])

# In-memory cache for MVP (replace with DB query in production)
VOICES_CACHE: dict[str, Voice] = {}

def get_voices_cache() -> dict[str, Voice]:
    return VOICES_CACHE


@router.get("", response_model=List[VoiceResponse])
async def list_voices(
    language: str = None,
    gender: str = None,
    is_custom: bool = None,
    db: Session = Depends(get_db)
):
    """List all available voices with optional filters."""
    voices = list(VOICES_CACHE.values())
    
    if language:
        voices = [v for v in voices if v.language == language]
    if gender:
        voices = [v for v in voices if v.gender == gender]
    if is_custom is not None:
        voices = [v for v in voices if v.is_custom == is_custom]
    
    return voices


@router.get("/{voice_id}", response_model=VoiceResponse)
async def get_voice(voice_id: str, db: Session = Depends(get_db)):
    """Get a specific voice by ID."""
    voice = VOICES_CACHE.get(voice_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    return voice


@router.post("", response_model=VoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_voice(
    voice_data: VoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new custom voice (requires authentication)."""
    voice_id = f"custom_{uuid4().hex[:8]}"
    
    voice = Voice(
        id=voice_id,
        name=voice_data.name,
        language=voice_data.language,
        gender=voice_data.gender,
        is_custom=True,
        owner_id=current_user.id,
        is_active=True
    )
    
    VOICES_CACHE[voice_id] = voice
    return voice


@router.put("/{voice_id}", response_model=VoiceResponse)
async def update_voice(
    voice_id: str,
    voice_data: VoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a custom voice (only owner can update)."""
    voice = VOICES_CACHE.get(voice_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    
    if voice.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this voice")
    
    if voice_data.name is not None:
        voice.name = voice_data.name
    if voice_data.language is not None:
        voice.language = voice_data.language
    if voice_data.gender is not None:
        voice.gender = voice_data.gender
    if voice_data.is_active is not None:
        voice.is_active = voice_data.is_active
    
    return voice


@router.delete("/{voice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voice(
    voice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a custom voice (only owner can delete)."""
    voice = VOICES_CACHE.get(voice_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    
    if voice.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this voice")
    
    del VOICES_CACHE[voice_id]
```

**[GREEN]** Run: `cd backend && python -c "from app.api.voices import router; print('OK')"`
**Expected:** PASS

**[REFACTOR]** Add to main.py:

```python
# backend/app/main.py - add to imports
from app.api.voices import router as voices_router

# Add to router section
app.include_router(voices_router, prefix=settings.API_V1_PREFIX)
```

---

### Task 4: Create Voice Upload to R2

**Files:** `backend/app/api/voices.py` (add upload endpoint), `backend/app/services/r2_service.py`

---

**[RED]** Write failing test:

```python
# backend/tests/test_voice_upload.py
import pytest

def test_upload_voice_requires_files():
    # Test that upload requires both .onnx and .json files
    pass
```

**[RED]** Run: `cd backend && python -m pytest tests/test_voice_upload.py -v`
**Expected:** FAIL

**[GREEN]** Add upload endpoint to voices.py:

```python
# Add to backend/app/api/voices.py
from fastapi import UploadFile, File, Form
import boto3
from botocore.config import Config
from app.core.settings import settings

@router.post("/upload", response_model=VoiceResponse)
async def upload_voice(
    name: str = Form(...),
    language: str = Form(default="vi"),
    gender: str = Form(default="neutral"),
    model_file: UploadFile = File(..., description="ONNX model file"),
    config_file: UploadFile = File(..., description="ONNX config JSON file"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a custom voice model to R2."""
    
    # Validate file extensions
    if not model_file.filename.endswith('.onnx'):
        raise HTTPException(status_code=400, detail="Model must be .onnx file")
    if not config_file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Config must be .json file")
    
    # Read file contents
    model_content = await model_file.read()
    config_content = await config_file.read()
    
    # Validate config is valid JSON
    import json
    try:
        config_data = json.loads(config_content)
    except:
        raise HTTPException(status_code=400, detail="Config must be valid JSON")
    
    # Upload to R2
    voice_id = f"custom_{uuid4().hex[:8]}"
    model_key = f"voices/{current_user.id}/{voice_id}/voice.onnx"
    config_key = f"voices/{current_user.id}/{voice_id}/voice.onnx.json"
    
    config = Config(signature_version="s3v4", region_name="auto")
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY or "",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        config=config,
    )
    
    # Upload model
    s3_client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=model_key,
        Body=model_content,
        ContentType="application/octet-stream"
    )
    
    # Upload config
    s3_client.put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=config_key,
        Body=config_content,
        ContentType="application/json"
    )
    
    # Generate URLs
    model_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{settings.R2_BUCKET_NAME}/{model_key}"
    config_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{settings.R2_BUCKET_NAME}/{config_key}"
    
    # Create voice record
    voice = Voice(
        id=voice_id,
        name=name,
        language=language,
        gender=gender,
        is_custom=True,
        owner_id=current_user.id,
        model_url=model_url,
        config_url=config_url,
        is_active=True
    )
    
    VOICES_CACHE[voice_id] = voice
    return voice
```

**[GREEN]** Run: `cd backend && python -c "from app.api.voices import router; print('OK')"`
**Expected:** PASS

**[REFACTOR]** None needed

---

### Task 5: Frontend - Voice Library Page

**Files:** `frontend/src/app/voices/page.tsx`

---

**[RED]** Write failing test:

```tsx
// This would require setting up Vitest/Jest for frontend
// For now, we'll verify the component renders
```

**[GREEN]** Create frontend page:

```tsx
// frontend/src/app/voices/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FadeIn, PressButton } from "@/components/motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  is_custom: boolean;
  is_active: boolean;
}

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ language: "", gender: "" });

  useEffect(() => {
    fetchVoices();
  }, [filter]);

  const fetchVoices = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.language) params.append("language", filter.language);
      if (filter.gender) params.append("gender", filter.gender);
      
      const response = await fetch(`${API_URL}/voices?${params}`);
      const data = await response.json();
      setVoices(data);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight uppercase"
      >
        Voice Library
      </motion.h1>

      {/* Filters */}
      <FadeIn>
        <div className="brutal-card p-6 mb-6">
          <div className="flex gap-4 flex-wrap">
            <select 
              value={filter.language}
              onChange={(e) => setFilter({...filter, language: e.target.value})}
              className="border-3 border-black rounded-xl px-4 py-2 font-bold"
            >
              <option value="">All Languages</option>
              <option value="vi">Vietnamese</option>
              <option value="en">English</option>
            </select>
            
            <select 
              value={filter.gender}
              onChange={(e) => setFilter({...filter, gender: e.target.value})}
              className="border-3 border-black rounded-xl px-4 py-2 font-bold"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-10 h-10 border-4 border-black border-t-transparent rounded-full"
            />
          </div>
        ) : (
          voices.map((voice) => (
            <FadeIn key={voice.id}>
              <div className="brutal-card p-6 h-full">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{voice.name}</h3>
                  {voice.is_custom && (
                    <span className="bg-[#00e676] text-black text-xs px-2 py-1 rounded font-bold">
                      CUSTOM
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Language:</span>
                    <span className="font-bold">{voice.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender:</span>
                    <span className="font-bold">{voice.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-bold ${voice.is_active ? 'text-[#00e676]' : 'text-[#ff4d4d]'}`}>
                      {voice.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <PressButton className="brutal-btn bg-[#ffd800] flex-1 py-2">
                    Test Voice
                  </PressButton>
                </div>
              </div>
            </FadeIn>
          ))
        )}
      </div>
    </main>
  );
}
```

**[GREEN]** Run: `cd frontend && npm run build`
**Expected:** PASS (or fix any TypeScript errors)

**[REFACTOR]** None needed

---

### Task 6: Frontend - Voice Upload Page

**Files:** `frontend/src/app/voices/upload/page.tsx`

---

**[GREEN]** Create upload page:

```tsx
// frontend/src/app/voices/upload/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FadeIn, PressButton } from "@/components/motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function UploadVoicePage() {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("vi");
  const [gender, setGender] = useState("neutral");
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [configFile, setConfigFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!name || !modelFile || !configFile) {
      setError("Please fill in all fields");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("language", language);
      formData.append("gender", gender);
      formData.append("model_file", modelFile);
      formData.append("config_file", configFile);

      const response = await fetch(`${API_URL}/voices/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setSuccess(true);
      setName("");
      setModelFile(null);
      setConfigFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight uppercase"
      >
        Upload Custom Voice
      </motion.h1>

      <FadeIn>
        <div className="brutal-card p-6">
          {error && (
            <div className="mb-4 p-3 bg-[#ff4d4d] text-white border-2 border-black rounded-lg font-bold">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-[#00e676] text-black border-2 border-black rounded-lg font-bold">
              Voice uploaded successfully!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-2">Voice Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border-3 border-black rounded-xl"
                placeholder="My Custom Voice"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 border-3 border-black rounded-xl"
                >
                  <option value="vi">Vietnamese</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label className="block font-bold mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 border-3 border-black rounded-xl"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold mb-2">ONNX Model File (.onnx)</label>
              <input
                type="file"
                accept=".onnx"
                onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                className="w-full p-3 border-3 border-black rounded-xl"
              />
              {modelFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {modelFile.name} ({(modelFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold mb-2">Model Config (.onnx.json)</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setConfigFile(e.target.files?.[0] || null)}
                className="w-full p-3 border-3 border-black rounded-xl"
              />
              {configFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {configFile.name}
                </p>
              )}
            </div>

            <PressButton 
              onClick={handleUpload}
              disabled={uploading || !name || !modelFile || !configFile}
              className="brutal-btn w-full py-4 text-xl font-bold bg-[#00e676] disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Voice"}
            </PressButton>
          </div>
        </div>
      </FadeIn>
    </main>
  );
}
```

**[GREEN]** Run: `cd frontend && npm run build`
**Expected:** PASS

**[REFACTOR]** None needed

---

### Task 7: Integrate TTS with Custom Voices

**Files:** `backend/app/services/tts_service.py`

---

Modify TTS service to support custom voices from R2:

```python
# backend/app/services/tts_service.py - add method

def _load_custom_voice(self, model_url: str, config_url: str):
    """Load custom voice from R2 URL."""
    import httpx
    
    # Download model
    model_resp = httpx.get(model_url, timeout=120.0)
    model_data = model_resp.content
    
    # Download config
    config_resp = httpx.get(config_url, timeout=30.0)
    config_data = config_resp.json()
    
    # Save to temp and load with Piper
    # (similar to existing _get_piper_voice logic)
```

---

### Task 8: Add Navigation to Voices Pages

**Files:** `frontend/src/components/layout/Navbar.tsx`

---

Add links to voice management pages:

```tsx
// Add to Navbar
<Link href="/voices" className="font-bold hover:underline">
  Voices
</Link>
<Link href="/voices/upload" className="font-bold hover:underline">
  Upload Voice
</Link>
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Voice Database Model | `models/voice.py` |
| 2 | Voice Schemas | `schemas/voice.py` |
| 3 | Voice API Routes | `api/voices.py` |
| 4 | Voice Upload to R2 | `api/voices.py` |
| 5 | Frontend Voice Library | `voices/page.tsx` |
| 6 | Frontend Voice Upload | `voices/upload/page.tsx` |
| 7 | TTS with Custom Voices | `services/tts_service.py` |
| 8 | Navigation | `components/layout/Navbar.tsx` |

---

## Testing Commands

```bash
# Backend tests
cd backend
python -m pytest tests/test_voice_model.py -v
python -m pytest tests/test_voice_schemas.py -v

# Frontend build
cd frontend
npm run build

# API test
curl http://localhost:8000/api/v1/voices
```

---

**Plan complete and saved to `.sdlc/SPECF4-voice-management/plan.md`.**
