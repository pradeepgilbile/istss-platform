#!/bin/bash
# ISTSS Backend Startup — gunicorn first, Tailscale background
cd /home/site/wwwroot || cd /home/claude/app/backend || true
echo "=== ISTSS API Startup ($(pwd)) ==="

# Start gunicorn FIRST so Azure health check passes
gunicorn -w 2 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8000 &
GUNICORN_PID=$!

# Background: install sshpass + Tailscale (non-blocking)
(
  sleep 10
  apt-get update -qq 2>/dev/null && apt-get install -y -qq sshpass 2>/dev/null
  if ! command -v tailscale &>/dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh 2>/dev/null
  fi
  tailscaled --tun=userspace-networking --state=/tmp/tailscale-state --socket=/tmp/tailscale.sock 2>/dev/null &
  sleep 3
  [ -n "$TAILSCALE_AUTHKEY" ] && tailscale --socket=/tmp/tailscale.sock up --authkey="$TAILSCALE_AUTHKEY" --hostname=istss-api-azure 2>/dev/null
) &

wait $GUNICORN_PID
