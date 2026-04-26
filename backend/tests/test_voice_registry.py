"""Tests for R2 voice registry."""
from datetime import datetime
import logging

from app.services.voice_registry import (
    build_tts_model_map_from_registry,
    build_voice_registry_from_objects,
)


def test_build_voice_registry_maps_folder_aliases_and_selects_latest_checkpoint():
    objects = [
        {"Key": "vi/baouyen/baouyen_6388.onnx", "LastModified": datetime(2024, 1, 1)},
        {"Key": "vi/baouyen/baouyen_6388.onnx.json", "LastModified": datetime(2024, 1, 1)},
        {"Key": "vi/baouyen/baouyen_6463.onnx", "LastModified": datetime(2024, 2, 1)},
        {"Key": "vi/baouyen/baouyen_6463.onnx.json", "LastModified": datetime(2024, 2, 1)},
        {"Key": "vi/mytam/mytam.onnx", "LastModified": datetime(2024, 3, 1)},
        {"Key": "vi/mytam/mytam.onnx.json", "LastModified": datetime(2024, 3, 1)},
    ]

    registry = build_voice_registry_from_objects(
        objects,
        public_base_url="https://cdn.example.com",
        bucket_name="genvoice-models",
    )

    assert "baouyen" in registry
    assert registry["baouyen"]["name"] == "Bảo Uyên"
    assert registry["baouyen"]["model_key"] == "vi/baouyen/baouyen_6463.onnx"
    assert registry["baouyen"]["config_key"] == "vi/baouyen/baouyen_6463.onnx.json"
    assert registry["baouyen"]["sample_url"] == "https://cdn.example.com/vi/baouyen/sample.wav"

    assert "mytam2" in registry
    assert registry["mytam2"]["folder"] == "mytam"
    assert registry["mytam2"]["model_key"] == "vi/mytam/mytam.onnx"
    assert registry["mytam2"]["config_key"] == "vi/mytam/mytam.onnx.json"
    assert registry["mytam2"]["sample_url"] == "https://cdn.example.com/vi/mytam/sample.wav"


def test_build_voice_registry_selects_latest_checkpoint_even_when_list_is_unordered():
    objects = [
        {"Key": "vi/baouyen/baouyen_6463.onnx", "LastModified": datetime(2024, 2, 1)},
        {"Key": "vi/baouyen/baouyen_6463.onnx.json", "LastModified": datetime(2024, 2, 1)},
        {"Key": "vi/baouyen/baouyen_6388.onnx", "LastModified": datetime(2024, 3, 1)},
        {"Key": "vi/baouyen/baouyen_6388.onnx.json", "LastModified": datetime(2024, 3, 1)},
    ]

    registry = build_voice_registry_from_objects(
        objects,
        public_base_url="https://cdn.example.com",
        bucket_name="genvoice-models",
    )

    assert registry["baouyen"]["model_key"] == "vi/baouyen/baouyen_6388.onnx"
    assert registry["baouyen"]["config_key"] == "vi/baouyen/baouyen_6388.onnx.json"


def test_build_voice_registry_ignores_partial_uploads():
    objects = [
        {"Key": "vi/baouyen/baouyen_6463.onnx", "LastModified": datetime(2024, 2, 1)},
        {"Key": "vi/mytam/mytam.onnx.json", "LastModified": datetime(2024, 3, 1)},
    ]

    registry = build_voice_registry_from_objects(
        objects,
        public_base_url="https://cdn.example.com",
        bucket_name="genvoice-models",
    )

    assert registry == {}


def test_build_voice_registry_ignores_unrelated_objects_and_keeps_valid_pair():
    objects = [
        {"Key": "vi/baouyen/readme.txt", "LastModified": datetime(2024, 4, 1)},
        {"Key": "vi/baouyen/baouyen_6388.onnx", "LastModified": datetime(2024, 3, 1)},
        {"Key": "vi/baouyen/baouyen_6388.onnx.json", "LastModified": datetime(2024, 3, 1)},
    ]

    registry = build_voice_registry_from_objects(
        objects,
        public_base_url="https://cdn.example.com",
        bucket_name="genvoice-models",
    )

    assert registry["baouyen"]["model_key"] == "vi/baouyen/baouyen_6388.onnx"
    assert registry["baouyen"]["config_key"] == "vi/baouyen/baouyen_6388.onnx.json"


