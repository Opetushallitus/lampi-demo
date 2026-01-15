#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

RESULTS_DIR="${TEST_RESULTS_DIR:-/app/test-results}"

function run_tests() {
  mkdir -p "${RESULTS_DIR}"
  npx tsx --test \
    --test-reporter=spec \
    --test-reporter=junit \
    --test-reporter-destination=stdout \
    --test-reporter-destination="${RESULTS_DIR}/junit.xml" \
    test/import.test.ts
}

run_tests