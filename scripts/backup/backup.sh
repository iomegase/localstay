#!/bin/bash
# Spec 081 : point d'entrée de la sauvegarde locale (appelé par launchd ou à la main).
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_DIR"
# Identifiants lus depuis .env.local (BR-03), jamais recopiés ailleurs.
set -a
# shellcheck disable=SC1091
. ./.env.local
set +a
exec node node_modules/.bin/tsx scripts/backup/run-backup.ts
