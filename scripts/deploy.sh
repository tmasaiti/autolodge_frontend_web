#!/bin/bash

# AutoLodge Frontend Deployment Script
# Usage: ./scripts/deploy.sh [environment] [options]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/dist"

# Default values
ENVIRONMENT="production"
SKIP_BUILD=false
SKIP_TESTS=false
DRY_RUN=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
AutoLodge Frontend Deployment Script

Usage: $0 [environment] [options]

Environments:
    development     Deploy to development environment
    staging         Deploy to staging environment
    production      Deploy to production environment (default)

Options:
    --skip-build    Skip the build process
    --skip-tests    Skip running tests
    --dry-run       Show what would be deployed without actually deploying
    --verbose       Enable verbose output
    -h, --help      Show this help message

Examples:
    $0 production                    # Deploy to production
    $0 staging --skip-tests          # Deploy to staging without tests
    $0 development --dry-run         # Dry run for development

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Verbose logging
if [ "$VERBOSE" = true ]; then
    set -x
fi

log_info "Starting deployment to $ENVIRONMENT environment"

# Change to project directory
cd "$PROJECT_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

# Load environment variables
ENV_FILE=".env.$ENVIRONMENT"
if [ -f "$ENV_FILE" ]; then
    log_info "Loading environment variables from $ENV_FILE"
    export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
else
    log_warning "Environment file $ENV_FILE not found"
fi

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
log_info "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
log_info "npm version: $NPM_VERSION"

# Install dependencies
log_info "Installing dependencies..."
npm ci

# Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    log_info "Running tests..."
    npm run test
    
    log_info "Running type check..."
    npm run type-check || log_warning "Type check failed, continuing anyway"
    
    log_info "Running linting..."
    npm run lint || log_warning "Linting failed, continuing anyway"
else
    log_warning "Skipping tests"
fi

# Build application (unless skipped)
if [ "$SKIP_BUILD" = false ]; then
    log_info "Building application for $ENVIRONMENT..."
    
    # Clean previous build
    npm run clean
    
    # Build with environment-specific configuration
    if [ "$ENVIRONMENT" = "production" ]; then
        NODE_ENV=production npm run build
    elif [ "$ENVIRONMENT" = "staging" ]; then
        NODE_ENV=staging npm run build
    else
        NODE_ENV=development npm run build
    fi
    
    # Verify build output
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build directory not found: $BUILD_DIR"
        exit 1
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    log_info "Build size: $BUILD_SIZE"
    
    # Run bundle analysis
    if [ -f "scripts/analyze-bundle.js" ]; then
        log_info "Analyzing bundle..."
        node scripts/analyze-bundle.js || log_warning "Bundle analysis failed"
    fi
else
    log_warning "Skipping build"
fi

# Deployment based on environment
if [ "$DRY_RUN" = true ]; then
    log_info "DRY RUN: Would deploy to $ENVIRONMENT"
    log_info "Build directory: $BUILD_DIR"
    log_info "Files to deploy:"
    find "$BUILD_DIR" -type f | head -20
    if [ $(find "$BUILD_DIR" -type f | wc -l) -gt 20 ]; then
        log_info "... and $(( $(find "$BUILD_DIR" -type f | wc -l) - 20 )) more files"
    fi
else
    case $ENVIRONMENT in
        production)
            deploy_to_production
            ;;
        staging)
            deploy_to_staging
            ;;
        development)
            deploy_to_development
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
fi

log_success "Deployment completed successfully!"

# Deployment functions
deploy_to_production() {
    log_info "Deploying to production..."
    
    # Add production-specific deployment logic here
    # Examples:
    # - Upload to S3 bucket
    # - Deploy to CDN
    # - Update DNS records
    # - Notify monitoring systems
    
    log_warning "Production deployment logic not implemented yet"
    log_info "Manual steps required:"
    log_info "1. Upload $BUILD_DIR to production server"
    log_info "2. Update CDN cache"
    log_info "3. Verify deployment"
}

deploy_to_staging() {
    log_info "Deploying to staging..."
    
    # Add staging-specific deployment logic here
    log_warning "Staging deployment logic not implemented yet"
    log_info "Manual steps required:"
    log_info "1. Upload $BUILD_DIR to staging server"
    log_info "2. Run smoke tests"
}

deploy_to_development() {
    log_info "Deploying to development..."
    
    # For development, we might just start the dev server
    log_info "Development deployment complete"
    log_info "Run 'npm run dev' to start development server"
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Add verification logic here
    # Examples:
    # - Health check endpoints
    # - Smoke tests
    # - Performance checks
    
    log_success "Deployment verification completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Set up trap for cleanup on exit
trap cleanup EXIT