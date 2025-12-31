#!/bin/sh

# Health check script for AutoLodge Frontend

# Configuration
HEALTH_URL="http://localhost:80/health"
TIMEOUT=3
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
    log "${RED}ERROR: curl is not available${NC}"
    exit 1
fi

# Perform health check with retries
for i in $(seq 1 $MAX_RETRIES); do
    log "Health check attempt $i/$MAX_RETRIES"
    
    # Make HTTP request
    response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$HEALTH_URL" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        log "${GREEN}Health check passed${NC}"
        exit 0
    else
        log "${YELLOW}Health check failed (HTTP $response)${NC}"
        
        if [ $i -lt $MAX_RETRIES ]; then
            sleep 1
        fi
    fi
done

log "${RED}Health check failed after $MAX_RETRIES attempts${NC}"
exit 1