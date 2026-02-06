# Automatic Gate - Local Docker Setup

This repo runs three services locally:
- Backend (NestJS + SQLite)
- Frontend (Next.js)
- AI Pipeline (FastAPI + YOLO + EasyOCR)

## Quick start (dev)
```bash
docker compose --profile dev up --build
```

## Quick start (test)
```bash
docker compose --profile test up --build
```

## Ports
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- Pipeline: http://localhost:8000

## Health checks
```bash
curl http://localhost:8000/health
```

## Example detection request
```bash
curl -X POST http://localhost:8000/detect \
  -F "image=@/path/to/image.jpg" \
  -F "trackId=1"
```

If `AUTO_REGISTER=true` (default in compose), the pipeline sends the detected plate to:
`POST /cars/detect` on the backend.
