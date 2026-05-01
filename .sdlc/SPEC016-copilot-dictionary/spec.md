# Feature: Copilot Dictionary

> **Status:** Draft
> **Author:** Antigravity
> **Date:** 2026-05-01
> **Related Issues:** #

---

## 1. Problem Statement

### 1.1 User Problem

Currently, the text normalization pipeline uses an LLM (Gemini) implicitly during the TTS generation process. This creates several issues:
1. "Black box" effect: Users do not know exactly how English words or acronyms are transliterated until they hear the final audio.
2. High latency: Every time a user generates audio with complex text, the LLM is called, adding seconds to the generation time.
3. Wasted API usage: The same words (e.g., "DevOps") are processed by the LLM repeatedly across different generations.

### 1.2 Business Impact

Shifting the LLM from an implicit pipeline step to an explicit "Copilot" feature improves user trust and control. It significantly reduces backend latency for TTS generation and saves LLM API quota by encouraging users to save phonetics to their custom dictionary for reuse.

### 1.3 Success Criteria

- [ ] Users can manually trigger the AI to scan their text for complex terms.
- [ ] Users can review, edit, and bulk-add suggested terms to their Custom Dictionary.
- [ ] TTS Generation endpoint latency is reduced by removing the implicit LLM call.

---

## 2. User Stories & Acceptance Criteria

### Story 1: Analyze Complex Words
**As a** content creator,
**I want** to scan my text for complex English words and acronyms,
**so that** I can see how the AI suggests pronouncing them.

#### Acceptance Criteria
- **Given** I have entered text with English words (e.g., "DevOps"),
  **When** I click "✨ Phân tích từ khó",
  **Then** a modal opens displaying a list of suggested transliterations (e.g., "Đép-óp").

### Story 2: Bulk Add to Dictionary
**As a** content creator,
**I want** to edit the AI's suggestions and save them to my dictionary,
**so that** I don't have to manually type them in and the system remembers them for future use.

#### Acceptance Criteria
- **Given** I am viewing the AI's suggestions,
  **When** I edit a pronunciation and click "Lưu X từ vào Từ điển",
  **Then** the selected words are saved to my Custom Dictionary and the modal closes.

### Story 3: Fast Audio Generation
**As a** content creator,
**I want** audio generation to be instantaneous,
**so that** I don't have to wait for the LLM every time.

#### Acceptance Criteria
- **Given** I click "Tạo giọng đọc",
  **When** the text is sent to the backend,
  **Then** the backend only uses the Custom Dictionary and rule-based normalization, completely bypassing the LLM.

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Create `POST /api/tts/extract-terms` endpoint that returns a JSON list of words and their phonetics | Must |
| FR-2 | Remove implicit `_call_gemini` from the `generate_tts` endpoint | Must |
| FR-3 | Add "✨ Phân tích từ khó" button to `TextInput` component | Must |
| FR-4 | Implement a Modal to display, edit, and select extracted terms | Must |
| FR-5 | Add selected terms to the Custom Dictionary via API | Must |

### 3.2 Edge Cases

- Text contains no complex words: Return an empty list and show a toast notification.
- Missing API Key: Display a clear error prompting the user to configure their Gemini API Key.
- Empty text input: Disable the analyze button.

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| API Key Invalid | Return 401/400 and show error toast "API Key không hợp lệ" |
| LLM parsing failure | Catch JSON parsing errors and fallback gracefully or retry |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- TTS Generation API must respond much faster (latency depends only on Piper now).
- Extract terms API should respond in < 3 seconds depending on text length.

### 4.2 Security
- LLM API key must still be passed securely from frontend local storage.

---

## 5. Unit Test Cases (TDD)
(Omitted for brevity in this simple feature, tests will be written during implementation if needed).

---

## 6. Boundaries
- **ALLOW**: Modify `tts.py` to remove implicit LLM calls.
- **ALLOW**: Create a new endpoint in `tts.py` for extraction.

---

## 8. Out of Scope
- Automatic background scanning while typing (debounce). This is a manual feature for now.

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-01 | v1.0 | Antigravity | Initial spec | — | All |
