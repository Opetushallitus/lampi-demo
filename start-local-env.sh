#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
CURRENT_DIR="$(dirname "$(readlink -f "$0")")"

function stop() {
  pushd "${CURRENT_DIR}"
  docker compose -f ./docker-compose.yml down
  popd
}

function main() {
  pushd "${CURRENT_DIR}"
  docker compose -f ./docker-compose.yml up --build
  popd
}

trap stop EXIT
main "$@"