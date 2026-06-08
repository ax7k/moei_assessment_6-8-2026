# ═══════════════════════════════════════════════════════════════════
#  MOEI HR Companion – Makefile
#
#  Usage:
#    make up       ← build images + start everything
#    make down     ← stop everything
#    make restart  ← down + up
#    make logs     ← tail logs from both containers
#    make shell-backend  ← open a shell in the backend container
#    make shell-frontend ← open a shell in the frontend container
# ═══════════════════════════════════════════════════════════════════

.PHONY: up down restart build logs clean shell-backend shell-frontend

## Start both containers (build if needed)
up:
	docker compose up --build

## Start in detached mode (background)
up-d:
	docker compose up --build -d

## Stop and remove containers
down:
	docker compose down

## Restart everything
restart: down up

## Rebuild images without cache
build:
	docker compose build --no-cache

## Tail logs from both services
logs:
	docker compose logs -f

## Tail backend logs only
logs-backend:
	docker compose logs -f backend

## Tail frontend logs only
logs-frontend:
	docker compose logs -f frontend

## Open a bash shell in the backend container
shell-backend:
	docker compose exec backend /bin/bash

## Open a shell in the frontend container
shell-frontend:
	docker compose exec frontend /bin/sh

## Remove containers, volumes, and orphans
clean:
	docker compose down -v --remove-orphans

## Show running container status
status:
	docker compose ps
