---
name: docker-environments
description: Containerize services and maintain consistent local, test, staging, and production environments.
---

# Docker and Environment Engineering Skill

## Requirements
- Use minimal, maintained base images and multi-stage builds.
- Run application processes as non-root where practical.
- Pin dependencies and avoid copying local secrets into images.
- Add health checks and graceful shutdown.
- Separate build-time and runtime environment variables.
- Use Docker Compose for local dependencies when it improves reproducibility.
- Document persistent volumes, backups, and restore procedures.

## Validation
Build from a clean checkout, run migrations, start services, and verify health endpoints.
