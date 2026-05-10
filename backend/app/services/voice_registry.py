"""Voice registry sourced from Cloudflare R2."""
from __future__ import annotations

import logging
import re
from datetime import datetime

from app.core.settings import settings, get_r2_public_base_url, get_r2_client_endpoint


logger = logging.getLogger(__name__)


FREE_VOICE_IDS = {"baouyen", "manhdung", "ngochuyen"}

VOICE_DISPLAY_NAMES = {
    "anhkhoi": "Anh Khôi",
    "anhtai": "Anh Tài",
    "banmai": "Ban Mai",
    "baouyen": "Bảo Uyên",
    "chieuthanh": "Chiếu Thành",
    "giabao": "Gia Bảo",
    "lacphi": "Lạc Phi",
    "maiphuong": "Mai Phương",
    "manhdung": "Mạnh Dũng",
    "minhkhang": "Minh Khang",
    "minhquang": "Minh Quang",
    "mytam2": "Mỹ Tâm",
    "ngochuyen": "Ngọc Huyền",
    "ngocduy": "Ngọc Duy",
    "ngocngan": "Ngọc Ngạn",
    "phuonganh": "Phương Anh",
    "phuongtrang": "Phương Trang",
    "thanhphuong": "Thanh Phương",
    "thientam": "Thiện Tâm",
    "tranthanh": "Trấn Thành",
    "vietcuong": "Việt Cường",
    "vietthao": "Việt Thảo",
}

VOICE_METADATA = {
    "anhkhoi": {"region": "Miền Bắc", "style": "Hiện đại", "gender": "male", "priority": 8},
    "anhtai": {"region": "Miền Bắc", "style": "Truyền cảm", "gender": "male", "priority": 5},
    "banmai": {"region": "Miền Bắc", "style": "Tin tức", "gender": "female", "priority": 9},
    "baouyen": {"region": "Miền Bắc", "style": "Truyền cảm", "gender": "female", "priority": 10},
    "chieuthanh": {"region": "Miền Nam", "style": "Truyền thống", "gender": "male", "priority": 6},
    "giabao": {"region": "Miền Nam", "style": "Truyền cảm", "gender": "male", "priority": 5},
    "lacphi": {"region": "Miền Trung", "style": "Du lịch", "gender": "female", "priority": 5},
    "maiphuong": {"region": "Miền Bắc", "style": "Quảng cáo", "gender": "female", "priority": 7},
    "manhdung": {"region": "Miền Nam", "style": "Doanh nghiệp", "gender": "male", "priority": 10},
    "minhkhang": {"region": "Miền Bắc", "style": "Giáo dục", "gender": "male", "priority": 4},
    "minhquang": {"region": "Miền Trung", "style": "Truyền cảm", "gender": "male", "priority": 9},
    "mytam2": {"region": "Miền Nam", "style": "Ca hát", "gender": "female", "priority": 7},
    "ngochuyen": {"region": "Miền Bắc", "style": "Truyền cảm", "gender": "female", "priority": 10},
    "ngocduy": {"region": "Miền Bắc", "style": "Truyền cảm", "gender": "male", "priority": 6},
    "ngocngan": {"region": "Miền Bắc", "style": "Tin tức", "gender": "male", "priority": 8},
    "phuonganh": {"region": "Miền Bắc", "style": "Tin tức", "gender": "female", "priority": 6},
    "phuongtrang": {"region": "Miền Nam", "style": "Truyền cảm", "gender": "female", "priority": 5},
    "thanhphuong": {"region": "Miền Bắc", "style": "Giáo dục", "gender": "female", "priority": 6},
    "thientam": {"region": "Miền Trung", "style": "Du lịch", "gender": "male", "priority": 4},
    "tranthanh": {"region": "Miền Nam", "style": "Giải trí", "gender": "male", "priority": 10},
    "vietcuong": {"region": "Miền Bắc", "style": "Hiện đại", "gender": "male", "priority": 8},
    "vietthao": {"region": "Miền Bắc", "style": "Truyền cảm", "gender": "male", "priority": 7},
}

