"""Application metrics helpers."""

from fastapi.responses import PlainTextResponse


def metrics_response() -> PlainTextResponse:
    """Return a minimal Prometheus-compatible metrics payload."""
    payload = """# HELP app_up Application uptime indicator
# TYPE app_up gauge
app_up 1
"""
    return PlainTextResponse(payload, media_type="text/plain; version=0.0.4")
