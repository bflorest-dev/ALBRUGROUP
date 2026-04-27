#!/bin/sh
set -eu

run_sql() {
  db_name="$1"
  sql_file="$2"
  echo "==> Seeding ${db_name} with ${sql_file}"
  psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$db_name" -f "$sql_file"
}

export PGPASSWORD="${PGPASSWORD:-postgres}"
export PGHOST="${PGHOST:-postgres-core}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

run_sql "auth_db" "/seeds/00-auth-seed.sql"
run_sql "rrhh_db" "/seeds/01-rrhh-seed.sql"
run_sql "recruitment_db" "/seeds/03-recruitment-seed.sql"
run_sql "schedule_db" "/seeds/04-schedule-seed.sql"

export PGHOST="${LEAD_PGHOST:-postgres-lead}"
run_sql "lead_db" "/seeds/02-lead-seed.sql"
run_sql "lead_db" "/seeds/05-lead-migration-seed.sql"

echo "==> Database seeds completed"
