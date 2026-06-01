#!/bin/sh
set -eu

log() {
  echo "==> $1"
}

fail() {
  echo "!! $1" >&2
  exit 1
}

require_file() {
  file_path="$1"
  if [ ! -r "$file_path" ]; then
    fail "Required file not found or not readable: $file_path"
  fi
}

wait_for_db() {
  host="$1"
  db_name="$2"
  attempts="${3:-20}"
  attempt=1

  while [ "$attempt" -le "$attempts" ]; do
    if psql -v ON_ERROR_STOP=1 -h "$host" -p "$PGPORT" -U "$PGUSER" -d "$db_name" -c "select 1" >/dev/null 2>&1; then
      log "lead migration target reachable on host=$host db=$db_name"
      return 0
    fi

    log "Waiting for lead migration target on host=$host db=$db_name (attempt $attempt/$attempts)"
    attempt=$((attempt + 1))
    sleep 2
  done

  fail "Unable to connect to lead migration target on host=$host db=$db_name after $attempts attempts"
}

export PGPASSWORD="${PGPASSWORD:-postgres}"
export PGHOST="${PGHOST:-postgres-lead}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

require_file "/seeds/05-lead-migration-seed.sql"
require_file "/seed-data/legacy/clientes_campos_utiles_full.csv"
wait_for_db "$PGHOST" "lead_db"

cp /seeds/05-lead-migration-seed.sql /tmp/lead-migration-dry-run.sql
sed -i 's/^COMMIT;$/ROLLBACK;/' /tmp/lead-migration-dry-run.sql

log "Running legacy lead migration dry-run with ROLLBACK"
psql \
  -v ON_ERROR_STOP=1 \
  -v VERBOSITY=verbose \
  -v SHOW_CONTEXT=always \
  --echo-errors \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "lead_db" \
  -f "/tmp/lead-migration-dry-run.sql"
log "Legacy lead migration dry-run completed"
