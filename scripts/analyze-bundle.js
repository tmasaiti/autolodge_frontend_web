#!/usr/bin/env node

/**
 * Bundle analysis script to check build optimization
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BUNDLE_SIZE_LIMITS = {
  // Main bundle should be under 500KB
  main: 500 * 1024,
  // Vendor chunks should be under 1MB
  vendor: 1024 * 1024,
  // Feature chunks should be under 200KB
  feature: 200 * 1024,
  // CSS should be under 100KB
  css: 100 * 1024
};

class BundleAnalyzer {
  constructor() {
    this.distPath = join(process.cwd(), 'dist');
    this.results = {
      totalSize: 0,
      chunks: [],
      warnings: [],
      errors: []
    };
  }

  async analyze() {
    console.log('🔍 Analyzing bundle...');
    
    // Build the project first
    try {
      console.log('📦 Building project...');
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      return false;
    }

    // Check if dist directory exists
    if (!existsSync(this.distPath)) {
      console.error('❌ Dist directory not found');
      return false;
    }

    // Analyze bundle files
    this.analyzeFiles();
    
    // Generate report
    this.generateReport();
    
    return this.results.errors.length === 0;
  }

  analyzeFiles() {
    const { readdirSync, statSync } = require('fs');
    
    const analyzeDirectory = (dirPath, prefix = '') => {
      const files = readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = join(dirPath, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
          analyzeDirectory(filePath, `${prefix}${file}/`);
        } else {
          const size = stat.size;
          const relativePath = `${prefix}${file}`;
          
          this.results.totalSize += size;
          this.results.chunks.push({
            name: relativePath,
            size: size,
            sizeKB: Math.round(size / 1024 * 100) / 100,
            type: this.getFileType(file)
          });
          
          // Check size limits
          this.checkSizeLimits(relativePath, size);
        }
      });
    };

    analyzeDirectory(this.distPath);
  }

  getFileType(filename) {
    if (filename.includes('vendor')) return 'vendor';
    if (filename.includes('feature')) return 'feature';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js')) return 'js';
    if (filename.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    return 'other';
  }

  checkSizeLimits(filename, size) {
    let limit;
    let type;

    if (filename.includes('vendor')) {
      limit = BUNDLE_SIZE_LIMITS.vendor;
      type = 'vendor';
    } else if (filename.includes('feature')) {
      limit = BUNDLE_SIZE_LIMITS.feature;
      type = 'feature';
    } else if (filename.endsWith('.css')) {
      limit = BUNDLE_SIZE_LIMITS.css;
      type = 'css';
    } else if (filename.endsWith('.js')) {
      limit = BUNDLE_SIZE_LIMITS.main;
      type = 'main';
    } else {
      return; // Skip size check for other files
    }

    if (size > limit) {
      this.results.errors.push({
        file: filename,
        size: size,
        limit: limit,
        type: type,
        message: `${type} bundle ${filename} (${Math.round(size/1024)}KB) exceeds limit (${Math.round(limit/1024)}KB)`
      });
    } else if (size > limit * 0.8) {
      this.results.warnings.push({
        file: filename,
        size: size,
        limit: limit,
        type: type,
        message: `${type} bundle ${filename} (${Math.round(size/1024)}KB) is approaching limit (${Math.round(limit/1024)}KB)`
      });
    }
  }

  generateReport() {
    console.log('\n📊 Bundle Analysis Report');
    console.log('========================');
    
    // Total size
    const totalSizeMB = Math.round(this.results.totalSize / 1024 / 1024 * 100) / 100;
    console.log(`📦 Total bundle size: ${totalSizeMB}MB`);
    
    // Largest chunks
    const sortedChunks = this.results.chunks
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    
    console.log('\n🔝 Largest chunks:');
    sortedChunks.forEach((chunk, index) => {
      console.log(`${index + 1}. ${chunk.name} - ${chunk.sizeKB}KB (${chunk.type})`);
    });
    
    // Size by type
    const sizeByType = this.results.chunks.reduce((acc, chunk) => {
      acc[chunk.type] = (acc[chunk.type] || 0) + chunk.size;
      return acc;
    }, {});
    
    console.log('\n📈 Size by type:');
    Object.entries(sizeByType).forEach(([type, size]) => {
      const sizeKB = Math.round(size / 1024 * 100) / 100;
      console.log(`${type}: ${sizeKB}KB`);
    });
    
    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.warnings.forEach(warning => {
        console.log(`- ${warning.message}`);
      });
    }
    
    // Errors
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => {
        console.log(`- ${error.message}`);
      });
    }
    
    // Recommendations
    this.generateRecommendations();
  }

  generateRecommendations() {
    console.log('\n💡 Recommendations:');
    
    const jsChunks = this.results.chunks.filter(c => c.type === 'js');
    const totalJSSize = jsChunks.reduce((sum, c) => sum + c.size, 0);
    
    if (totalJSSize > 1024 * 1024) { // > 1MB
      console.log('- Consider further code splitting for JavaScript bundles');
    }
    
    const vendorChunks = this.results.chunks.filter(c => c.type === 'vendor');
    if (vendorChunks.length === 0) {
      console.log('- Consider splitting vendor dependencies into separate chunks');
    }
    
    const imageSize = this.results.chunks
      .filter(c => c.type === 'image')
      .reduce((sum, c) => sum + c.size, 0);
    
    if (imageSize > 500 * 1024) { // > 500KB
      console.log('- Consider optimizing images or using WebP format');
    }
    
    if (this.results.errors.length === 0 && this.results.warnings.length === 0) {
      console.log('✅ Bundle size is optimized!');
    }
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { BundleAnalyzer };