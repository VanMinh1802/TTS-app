import re

ONES = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]

def _read_tens(n: int, has_hundreds: bool) -> str:
    if n == 0:
        return "lẻ" if has_hundreds else ""
    if n < 10:
        return f"lẻ {ONES[n]}" if has_hundreds else ONES[n]
    
    tens = n // 10
    ones = n % 10
    
    res = "mười" if tens == 1 else f"{ONES[tens]} mươi"
    
    if ones == 1 and tens > 1:
        res += " mốt"
    elif ones == 4 and tens > 1:
        res += " tư"
    elif ones == 5:
        res += " lăm"
    elif ones > 0:
        res += f" {ONES[ones]}"
        
    return res

def _read_hundreds(n: int, full_read: bool = False) -> str:
    if n == 0:
        return "không trăm" if full_read else ""
    
    hundreds = n // 100
    remainder = n % 100
    
    res = f"{ONES[hundreds]} trăm"
    if remainder > 0:
        res += f" {_read_tens(remainder, True)}"
    elif full_read and remainder == 0: 
        pass 
        
    return res.strip()

def number_to_words(num: int) -> str:
    if num == 0: return "không"
    
    units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"]
    chunks = []
    
    temp = num
    while temp > 0:
        chunks.append(temp % 1000)
        temp //= 1000
        
    words = []
    for i, chunk in enumerate(chunks):
        if chunk == 0 and i > 0:
            continue
            
        chunk_words = ""
        needs_full_read = i < len(chunks) - 1 and num > 999 and chunk > 0 and chunk < 100
        
        if chunk > 99 or needs_full_read:
            chunk_words = _read_hundreds(chunk, full_read=needs_full_read)
        else:
            chunk_words = _read_tens(chunk, has_hundreds=False)
            
        if chunk_words:
            words.insert(0, f"{chunk_words} {units[i]}".strip())
            
    return " ".join(words).strip()

NUMBER_PATTERN = re.compile(r'\b\d+(?:[.,]\d+)*\b')

def normalize_numbers(text: str) -> str:
    def replace(match):
        num_str = match.group().replace(",", "").replace(".", "")
        try:
            return number_to_words(int(num_str))
        except ValueError:
            return match.group()
    return NUMBER_PATTERN.sub(replace, text)
