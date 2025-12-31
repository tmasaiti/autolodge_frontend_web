/**
 * Integration check utility to verify system components are working together
 */

export interface IntegrationCheckResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class IntegrationChecker {
  private results: IntegrationCheckResult[] = [];

  async runChecks(): Promise<IntegrationCheckResult[]> {
    this.results = [];

    // Check Redux store integration
    await this.checkReduxStore();
    
    // Check routing integration
    await this.checkRouting();
    
    // Check API service integration
    await this.checkAPIServices();
    
    // Check component integration
    await this.checkComponentIntegration();
    
    // Check performance monitoring
    await this.checkPerformanceMonitoring();

    return this.results;
  }

  private async checkReduxStore(): Promise<void> {
    try {
      // Basic Redux store check
      const { configureStore } = await import('@reduxjs/toolkit');
      const { userSlice } = await import('../store/slices/userSlice');
      
      const testStore = configureStore({
        reducer: {
          user: userSlice.reducer,
        },
      });

      if (testStore.getState()) {
        this.addResult('Redux Store', 'pass', 'Redux store configuration is working');
      } else {
        this.addResult('Redux Store', 'fail', 'Redux store not properly configured');
      }
    } catch (error) {
      this.addResult('Redux Store', 'fail', `Redux store error: ${error}`);
    }
  }

  private async checkRouting(): Promise<void> {
    try {
      // Check React Router integration
      const { BrowserRouter } = await import('react-router-dom');
      
      if (BrowserRouter) {
        this.addResult('React Router', 'pass', 'React Router is available');
      } else {
        this.addResult('React Router', 'fail', 'React Router not available');
      }
    } catch (error) {
      this.addResult('React Router', 'fail', `Router error: ${error}`);
    }
  }

  private async checkAPIServices(): Promise<void> {
    try {
      // Check API service configuration
      const { api } = await import('../services/api');
      
      if (api) {
        this.addResult('API Services', 'pass', 'API service is configured');
      } else {
        this.addResult('API Services', 'fail', 'API service not configured');
      }
    } catch (error) {
      this.addResult('API Services', 'fail', `API service error: ${error}`);
    }
  }

  private async checkComponentIntegration(): Promise<void> {
    try {
      // Check core UI components
      const { Button } = await import('../components/ui/Button');
      const { Card } = await import('../components/ui/Card');
      const { Modal } = await import('../components/ui/Modal');
      
      if (Button && Card && Modal) {
        this.addResult('UI Components', 'pass', 'Core UI components are available');
      } else {
        this.addResult('UI Components', 'fail', 'Some UI components are missing');
      }
    } catch (error) {
      this.addResult('UI Components', 'fail', `Component error: ${error}`);
    }
  }

  private async checkPerformanceMonitoring(): Promise<void> {
    try {
      // Check performance monitoring
      const { PerformanceMonitor } = await import('./performance-monitoring');
      
      if (PerformanceMonitor) {
        this.addResult('Performance Monitoring', 'pass', 'Performance monitoring is available');
      } else {
        this.addResult('Performance Monitoring', 'warning', 'Performance monitoring not available');
      }
    } catch (error) {
      this.addResult('Performance Monitoring', 'warning', `Performance monitoring error: ${error}`);
    }
  }

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({
      component,
      status,
      message,
      details
    });
  }

  getHealthScore(): number {
    const totalChecks = this.results.length;
    if (totalChecks === 0) return 0;

    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    // Pass = 1 point, Warning = 0.5 points, Fail = 0 points
    const score = (passCount + (warningCount * 0.5)) / totalChecks;
    return Math.round(score * 100);
  }

  getSummary(): string {
    const healthScore = this.getHealthScore();
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;

    return `Integration Health: ${healthScore}% (${passCount} pass, ${warningCount} warnings, ${failCount} failures)`;
  }
}

// Export singleton instance
export const integrationChecker = new IntegrationChecker();