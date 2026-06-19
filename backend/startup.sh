#!/bin/bash
# ISTSS Backend Startup with Tailscale
# This script installs Tailscale in userspace mode, connects to the tailnet,
# then starts the FastAPI server

echo "=== ISTSS API Startup ==="

# Install Tailscale if not present
if ! command -v tailscale &> /dev/null; then
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
fi

# Start tailscaled in userspace mode (no TUN needed in App Service)
echo "Starting tailscaled in userspace mode..."
tailscaled --tun=userspace-networking --state=/tmp/tailscale-state --socket=/tmp/tailscale.sock &
sleep 3

# Authenticate with auth key (set as app setting TAILSCALE_AUTHKEY)
if [ -n "$TAILSCALE_AUTHKEY" ]; then
    echo "Connecting to Tailscale network..."
    tailscale --socket=/tmp/tailscale.sock up --authkey="$TAILSCALE_AUTHKEY" --hostname="istss-api-azure"
    echo "Tailscale connected. Status:"
    tailscale --socket=/tmp/tailscale.sock status
else
    echo "WARNING: TAILSCALE_AUTHKEY not set. Device SSH will not work."
fi

# Start the FastAPI server
echo "Starting ISTSS API server..."
gunicorn -w 2 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:8000
