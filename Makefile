# DigiConverter - Centralized Docker Management
# Supports both development and production builds with incremental tagging

.PHONY: help build-all build-client build-server build-nginx run-dev run-prod stop clean

# Default target
help:
	@echo "DigiConverter Docker Management"
	@echo ""
	@echo "Development Commands:"
	@echo "  build-dev          Build all services for development"
	@echo "  build-client-dev   Build client development image"
	@echo "  build-server-dev   Build server development image"
	@echo "  run-dev           Run all services in development mode"
	@echo "  stop-dev          Stop development containers"
	@echo ""
	@echo "Production Commands:"
	@echo "  build-prod         Build all services for production"
	@echo "  build-client-prod  Build client production image"
	@echo "  build-server-prod  Build server production image"
	@echo "  run-prod          Run all services in production mode"
	@echo "  stop-prod         Stop production containers"
	@echo ""
	@echo "Utility Commands:"
	@echo "  clean             Remove all DigiConverter containers and images"
	@echo "  logs              Show logs for all services"
	@echo "  status            Show status of all containers"

# Development builds
build-dev: build-client-dev build-server-dev
	@echo "✅ All development images built successfully"

build-client-dev:
	@echo "🔨 Building client development image..."
	@build_file=client_dev_build.txt; \
	if [ ! -f $$build_file ]; then echo 0 > $$build_file; fi; \
	build_num=$$(cat $$build_file | tr -d '\n'); \
	if [ -z "$$build_num" ]; then build_num=0; fi; \
	echo "Building with tag: $$build_num"; \
	cd client && docker build --target development -t digiconverter-client:dev-$$build_num -f Dockerfile .; \
	echo $$((build_num + 1)) > $$build_file; \
	echo "✅ Built client development image: digiconverter-client:dev-$$build_num"

build-server-dev:
	@echo "🔨 Building server development image..."
	@build_file=server_dev_build.txt; \
	if [ ! -f $$build_file ]; then echo 0 > $$build_file; fi; \
	build_num=$$(cat $$build_file | tr -d '\n'); \
	if [ -z "$$build_num" ]; then build_num=0; fi; \
	echo "Building with tag: $$build_num"; \
	cd server && docker build --target development -t digiconverter-server:dev-$$build_num -f Dockerfile .; \
	echo $$((build_num + 1)) > $$build_file; \
	echo "✅ Built server development image: digiconverter-server:dev-$$build_num"

# Production builds
build-prod: build-client-prod build-server-prod
	@echo "✅ All production images built successfully"

build-client-prod:
	@echo "🔨 Building client production image..."
	@build_file=client_prod_build.txt; \
	if [ ! -f $$build_file ]; then echo 0 > $$build_file; fi; \
	build_num=$$(cat $$build_file); \
	cd client && docker build --target production -t digiconverter-client:prod-$$build_num -f Dockerfile .; \
	echo $$((build_num + 1)) > $$build_file; \
	echo "✅ Built client production image: digiconverter-client:prod-$$build_num"

build-server-prod:
	@echo "🔨 Building server production image..."
	@build_file=server_prod_build.txt; \
	if [ ! -f $$build_file ]; then echo 0 > $$build_file; fi; \
	build_num=$$(cat $$build_file); \
	cd server && docker build --target production -t digiconverter-server:prod-$$build_num -f Dockerfile .; \
	echo $$((build_num + 1)) > $$build_file; \
	echo "✅ Built server production image: digiconverter-server:prod-$$build_num"

