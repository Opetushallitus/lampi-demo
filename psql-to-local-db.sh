#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
CURRENT_DIR="$(dirname "$(readlink -f "$0")")"

function psql() {
  pushd "${CURRENT_DIR}"

  docker compose -f ./docker-compose.yml run \
    -e PGPASSWORD="pgpassword" \
     database \
     /usr/bin/psql --host=db --port 5432 --dbname lampi --username pgadmin

  popd
}

psql "$@"