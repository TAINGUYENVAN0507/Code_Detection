#!/bin/bash

PROJECT_ROOT="/home/tai/Project/Code_Detection"

BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/web"
MONGO_DATA_DIR="$PROJECT_ROOT/.local/mongodb/data"
MONGO_LOG_DIR="$PROJECT_ROOT/.local/mongodb/log"
MONGO_LOG_FILE="$MONGO_LOG_DIR/mongod.log"
MONGO_PORT="27017"

echo "========================================="
echo "Starting AI Code Detector Project..."
echo "========================================="

mkdir -p "$MONGO_DATA_DIR" "$MONGO_LOG_DIR"

echo ""
echo "[1/3] Starting MongoDB..."

if ! command -v mongod >/dev/null 2>&1; then
  echo "mongod command was not found. Please install MongoDB server first."
  exit 1
fi

if mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" >/dev/null 2>&1; then
  echo "MongoDB is already running on port $MONGO_PORT."
else
  mongod \
    --dbpath "$MONGO_DATA_DIR" \
    --bind_ip 127.0.0.1 \
    --port "$MONGO_PORT" \
    --logpath "$MONGO_LOG_FILE" \
    --fork

  sleep 2

  if mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" >/dev/null 2>&1; then
    echo "MongoDB started successfully."
  else
    echo "MongoDB failed to start. Check log file:"
    echo "$MONGO_LOG_FILE"
    exit 1
  fi
fi

echo ""
echo "[2/3] Starting FastAPI backend..."

gnome-terminal -- bash -c "
cd '$BACKEND_DIR'
source venv/bin/activate
export MONGODB_URL='mongodb://127.0.0.1:$MONGO_PORT/'
uvicorn app.main:app --reload
exec bash
"

sleep 3

echo ""
echo "[3/3] Starting React frontend..."

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
echo "MongoDB data: $MONGO_DATA_DIR"
echo "MongoDB log:  $MONGO_LOG_FILE"
