"""Tests for project API endpoints."""
import io
import time
import wave

import pytest
from fastapi import status


def create_project(client, name: str, description: str | None = None) -> dict:
    """Create project and return JSON body."""
    response = client.post(
        "/api/projects",
        json={"name": name, "description": description},
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


def wait_for_export_completion(client, project_id: str, job_id: str, timeout_seconds: float = 5.0) -> dict:
    """Poll export status until completed or failed."""
    deadline = time.time() + timeout_seconds
    last_response = None

    while time.time() < deadline:
        response = client.get(
            f"/api/projects/{project_id}/export/{job_id}/status",
        )
        assert response.status_code == status.HTTP_200_OK, response.text
        payload = response.json()
        last_response = payload

        if payload["status"] in {"completed", "failed"}:
            return payload

        time.sleep(0.05)

    raise AssertionError(f"Export job did not complete in time. Last status: {last_response}")


def test_create_project_returns_201_with_name(client):
    """User can create project."""
    response = client.post(
        "/api/projects",
        json={"name": "My Project", "description": "Demo"},
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "My Project"
    assert "id" in data


def test_list_projects_returns_projects(client):
    """List projects returns user's projects."""
    create_project(client, "Project 1")
    create_project(client, "Project 2")

    response = client.get("/api/projects")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2


def test_list_projects_is_ordered_by_updated_at_desc(client):
    """Project list order should be deterministic and reflect recency."""
    first = create_project(client, "First")
    second = create_project(client, "Second")

    update_response = client.put(
        f"/api/projects/{first['id']}",
        json={"name": "First Updated"},
    )
    assert update_response.status_code == status.HTTP_200_OK

    response = client.get("/api/projects")
    assert response.status_code == status.HTTP_200_OK
    names = [item["name"] for item in response.json()]
    assert names[0] == "First Updated"


def test_scene_crud_operations(client):
    """Test scene CRUD operations."""
    project = create_project(client, "Scene Test")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene 1"},
    )
    assert scene_response.status_code == status.HTTP_201_CREATED
    scene = scene_response.json()

    get_response = client.get(f"/api/projects/{project['id']}")
    assert get_response.status_code == status.HTTP_200_OK
    assert len(get_response.json()["scenes"]) == 1

    update_response = client.put(
        f"/api/projects/{project['id']}/scenes/{scene['id']}",
        json={"name": "Updated Scene"},
    )
    assert update_response.status_code == status.HTTP_200_OK

    delete_response = client.delete(
        f"/api/projects/{project['id']}/scenes/{scene['id']}",
    )
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT


def test_segment_crud_operations(client):
    """Test segment CRUD operations."""
    project = create_project(client, "Segment Test")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Main Scene"},
    )
    scene = scene_response.json()

    seg_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "Hello", "voice_id": "vi_female"},
    )
    assert seg_response.status_code == status.HTTP_201_CREATED
    segment = seg_response.json()

    update_response = client.put(
        f"/api/projects/{project['id']}/segments/{segment['id']}",
        json={"text": "Updated"},
    )
    assert update_response.status_code == status.HTTP_200_OK

    delete_response = client.delete(
        f"/api/projects/{project['id']}/segments/{segment['id']}",
    )
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT


def test_reorder_segments_returns_success(client):
    """Reorder segments works."""
    project = create_project(client, "Reorder Test")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Main Scene"},
    )
    scene = scene_response.json()

    seg1_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "A", "voice_id": "vi_female"},
    )
    seg1 = seg1_response.json()

    seg2_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "B", "voice_id": "vi_female"},
    )
    seg2 = seg2_response.json()

    reorder_response = client.post(
        f"/api/projects/{project['id']}/segments/reorder",
        json={"scene_id": scene["id"], "segment_ids": [seg2["id"], seg1["id"]]},
    )
    assert reorder_response.status_code == status.HTTP_200_OK
    assert reorder_response.json() == {"success": True}


def test_export_single_file_start_status_and_download(client, monkeypatch):
    """Export API supports start, status polling and download for single format."""
    project = create_project(client, "Export Single")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene 1"},
    )
    scene = scene_response.json()

    segment_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "hello", "voice_id": "vi_female"},
    )
    assert segment_response.status_code == status.HTTP_201_CREATED

    fake_wav = create_test_wav()

    def fake_synthesize(*, text, voice_id, speed=1.0, user_dictionary=None):
        return fake_wav, 0.1

    monkeypatch.setattr("app.services.project_service.tts_service.synthesize", fake_synthesize)

    start_response = client.post(
        f"/api/projects/{project['id']}/export",
        json={"format": "single", "gap_seconds": 0},
    )
    assert start_response.status_code == status.HTTP_202_ACCEPTED
    start_payload = start_response.json()
    assert start_payload["status"] == "processing"
    assert "job_id" in start_payload

    final_status = wait_for_export_completion(client, project["id"], start_payload["job_id"])
    assert final_status["status"] in {"processing", "completed"}
    if final_status["status"] == "processing":
        final_status = wait_for_export_completion(
            client,
            project["id"],
            start_payload["job_id"],
            timeout_seconds=5.0,
        )

    assert final_status["status"] == "completed"
    assert final_status["progress"] == 100

    download_response = client.get(
        f"/api/projects/{project['id']}/export/{start_payload['job_id']}/download",
    )
    assert download_response.status_code == status.HTTP_200_OK
    assert download_response.headers["content-type"].startswith("audio/wav")
    assert len(download_response.content) > 0


def test_export_download_before_completion_returns_409(client, monkeypatch):
    """Download endpoint rejects unfinished export jobs."""
    project = create_project(client, "Export Pending")

    scene_response = client.post(
        f"/api/projects/{project['id']}/scenes",
        json={"name": "Scene 1"},
    )
    scene = scene_response.json()

    segment_response = client.post(
        f"/api/projects/{project['id']}/scenes/{scene['id']}/segments",
        json={"text": "hello", "voice_id": "vi_female"},
    )

    fake_wav = create_test_wav()

    def slow_synthesize(*, text, voice_id, speed=1.0, user_dictionary=None):
        time.sleep(0.2)
        return fake_wav, 0.1

    monkeypatch.setattr("app.services.project_service.tts_service.synthesize", slow_synthesize)

    start_response = client.post(
        f"/api/projects/{project['id']}/export",
        json={"format": "single", "gap_seconds": 0},
    )
    assert start_response.status_code == status.HTTP_202_ACCEPTED
    job_id = start_response.json()["job_id"]

    download_response = client.get(
        f"/api/projects/{project['id']}/export/{job_id}/download",
    )
    assert download_response.status_code == status.HTTP_409_CONFLICT


def test_export_fails_for_project_without_segments(client):
    """Export transitions to failed status when project has no segments."""
    project = create_project(client, "Export Empty")

    start_response = client.post(
        f"/api/projects/{project['id']}/export",
        json={"format": "single", "gap_seconds": 0},
    )
    assert start_response.status_code == status.HTTP_202_ACCEPTED
    job_id = start_response.json()["job_id"]

    final_status = wait_for_export_completion(client, project["id"], job_id)
    assert final_status["status"] == "failed"
    assert final_status["progress"] == 100
    assert final_status["error"]