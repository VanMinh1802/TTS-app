from app.services.normalizer.numbers import number_to_words, normalize_numbers

def test_number_to_words():
    assert number_to_words(0) == "không"
    assert number_to_words(5) == "năm"
    assert number_to_words(15) == "mười lăm"
    assert number_to_words(21) == "hai mươi mốt"
    assert number_to_words(125) == "một trăm hai mươi lăm"
    assert number_to_words(1005) == "một nghìn không trăm lẻ năm"
    assert number_to_words(1000000) == "một triệu"
    assert number_to_words(2500000000) == "hai tỷ năm trăm triệu"

def test_normalize_numbers_in_text():
    assert normalize_numbers("Tôi có 125 nghìn") == "Tôi có một trăm hai mươi lăm nghìn"
    assert normalize_numbers("Năm 2024") == "Năm hai nghìn không trăm hai mươi tư"
