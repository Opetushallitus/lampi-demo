#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
CURRENT_DIR="$(dirname "$(readlink -f "$0")")"

function ensure_service_is_down() {
  pushd "${CURRENT_DIR}"
  docker compose -f ../docker-compose.yml down
  popd
}

function run_tests() {
  pushd "${CURRENT_DIR}"
  docker compose -f ./docker-compose.yml run --build --rm test
  local exit_code=$?
  docker compose -f ./docker-compose.yml down
  popd

  exit $exit_code
}

function main() {
  ensure_service_is_down
  run_tests
}

main "$@"