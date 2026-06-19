#!/bin/bash
# ISTSS Backend Startup — gunicorn starts FIRST, Tailscale installs in background
echo "=== ISTSS API Startup ==="

# Start gunicorn immediately so Azure health check passes
gunicorn -w 2 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8000 &
GUNICORN_PID=$!
echo "Gunicorn started (PID: $GUNICORN_PID)"

# Background: install sshpass + Tailscale
(
  sleep 5
  echo "Installing sshpass..."
  apt-get update -qq && apt-get install -y -qq sshpass > /dev/null 2>&1
  echo "Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh 2>/dev/null
  echo "Starting tailscaled..."
  tailscaled --tun=userspace-networking --state=/tmp/tailscale-state --socket=/tmp/tailscale.sock &
  sleep 3
  if [ -n "$TAILSCALE_AUTHKEY" ]; then
    tailscale --socket=/tmp/tailscale.sock up --authkey="$TAILSCALE_AUTHKEY" --hostname="istss-api-azure" 2>/dev/null
    echo "Tailscale connected"
    tailscale --socket=/tmp/tailscale.sock status 2>/dev/null
  fi
) &

# Wait for gunicorn (keep script alive)
wait $GUNICORN_PID
