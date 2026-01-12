#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function main() {
  echo "Task is starting"
  npx tsx /app/src/index.ts
}

main "$@"