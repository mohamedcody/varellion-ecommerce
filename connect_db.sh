#!/bin/bash
# VARELLION - Interactive PostgreSQL connection script for concurrency testing
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: backend/.env not found!"
    exit 1
fi

DB_USER=$(grep '^SPRING_DATASOURCE_USERNAME=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r\n')
DB_PASS=$(grep '^SPRING_DATASOURCE_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r\n')

echo "🔗 Connecting to PostgreSQL (Port 5432 - Session Mode)..."
PGPASSWORD="$DB_PASS" psql \
  -h "aws-0-eu-west-1.pooler.supabase.com" \
  -p 5432 \
  -U "$DB_USER" \
  -d "postgres"
