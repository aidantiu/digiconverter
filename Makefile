# DigiConverter - Centralized Docker Management
# Supports both development and production builds with incremental tagging
# Uses MongoDB Atlas for database (no local MongoDB container)

# Docker Compose Files
COMPOSE_DEV := docker-compose.dev.yml
COMPOSE_PROD := docker-compose.prod.yml
COMPOSE_STAGING := docker-compose.staging.yml

# Docker Compose Command - Updated for Docker Compose v2
DOCKER_COMPOSE := docker compose

.PHONY: help build-all build-client build-server build-nginx run-dev run-prod run-staging stop clean up-dev up-prod up-staging down-dev down-prod down-staging

# Default target
help:
	@echo "DigiConverter Docker Management"
	@echo "🗄️  Database: MongoDB Atlas (cloud)"
	@echo ""
	@echo "Development Commands:"
	@echo "  up-dev            Start all services in development mode (Docker Compose)"
	@echo "  down-dev          Stop development services"
	@echo "  build-dev         Build development images"
	@echo "  logs-dev          Show development logs"
	@echo ""
	@echo "Production Commands:"
	@echo "  up-prod           Start all services in production mode (Docker Compose)"
	@echo "  down-prod         Stop production services"
	@echo "  build-prod        Build production images"
	@echo "  logs-prod         Show production logs"
	@echo ""
	@echo "Staging Commands:"
	@echo "  up-staging        Start all services in staging mode (Docker Compose)"
	@echo "  down-staging      Stop staging services"
	@echo "  logs-staging      Show staging logs"
	@echo ""
	@echo "Utility Commands:"
	@echo "  clean             Remove all DigiConverter containers and images"
	@echo "  status            Show status of all containers"
	@echo "  rebuild ENV=<env> Rebuild and restart specific environment"

# Docker Compose Commands - Main interface
up-dev:
	@echo "🚀 Starting DigiConverter development environment..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_DEV) up -d
	@echo "✅ Development environment started:"
	@echo "   🌐 Frontend: http://localhost:5173"
	@echo "   🔗 Backend: http://localhost:5000"
	@echo "   🗄️  Database: MongoDB Atlas (configured in .env)"

up-prod:
	@echo "🚀 Starting DigiConverter production environment..."
	@if [ ! -f server/.env.production ]; then \
		echo "❌ Missing server/.env.production file!"; \
		echo "💡 Please create it with your production configuration"; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE) -f $(COMPOSE_PROD) up -d
	@echo "✅ Production environment started:"
	@echo "   🌐 Application: http://localhost"
	@echo "   🗄️  Database: MongoDB Atlas"
	@echo "   🔍 Check status: make status"

up-staging:
	@echo "🚀 Starting DigiConverter staging environment..."
	@if [ ! -f server/.env.staging ]; then \
		echo "⚠️  Creating basic .env.staging file..."; \
		echo "NODE_ENV=staging" > server/.env.staging; \
		echo "JWT_SECRET=$$(openssl rand -base64 32)" >> server/.env.staging; \
		echo "PORT=5000" >> server/.env.staging; \
		echo "📝 Created basic .env.staging file. Please add your MongoDB Atlas credentials."; \
	fi
	@$(DOCKER_COMPOSE) -f $(COMPOSE_STAGING) up -d
	@echo "✅ Staging environment started:"
	@echo "   🌐 Frontend: http://localhost:3000"
	@echo "   🔗 Backend: http://localhost:5000"
	@echo "   🗄️  Database: MongoDB Atlas"

down-dev:
	@echo "🛑 Stopping development environment..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_DEV) down

down-prod:
	@echo "🛑 Stopping production environment..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_PROD) down

down-staging:
	@echo "🛑 Stopping staging environment..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_STAGING) down

# Build commands
build-dev:
	@echo "🔨 Building development images..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_DEV) build
	@echo "✅ Development images built successfully"

build-prod:
	@echo "🔨 Building production images..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_PROD) build
	@echo "✅ Production images built successfully"

build-staging:
	@echo "🔨 Building staging images..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_STAGING) build
	@echo "✅ Staging images built successfully"

# Logs commands
logs-dev:
	@echo "📋 Development logs:"
	@$(DOCKER_COMPOSE) -f $(COMPOSE_DEV) logs -f

logs-prod:
	@echo "📋 Production logs:"
	@$(DOCKER_COMPOSE) -f $(COMPOSE_PROD) logs -f

logs-staging:
	@echo "📋 Staging logs:"
	@$(DOCKER_COMPOSE) -f $(COMPOSE_STAGING) logs -f

# Utility commands
rebuild:
	@if [ -z "$(ENV)" ]; then \
		echo "❌ Usage: make rebuild ENV=<environment>"; \
		echo "💡 Example: make rebuild ENV=dev"; \
		echo "💡 Available: dev, prod, staging"; \
		exit 1; \
	fi
	@echo "🔄 Rebuilding $(ENV) environment..."
	@make down-$(ENV)
	@make build-$(ENV)
	@make up-$(ENV)
	@echo "✅ $(ENV) environment rebuilt and restarted"

clean: down-dev down-prod down-staging
	@echo "🧹 Cleaning up DigiConverter containers and images..."
	@docker system prune -f
	@docker volume prune -f
	@echo "✅ Cleanup completed"

status:
	@echo "📊 DigiConverter container status:"
	@docker ps --filter "name=digiconverter" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No digiconverter containers found"

# Quick workflow commands
dev: build-dev up-dev
	@echo "🎉 Development environment ready!"

prod: build-prod up-prod
	@echo "🎉 Production environment ready!"

staging: build-staging up-staging
	@echo "🎉 Staging environment ready!"

# Legacy support (keeping old commands for backward compatibility)
run-dev: up-dev
run-prod: up-prod
stop-dev: down-dev
stop-prod: down-prod
logs: logs-dev