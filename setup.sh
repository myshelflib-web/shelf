#!/bin/bash
set -e

echo "=== Shelf Setup ==="

# Check docker
if ! command -v docker &> /dev/null; then
  echo "⚠️  Docker not found. Install Docker Desktop to run PostgreSQL and MinIO."
  echo "   You can still install dependencies and explore the code."
else
  echo "Starting PostgreSQL and MinIO..."
  docker compose up -d
  echo "Waiting for services..."
  sleep 5
fi

echo "Installing backend..."
cd backend && npm install && cp -n .env.example .env 2>/dev/null || true
npx prisma generate
if command -v docker &> /dev/null; then
  npx prisma migrate deploy
  npm run db:seed
fi
cd ..

echo "Installing processing service..."
cd processing-service && npm install && cp -n .env.example .env 2>/dev/null || true
cd ..

echo "Installing ingestion service..."
cd ingestion-service && npm install && cp -n .env.example .env 2>/dev/null || true
cd ..

echo "Installing frontend..."
cd frontend && npm install && cp -n .env.example .env.local 2>/dev/null || true
cd ..

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Start services in separate terminals:"
echo "  1. cd backend && npm run dev          (port 4000)"
echo "  2. cd processing-service && npm run dev    (port 4001)"
echo "  3. cd ingestion-service && npm run dev     (port 4002, or INGEST_WORKER_MODE=poll)"
echo "  4. cd frontend && npm run dev         (port 3000)"
echo ""
echo "Default admin: admin@shelf.local / admin123"
echo "MinIO console: http://localhost:9001 (minioadmin/minioadmin)"
echo "Qdrant (vector DB): http://localhost:6333"
echo ""
echo "Optional local Study AI (Ollama):"
echo "  docker compose --profile ai up -d"
echo "  docker exec shelf-ollama ollama pull llama3.2:1b"
echo "  docker exec shelf-ollama ollama pull nomic-embed-text"
echo "  See backend/.env.example for VECTOR_DB_URL + LLM_* vars"
