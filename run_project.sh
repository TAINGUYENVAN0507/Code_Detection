#!/bin/bash

PROJECT_ROOT="/home/tai/Project/Code_Detection"

BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/web"

echo "========================================="
echo "Starting AI Code Detector Project..."
echo "========================================="

echo ""
echo "[1/2] Starting FastAPI backend..."

gnome-terminal -- bash -c "
cd '$BACKEND_DIR'
source venv/bin/activate
uvicorn app.main:app --reload
exec bash
"

sleep 3

echo ""
echo "[2/2] Starting React frontend..."

gnome-terminal -- bash -c "
cd '$FRONTEND_DIR'
npm run dev
exec bash
"

sleep 3

echo ""
echo "Opening browser..."

xdg-open http://localhost:5173 >/dev/null 2>&1

echo ""
echo "Project started successfully."
