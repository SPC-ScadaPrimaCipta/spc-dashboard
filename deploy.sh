#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting deployment..."

# Pull the latest changes from the main branch
echo "Pulling latest changes from git..."
git pull

# Stop existing containers
echo "Stopping existing containers..."
docker compose down

# Start containers in detached mode, rebuilding images if necessary
echo "Starting containers..."
docker compose up -d --build

echo "Deployment completed successfully!"
