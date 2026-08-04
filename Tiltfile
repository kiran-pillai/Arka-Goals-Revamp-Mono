# Tiltfile for arka-goals-revamp
#
# Postgres runs in Docker Compose; the backend and frontend run standalone
# as local processes on the host (they connect to Postgres at localhost:5432).

# --- Infra (Docker Compose) ---
docker_compose('./docker-compose.yml')

dc_resource('db', labels=['infra'])
dc_resource('mailhog', labels=['infra'])

# --- Backend (NestJS, standalone) ---
local_resource(
    'back-end',
    serve_cmd='npm run start:dev',
    serve_dir='./back-end',
    deps=['./back-end/src'],
    resource_deps=['db', 'mailhog'],
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