VOICE_MODEL_FILES = {
    "anhtai": "taian4",
    "baouyen": "baouyen_6463",
    "ngocduy": "duyoryx3175",
    "thanhphuong": "thanhphuong2",
    "tranthanh": "tranthanh3870",
    "vietthao": "vietthao2",
}


def _voice_id_for_folder(folder_name: str) -> str:
    if folder_name == "mytam":
        return "mytam2"
    return folder_name


def _model_file_for_voice_id(voice_id: str) -> str:
    return VOICE_MODEL_FILES.get(voice_id, voice_id)


def _display_name_for_voice_id(voice_id: str) -> str:
    return VOICE_DISPLAY_NAMES.get(voice_id, voice_id.replace("_", " ").title())


def _metadata_for_voice_id(voice_id: str) -> dict:
    return VOICE_METADATA.get(
        voice_id,
        {"region": "Miền Bắc", "style": "Truyền cảm", "gender": "female", "priority": 1},
    )


def _checkpoint_score(base_name: str) -> tuple[int, str]:
    match = re.search(r"_(\d+)$", base_name)
    if match:
        return int(match.group(1)), base_name
    return 0, base_name


def _levenshtein_ratio(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    m, n = len(a), len(b)
    if max(m, n) == 0:
        return 1.0
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            tmp = dp[j]
            dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev + (0 if a[i - 1] == b[j - 1] else 1))
            prev = tmp
    return 1.0 - dp[n] / max(m, n)


def _object_last_modified(obj: dict) -> datetime:
    last_modified = obj.get("LastModified")
    if isinstance(last_modified, datetime):
        return last_modified
    return datetime.min


def build_voice_registry_from_objects(objects: list[dict], public_base_url: str, bucket_name: str) -> dict[str, dict]:
    """Build a voice registry from R2 object listing."""
    registry: dict[str, dict] = {}
    grouped: dict[str, dict[str, dict[str, object]]] = {}

    for obj in objects:
        key = obj.get("Key")
        if not isinstance(key, str):
            continue

        if not key.startswith("vi/"):
            continue

        parts = key.split("/")
        if len(parts) < 3:
            continue

        folder_name = parts[1]
        voice_id = _voice_id_for_folder(folder_name)
        file_name = parts[-1]
        base_name = file_name.replace(".onnx.json", "").replace(".onnx", "")

        voice_entry = grouped.setdefault(voice_id, {})
        candidate_entry = voice_entry.setdefault(base_name, {"folder_name": folder_name, "model_object": None, "config_object": None})

        if file_name.endswith(".onnx"):
            candidate_entry["model_object"] = obj
        elif file_name.endswith(".onnx.json"):
            candidate_entry["config_object"] = obj

    for voice_id, data in grouped.items():
        complete_candidates = [
            candidate
            for candidate in data.values()
            if candidate.get("model_object") and candidate.get("config_object")
        ]

        if not complete_candidates:
            models = [c for c in data.values() if c.get("model_object")]
            configs = {k: c for k, c in data.items() if c.get("config_object")}
            for model_candidate in models:
                model_name = model_candidate["model_object"]["Key"].split("/")[-1].replace(".onnx", "")
                for config_base, config_candidate in configs.items():
                    if model_name in config_base or config_base in model_name or _levenshtein_ratio(model_name, config_base) > 0.85:
                        if "config_object" not in model_candidate:
                            model_candidate["config_object"] = config_candidate["config_object"]
                            model_candidate["folder_name"] = model_candidate.get("folder_name") or config_candidate.get("folder_name", voice_id)
                        break

        complete_candidates = [
            candidate
            for candidate in data.values()
            if candidate.get("model_object") and candidate.get("config_object")
        ]
        if not complete_candidates:
            continue

        complete_candidates.sort(
            key=lambda candidate: (
                _object_last_modified(candidate["model_object"]),
                _checkpoint_score(candidate["model_object"]["Key"].split("/")[-1].replace(".onnx", ""))[0],
                candidate["model_object"]["Key"],
            )
        )
        selected = complete_candidates[-1]
        folder_name = selected.get("folder_name", voice_id)
        base_name = selected["model_object"]["Key"].split("/")[-1].replace(".onnx", "")
        model_key = f"vi/{folder_name}/{base_name}.onnx"
        config_key = f"vi/{folder_name}/{base_name}.onnx.json"
        sample_key = f"vi/{folder_name}/sample.wav"

        metadata = _metadata_for_voice_id(voice_id)

        registry[voice_id] = {
            "id": voice_id,
            "name": _display_name_for_voice_id(voice_id),
            "language": "vi",
            "gender": metadata["gender"],
            "region": metadata["region"],
            "style": metadata["style"],
            "priority": metadata["priority"],
            "is_custom": True,
            "owner_id": None,
            "model_url": f"{public_base_url}/{bucket_name}/{model_key}",
            "config_url": f"{public_base_url}/{bucket_name}/{config_key}",
            "sample_url": f"{public_base_url}/{sample_key}",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": _object_last_modified(selected["model_object"]).isoformat(),
            "model_key": model_key,
            "config_key": config_key,
            "sample_key": sample_key,
            "folder": folder_name,
        }

    return registry


