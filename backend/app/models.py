import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import AutoString, Field, Relationship, SQLModel

Priority = Literal["high", "medium", "low"]


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    share_token: str | None = Field(default=None, index=True, unique=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    tasks: list["Task"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared task properties
class TaskBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    subject: str | None = Field(default=None, max_length=255)
    due_date: datetime = Field(sa_type=DateTime(timezone=True))  # type: ignore
    priority: Priority = Field(default="medium", sa_type=AutoString)
    is_done: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    subject: str | None = Field(default=None, max_length=255)
    due_date: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))  # type: ignore
    priority: Priority | None = None
    is_done: bool | None = None


class Task(TaskBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner: User | None = Relationship(back_populates="tasks")


class TaskPublic(TaskBase):
    id: uuid.UUID
    created_at: datetime | None = None


class TasksPublic(SQLModel):
    data: list[TaskPublic]
    count: int


class ShareLink(SQLModel):
    share_token: str
    share_url: str


class ReminderResult(SQLModel):
    sent: int
    message: str


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
