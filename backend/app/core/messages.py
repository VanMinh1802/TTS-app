"""Centralized Vietnamese messages for backend responses and errors."""

BACKEND_MESSAGES = {
    "errors": {
        "internal_server_error": "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.",
        "rate_limit_exceeded": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
        "api_calls_limit": "Bạn đã đạt giới hạn số lần gọi API trong ngày.",
        "characters_limit": "Bạn đã hết số lượng ký tự trong tháng.",
        "invalid_api_key": "API key không hợp lệ hoặc đã bị thu hồi.",
        "gemini_rate_limit": "Đã đạt rate limit. Vui lòng thử lại sau ít phút.",
        "gemini_quota_exceeded": "Đã hết quota. Vui lòng kiểm tra billing trên Google AI Studio.",
        "gemini_connection_error": "Lỗi kết nối đến Gemini API.",
        "unknown_status": "Trạng thái không xác định.",
        "storage_limit": "Bạn đã hết dung lượng lưu trữ Storage (Storage limit reached).",
        "pro_feature_only": "Tính năng lưu trữ đám mây chỉ dành cho tài khoản PRO (Cloud storage requires PRO tier).",
        "subscription_expired": "Gói cước của bạn đã hết hạn (Subscription expired). Vui lòng gia hạn để tiếp tục sử dụng.",
        "record_not_found": "Không tìm thấy file âm thanh (Record not found).",
        "r2_upload_error": "Lỗi khi tải file lên máy chủ (R2 Upload Error).",
    },
    "notifications": {
        "rate_limit_retry": "API rate limit đã vượt quá. Vui lòng thử lại sau {seconds} giây.",
    },
    "status": {
        "api_key_valid": "✓ API key hợp lệ và hoạt động tốt",
        "api_key_invalid": "✗ API key không hợp lệ hoặc đã bị thu hồi",
        "api_key_rate_limit": "⚠ Đã đạt rate limit, vui lòng thử lại sau ít phút",
        "api_key_quota_exceeded": "⚠ Đã hết quota, kiểm tra billing trên Google AI Studio",
        "api_key_error": "✗ Lỗi kết nối đến Gemini API",
    },
}
