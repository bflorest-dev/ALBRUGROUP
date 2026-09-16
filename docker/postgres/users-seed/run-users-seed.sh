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
    fail "Users seed failed for db=$db_name host=$host file=$sql_file"
  fi
}

run_sql_with_variable() {
  host="$1"
  db_name="$2"
  sql_file="$3"
  variable_name="$4"
  variable_value="$5"

  require_file "$sql_file"
  wait_for_db "$host" "$db_name" "$db_name"
  log "Seeding db=$db_name host=$host file=$sql_file $variable_name=$variable_value"

  if ! psql \
    -v ON_ERROR_STOP=1 \
    -v VERBOSITY=verbose \
    -v SHOW_CONTEXT=always \
    -v "$variable_name=$variable_value" \
    --echo-errors \
    -h "$host" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$db_name" \
    -f "$sql_file"; then
    fail "Users seed failed for db=$db_name host=$host file=$sql_file"
  fi
}

resolve_freelance_team() {
  candidate_ids="$(psql \
    -v ON_ERROR_STOP=1 \
    -h "$LEAD_PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d lead_db \
    -At \
    -c "SELECT DISTINCT ep.id_equipo
        FROM equipo_proveedor ep
        JOIN proveedor p ON p.id = ep.id_proveedor AND p.activo = TRUE
        WHERE EXISTS (
          SELECT 1
          FROM plan pl
          WHERE pl.id_proveedor = p.id
            AND pl.activo = TRUE
            AND (pl.vigencia_desde IS NULL OR pl.vigencia_desde <= CURRENT_DATE)
            AND (pl.vigencia_hasta IS NULL OR pl.vigencia_hasta >= CURRENT_DATE)
        )
        ORDER BY ep.id_equipo")"

  for candidate_id in $candidate_ids; do
    is_active="$(psql \
      -v ON_ERROR_STOP=1 \
      -h "$PGHOST" \
      -p "$PGPORT" \
      -U "$PGUSER" \
      -d auth_db \
      -At \
      -c "SELECT EXISTS (
            SELECT 1
            FROM equipos
            WHERE id = $candidate_id
              AND activo = TRUE
          )")"

    if [ "$is_active" = "t" ]; then
      echo "$candidate_id"
      return 0
    fi
  done

  fail "No active auth team with an active provider and current plan was found for FREELANCE"
}

export PGPASSWORD="${PGPASSWORD:-postgres}"
export PGHOST="${PGHOST:-postgres-core}"
export LEAD_PGHOST="${LEAD_PGHOST:-postgres-lead}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"

log "users-seeder starting with PGUSER=$PGUSER PGPORT=$PGPORT PGHOST=$PGHOST"

require_file "/seeds/users-seed.csv"
require_file "/seeds/00-users-rrhh-seed.sql"
require_file "/seeds/01-users-auth-seed.sql"
require_file "/seeds/02-users-schedule-seed.sql"
require_file "/seeds/03-users-lead-team-seed.sql"
require_file "/seeds/04-users-freelance-team-seed.sql"

run_sql "$PGHOST" "rrhh_db" "/seeds/00-users-rrhh-seed.sql"
run_sql "$PGHOST" "auth_db" "/seeds/01-users-auth-seed.sql"
run_sql "$PGHOST" "schedule_db" "/seeds/02-users-schedule-seed.sql"
run_sql "$LEAD_PGHOST" "lead_db" "/seeds/03-users-lead-team-seed.sql"

freelance_team_id="$(resolve_freelance_team)"
log "Assigning seeded FREELANCE users to operational team id=$freelance_team_id"
run_sql_with_variable \
  "$PGHOST" \
  "auth_db" \
  "/seeds/04-users-freelance-team-seed.sql" \
  "freelance_equipo_id" \
  "$freelance_team_id"

log "Users seed completed"