def build_tts_model_map_from_registry(registry: dict[str, dict]) -> dict[str, dict]:
    """Build TTS model map with backward-compatible aliases."""
    models: dict[str, dict] = {}

    if not registry:
        return models

    ordered_voice_ids = list(registry.keys())
    default_voice_id = "ngochuyen" if "ngochuyen" in registry else ordered_voice_ids[0]
    male_voice_id = "manhdung" if "manhdung" in registry else default_voice_id

    for voice_id, data in registry.items():
        metadata = _metadata_for_voice_id(voice_id)
        models[voice_id] = {
            "name": data["name"],
            "path": data["model_key"],
            "sample_url": data.get("sample_url"),
            "updated_at": data.get("updated_at", datetime.utcnow().isoformat()),
            "priority": data.get("priority", metadata["priority"]),
            "gender": data.get("gender", metadata["gender"]),
            "region": data.get("region", metadata["region"]),
            "style": data.get("style", metadata["style"]),
        }

    models["default"] = {
        "name": registry[default_voice_id]["name"],
        "path": registry[default_voice_id]["model_key"],
        "sample_url": registry[default_voice_id].get("sample_url"),
        "priority": registry[default_voice_id].get("priority", _metadata_for_voice_id(default_voice_id)["priority"]),
        "gender": registry[default_voice_id].get("gender", _metadata_for_voice_id(default_voice_id)["gender"]),
        "region": registry[default_voice_id].get("region", _metadata_for_voice_id(default_voice_id)["region"]),
        "style": registry[default_voice_id].get("style", _metadata_for_voice_id(default_voice_id)["style"]),
    }
    models["vi_female"] = {
        "name": registry[default_voice_id]["name"],
        "path": registry[default_voice_id]["model_key"],
        "sample_url": registry[default_voice_id].get("sample_url"),
        "priority": registry[default_voice_id].get("priority", _metadata_for_voice_id(default_voice_id)["priority"]),
        "gender": registry[default_voice_id].get("gender", _metadata_for_voice_id(default_voice_id)["gender"]),
        "region": registry[default_voice_id].get("region", _metadata_for_voice_id(default_voice_id)["region"]),
        "style": registry[default_voice_id].get("style", _metadata_for_voice_id(default_voice_id)["style"]),
    }
    models["vi_male"] = {
        "name": registry[male_voice_id]["name"],
        "path": registry[male_voice_id]["model_key"],
        "sample_url": registry[male_voice_id].get("sample_url"),
        "priority": registry[male_voice_id].get("priority", _metadata_for_voice_id(male_voice_id)["priority"]),
        "gender": registry[male_voice_id].get("gender", _metadata_for_voice_id(male_voice_id)["gender"]),
        "region": registry[male_voice_id].get("region", _metadata_for_voice_id(male_voice_id)["region"]),
        "style": registry[male_voice_id].get("style", _metadata_for_voice_id(male_voice_id)["style"]),
    }

    return models


