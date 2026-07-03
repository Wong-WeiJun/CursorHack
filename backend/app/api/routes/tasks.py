import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.models import (
    Message,
    ReminderResult,
    ShareLink,
    Task,
    TaskCreate,
    TaskPublic,
    TasksPublic,
    TaskUpdate,
    User,
)
from app.utils import send_resend_email

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=TasksPublic)
def read_tasks(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve current user's tasks sorted by due date.
    """
    count_statement = (
        select(func.count()).select_from(Task).where(Task.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(Task)
        .where(Task.owner_id == current_user.id)
        .order_by(col(Task.due_date).asc())
    )
    tasks = session.exec(statement).all()
    return TasksPublic(
        data=[TaskPublic.model_validate(task) for task in tasks], count=count
    )


@router.post("/", response_model=TaskPublic)
def create_task(
    *, session: SessionDep, current_user: CurrentUser, task_in: TaskCreate
) -> Any:
    """
    Create a new task for the current user.
    """
    task = Task.model_validate(task_in, update={"owner_id": current_user.id})
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskPublic)
def update_task(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    task_id: uuid.UUID,
    task_in: TaskUpdate,
) -> Any:
    """
    Update a task (edit fields, mark done/undo).
    """
    task = session.get(Task, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = task_in.model_dump(exclude_unset=True)
    task.sqlmodel_update(task_data)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/{task_id}", response_model=Message)
def delete_task(
    session: SessionDep, current_user: CurrentUser, task_id: uuid.UUID
) -> Any:
    """
    Delete a task.
    """
    task = session.get(Task, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(task)
    session.commit()
    return Message(message="Task deleted successfully")


@router.post("/share", response_model=ShareLink)
def share_tasks(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Generate (or rotate) a public share token for the current user's task list.
    """
    token = secrets.token_urlsafe(16)
    current_user.share_token = token
    session.add(current_user)
    session.commit()
    return ShareLink(
        share_token=token,
        share_url=f"{settings.FRONTEND_HOST}/share/{token}",
    )


@router.post("/reminders/send", response_model=ReminderResult)
def send_reminders(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Email the current user their unfinished tasks due within the next 24 hours.
    """
    if not settings.resend_enabled:
        raise HTTPException(
            status_code=400, detail="Email reminders are not configured"
        )

    now = datetime.now(timezone.utc)
    window = now + timedelta(hours=24)
    statement = (
        select(Task)
        .where(Task.owner_id == current_user.id)
        .where(col(Task.is_done) == False)  # noqa: E712
        .where(col(Task.due_date) <= window)
        .order_by(col(Task.due_date).asc())
    )
    tasks = session.exec(statement).all()

    if not tasks:
        return ReminderResult(sent=0, message="No tasks due in the next 24 hours")

    rows = "".join(
        f"<li><strong>{task.title}</strong>"
        f"{f' ({task.subject})' if task.subject else ''}"
        f" — due {task.due_date.strftime('%a %d %b, %H:%M')}"
        f" [{task.priority}]</li>"
        for task in tasks
    )
    html = (
        f"<h2>Your upcoming deadlines</h2>"
        f"<p>You have {len(tasks)} task(s) due in the next 24 hours:</p>"
        f"<ul>{rows}</ul>"
        f"<p>— {settings.PROJECT_NAME}</p>"
    )
    send_resend_email(
        to=current_user.email,
        subject=f"{settings.PROJECT_NAME}: {len(tasks)} task(s) due soon",
        html=html,
    )
    return ReminderResult(
        sent=len(tasks), message=f"Sent reminder for {len(tasks)} task(s)"
    )


@router.get("/share/{token}", response_model=TasksPublic)
def read_shared_tasks(session: SessionDep, token: str) -> Any:
    """
    Public, read-only view of a shared task list. No authentication required.
    """
    owner = session.exec(select(User).where(User.share_token == token)).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Shared task list not found")

    count_statement = (
        select(func.count()).select_from(Task).where(Task.owner_id == owner.id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(Task).where(Task.owner_id == owner.id).order_by(col(Task.due_date).asc())
    )
    tasks = session.exec(statement).all()
    return TasksPublic(
        data=[TaskPublic.model_validate(task) for task in tasks], count=count
    )
