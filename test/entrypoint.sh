#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

function run_tests() {
  npx tsx --test --test-reporter=junit test/import.test.ts
}

run_tests