# Development run commands
run-dev: stop-dev
	@echo "🚀 Starting DigiConverter in development mode..."
	@if [ ! -f client_dev_build.txt ]; then echo "❌ No client dev build found. Run 'make build-client-dev' first"; exit 1; fi
	@if [ ! -f server_dev_build.txt ]; then echo "❌ No server dev build found. Run 'make build-server-dev' first"; exit 1; fi
	@client_next=$$(cat client_dev_build.txt | tr -d '\n'); \
	server_next=$$(cat server_dev_build.txt | tr -d '\n'); \
	if [ $$client_next -le 0 ]; then client_tag=0; else client_tag=$$((client_next - 1)); fi; \
	if [ $$server_next -le 0 ]; then server_tag=0; else server_tag=$$((server_next - 1)); fi; \
	echo "Using client tag: $$client_tag, server tag: $$server_tag"; \
	docker network create digiconverter-network 2>/dev/null || true; \
	rm -rf "$(PWD)/server/logs" && mkdir -p "$(PWD)/server/logs" && chmod 777 "$(PWD)/server/logs"; \
	docker run -d --name digiconverter-server-dev --network digiconverter-network -p 5000:5000 -v "$(PWD)/server:/app" -v /app/node_modules -v "$(PWD)/server/logs:/app/logs" -e NODE_ENV=development "digiconverter-server:dev-$$server_tag"; \
	docker run -d --name digiconverter-client-dev --network digiconverter-network -p 5173:5173 -v "$(PWD)/client:/app" -v /app/node_modules -e VITE_API_BASE_URL=http://localhost:5000 "digiconverter-client:dev-$$client_tag"; \
	echo "✅ Development environment started:"; \
	echo "   🌐 Frontend: http://localhost:5173"; \
	echo "   🔗 Backend: http://localhost:5000"

# Production run commands
run-prod: stop-prod
	@echo "🚀 Starting DigiConverter in production mode..."
	@if [ ! -f client_prod_build.txt ]; then echo "❌ No client prod build found. Run 'make build-client-prod' first"; exit 1; fi
	@if [ ! -f server_prod_build.txt ]; then echo "❌ No server prod build found. Run 'make build-server-prod' first"; exit 1; fi
	@client_tag=$$(cat client_prod_build.txt); \
	server_tag=$$(cat server_prod_build.txt); \
	docker network create digiconverter-network 2>/dev/null || true; \
	docker run -d --name digiconverter-server-prod --network digiconverter-network \
		-e NODE_ENV=production \
		digiconverter-server:prod-$$server_tag; \
	docker run -d --name digiconverter-client-prod --network digiconverter-network \
		digiconverter-client:prod-$$client_tag; \
	docker run -d --name digiconverter-nginx --network digiconverter-network \
		-p 80:80 \
		-v $(PWD)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf \
		nginx:alpine; \
	echo "✅ Production environment started:"; \
	echo "   🌐 Application: http://localhost"

# Stop commands
stop-dev:
	@echo "🛑 Stopping development containers..."
	@docker stop digiconverter-client-dev digiconverter-server-dev 2>/dev/null || true
	@docker rm digiconverter-client-dev digiconverter-server-dev 2>/dev/null || true

stop-prod:
	@echo "🛑 Stopping production containers..."
	@docker stop digiconverter-nginx digiconverter-client-prod digiconverter-server-prod 2>/dev/null || true
	@docker rm digiconverter-nginx digiconverter-client-prod digiconverter-server-prod 2>/dev/null || true

# Utility commands
clean: stop-dev stop-prod
	@echo "🧹 Cleaning up DigiConverter containers and images..."
	@docker rmi $$(docker images "digiconverter-*" -q) 2>/dev/null || true
	@docker network rm digiconverter-network 2>/dev/null || true
	@rm -f *_build.txt
	@echo "✅ Cleanup completed"

logs:
	@echo "📋 DigiConverter container logs:"
	@echo "=== Client Dev Logs ==="
	@docker logs digiconverter-client-dev 2>/dev/null || echo "Client dev: not running"
	@echo "=== Server Dev Logs ==="
	@docker logs digiconverter-server-dev 2>/dev/null || echo "Server dev: not running"
	@echo "=== Client Prod Logs ==="
	@docker logs digiconverter-client-prod 2>/dev/null || echo "Client prod: not running"
	@echo "=== Server Prod Logs ==="
	@docker logs digiconverter-server-prod 2>/dev/null || echo "Server prod: not running"
	@echo "=== Nginx Logs ==="
	@docker logs digiconverter-nginx 2>/dev/null || echo "Nginx: not running"

status:
	@echo "📊 DigiConverter container status:"
	@docker ps --filter "name=digiconverter" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No containers running"

# Quick development workflow
dev: build-dev run-dev
	@echo "🎉 Development environment ready!"

# Quick production workflow  
prod: build-prod run-prod
	@echo "🎉 Production environment ready!"