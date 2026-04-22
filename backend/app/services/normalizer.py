"""Vietnamese Text Normalization Service."""
import re
import time
from typing import Optional

# Vietnamese number words
NUMBER_WORDS_NORTH = {
    0: "không", 1: "một", 2: "hai", 3: "ba", 4: "bốn", 
    5: "năm", 6: "sáu", 7: "bảy", 8: "tám", 9: "chín",
    10: "mười", 11: "mười một", 12: "mười hai", 13: "mười ba", 14: "mười bốn",
    15: "mười lăm", 16: "mười sáu", 17: "mười bảy", 18: "mười tám", 19: "mười chín",
    20: "hai mươi", 21: "hai mươi mốt", 22: "hai mươi hai", 23: "hai mươi ba",
    30: "ba mươi", 40: "bốn mươi", 50: "năm mươi", 60: "sáu mươi", 70: "bảy mươi",
    80: "tám mươi", 90: "chín mươi",
}

NUMBER_WORDS_SOUTH = {
    0: "không", 1: "một", 2: "hai", 3: "ba", 4: "tư",
    5: "năm", 6: "sáu", 7: "bẩy", 8: "tám", 9: "chín",
    10: "mười", 11: "mười một", 12: "mười hai", 13: "mười ba", 14: "mười tư",
    15: "mười lăm", 16: "mười sáu", 17: "mười bẩy", 18: "mười tám", 19: "mười chín",
    20: "hai mươi", 21: "hai mươi mốt", 22: "hai mươi hai", 23: "hai mươi ba",
    30: "ba mươi", 40: "tư mươi", 50: "năm mươi", 60: "sáu mươi", 70: "bẩy mươi",
    80: "tám mươi", 90: "chín mươi",
}

# Abbreviations dictionary
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

# URL pattern
URL_PATTERN = re.compile(
    r'(https?://[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9._%-]+@[a-zA-Z0-9.%-]+\.[a-zA-Z]{2,6})'
)

# Number pattern
NUMBER_PATTERN = re.compile(r'\d+(?:[.,]\d+)*')

# Currency patterns  
CURRENCY_PATTERN = re.compile(r'(\d+(?:[.,]\d+)*)\s*(đ|vnd|dollars?|usd|us\$|\$)', re.IGNORECASE)

# Date patterns
DATE_PATTERN = re.compile(r'(\d{1,2})/(\d{1,2})/(\d{2,4})|(\d{4})-(\d{1,2})-(\d{1,2})')


class VietnameseNormalizer:
    """Vietnamese text normalizer."""

    def __init__(self, dialect: str = "mixed"):
        self.dialect = dialect
        self.numbers = NUMBER_WORDS_SOUTH if dialect == "southern" else NUMBER_WORDS_NORTH

    def number_to_words(self, number: int) -> str:
        """Convert number to Vietnamese words."""
        if number < 20:
            return self.numbers.get(number, str(number))
        if number < 100:
            tens = (number // 10) * 10
            ones = number % 10
            result = self.numbers.get(tens, str(tens))
            if ones:
                result += " " + self.numbers.get(ones, str(ones))
            return result
            
        # For larger numbers, convert digit by digit
        result = []
        for digit in str(number):
            result.append(self.numbers.get(int(digit), digit))
        return " ".join(result)

    def expand_abbreviations(self, text: str) -> str:
        """Expand abbreviations."""
        words = text.split()
        result = []
        for word in words:
            lower = word.lower()
            if lower in ABBREVIATIONS:
                result.append(ABBREVIATIONS[lower])
            else:
                result.append(word)
        return " ".join(result)

    def normalize_numbers(self, text: str) -> str:
        """Convert numbers to words."""
        def replace_number(match):
            num_str = match.group().replace(",", "").replace(".", "")
            try:
                num = int(num_str)
                return self.number_to_words(num)
            except:
                return match.group()
        return NUMBER_PATTERN.sub(replace_number, text)

    def normalize_currency(self, text: str) -> str:
        """Normalize currency."""
        def replace_currency(match):
            amount = match.group(1).replace(",", ".")
            num = float(amount)
            words = self.number_to_words(int(num))
            
            currency = match.group(2).lower()
            if currency in ["usd", "us$", "dollars?", "dolar"]:
                return words + " đô la Mỹ"
            return words + " đồng"
            
        return CURRENCY_PATTERN.sub(replace_currency, text)

    def normalize_urls(self, text: str) -> str:
        """Normalize URLs and emails."""
        def replace_url(match):
            url = match.group()
            if "@" in url:
                # Email: a@b.com -> a at b dot com
                parts = url.replace("@", " at ").replace(".", " dot ")
                return parts
            # URL: https://... -> h t t p s ...
            return " ".join(list(url.replace(".", " dot ")))

    def normalize_dates(self, text: str) -> str:
        """Normalize date formats: dd/mm/yyyy -> ngày dd tháng mm năm yyyy"""
        def replace_date(match):
            groups = match.groups()
            if groups[0]:  # dd/mm/yyyy
                day, month, year = groups[0], groups[1], groups[2]
            elif groups[3]:  # yyyy-mm-dd
                year, month, day = groups[3], groups[4], groups[5]
            else:
                return match.group()
            
            # Convert 2-digit year to 4-digit
            if len(year) == 2:
                year = "20" + year if int(year) < 50 else "19" + year
            
            return f"ngày {day} tháng {month} năm {year}"
        
        return DATE_PATTERN.sub(replace_date, text)

    def normalize(self, text: str, mode: str = "standard") -> tuple[str, float]:
        """Normalize text."""
        start_time = time.time()
        
        if not text.strip():
            raise ValueError("EMPTY_TEXT: Input text is empty")
            
        if len(text) > 10000:
            raise ValueError("TEXT_TOO_LONG: Input exceeds 10000 characters")
            
        result = text
        
        if mode in ["standard", "full"]:
            result = self.expand_abbreviations(result)
            result = self.normalize_dates(result)
            result = self.normalize_numbers(result)
            result = self.normalize_currency(result)
            result = self.normalize_urls(result)
            
        return result, (time.time() - start_time) * 1000


def normalize_vietnamese(
    text: str, 
    mode: str = "standard",
    dialect: str = "mixed"
) -> tuple[str, int, int, float]:
    """Main normalization function."""
    if not text.strip():
        raise ValueError("EMPTY_TEXT")
    if len(text) > 10000:
        raise ValueError("TEXT_TOO_LONG")
        
    normalizer = VietnameseNormalizer(dialect)
    normalized, proc_time = normalizer.normalize(text, mode)
    
    return (
        normalized,
        len(text),
        len(normalized),
        proc_time
    )