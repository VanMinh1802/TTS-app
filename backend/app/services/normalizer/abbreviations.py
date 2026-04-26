import re

ABBREVIATIONS = {
    # Countries
    "vn": "Việt Nam",
    "hq": "Hàn Quốc",
    "trung quốc": "Trung Quốc",
    "mỹ": "Hoa Kỳ",
    "us": "Hoa Kỳ",
    "uk": "Anh",
    # Cities
    "tp hcm": "Thành Phố Hồ Chí Minh",
    "tp hn": "Thành Phố Hà Nội",
    "hn": "Hà Nội",
    # Education
    "đhqg": "Đại Học Quốc Gia",
    "đh": "Đại Học",
    "thcs": "Trung Học Cơ Sở",
    "thpt": "Trung Học Phổ Thông",
    "tiểu học": "Tiểu Học",
    "mần học": "Mầm Non",
    # Government
    "bộ gdđt": "Bộ Giáo Dục và Đào Tạo",
    "bộ y tế": "Bộ Y Tế",
    # Time
    "gđkg": "Giờ Địa Kim Nguyên Kế",
    "jst": "Giờ Chuẩn Nhật Bản",
    "utc": "Giờ Quốc Tế",
    # Tech/Internet
    "it": "Công Nghệ Thông tin",
    "ict": "Công Nghệ Thông tin",
    "3g": "mạng ba G",
    "4g": "mạng bốn G", 
    "5g": "mạng năm G",
    "wifi": "Wifi",
    "usb": "Ú S Bê",
    # Common titles
    "mr": "ông",
    "mrs": "bà",
    "ms": "cô",
    "dr": "tiến sĩ",
    "ts": "tiến sĩ",
    "ths": "thạc sĩ",
    "bs": "bác sĩ",
    "nv": "nhân viên",
    "gd": "giáo viên",
    # Business
    "công ty": "Công Ty",
    "tnhh": "Trách Nhiệm Hữu Hạn",
    "cổ phần": "Cổ Phần",
    # Currency
    "usd": "đô la Mỹ",
    "gbp": "bảng Anh",
    "jpy": "yên Nhật",
    "cny": "nhân dân tệ",
    "eur": "êu rô",
    # Layer 2: Pronunciation aliases for TTS
    "ceo": "xi i ô",
    "b2b": "bi tu bi",
    "vnd": "đồng Việt Nam",
    "sales": "xêo",
    "deadline": "đềa đàyên",
    "team": "tìm",
    "bonus": "bô nút",
}

def expand_abbreviations(text: str) -> str:
    # First, sort keys by length descending to match longest phrases first (e.g., "tp hcm" before "tp")
    sorted_abbrs = sorted(ABBREVIATIONS.items(), key=lambda x: len(x[0]), reverse=True)
    
    for abbr, full in sorted_abbrs:
        pattern = r'\b' + re.escape(abbr) + r'\b'
        text = re.sub(pattern, full, text, flags=re.IGNORECASE)
    return text
