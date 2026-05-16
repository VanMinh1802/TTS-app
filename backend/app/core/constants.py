"""Shared quota limit constants — single source of truth."""

QUOTA_LIMITS = {
    "free": {"characters": 5000, "storage_mb": 100, "api_calls": 100},
    "basic": {"characters": 50000, "storage_mb": 1024, "api_calls": 1000},
    "pro": {"characters": 200000, "storage_mb": 5120, "api_calls": 5000},
    "enterprise": {"characters": None, "storage_mb": 51200, "api_calls": None},
}
