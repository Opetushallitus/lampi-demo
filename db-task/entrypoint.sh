#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function main() {
  echo "---------------"
  echo "Starting container for database import task"
  echo "---------------"

  npx tsx /app/src/index.ts
}

main "$@"