def test_build_voice_registry_selects_checkpoint_by_last_modified_not_suffix():
    objects = [
        {"Key": "vi/baouyen/baouyen_6463.onnx", "LastModified": datetime(2024, 2, 1)},
        {"Key": "vi/baouyen/baouyen_6463.onnx.json", "LastModified": datetime(2024, 2, 1)},
        {"Key": "vi/baouyen/baouyen_6388.onnx", "LastModified": datetime(2024, 3, 1)},
        {"Key": "vi/baouyen/baouyen_6388.onnx.json", "LastModified": datetime(2024, 3, 1)},
    ]

    registry = build_voice_registry_from_objects(
        objects,
        public_base_url="https://cdn.example.com",
        bucket_name="genvoice-models",
    )

    assert registry["baouyen"]["model_key"] == "vi/baouyen/baouyen_6388.onnx"
    assert registry["baouyen"]["config_key"] == "vi/baouyen/baouyen_6388.onnx.json"


def test_load_voice_registry_from_r2_uses_client_listing_and_public_url(monkeypatch):
    class FakeClient:
        def list_objects_v2(self, Bucket, Prefix):
            assert Bucket == "genvoice-models"
            assert Prefix == "vi/"
            return {
                "Contents": [
                    {"Key": "vi/mytam/mytam.onnx"},
                    {"Key": "vi/mytam/mytam.onnx.json"},
                ]
            }

    from app.services import voice_registry as registry_module

    registry = registry_module.load_voice_registry_from_r2(
        client=FakeClient(),
        bucket_name="genvoice-models",
        public_base_url="https://cdn.example.com",
    )

    assert registry["mytam2"]["model_url"] == "https://cdn.example.com/genvoice-models/vi/mytam/mytam.onnx"
    assert registry["mytam2"]["config_url"] == "https://cdn.example.com/genvoice-models/vi/mytam/mytam.onnx.json"


def test_load_default_voice_registry_logs_and_falls_back_on_r2_error(monkeypatch, caplog):
    from app.services import voice_registry as registry_module

    class BrokenClient:
        def list_objects_v2(self, Bucket, Prefix):
            raise RuntimeError("boom")

    monkeypatch.setattr(registry_module, "load_voice_registry_from_r2", lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("boom")))
    monkeypatch.setattr(registry_module, "settings", type("Settings", (), {
        "R2_ACCESS_KEY_ID": "x",
        "R2_SECRET_ACCESS_KEY": "x",
        "R2_ACCOUNT_ID": "x",
        "R2_BUCKET_NAME": "genvoice-models",
        "R2_PUBLIC_URL": "https://cdn.example.com",
    })())

    caplog.set_level(logging.WARNING)

    registry = registry_module.load_default_voice_registry()

    assert "ngochuyen" in registry
    assert "manhdung" in registry
    assert any("Failed to load voice registry from R2" in record.message for record in caplog.records)


def test_build_tts_model_map_adds_backward_compatible_aliases():
    registry = {
        "ngochuyen": {
            "id": "ngochuyen",
            "name": "Ngọc Huyền",
            "model_key": "vi/ngochuyen/ngochuyen.onnx",
            "sample_url": "https://cdn.example.com/vi/ngochuyen/sample.wav",
        },
        "manhdung": {
            "id": "manhdung",
            "name": "Mạnh Dũng",
            "model_key": "vi/manhdung/manhdung.onnx",
            "sample_url": "https://cdn.example.com/vi/manhdung/sample.wav",
        },
    }

    models = build_tts_model_map_from_registry(registry)

    assert models["vi_female"]["path"] == "vi/ngochuyen/ngochuyen.onnx"
    assert models["vi_male"]["path"] == "vi/manhdung/manhdung.onnx"
    assert models["default"]["path"] == "vi/ngochuyen/ngochuyen.onnx"
    assert models["vi_female"]["sample_url"] == "https://cdn.example.com/vi/ngochuyen/sample.wav"


def test_build_voice_registry_includes_region_style_and_priority():
    objects = [
        {"Key": "vi/anhkhoi/anhkhoi.onnx", "LastModified": datetime(2024, 1, 1)},
        {"Key": "vi/anhkhoi/anhkhoi.onnx.json", "LastModified": datetime(2024, 1, 1)},
    ]

    registry = build_voice_registry_from_objects(
        objects,
        public_base_url="https://cdn.example.com",
        bucket_name="genvoice-models",
    )

    assert registry["anhkhoi"]["region"] == "Miền Bắc"
    assert registry["anhkhoi"]["style"] == "Hiện đại"
    assert registry["anhkhoi"]["priority"] == 8
    assert registry["anhkhoi"]["sample_url"] == "https://cdn.example.com/vi/anhkhoi/sample.wav"
