#!/bin/bash

# E2E Test Runner Script
# This script starts all required services and runs E2E tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FIREBASE_PROJECT_ID="claite-87848"
FIREBASE_AUTH_EMULATOR_PORT=9099
BACKEND_PORT=4000
WEBAPP_PORT=5173
DATABASE_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/classlite}"

# Export env vars for child processes
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:${FIREBASE_AUTH_EMULATOR_PORT}"
export VITE_USE_FIREBASE_EMULATOR="true"
export DATABASE_URL

# PIDs for cleanup
FIREBASE_PID=""
BACKEND_PID=""
WEBAPP_PID=""

cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"

    if [ -n "$WEBAPP_PID" ]; then
        echo "Stopping webapp (PID: $WEBAPP_PID)"
        kill $WEBAPP_PID 2>/dev/null || true
    fi

    if [ -n "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ -n "$FIREBASE_PID" ]; then
        echo "Stopping Firebase emulator (PID: $FIREBASE_PID)"
        kill $FIREBASE_PID 2>/dev/null || true
    fi

    # Kill any remaining processes on the ports
    lsof -ti:$FIREBASE_AUTH_EMULATOR_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$WEBAPP_PORT | xargs kill -9 2>/dev/null || true

    echo -e "${GREEN}Cleanup complete${NC}"
}

# Set up trap for cleanup on exit
trap cleanup EXIT INT TERM

wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-30}
    local attempt=1

    echo -n "Waiting for $name"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e " ${RED}timeout${NC}"
    return 1
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   E2E Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Configuration:"
echo "  DATABASE_URL: $DATABASE_URL"
echo "  FIREBASE_AUTH_EMULATOR_HOST: $FIREBASE_AUTH_EMULATOR_HOST"
echo ""

# Step 1: Start Firebase Auth Emulator
echo -e "${YELLOW}Step 1: Starting Firebase Auth Emulator...${NC}"
firebase emulators:start --only auth --project $FIREBASE_PROJECT_ID > /tmp/firebase-emulator.log 2>&1 &
FIREBASE_PID=$!

if ! wait_for_service "http://127.0.0.1:${FIREBASE_AUTH_EMULATOR_PORT}" "Firebase Auth Emulator" 30; then
    echo -e "${RED}Failed to start Firebase emulator${NC}"
    cat /tmp/firebase-emulator.log
    exit 1
fi

# Step 2: Start Backend
echo -e "${YELLOW}Step 2: Starting Backend...${NC}"
pnpm --filter backend dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

if ! wait_for_service "http://127.0.0.1:${BACKEND_PORT}/health" "Backend" 60; then
    # Try alternative health check
    if ! wait_for_service "http://127.0.0.1:${BACKEND_PORT}/documentation" "Backend" 10; then
        echo -e "${RED}Failed to start backend${NC}"
        cat /tmp/backend.log
        exit 1
    fi
fi

# Step 3: Start Webapp
echo -e "${YELLOW}Step 3: Starting Webapp...${NC}"
pnpm --filter webapp dev > /tmp/webapp.log 2>&1 &
WEBAPP_PID=$!

if ! wait_for_service "http://127.0.0.1:${WEBAPP_PORT}" "Webapp" 60; then
    echo -e "${RED}Failed to start webapp${NC}"
    cat /tmp/webapp.log
    exit 1
fi

# Step 4: Seed test data
echo -e "${YELLOW}Step 4: Seeding test data...${NC}"
if ! pnpm test:e2e:seed; then
    echo -e "${RED}Failed to seed test data${NC}"
    exit 1
fi
echo -e "${GREEN}Test data seeded successfully${NC}"

# Step 5: Run E2E tests
echo ""
echo -e "${YELLOW}Step 5: Running E2E tests...${NC}"
echo -e "${BLUE}========================================${NC}"

# Run tests (pass any additional arguments to playwright)
pnpm test:e2e:chromium "$@"
TEST_EXIT_CODE=$?

echo ""
echo -e "${BLUE}========================================${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}E2E tests passed!${NC}"
else
    echo -e "${RED}E2E tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi
echo -e "${BLUE}========================================${NC}"

exit $TEST_EXIT_CODE
