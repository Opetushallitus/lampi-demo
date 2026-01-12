#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
CURRENT_DIR="$(dirname "$(readlink -f "$0")")"

function main() {
  pushd "${CURRENT_DIR}"
  docker compose -f ./docker-compose.yml up db-task --build
  popd
}

main "$@"