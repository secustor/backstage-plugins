#!/bin/bash
set -e

# Ensure we're in the correct directory (where package.json is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Run yarn fix and capture its exit code while preserving stderr
yarn fix 2>&1
FIX_EXIT_CODE=$?

if [ $FIX_EXIT_CODE -ne 0 ]; then
  exit 2
fi

# Run yarn test and capture its exit code while preserving stderr
yarn test:all 2>&1
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
  exit 2
fi

exit 0
