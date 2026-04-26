from app.services.normalizer.currency import normalize_currency
from app.services.normalizer.datetime import normalize_dates

def test_normalize_currency():
    assert normalize_currency("Giá 50.000đ") == "Giá năm mươi nghìn đồng"
    assert normalize_currency("Giá 50,000 VND") == "Giá năm mươi nghìn đồng"
    assert normalize_currency("Contract $50,000 USD") == "Contract năm mươi nghìn đô la Mỹ"
    assert normalize_currency("Chi phí $50") == "Chi phí năm mươi đô la Mỹ"
    assert normalize_currency("Giá 2.500.000.000đ") == "Giá hai tỷ năm trăm triệu đồng"

def test_normalize_dates():
    assert normalize_dates("Ngày 22/04/2026") == "Ngày ngày hai mươi hai tháng tư năm hai nghìn không trăm hai mươi sáu"
    assert normalize_dates("22/04/2026") == "ngày hai mươi hai tháng tư năm hai nghìn không trăm hai mươi sáu"
    assert normalize_dates("2024-12-31") == "ngày ba mươi mốt tháng mười hai năm hai nghìn không trăm hai mươi tư"
