#!/bin/bash
# VARELLION - Script to inspect Supabase Users table directly from terminal

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: backend/.env not found!"
    exit 1
fi

# Load DB credentials from .env
DB_USER=$(grep '^SPRING_DATASOURCE_USERNAME=' "$ENV_FILE" | cut -d'=' -f2-)
DB_PASS=$(grep '^SPRING_DATASOURCE_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2-)

echo "🔍 Connecting to Supabase PostgreSQL..."
echo "📊 Fetching users from public.users table:"
echo ""

PGPASSWORD="$DB_PASS" psql \
  -h "aws-0-eu-west-1.pooler.supabase.com" \
  -p 6543 \
  -U "$DB_USER" \
  -d "postgres" \
  -c "SELECT id, username, email, role, enabled, email_verified, created_at FROM public.users ORDER BY id DESC LIMIT 10;"

echo ""
echo "✅ Check complete! To view full tables, visit your Supabase dashboard at:"
echo "👉 https://supabase.com/dashboard/project/zninhofysyaydtumidvy"
