#!/usr/bin/env bash
set -e

echo "Installing uv..."
pip install uv

echo "Syncing Python dependencies..."
uv sync --frozen --no-dev

echo "Running database migrations..."
uv run alembic upgrade head

echo "Seeding first superuser (idempotent)..."
uv run python app/initial_data.py

echo "Build complete!"
