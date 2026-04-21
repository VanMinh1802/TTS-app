"""Tests for project API endpoints."""
import io
import time
import wave

import pytest
from fastapi import status


def register_and_login(client, email: str, password: str = "password123") -> str:
    """Register a user and return bearer token."""
    register_response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == status.HTTP_201_CREATED, register_response.text

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == status.HTTP_200_OK, login_response.text
    return login_response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    """Build auth headers from bearer token."""
    return {"Authorization": f"Bearer {token}"}


def create_project(client, token: str, name: str, description: str | None = None) -> dict:
    """Create project and return JSON body."""
    response = client.post(
        "/api/projects",
        json={"name": name, "description": description},
        headers=auth_headers(token),
    )
    assert response.status_code == status.HTTP_201_CREATED, response.text
    return response.json()


def create_test_wav(sample_rate: int = 22050, frame_count: int = 64) -> bytes:
    """Create tiny valid wav payload for export tests."""
    payload = b"\x00\x00" * frame_count
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(payload)
    return buffer.getvalue()


def wait_for_export_completion(client, token: str, project_id: str, job_id: str, timeout_seconds: float = 5.0) -> dict:
    """Poll export status until completed or failed."""
    deadline = time.time() + timeout_seconds
    last_response = None

    while time.time() < deadline:
        response = client.get(
            f"/api/projects/{project_id}/export/{job_id}/status",
            headers=auth_headers(token),
        )
        assert response.status_code == status.HTTP_200_OK, response.text
        payload = response.json()
        last_response = payload

        if payload["status"] in {"completed", "failed"}:
            return payload

        time.sleep(0.05)

    raise AssertionError(f"Export job did not complete in time. Last status: {last_response}")


