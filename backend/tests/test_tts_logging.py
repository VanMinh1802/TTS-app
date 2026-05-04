"""Verify tts_service.py uses proper logging instead of print()."""
import logging


def test_logger_is_configured():
    from app.services import tts_service

    assert hasattr(tts_service, "logger")

    expected_name = "app.services.tts_service"
    assert tts_service.logger.name == expected_name


def test_logger_is_logging_logger():
    from app.services import tts_service

    assert isinstance(tts_service.logger, logging.Logger)
