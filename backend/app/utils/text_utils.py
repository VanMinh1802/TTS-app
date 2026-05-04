"""Utility functions for text processing."""
import re


def cleanup_grammar(text: str) -> str:
    """Layer 3: Grammar cleanup for TTS."""
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text, flags=re.IGNORECASE)
    text = re.sub(r'\(([^)]+)\)', r'\1', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