@pytest.mark.parametrize(
    "method,path,body",
    [
        ("get", "/api/projects", None),
        ("post", "/api/projects", {"name": "Unauthorized"}),
        ("get", "/api/projects/unauth-id", None),
        ("put", "/api/projects/unauth-id", {"name": "Updated"}),
        ("delete", "/api/projects/unauth-id", None),
        ("post", "/api/projects/unauth-id/duplicate", None),
        ("post", "/api/projects/unauth-id/scenes", {"name": "Scene A"}),
        ("put", "/api/projects/unauth-id/scenes/scene-1", {"name": "Scene B"}),
        ("delete", "/api/projects/unauth-id/scenes/scene-1", None),
        ("post", "/api/projects/unauth-id/scenes/scene-1/segments", {"text": "Hello", "voice_id": "vi_female"}),
        ("put", "/api/projects/unauth-id/segments/seg-1", {"text": "Updated"}),
        ("delete", "/api/projects/unauth-id/segments/seg-1", None),
        (
            "post",
            "/api/projects/unauth-id/segments/reorder",
            {"scene_id": "scene-1", "segment_ids": ["seg-1"]},
        ),
        ("post", "/api/projects/unauth-id/export", {"format": "single", "gap_seconds": 1}),
        ("get", "/api/projects/unauth-id/export/job-1/status", None),
        ("get", "/api/projects/unauth-id/export/job-1/download", None),
    ],
)
def test_projects_endpoints_require_auth(method, path, body, client):
    """All project endpoints must require authentication."""
    request = getattr(client, method)
    kwargs = {}
    if body is not None:
        kwargs["json"] = body

    response = request(path, **kwargs)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_create_project_authenticated_returns_201_with_name(client):
    """Authenticated user can create project."""
    token = register_and_login(client, "owner@example.com")

    response = client.post(
        "/api/projects",
        json={"name": "My Project", "description": "Demo"},
        headers=auth_headers(token),
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "My Project"
    assert "id" in data


def test_list_projects_returns_only_current_users_projects(client):
    """List projects must be scoped to current user."""
    owner_token = register_and_login(client, "owner2@example.com")
    other_token = register_and_login(client, "other@example.com")

    create_project(client, owner_token, "Owner Project 1")
    create_project(client, owner_token, "Owner Project 2")
    create_project(client, other_token, "Other Project")

    response = client.get(
        "/api/projects",
        headers=auth_headers(owner_token),
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    assert {item["name"] for item in data} == {"Owner Project 1", "Owner Project 2"}


def test_list_projects_is_ordered_by_updated_at_desc(client):
    """Project list order should be deterministic and reflect recency."""
    token = register_and_login(client, "order@example.com")
    first = create_project(client, token, "First")
    second = create_project(client, token, "Second")

    update_response = client.put(
        f"/api/projects/{first['id']}",
        json={"name": "First Updated"},
        headers=auth_headers(token),
    )
    assert update_response.status_code == status.HTTP_200_OK

    response = client.get("/api/projects", headers=auth_headers(token))
    assert response.status_code == status.HTTP_200_OK
    names = [item["name"] for item in response.json()]
    assert names[0] == "First Updated"
    assert set(names) == {"First Updated", "Second"}


def test_cross_user_access_returns_404_for_project_scene_segment_routes(client):
    """Another user must not access someone else's project resources."""
    owner_token = register_and_login(client, "owner3@example.com")
    other_token = register_and_login(client, "other3@example.com")

    project = create_project(client, owner_token, "Owner Project")
    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene 1"},
        headers=auth_headers(owner_token),
    )
    assert scene_response.status_code == status.HTTP_201_CREATED
    scene = scene_response.json()

    segment_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "Hello", "voice_id": "vi_female"},
        headers=auth_headers(owner_token),
    )
    assert segment_response.status_code == status.HTTP_201_CREATED
    segment = segment_response.json()

    assert client.get(
        f"/api/projects/{project['id']}",
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND
    assert client.put(
        f"/api/projects/{project['id']}",
        json={"name": "Hacked"},
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND
    assert client.delete(
        f"/api/projects/{project['id']}",
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND

    assert client.put(
        f"/api/projects/{project['id']}/scenes/{scene['id']}",
        json={"name": "Updated"},
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND
    assert client.delete(
        f"/api/projects/{project['id']}/scenes/{scene['id']}",
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND

    assert client.put(
        f"/api/projects/{project['id']}/segments/{segment['id']}",
        json={"text": "Updated"},
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND
    assert client.delete(
        f"/api/projects/{project['id']}/segments/{segment['id']}",
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND

    assert client.post(
        f"/api/projects/{project['id']}/segments/reorder",
        json={"scene_id": scene["id"], "segment_ids": [segment["id"]]},
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND

    assert client.post(
        f"/api/projects/{project['id']}/duplicate",
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND

    assert client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Intruder Scene"},
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND

    assert client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "Intruder", "voice_id": "vi_female"},
        headers=auth_headers(other_token),
    ).status_code == status.HTTP_404_NOT_FOUND


def test_reorder_segments_invalid_payloads_return_400(client):
    """Invalid reorder requests must return 400."""
    token = register_and_login(client, "reorder@example.com")
    project = create_project(client, token, "Reorder Project")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Main Scene"},
        headers=auth_headers(token),
    )
    assert scene_response.status_code == status.HTTP_201_CREATED
    scene = scene_response.json()

    seg1_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "A", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert seg1_response.status_code == status.HTTP_201_CREATED
    seg1 = seg1_response.json()

    seg2_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "B", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert seg2_response.status_code == status.HTTP_201_CREATED
    seg2 = seg2_response.json()

    other_project = create_project(client, token, "Other Project")
    other_scene_response = client.post(
        f"/api/projects/{other_project['id']}/scenes",
        json={"name": "Other Scene"},
        headers=auth_headers(token),
    )
    assert other_scene_response.status_code == status.HTTP_201_CREATED
    other_scene = other_scene_response.json()
    foreign_segment_response = client.post(
        f"/api/projects/{other_project['id']}/scenes/{other_scene['id']}/segments",
        json={"text": "Foreign", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert foreign_segment_response.status_code == status.HTTP_201_CREATED
    foreign_segment = foreign_segment_response.json()

    duplicate_response = client.post(
        f"/api/projects/{project['id']}/segments/reorder",
        json={"scene_id": scene["id"], "segment_ids": [seg1["id"], seg1["id"]]},
        headers=auth_headers(token),
    )
    assert duplicate_response.status_code == status.HTTP_400_BAD_REQUEST

    missing_response = client.post(
        f"/api/projects/{project['id']}/segments/reorder",
        json={"scene_id": scene["id"], "segment_ids": [seg1["id"]]},
        headers=auth_headers(token),
    )
    assert missing_response.status_code == status.HTTP_400_BAD_REQUEST

    foreign_response = client.post(
        f"/api/projects/{project['id']}/segments/reorder",
        json={"scene_id": scene["id"], "segment_ids": [seg1["id"], foreign_segment["id"]]},
        headers=auth_headers(token),
    )
    assert foreign_response.status_code == status.HTTP_400_BAD_REQUEST

    valid_response = client.post(
        f"/api/projects/{project['id']}/segments/reorder",
        json={"scene_id": scene["id"], "segment_ids": [seg2["id"], seg1["id"]]},
        headers=auth_headers(token),
    )
    assert valid_response.status_code == status.HTTP_200_OK
    assert valid_response.json() == {"success": True}


def test_reorder_segments_with_partial_scene_ids_is_allowed_per_scene(client):
    """API accepts reorder payloads scoped to one scene."""
    token = register_and_login(client, "multiscene@example.com")
    project = create_project(client, token, "Multi-scene")

    scene_a_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene A"},
        headers=auth_headers(token),
    )
    assert scene_a_response.status_code == status.HTTP_201_CREATED
    scene_a = scene_a_response.json()

    scene_b_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene B"},
        headers=auth_headers(token),
    )
    assert scene_b_response.status_code == status.HTTP_201_CREATED
    scene_b = scene_b_response.json()

    a1_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene_a['id']}/segments",
        json={"text": "A1", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert a1_response.status_code == status.HTTP_201_CREATED
    a1 = a1_response.json()

    a2_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene_a['id']}/segments",
        json={"text": "A2", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert a2_response.status_code == status.HTTP_201_CREATED
    a2 = a2_response.json()

    b1_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene_b['id']}/segments",
        json={"text": "B1", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert b1_response.status_code == status.HTTP_201_CREATED
    _b1 = b1_response.json()

    partial_reorder = client.post(
        f"/api/projects/{project['id']}/segments/reorder",
        json={"scene_id": scene_a["id"], "segment_ids": [a2["id"], a1["id"]]},
        headers=auth_headers(token),
    )
    assert partial_reorder.status_code == status.HTTP_200_OK

    project_after = client.get(
        f"/api/projects/{project['id']}",
        headers=auth_headers(token),
    )
    assert project_after.status_code == status.HTTP_200_OK
    scenes_by_id = {scene["id"]: scene for scene in project_after.json()["scenes"]}
    scene_a_after = scenes_by_id[scene_a["id"]]
    scene_b_after = scenes_by_id[scene_b["id"]]

    scene_a_ids_in_order = [segment["id"] for segment in scene_a_after["segments"]]
    scene_b_ids_in_order = [segment["id"] for segment in scene_b_after["segments"]]

    assert scene_a_ids_in_order == [a2["id"], a1["id"]]
    assert scene_b_ids_in_order == [_b1["id"]]


def test_export_single_file_start_status_and_download(client, monkeypatch):
    """Export API supports start, status polling and download for single format."""
    token = register_and_login(client, "export-single@example.com")
    project = create_project(client, token, "Export Single")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene 1"},
        headers=auth_headers(token),
    )
    assert scene_response.status_code == status.HTTP_201_CREATED
    scene = scene_response.json()

    segment_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "hello", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert segment_response.status_code == status.HTTP_201_CREATED

    fake_wav = create_test_wav()

    def fake_synthesize(*, text, voice_id, speed=1.0, user_dictionary=None):
        return fake_wav, 0.1

    monkeypatch.setattr("app.services.project_service.tts_service.synthesize", fake_synthesize)

    start_response = client.post(
        f"/api/projects/{project['id']}/export",
        json={"format": "single", "gap_seconds": 0},
        headers=auth_headers(token),
    )
    assert start_response.status_code == status.HTTP_202_ACCEPTED
    start_payload = start_response.json()
    assert start_payload["status"] == "processing"
    assert "job_id" in start_payload

    final_status = wait_for_export_completion(client, token, project["id"], start_payload["job_id"])
    assert final_status["status"] in {"processing", "completed"}
    if final_status["status"] == "processing":
        final_status = wait_for_export_completion(
            client,
            token,
            project["id"],
            start_payload["job_id"],
            timeout_seconds=5.0,
        )

    assert final_status["status"] == "completed"
    assert final_status["progress"] == 100

    download_response = client.get(
        f"/api/projects/{project['id']}/export/{start_payload['job_id']}/download",
        headers=auth_headers(token),
    )
    assert download_response.status_code == status.HTTP_200_OK
    assert download_response.headers["content-type"].startswith("audio/wav")
    assert len(download_response.content) > 0


def test_export_download_before_completion_returns_409(client, monkeypatch):
    """Download endpoint rejects unfinished export jobs."""
    token = register_and_login(client, "export-pending@example.com")
    project = create_project(client, token, "Export Pending")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene 1"},
        headers=auth_headers(token),
    )
    assert scene_response.status_code == status.HTTP_201_CREATED
    scene = scene_response.json()

    segment_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "hello", "voice_id": "vi_female"},
        headers=auth_headers(token),
    )
    assert segment_response.status_code == status.HTTP_201_CREATED

    fake_wav = create_test_wav()

    def slow_synthesize(*, text, voice_id, speed=1.0, user_dictionary=None):
        time.sleep(0.2)
        return fake_wav, 0.1

    monkeypatch.setattr("app.services.project_service.tts_service.synthesize", slow_synthesize)

    start_response = client.post(
        f"/api/projects/{project['id']}/export",
        json={"format": "single", "gap_seconds": 0},
        headers=auth_headers(token),
    )
    assert start_response.status_code == status.HTTP_202_ACCEPTED
    job_id = start_response.json()["job_id"]

    download_response = client.get(
        f"/api/projects/{project['id']}/export/{job_id}/download",
        headers=auth_headers(token),
    )
    assert download_response.status_code == status.HTTP_409_CONFLICT


def test_export_cross_user_access_returns_404(client, monkeypatch):
    """Export status/download are scoped to project owner."""
    owner_token = register_and_login(client, "export-owner@example.com")
    other_token = register_and_login(client, "export-other@example.com")
    project = create_project(client, owner_token, "Export Owner")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene 1"},
        headers=auth_headers(owner_token),
    )
    assert scene_response.status_code == status.HTTP_201_CREATED
    scene = scene_response.json()

    segment_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "hello", "voice_id": "vi_female"},
        headers=auth_headers(owner_token),
    )
    assert segment_response.status_code == status.HTTP_201_CREATED

    fake_wav = create_test_wav()

    def fake_synthesize(*, text, voice_id, speed=1.0, user_dictionary=None):
        return fake_wav, 0.1

    monkeypatch.setattr("app.services.project_service.tts_service.synthesize", fake_synthesize)

    start_response = client.post(
        f"/api/projects/{project['id']}/export",
        json={"format": "single", "gap_seconds": 0},
        headers=auth_headers(owner_token),
    )
    assert start_response.status_code == status.HTTP_202_ACCEPTED
    job_id = start_response.json()["job_id"]

    status_response = client.get(
        f"/api/projects/{project['id']}/export/{job_id}/status",
        headers=auth_headers(other_token),
    )
    assert status_response.status_code == status.HTTP_404_NOT_FOUND

    download_response = client.get(
        f"/api/projects/{project['id']}/export/{job_id}/download",
        headers=auth_headers(other_token),
    )
    assert download_response.status_code == status.HTTP_404_NOT_FOUND


def test_export_fails_for_project_without_segments(client):
    """Export transitions to failed status when project has no segments."""
    token = register_and_login(client, "export-empty@example.com")
    project = create_project(client, token, "Export Empty")

    start_response = client.post(
        f"/api/projects/{project['id']}/export",
        json={"format": "single", "gap_seconds": 0},
        headers=auth_headers(token),
    )
    assert start_response.status_code == status.HTTP_202_ACCEPTED
    job_id = start_response.json()["job_id"]

    final_status = wait_for_export_completion(client, token, project["id"], job_id)
    assert final_status["status"] == "failed"
    assert final_status["progress"] == 100
    assert final_status["error"]
