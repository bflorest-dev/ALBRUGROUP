#!/bin/sh
set -eu

export PGPASSWORD="${PGPASSWORD:-postgres}"
export PGHOST="${PGHOST:-postgres-lead}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

echo "==> Running legacy lead migration"
psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "lead_db" -f "/seeds/05-lead-migration-seed.sql"
echo "==> Legacy lead migration completed"
