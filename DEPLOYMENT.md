# AutoLodge Frontend Deployment Guide

This document provides comprehensive instructions for deploying the AutoLodge Frontend Web Application across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Methods](#deployment-methods)
- [Docker Deployment](#docker-deployment)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 18+ 
- npm 9+
- Docker (for containerized deployment)
- Git

### Environment Setup

1. Clone the repository
2. Install dependencies: `npm ci`
3. Configure environment variables (see [Environment Configuration](#environment-configuration))

## Environment Configuration

### Environment Files

The application uses different environment files for each deployment target:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Required Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://api.autolodge.com
VITE_API_VERSION=v1

# Authentication
VITE_AUTH_DOMAIN=auth.autolodge.com
VITE_JWT_ISSUER=autolodge-production

# External Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_SENTRY_DSN=your_sentry_dsn

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE_MODE=true
```

### Security Considerations

- Never commit API keys or secrets to version control
- Use environment-specific configuration files
- Enable HTTPS in production environments
- Configure Content Security Policy (CSP) headers

## Build Process

### Development Build

```bash
npm run dev
```

### Production Build

```bash
# Standard build
npm run build

# Build with analysis
npm run build:analyze

# Build with optimization
npm run build:optimize
```

### Build Optimization

The build process includes several optimization steps:

1. **Code Splitting**: Automatic vendor and feature-based chunking
2. **Minification**: JavaScript and CSS minification
3. **Compression**: Gzip compression for static assets
4. **Image Optimization**: Automatic image compression
5. **Bundle Analysis**: Size analysis and recommendations

## Deployment Methods

### 1. Script-Based Deployment

Use the provided deployment script for automated deployments:

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Deploy with options
./scripts/deploy.sh production --skip-tests --verbose
```

#### Deployment Script Options

- `--skip-build`: Skip the build process
- `--skip-tests`: Skip running tests
- `--dry-run`: Show what would be deployed without deploying
- `--verbose`: Enable verbose output

### 2. Manual Deployment

For manual deployments:

1. **Build the application**:
   ```bash
   npm run build:production
   ```

2. **Upload the `dist/` directory** to your web server

3. **Configure your web server** (see [Web Server Configuration](#web-server-configuration))

### 3. CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build:production
      - run: npm run deploy:production
```

## Docker Deployment

### Building Docker Image

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Docker Compose

For local development with Docker:

```bash
# Development mode
npm run docker:dev

# Production mode
npm run docker:prod
```

### Production Docker Deployment

1. **Build and tag image**:
   ```bash
   docker build -t autolodge-frontend:latest .
   ```

2. **Push to registry**:
   ```bash
   docker tag autolodge-frontend:latest your-registry/autolodge-frontend:latest
   docker push your-registry/autolodge-frontend:latest
   ```

3. **Deploy to production**:
   ```bash
   docker run -d \
     --name autolodge-frontend \
     -p 80:80 \
     -e NODE_ENV=production \
     your-registry/autolodge-frontend:latest
   ```

## Web Server Configuration

### Nginx Configuration

The application includes optimized Nginx configuration:

- **Gzip compression** for static assets
- **Long-term caching** for versioned assets
- **Security headers** (CSP, HSTS, etc.)
- **Client-side routing** support
- **Health check endpoint** at `/health`

### Apache Configuration

For Apache servers, add to `.htaccess`:

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Client-side routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## Monitoring and Health Checks

### Health Check Endpoint

The application provides a health check endpoint at `/health` that returns:

- **200 OK**: Application is healthy
- **500 Error**: Application has issues

### Performance Monitoring

Built-in performance monitoring includes:

- **Core Web Vitals** tracking
- **Bundle size** monitoring
- **Load time** metrics
- **Error rate** tracking

### Logging

Application logs are available at:

- **Nginx logs**: `/var/log/nginx/`
- **Application logs**: Browser console and external services (Sentry)

## Troubleshooting

### Common Issues

#### Build Failures

1. **TypeScript errors**: Run `npm run type-check` to identify issues
2. **Dependency issues**: Clear cache with `npm ci`
3. **Memory issues**: Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`

#### Deployment Issues

1. **404 errors**: Ensure client-side routing is configured
2. **Asset loading failures**: Check CDN configuration and CORS settings
3. **API connection issues**: Verify environment variables and network connectivity

#### Performance Issues

1. **Large bundle size**: Run `npm run build:analyze` to identify large dependencies
2. **Slow loading**: Enable compression and check CDN configuration
3. **Memory leaks**: Monitor performance metrics and check for memory leaks

### Debug Mode

Enable debug mode by setting:

```bash
VITE_LOG_LEVEL=debug
```

### Support

For deployment support:

1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Contact the development team with specific error messages and environment details

## Security Checklist

Before deploying to production:

- [ ] Environment variables are properly configured
- [ ] HTTPS is enabled
- [ ] Security headers are configured
- [ ] API keys are not exposed in client code
- [ ] Content Security Policy is configured
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies are up to date and secure

## Performance Checklist

Before deploying to production:

- [ ] Bundle size is optimized
- [ ] Images are compressed
- [ ] Gzip compression is enabled
- [ ] Caching headers are configured
- [ ] CDN is configured for static assets
- [ ] Performance monitoring is enabled
- [ ] Core Web Vitals meet targets

## Rollback Procedure

In case of deployment issues:

1. **Immediate rollback**: Deploy previous known-good version
2. **Database rollback**: If database changes were made, coordinate with backend team
3. **Cache invalidation**: Clear CDN and browser caches
4. **Monitoring**: Verify rollback success through health checks and monitoring

## Maintenance

### Regular Maintenance Tasks

- **Dependency updates**: Monthly security updates
- **Performance monitoring**: Weekly performance reviews
- **Log rotation**: Configure log rotation to prevent disk space issues
- **Backup verification**: Ensure deployment artifacts are backed up

### Scheduled Maintenance

Plan maintenance windows for:

- **Major version updates**
- **Infrastructure changes**
- **Security patches**
- **Performance optimizations**