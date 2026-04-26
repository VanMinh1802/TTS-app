"""Tests for voice library API."""


def test_list_voices_includes_registry_items(client, monkeypatch):
    from app.api import voices as voices_module

    monkeypatch.setattr(
        voices_module,
        "load_default_voice_registry",
        lambda: {
            "ngochuyen": {
                "id": "ngochuyen",
                "name": "Ngọc Huyền",
                "language": "vi",
                "gender": "female",
                "is_custom": True,
                "owner_id": None,
                "model_url": "https://cdn.example.com/genvoice-models/vi/ngochuyen/ngochuyen.onnx",
                "config_url": "https://cdn.example.com/genvoice-models/vi/ngochuyen/ngochuyen.onnx.json",
                "sample_url": "https://cdn.example.com/vi/ngochuyen/sample.wav",
                "folder": "ngochuyen",
                "is_active": True,
                "created_at": None,
                "updated_at": None,
                "model_key": "vi/ngochuyen/ngochuyen.onnx",
                "config_key": "vi/ngochuyen/ngochuyen.onnx.json",
                "folder": "ngochuyen",
            },
            "mytam2": {
                "id": "mytam2",
                "name": "Mỹ Tâm",
                "language": "vi",
                "gender": "female",
                "is_custom": True,
                "owner_id": None,
                "model_url": "https://cdn.example.com/genvoice-models/vi/mytam/mytam.onnx",
                "config_url": "https://cdn.example.com/genvoice-models/vi/mytam/mytam.onnx.json",
                "sample_url": "https://cdn.example.com/vi/mytam/sample.wav",
                "is_active": True,
                "created_at": None,
                "updated_at": None,
                "model_key": "vi/mytam/mytam.onnx",
                "config_key": "vi/mytam/mytam.onnx.json",
                "folder": "mytam",
            },
        },
    )
    voices_module._get_voice_cache.cache_clear()

    response = client.get("/api/voices")

    assert response.status_code == 200
    data = response.json()
    voice_ids = {voice["id"] for voice in data}
    assert "mytam2" in voice_ids
    assert "ngochuyen" in voice_ids
    mytam = next(voice for voice in data if voice["id"] == "mytam2")
    assert mytam["folder"] == "mytam"
