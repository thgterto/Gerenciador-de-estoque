#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting General Testing Routine...${NC}"

# 1. Run Unit Tests (Vitest)
echo -e "\n${YELLOW}[1/3] Running Unit Tests (Vitest)...${NC}"
npm test -- run
UNIT_EXIT_CODE=$?

if [ $UNIT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Unit Tests Passed${NC}"
else
    echo -e "${RED}✗ Unit Tests Failed${NC}"
    exit 1
fi

# 2. Check Server Availability
echo -e "\n${YELLOW}[2/3] Checking Application Server...${NC}"
# Simple check if port 5173 is listening
if lsof -i :5173 > /dev/null; then
    echo -e "${GREEN}✓ Server detected on port 5173${NC}"
else
    echo -e "${RED}✗ Server NOT detected on port 5173.${NC}"
    echo -e "${YELLOW}Please start the application with 'npm run dev' or 'start.bat' in a separate terminal.${NC}"
    # Optionally we could try to start it, but usually better to let user manage env
    exit 1
fi

# 3. Run E2E Tests (Playwright/Pytest)
echo -e "\n${YELLOW}[3/3] Running E2E Tests (Pytest)...${NC}"

# Check if pytest is installed
if ! python3 -c "import pytest" &> /dev/null; then
    echo -e "${YELLOW}Pytest not found in python3. Attempting to run via 'pytest' command...${NC}"
    pytest tests/e2e/
else
    python3 -m pytest tests/e2e/
fi

E2E_EXIT_CODE=$?

if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ E2E Tests Passed${NC}"
else
    echo -e "${RED}✗ E2E Tests Failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}All tests passed successfully!${NC}"
