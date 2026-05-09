"""Language Detection Service."""
import re


# Vietnamese character patterns (with diacritics)
VIETNAMESE_CHARS = set('àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ')

# Common English words
ENGLISH_COMMON = {
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about',
    'into', 'over', 'after', 'beneath', 'under', 'above',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
    'this', 'that', 'these', 'those',
    'what', 'which', 'who', 'whom', 'whose',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'for',
    'hello', 'hi', 'good', 'bad', 'love', 'like', 'want', 'think',
    'technology', 'ai', 'ml', 'machine', 'learning', 'data', 'computer', 'internet',
}


def is_vietnamese_word(word: str) -> bool:
    """Check if word contains Vietnamese characters."""
    word_lower = word.lower()
    # Check for Vietnamese diacritics
    if any(c in VIETNAMESE_CHARS for c in word_lower):
        return True
    # Check for common Vietnamese particles
    vietnamese_particles = {'là', 'và', 'có', 'không', 'của', 'được', 'cho', 'với', 'trong', 'trên'}
    if word_lower in vietnamese_particles:
        return True
    return False


def is_english_word(word: str) -> bool:
    """Check if word is likely English."""
    word_lower = word.lower().strip('.,!?;:"\'()[]{}')
    if word_lower in ENGLISH_COMMON:
        return True
    # Check for English patterns (no Vietnamese chars, has a,e,i,o,u)
    if not any(c in VIETNAMESE_CHARS for c in word_lower):
        # Simple heuristic: if has typical English endings
        if word_lower.endswith(('ing', 'ed', 'tion', 'ness', 'ment', 'able', 'ible')):
            return True
    return False


def detect_language(text: str) -> tuple[str, float, list[dict]]:
    """Detect language and split into segments.
    
    Returns: (language, confidence, segments)
    """
    if not text.strip():
        return "vietnamese", 1.0, []
    
    words = re.findall(r'\b\w+\b|[^\w\s]|\s+', text)
    
    if not words:
        return "vietnamese", 1.0, []
    
    vn_count = 0
    en_count = 0
    segments = []
    current_segment = {"text": "", "language": "", "start_pos": 0}
    pos = 0
    
    for word in words:
        start = pos
        pos += len(word)
        
        if word.strip() == '':
            continue
            
        is_vn = is_vietnamese_word(word)
        is_en = is_english_word(word)
        
        if is_vn:
            vn_count += 1
            lang = "vietnamese"
        elif is_en:
            en_count += 1
            lang = "english"
        else:
            # Unknown - default to vietnamese for MVP
            lang = "vietnamese"
        
        # Start new segment if language changes
        if current_segment["language"] and current_segment["language"] != lang:
            if current_segment["text"]:
                segments.append(current_segment)
            current_segment = {"text": word, "language": lang, "start_pos": start}
        elif not current_segment["language"]:
            current_segment = {"text": word, "language": lang, "start_pos": start}
        else:
            current_segment["text"] += word
    
    # Add last segment
    if current_segment["text"]:
        segments.append(current_segment)
    
    # Calculate overall language
    total = vn_count + en_count
    if total == 0:
        return "vietnamese", 1.0, segments
    
    vn_ratio = vn_count / total
    
    if vn_ratio > 0.6:
        overall_lang = "vietnamese"
        confidence = vn_ratio
    elif vn_ratio < 0.4:
        overall_lang = "english"
        confidence = 1 - vn_ratio
    else:
        overall_lang = "mixed"
        confidence = 0.5
    
    return overall_lang, confidence, segments