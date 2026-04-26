import re

def normalize_symbols(text: str) -> str:
    text = text.replace("%", " phần trăm")
    text = text.replace("&", " và ")
    
    # Strip parens but keep content
    text = re.sub(r'\(([^)]+)\)', r' \1 ', text)
    
    # Clean up double spaces created by replacement
    text = re.sub(r'\s+', ' ', text).strip()
    return text
