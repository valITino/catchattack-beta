COMPOSE = docker compose -f docker/docker-compose.yml

.PHONY: dev demo test migrate lint

dev:
	$(COMPOSE) up -d --build
	$(COMPOSE) exec api bash -lc "alembic upgrade head || true"
	@echo "API -> http://localhost:8000/docs"
	@echo "WEB -> http://localhost:3000"

demo:
	$(COMPOSE) up -d --build
	$(COMPOSE) exec api bash -lc "alembic upgrade head || true"
	$(COMPOSE) exec api bash -lc "python ops/demo.py"

down:
	$(COMPOSE) down -v

migrate:
	$(COMPOSE) exec api bash -lc "alembic revision --autogenerate -m 'init' && alembic upgrade head"

test:
	@echo "TODO: add tests next chunks"

lint:
	$(COMPOSE) exec api bash -lc "pip install ruff mypy && ruff backend && mypy backend"
