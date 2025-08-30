# Docker build for client; use incremental tags

.PHONY: docker-build-dev docker-build-prod docker-run-dev docker-run-prod

# Development build with Vite dev server
docker-build-dev:
	@build_number_file=build_number.txt; \
	if [ ! -f $$build_number_file ]; then echo 0 > $$build_number_file; fi; \
	build_number=$$(cat $$build_number_file); \
	docker build --target development -t client:dev-$$build_number -f Dockerfile .; \
	echo $$((build_number + 1)) > $$build_number_file; \
	echo "Built client development image with tag: client:dev-$$build_number"

# Production build with nginx
docker-build-prod:
	@build_number_file=build_number_prod.txt; \
	if [ ! -f $$build_number_file; then echo 0 > $$build_number_file; fi; \
	build_number=$$(cat $$build_number_file); \
	docker build --target production -t client:prod-$$build_number -f Dockerfile .; \
	echo $$((build_number + 1)) > $$build_number_file; \
	echo "Built client production image with tag: client:prod-$$build_number"

# Run development container with volume mounts for hot reload
docker-run-dev:
	docker run -it --rm \
		-p 5173:5173 \
		-v $$(pwd):/app \
		-v /app/node_modules \
		-e VITE_API_BASE_URL=http://localhost:5000 \
		--name digiconverter-client-dev \
		client:dev-$$(cat build_number.txt)

# Run production container
docker-run-prod:
	docker run -d \
		-p 3000:8080 \
		--name digiconverter-client-prod \
		client:prod-$$(cat build_number_prod.txt)

# Development build with custom API URL
docker-build-dev-custom:
	@read -p "Enter API URL (default: http://localhost:5000): " api_url; \
	api_url=$${api_url:-http://localhost:5000}; \
	build_number_file=build_number.txt; \
	if [ ! -f $$build_number_file]; then echo 0 > $$build_number_file; fi; \
	build_number=$$(cat $$build_number_file); \
	docker build --target development --build-arg VITE_API_BASE_URL=$$api_url -t client:dev-$$build_number -f Dockerfile .; \
	echo $$((build_number + 1)) > $$build_number_file; \
	echo "Built client development image with API URL: $$api_url and tag: client:dev-$$build_number"