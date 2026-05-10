"""Tests for TTS voices API."""


def test_tts_voice_list_excludes_default_alias_duplicate(client, monkeypatch):
    import app.services.tts_service as tts_svc

    test_models = {
        "ngochuyen": {"name": "Ngọc Huyền", "path": "vi/ngochuyen/ngochuyen.onnx", "sample_url": "https://cdn.example.com/vi/ngochuyen/sample.wav"},
        "manhdung": {"name": "Mạnh Dũng", "path": "vi/manhdung/manhdung.onnx", "sample_url": "https://cdn.example.com/vi/manhdung/sample.wav"},
        "default": {"name": "Ngọc Huyền", "path": "vi/ngochuyen/ngochuyen.onnx", "sample_url": "https://cdn.example.com/vi/ngochuyen/sample.wav"},
        "vi_female": {"name": "Ngọc Huyền", "path": "vi/ngochuyen/ngochuyen.onnx", "sample_url": "https://cdn.example.com/vi/ngochuyen/sample.wav"},
        "vi_male": {"name": "Mạnh Dũng", "path": "vi/manhdung/manhdung.onnx", "sample_url": "https://cdn.example.com/vi/manhdung/sample.wav"},
    }

    monkeypatch.setattr(tts_svc, "_get_models", lambda: test_models)

    response = client.get("/api/tts/voices")

    assert response.status_code == 200
    data = response.json()["voices"]
    voice_ids = [voice["id"] for voice in data]
    assert voice_ids == ["ngochuyen", "manhdung"]
