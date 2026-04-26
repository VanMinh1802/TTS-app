import re
from .numbers import number_to_words

CURRENCY_PATTERN = re.compile(r'(?:\$)?(\d+(?:[.,]\d+)*)\s*(đ|vnd|dollars?|usd|us\$|\$)?', re.IGNORECASE)

def normalize_currency(text: str) -> str:
    def replace(match):
        amount_str = match.group(1).replace(",", "").replace(".", "")
        try:
            num = int(amount_str)
            words = number_to_words(num)
        except ValueError:
            return match.group(0)
            
        currency_symbol = (match.group(2) or "").lower()
        original_text = match.group(0)
        
        # Determine currency type
        if currency_symbol in ["usd", "us$", "dollars", "dollar"] or "$" in original_text:
            return f"{words} đô la Mỹ"
        elif currency_symbol in ["đ", "vnd"]:
            return f"{words} đồng"
            
        return original_text

    return CURRENCY_PATTERN.sub(replace, text)
