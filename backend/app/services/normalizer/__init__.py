from .numbers import normalize_numbers
from .currency import normalize_currency
from .datetime import normalize_dates
from .abbreviations import expand_abbreviations
from .symbols import normalize_symbols
from app.utils.text_utils import cleanup_grammar

def normalize_vietnamese(text: str) -> tuple[str, int, int, float]:
    import time
    start = time.time()
    
    # Layer 2: Rule-based
    result = text
    result = normalize_dates(result)
    result = normalize_currency(result)
    result = normalize_numbers(result)
    result = expand_abbreviations(result)
    result = normalize_symbols(result)
    
    return result, len(text), len(result), (time.time() - start) * 1000