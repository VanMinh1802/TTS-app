"""Utility functions for text processing."""
import re

EMOTION_TAG_PATTERN = re.compile(r'\([^)]+\)')


def strip_emotion_tags(text: str) -> str:
    """Remove emotion tags like (ngạc nhiên), (cười) from text."""
    return EMOTION_TAG_PATTERN.sub('', text).strip()