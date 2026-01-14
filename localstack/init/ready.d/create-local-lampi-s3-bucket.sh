#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
CURRENT_DIR="$(dirname "$(readlink -f "$0")")"

function create_bucket() {
  awslocal s3 mb s3://oph-lampi-local
}

function copy_files_to_bucket() {
  awslocal s3 cp "${CURRENT_DIR}"/data/koodi.csv s3://oph-lampi-local/koodi.csv
  awslocal s3 cp "${CURRENT_DIR}"/data/koodisto.schema s3://oph-lampi-local/koodisto.schema
  awslocal s3 cp "${CURRENT_DIR}"/data/manifest.json s3://oph-lampi-local/manifest.json
  awslocal s3 cp "${CURRENT_DIR}"/data/relaatio.csv s3://oph-lampi-local/relaatio.csv
}

function create_healthcheck() {
  echo "ok" | awslocal s3 cp - s3://oph-lampi-local/healthcheck.txt
}

function list_files() {
  aws --endpoint-url=http://127.0.0.1:4566 s3 ls --recursive s3://oph-lampi-local/
}

function main() {
  create_bucket
  copy_files_to_bucket
  create_healthcheck
}

main