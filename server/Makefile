# Docker build for server; use incremental tags

.PHONY: docker-build-dev docker-build-prod docker-run-dev docker-run-prod

# Development build with hot reload
docker-build-dev:
	@build_number_file=build_number.txt; \
	if [ ! -f $$build_number_file ]; then echo 0 > $$build_number_file; fi; \
	build_number=$$(cat $$build_number_file); \
	docker build --target development -t server:dev-$$build_number -f Dockerfile .; \
	echo $$((build_number + 1)) > $$build_number_file; \
	echo "Built server development image with tag: server:dev-$$build_number"

# Production build optimized
docker-build-prod:
	@build_number_file=build_number_prod.txt; \
	if [ ! -f $$build_number_file ]; then echo 0 > $$build_number_file; fi; \
	build_number=$$(cat $$build_number_file); \
	docker build --target production -t server:prod-$$build_number -f Dockerfile .; \
	echo $$((build_number + 1)) > $$build_number_file; \
	echo "Built server production image with tag: server:prod-$$build_number"

# Run development container with volume mounts for hot reload
docker-run-dev:
	docker run -it --rm \
		-p 5000:5000 \
		-v $$(pwd):/app \
		-v /app/node_modules \
		-e NODE_ENV=development \
		--name digiconverter-server-dev \
		server:dev-$$(cat build_number.txt)

# Run production container
docker-run-prod:
	docker run -d \
		-p 5000:5000 \
		-e NODE_ENV=production \
		--name digiconverter-server-prod \
		server:prod-$$(cat build_number_prod.txt)