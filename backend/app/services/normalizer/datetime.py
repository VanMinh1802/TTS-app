import re
from .numbers import number_to_words

DATE_PATTERN = re.compile(r'\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b|\b(\d{4})-(\d{1,2})-(\d{1,2})\b')

def normalize_dates(text: str) -> str:
    def replace(match):
        groups = match.groups()
        if groups[0]:  # dd/mm/yyyy
            day, month, year = groups[0], groups[1], groups[2]
        elif groups[3]:  # yyyy-mm-dd
            year, month, day = groups[3], groups[4], groups[5]
        else:
            return match.group(0)
            
        # Convert 2-digit year
        if len(year) == 2:
            year = "20" + year if int(year) < 50 else "19" + year
            
        day_word = number_to_words(int(day))
        month_word = number_to_words(int(month))
        
        if int(month) == 4: month_word = "tư"
        if int(month) == 1: month_word = "một" 
            
        year_word = number_to_words(int(year))
        
        return f"ngày {day_word} tháng {month_word} năm {year_word}"

    return DATE_PATTERN.sub(replace, text)
