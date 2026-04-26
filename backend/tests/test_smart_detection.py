from app.services.llm_normalizer import needs_llm_normalization

def test_needs_llm_normalization():
    assert needs_llm_normalization("Xin chào mọi người") == False
    assert needs_llm_normalization("Ngày 22/04/2026 tôi đi chơi") == False 
    assert needs_llm_normalization("Giá 50.000đ") == False 
    
    assert needs_llm_normalization("Đây là khái niệm hedging trong tài chính") == True
    assert needs_llm_normalization("Chỉ số VN-Index hôm nay") == True
    assert needs_llm_normalization("Hệ thống PoS (Proof of Stake)") == True
