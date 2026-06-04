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
  label="$3"
  attempts="${4:-20}"
  attempt=1

  while [ "$attempt" -le "$attempts" ]; do
    if psql -v ON_ERROR_STOP=1 -h "$host" -p "$PGPORT" -U "$PGUSER" -d "$db_name" -c "select 1" >/dev/null 2>&1; then
      log "$label reachable on host=$host db=$db_name"
      return 0
    fi

    log "Waiting for $label on host=$host db=$db_name (attempt $attempt/$attempts)"
    attempt=$((attempt + 1))
    sleep 2
  done

  fail "Unable to connect to $label on host=$host db=$db_name after $attempts attempts"
}

run_sql() {
  host="$1"
  db_name="$2"
  sql_file="$3"

  require_file "$sql_file"
  wait_for_db "$host" "$db_name" "$db_name"
  log "Seeding db=$db_name host=$host file=$sql_file"

  if ! psql \
    -v ON_ERROR_STOP=1 \
    -v VERBOSITY=verbose \
    -v SHOW_CONTEXT=always \
    --echo-errors \
    -h "$host" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$db_name" \
    -f "$sql_file"; then
    fail "OJT users seed failed for db=$db_name host=$host file=$sql_file"
  fi
}

export PGPASSWORD="${PGPASSWORD:-postgres}"
export PGHOST="${PGHOST:-postgres-core}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

log "ojt-users-seeder starting with PGUSER=$PGUSER PGPORT=$PGPORT PGHOST=$PGHOST"

require_file "/seeds/ojt-users-seed.csv"
require_file "/seeds/00-ojt-users-rrhh-seed.sql"
require_file "/seeds/01-ojt-users-auth-seed.sql"
require_file "/seeds/02-ojt-users-schedule-seed.sql"

run_sql "$PGHOST" "rrhh_db" "/seeds/00-ojt-users-rrhh-seed.sql"
run_sql "$PGHOST" "auth_db" "/seeds/01-ojt-users-auth-seed.sql"
run_sql "$PGHOST" "schedule_db" "/seeds/02-ojt-users-schedule-seed.sql"

log "OJT users seed completed"
