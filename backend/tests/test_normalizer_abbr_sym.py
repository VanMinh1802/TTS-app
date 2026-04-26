from app.services.normalizer.abbreviations import expand_abbreviations
from app.services.normalizer.symbols import normalize_symbols

def test_expand_abbreviations():
    assert expand_abbreviations("Tôi ở tp hcm") == "Tôi ở Thành Phố Hồ Chí Minh"
    assert expand_abbreviations("CEO của công ty") == "xi i ô của Công Ty"

def test_normalize_symbols():
    assert normalize_symbols("Tỉ lệ 50%") == "Tỉ lệ 50 phần trăm"
    assert normalize_symbols("A & B") == "A và B"
    assert normalize_symbols("Lãi suất (năm)") == "Lãi suất năm"
