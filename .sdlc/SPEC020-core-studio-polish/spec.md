# Feature: Studio Polish

> **Status:** Review
> **Author:** Kilo
> **Date:** 2026-05-05
> **Parent:** Sub-project 2 of "UI/UX Improvement"

---

## 1. Scope

Polish the Studio page with 3 focused improvements. No architectural changes, no backend API changes.

## 2. Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | **Toolbar**: Group "Sửa chính tả", "Kiểm tra phát âm", "Chia đoạn" into a compact `aether-glass-wrapper` toolbar band above TextInput, with proper icon+text pair and spacing |
| FR-2 | **Floating Action Bar**: Move Generate + Cancel + Library buttons into a fixed/sticky bottom bar (glass pill group), visible only when text area has content or during generation |
| FR-3 | **Waveform Visualizer**: Replace text loading indicator in PreviewPanel with animated audio waveform bars during generation (progress-driven) |

## 3. Out of Scope

- VoiceSelector / VoiceSettings / CustomDictionary changes
- New features or tools
- Layout redesign (grid stays as-is)
- Mobile-only changes

## 4. Change Log

| Date | Version | Changed By | Summary |
|------|---------|------------|---------|
| 2026-05-05 | v1.0 | Kilo | Initial |
