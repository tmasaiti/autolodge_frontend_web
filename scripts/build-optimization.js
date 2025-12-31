#!/usr/bin/env node

/**
 * Build optimization script for production deployments
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

class BuildOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
    this.distPath = join(this.projectRoot, 'dist');
    this.optimizations = [];
  }

  async optimize() {
    console.log('🚀 Starting build optimization...');
    
    // Check if build exists
    if (!existsSync(this.distPath)) {
      console.error('❌ Build directory not found. Run npm run build first.');
      return false;
    }

    // Run optimizations
    await this.optimizeImages();
    await this.optimizeCSS();
    await this.optimizeJS();
    await this.generateServiceWorker();
    await this.createCompressionFiles();
    await this.generateManifest();
    
    // Generate report
    this.generateOptimizationReport();
    
    return true;
  }

  async optimizeImages() {
    console.log('🖼️  Optimizing images...');
    
    try {
      // Check if imagemin is available
      const { glob } = await import('glob');
      const imageFiles = glob.sync(join(this.distPath, '**/*.{png,jpg,jpeg,gif,svg}'));
      
      if (imageFiles.length > 0) {
        console.log(`Found ${imageFiles.length} images to optimize`);
        
        // Add image optimization logic here
        // For now, just report what would be optimized
        this.optimizations.push({
          type: 'images',
          count: imageFiles.length,
          status: 'analyzed'
        });
      }
    } catch (error) {
      console.warn('⚠️  Image optimization skipped:', error.message);
    }
  }

  async optimizeCSS() {
    console.log('🎨 Optimizing CSS...');
    
    try {
      const { glob } = await import('glob');
      const cssFiles = glob.sync(join(this.distPath, '**/*.css'));
      
      let totalSavings = 0;
      
      cssFiles.forEach(file => {
        const originalSize = this.getFileSize(file);
        
        // Read and minify CSS (basic optimization)
        let content = readFileSync(file, 'utf8');
        
        // Remove comments
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove extra whitespace
        content = content.replace(/\s+/g, ' ').trim();
        
        // Write optimized CSS
        writeFileSync(file, content);
        
        const newSize = this.getFileSize(file);
        const savings = originalSize - newSize;
        totalSavings += savings;
        
        console.log(`  ${file}: ${this.formatBytes(savings)} saved`);
      });
      
      this.optimizations.push({
        type: 'css',
        files: cssFiles.length,
        savings: totalSavings,
        status: 'optimized'
      });
      
    } catch (error) {
      console.warn('⚠️  CSS optimization failed:', error.message);
    }
  }

  async optimizeJS() {
    console.log('📦 Optimizing JavaScript...');
    
    try {
      const { glob } = await import('glob');
      const jsFiles = glob.sync(join(this.distPath, '**/*.js'));
      
      // JS is already minified by Vite, so we'll just analyze
      const totalSize = jsFiles.reduce((sum, file) => sum + this.getFileSize(file), 0);
      
      this.optimizations.push({
        type: 'javascript',
        files: jsFiles.length,
        totalSize: totalSize,
        status: 'analyzed'
      });
      
      console.log(`  Analyzed ${jsFiles.length} JS files (${this.formatBytes(totalSize)})`);
      
    } catch (error) {
      console.warn('⚠️  JavaScript optimization failed:', error.message);
    }
  }

  async generateServiceWorker() {
    console.log('⚙️  Generating service worker...');
    
    try {
      const swContent = `
// AutoLodge Service Worker
const CACHE_NAME = 'autolodge-v${Date.now()}';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  // Add other static assets here
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
`;
      
      writeFileSync(join(this.distPath, 'sw.js'), swContent);
      
      this.optimizations.push({
        type: 'service-worker',
        status: 'generated'
      });
      
    } catch (error) {
      console.warn('⚠️  Service worker generation failed:', error.message);
    }
  }

  async createCompressionFiles() {
    console.log('🗜️  Creating compression files...');
    
    try {
      const { glob } = await import('glob');
      const compressibleFiles = glob.sync(join(this.distPath, '**/*.{js,css,html,json,svg}'));
      
      let totalSavings = 0;
      
      compressibleFiles.forEach(file => {
        const content = readFileSync(file);
        const compressed = gzipSync(content);
        
        // Write .gz file
        writeFileSync(`${file}.gz`, compressed);
        
        const savings = content.length - compressed.length;
        totalSavings += savings;
      });
      
      this.optimizations.push({
        type: 'compression',
        files: compressibleFiles.length,
        savings: totalSavings,
        status: 'completed'
      });
      
      console.log(`  Created ${compressibleFiles.length} gzip files, saved ${this.formatBytes(totalSavings)}`);
      
    } catch (error) {
      console.warn('⚠️  Compression failed:', error.message);
    }
  }

  async generateManifest() {
    console.log('📋 Generating build manifest...');
    
    try {
      const { glob } = await import('glob');
      const allFiles = glob.sync(join(this.distPath, '**/*'), { nodir: true });
      
      const manifest = {
        buildTime: new Date().toISOString(),
        version: process.env.VITE_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        files: allFiles.map(file => ({
          path: file.replace(this.distPath, ''),
          size: this.getFileSize(file),
          hash: this.getFileHash(file)
        })),
        optimizations: this.optimizations
      };
      
      writeFileSync(
        join(this.distPath, 'build-manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      
      this.optimizations.push({
        type: 'manifest',
        status: 'generated'
      });
      
    } catch (error) {
      console.warn('⚠️  Manifest generation failed:', error.message);
    }
  }

  generateOptimizationReport() {
    console.log('\n📊 Optimization Report');
    console.log('=====================');
    
    this.optimizations.forEach(opt => {
      switch (opt.type) {
        case 'css':
          console.log(`✅ CSS: ${opt.files} files optimized, ${this.formatBytes(opt.savings)} saved`);
          break;
        case 'javascript':
          console.log(`✅ JavaScript: ${opt.files} files analyzed (${this.formatBytes(opt.totalSize)})`);
          break;
        case 'compression':
          console.log(`✅ Compression: ${opt.files} files compressed, ${this.formatBytes(opt.savings)} saved`);
          break;
        case 'images':
          console.log(`✅ Images: ${opt.count} files analyzed`);
          break;
        case 'service-worker':
          console.log(`✅ Service Worker: Generated`);
          break;
        case 'manifest':
          console.log(`✅ Build Manifest: Generated`);
          break;
      }
    });
    
    console.log('\n🎉 Build optimization completed!');
  }

  getFileSize(filePath) {
    try {
      const { statSync } = require('fs');
      return statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  getFileHash(filePath) {
    try {
      const { createHash } = require('crypto');
      const content = readFileSync(filePath);
      return createHash('md5').update(content).digest('hex').substring(0, 8);
    } catch {
      return 'unknown';
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new BuildOptimizer();
  optimizer.optimize().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { BuildOptimizer };