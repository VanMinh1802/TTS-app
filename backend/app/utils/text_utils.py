"""Utility functions for text processing."""
import re

EMOTION_TAG_PATTERN = re.compile(r'\(([^)]+)\)')


def cleanup_grammar(text: str) -> str:
    """Layer 3: Grammar cleanup for TTS."""
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text, flags=re.IGNORECASE)
    text = re.sub(r'\(([^)]+)\)', r'\1', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def strip_emotion_tags(text: str) -> str:
    """Remove emotion tags like (ngạc nhiên), (cười) from text."""
    return EMOTION_TAG_PATTERN.sub('', text).strip()


def parse_emotion_tags(text: str) -> list[dict[str, str]]:
    """Parse emotion tags from text."""
    chunks = []
    matches = list(EMOTION_TAG_PATTERN.finditer(text))
    if not matches:
        if text.strip():
            return [{"emotion": "bình thường", "text": text.strip()}]
        return []

    for i, match in enumerate(matches):
        emotion = match.group(1).lower().strip()
        tag_end = match.end()
        next_tag_start = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        text_content = text[tag_end:next_tag_start].strip()
        if text_content:
            chunks.append({"emotion": emotion, "text": text_content})
    return chunks
