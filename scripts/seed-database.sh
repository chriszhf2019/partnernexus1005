#!/bin/bash
# Seed database with complete data
# Prerequisites: supabase CLI installed, logged in, and linked to project

set -e

echo "=== PartnerNexus 数据库迁移 ==="

# Check supabase CLI
if ! command -v supabase &>/dev/null; then
  echo "Error: supabase CLI not found. Install with: npm install -g supabase"
  exit 1
fi

# Check login
supabase projects list --json &>/dev/null || {
  echo "Please login first: supabase login"
  exit 1
}

# Link to project (if not already linked)
if [ ! -f supabase/.temp/project-ref ]; then
  echo "Linking to project..."
  supabase link --project-ref ezkbjufluczpxdixplxu
fi

echo "Running migrations..."
supabase db push --local --apply-migrations

echo "=== Done ==="
