import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings


def _due(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def test_create_task(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    data = {
        "title": "Finish CS assignment",
        "subject": "CS101",
        "category": "class",
        "notes": "Chapters 3-5",
        "due_date": _due(3),
        "priority": "high",
    }
    r = client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert r.status_code == 200
    content = r.json()
    assert content["title"] == data["title"]
    assert content["subject"] == data["subject"]
    assert content["category"] == "class"
    assert content["notes"] == "Chapters 3-5"
    assert content["priority"] == "high"
    assert content["is_done"] is False
    assert "id" in content


def test_create_task_defaults_category(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "No category given", "due_date": _due(1)},
    )
    assert r.status_code == 200
    assert r.json()["category"] == "class"


def test_update_task_category_and_notes(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create = client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "Club meeting", "due_date": _due(2)},
    )
    task_id = create.json()["id"]
    r = client.patch(
        f"{settings.API_V1_STR}/tasks/{task_id}",
        headers=normal_user_token_headers,
        json={"category": "club", "notes": "Bring the banner"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "club"
    assert body["notes"] == "Bring the banner"


def test_create_task_missing_fields(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"subject": "CS101"},
    )
    assert r.status_code == 422


def test_read_tasks_sorted_by_due_date(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "Later", "due_date": _due(30), "priority": "low"},
    )
    client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "Sooner", "due_date": _due(1), "priority": "high"},
    )
    r = client.get(f"{settings.API_V1_STR}/tasks/", headers=normal_user_token_headers)
    assert r.status_code == 200
    content = r.json()
    assert content["count"] >= 2
    due_dates = [task["due_date"] for task in content["data"]]
    assert due_dates == sorted(due_dates)


def test_mark_task_done(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create = client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "Toggle me", "due_date": _due(2)},
    )
    task_id = create.json()["id"]
    r = client.patch(
        f"{settings.API_V1_STR}/tasks/{task_id}",
        headers=normal_user_token_headers,
        json={"is_done": True},
    )
    assert r.status_code == 200
    assert r.json()["is_done"] is True


def test_update_task_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.patch(
        f"{settings.API_V1_STR}/tasks/{uuid.uuid4()}",
        headers=normal_user_token_headers,
        json={"is_done": True},
    )
    assert r.status_code == 404


def test_delete_task(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    create = client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "Delete me", "due_date": _due(5)},
    )
    task_id = create.json()["id"]
    r = client.delete(
        f"{settings.API_V1_STR}/tasks/{task_id}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 200
    assert r.json()["message"] == "Task deleted successfully"


def test_delete_task_not_found(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.delete(
        f"{settings.API_V1_STR}/tasks/{uuid.uuid4()}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 404


def test_share_and_read_shared_tasks(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "Shared task", "due_date": _due(4)},
    )
    share = client.post(
        f"{settings.API_V1_STR}/tasks/share",
        headers=normal_user_token_headers,
    )
    assert share.status_code == 200
    token = share.json()["share_token"]
    assert token
    assert share.json()["share_url"].endswith(f"/share/{token}")

    r = client.get(f"{settings.API_V1_STR}/tasks/share/{token}")
    assert r.status_code == 200
    assert r.json()["count"] >= 1


def test_read_shared_tasks_bad_token(client: TestClient) -> None:
    r = client.get(f"{settings.API_V1_STR}/tasks/share/nonexistent-token")
    assert r.status_code == 404


def test_send_reminders_not_configured(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "RESEND_API_KEY", None)
    monkeypatch.setattr(settings, "RESEND_FROM_EMAIL", None)
    r = client.post(
        f"{settings.API_V1_STR}/tasks/reminders/send",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 400


def test_send_reminders_happy_path(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client.post(
        f"{settings.API_V1_STR}/tasks/",
        headers=normal_user_token_headers,
        json={"title": "Reminder task", "due_date": _due(0)},
    )

    monkeypatch.setattr(settings, "RESEND_API_KEY", "re_test")
    monkeypatch.setattr(settings, "RESEND_FROM_EMAIL", "test@example.com")
    sent_emails: list[dict[str, str]] = []
    monkeypatch.setattr(
        "app.api.routes.tasks.send_resend_email",
        lambda **kwargs: sent_emails.append(kwargs),
    )

    r = client.post(
        f"{settings.API_V1_STR}/tasks/reminders/send",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 200
    assert r.json()["sent"] >= 1
    assert len(sent_emails) == 1
