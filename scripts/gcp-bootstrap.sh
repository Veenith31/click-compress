#!/usr/bin/env bash
# Bootstrap Click-Compress worker on GCP e2-micro (Ubuntu).
# Run on the VM: bash scripts/gcp-bootstrap.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Veenith31/click-compress.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/click-compress}"

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
  echo "Docker installed. If 'docker' fails, log out and SSH back in, then re-run this script."
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon not accessible. Try: newgrp docker"
  echo "Or log out/in and run: cd $INSTALL_DIR && bash scripts/gcp-bootstrap.sh --skip-docker"
  if [[ "${1:-}" != "--skip-docker" ]]; then
    exit 1
  fi
fi

echo "==> Cloning/updating repo..."
if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

echo "==> Building and starting worker..."
cd "$INSTALL_DIR/compression-worker"
docker compose -f docker-compose.gcp.yml up -d --build

echo "==> Waiting for health..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8080/health >/dev/null 2>&1; then
    curl -s http://127.0.0.1:8080/health
    echo ""
    echo "Worker is running on 127.0.0.1:8080"
    echo "Next: set DNS + nginx + HTTPS — see docs/GCP-COMPRESSION-WORKER.md"
    exit 0
  fi
  sleep 2
done

echo "Health check failed. Logs:"
docker compose -f docker-compose.gcp.yml logs --tail=50
exit 1
