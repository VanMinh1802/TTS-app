"""Utility functions for text processing."""
import re


def cleanup_grammar(text: str) -> str:
    """Layer 3: Grammar cleanup for TTS."""
    # Remove duplicate words: "sự sự" -> "sự"
    text = re.sub(r'\b(\w+)\s+\1\b', r'\1', text, flags=re.IGNORECASE)
    
    # Clean up parentheses: "(text)" -> "text" (keep content, remove parens)
    text = re.sub(r'\(([^)]+)\)', r'\1', text)
    
    # Clean up multiple spaces
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()