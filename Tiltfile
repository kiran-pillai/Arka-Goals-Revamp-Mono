# Tiltfile for arka-goals-revamp
#
# Postgres runs in Docker Compose; the backend and frontend run standalone
# as local processes on the host (they connect to Postgres at localhost:5432).

# --- Infra (Docker Compose) ---
docker_compose('./docker-compose.yml')

dc_resource('db', labels=['infra'])
dc_resource('mailhog', labels=['infra'])

# --- Database migrations + seed (runs once before the backend starts) ---
local_resource(
    'db-migrate',
    cmd='npm run db:setup',
    dir='./back-end',
    resource_deps=['db'],
    labels=['infra'],
)

# --- Backend (NestJS, standalone) ---
local_resource(
    'back-end',
    serve_cmd='npm run start:dev',
    serve_dir='./back-end',
    deps=['./back-end/src'],
    resource_deps=['db-migrate', 'mailhog'],
    labels=['app'],
)

# --- Frontend (Vite, standalone) ---
local_resource(
    'front-end',
    serve_cmd='npm run dev',
    serve_dir='./front-end',
    deps=['./front-end/src'],
    resource_deps=['back-end'],
    labels=['app'],
)
