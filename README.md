# FlowDesk — Real-time Collaborative Task Intelligence Platform

A production-level task management system built with FastAPI, PostgreSQL, Redis, and WebSockets.

Live demo: https://flowdesk-api-qmtl.onrender.com/docs

---

## Features

- **JWT Authentication** — register, login, access + refresh token pair
- **Workspaces & Teams** — create workspaces, invite members, role-based access control (RBAC)
- **Task Management** — full CRUD with status, priority, labels, assignments, due dates
- **Real-time Collaboration** — WebSocket-powered live updates via Redis Pub/Sub
- **Notifications** — in-app alerts with real-time delivery
- **Analytics Dashboard** — task velocity, member stats, 30-day activity chart data
- **Clean Architecture** — routers → services → repositories → models

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Backend      | Python 3.12, FastAPI              |
| Database     | PostgreSQL 16, SQLAlchemy 2.0     |
| Cache/RT     | Redis 7, Pub/Sub                  |
| Auth         | JWT (python-jose), bcrypt         |
| Real-time    | WebSockets (native FastAPI)       |
| Deployment   | Docker, Render, Upstash Redis     |

---

## Architecture

```text
Request → FastAPI Router → Service Layer → Repository → PostgreSQL
                ↘ Redis Pub/Sub → WebSocket broadcast
```

Modular monolith — clean separation of concerns, designed for horizontal scaling.

---

## Local Development

### Prerequisites

- Python 3.12+
- Docker + Docker Compose

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/flowdesk.git

cd flowdesk/backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env

# Fill environment variables

docker compose up -d

uvicorn app.main:app --reload --port 8000
```

Visit:

```text
http://localhost:8000/docs
```

for interactive API documentation.

### Demo Role Users

Create one login for each workspace role manually:

```bash
cd backend
DATABASE_URL="postgresql+asyncpg://flowdesk_user:flowdesk_pass@localhost:5432/flowdesk_db" \
SECRET_KEY="local-dev-secret" \
DEBUG=False \
python -m scripts.seed_demo_users
```

To seed automatically after a deploy, set this environment variable on the
backend service:

```text
SEED_DEMO_USERS=true
```

Optional environment overrides:

```text
DEMO_PASSWORD=DemoPass123!
DEMO_WORKSPACE_NAME=FlowDesk Demo Workspace
DEMO_WORKSPACE_SLUG=flowdesk-demo-workspace
```

Default password for all demo users:

```text
DemoPass123!
```

Demo accounts:

```text
owner:  flowdesk.owner@example.com
admin:  flowdesk.admin@example.com
member: flowdesk.member@example.com
viewer: flowdesk.viewer@example.com
```

---

## API Overview

| Module        | Endpoints |
|---------------|-----------|
| Auth          | POST /register, /login, /refresh · GET /me |
| Workspaces    | CRUD workspaces, members, invitations |
| Tasks         | CRUD tasks, labels, comments, activity |
| Real-time     | WS /ws/{workspace_id}?token= |
| Notifications | GET /notifications · POST /mark-read |
| Analytics     | GET /workspaces/{id}/analytics |

Full documentation available at:

- `/docs` → Swagger UI
- `/redoc` → ReDoc

---

## Key Design Decisions

### Why FastAPI?

Async-native, automatic OpenAPI docs, Pydantic validation, and excellent developer experience.

### Why Redis Pub/Sub for WebSockets?

Allows horizontal scaling — multiple application instances can share events through Redis.

### Why Modular Monolith Instead of Microservices?

Keeps operational complexity manageable while preserving clean module boundaries for future scaling.

### JWT Access + Refresh Token Strategy

- Access token → 30 minutes
- Refresh token → 7 days

Improves security while maintaining smooth user sessions.

---

## Deployment

Deployed on:

- Render Web Service
- Render PostgreSQL
- Upstash Redis

CI/CD:

Every push to `main` triggers automatic deployment.

---

## Project Structure

```text
backend/
├── app/
│   ├── api/            # HTTP route handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Database queries
│   ├── models/         # SQLAlchemy ORM models
│   ├── schemas/        # Pydantic request/response schemas
│   ├── core/           # Config, DB, Redis, dependencies
│   └── websockets/     # WebSocket manager & events
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

---

## Production URLs

### Swagger Docs

https://flowdesk-api-qmtl.onrender.com/docs

### Health Check

https://flowdesk-api-qmtl.onrender.com/health

---

## Author

Abdul Rahman