def load_voice_registry_from_r2(client, bucket_name: str, public_base_url: str) -> dict[str, dict]:
    """Load voice registry by scanning the R2 bucket."""
    response = client.list_objects_v2(Bucket=bucket_name, Prefix="vi/")
    objects = response.get("Contents", [])
    return build_voice_registry_from_objects(objects, public_base_url=public_base_url, bucket_name=bucket_name)


def load_default_voice_registry() -> dict[str, dict]:
    """Load registry using the configured R2 client."""
    try:
        import boto3
        from botocore.config import Config

        config = Config(signature_version="s3v4", region_name="auto")
        client = boto3.client(
            "s3",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY or "",
            endpoint_url=get_r2_client_endpoint(),
            config=config,
        )
        public_base_url = get_r2_public_base_url()
        registry = load_voice_registry_from_r2(
            client=client,
            bucket_name=settings.R2_BUCKET_NAME,
            public_base_url=public_base_url,
        )
        if registry:
            return registry
    except Exception as exc:
        logger.warning("Failed to load voice registry from R2; using fallback registry: %s", exc)

    fallback_registry = {
        "ngochuyen": {
            "id": "ngochuyen",
            "name": "Ngọc Huyền",
            "language": "vi",
            "gender": "female",
            "region": "Miền Bắc",
            "style": "Truyền cảm",
            "priority": 10,
            "is_custom": True,
            "owner_id": None,
            "model_url": f"{get_r2_public_base_url()}/vi/ngochuyen/ngochuyen.onnx",
            "config_url": f"{get_r2_public_base_url()}/vi/ngochuyen/ngochuyen.onnx.json",
            "sample_url": f"{get_r2_public_base_url()}/vi/ngochuyen/sample.wav",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "model_key": "vi/ngochuyen/ngochuyen.onnx",
            "config_key": "vi/ngochuyen/ngochuyen.onnx.json",
            "sample_key": "vi/ngochuyen/sample.wav",
            "folder": "ngochuyen",
        },
        "manhdung": {
            "id": "manhdung",
            "name": "Mạnh Dũng",
            "language": "vi",
            "gender": "male",
            "region": "Miền Nam",
            "style": "Doanh nghiệp",
            "priority": 10,
            "is_custom": True,
            "owner_id": None,
            "model_url": f"{get_r2_public_base_url()}/vi/manhdung/manhdung.onnx",
            "config_url": f"{get_r2_public_base_url()}/vi/manhdung/manhdung.onnx.json",
            "sample_url": f"{get_r2_public_base_url()}/vi/manhdung/sample.wav",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "model_key": "vi/manhdung/manhdung.onnx",
            "config_key": "vi/manhdung/manhdung.onnx.json",
            "sample_key": "vi/manhdung/sample.wav",
            "folder": "manhdung",
        },
    }
    return fallback_registry


def build_voice_cache_from_registry(registry: dict[str, dict]) -> dict[str, dict]:
    """Convert registry rows into API voice payloads."""
    voice_cache: dict[str, dict] = {}

    for voice_id, data in registry.items():
        metadata = _metadata_for_voice_id(voice_id)
        voice_cache[voice_id] = {
            "id": voice_id,
            "name": data["name"],
            "language": data["language"],
            "gender": data.get("gender", metadata["gender"]),
            "region": data.get("region", metadata["region"]),
            "style": data.get("style", metadata["style"]),
            "priority": data.get("priority", metadata["priority"]),
            "is_custom": data.get("is_custom", True),
            "owner_id": data.get("owner_id"),
            "model_url": data.get("model_url"),
            "config_url": data.get("config_url"),
            "sample_url": data.get("sample_url"),
            "folder": data.get("folder"),
            "is_active": data.get("is_active", True),
            "is_premium": voice_id not in FREE_VOICE_IDS,
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at"),
        }

    return voice_cache
