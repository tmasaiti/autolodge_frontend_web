import React from 'react';
import { cn } from '../../utils/cn';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNavigation } from './MobileNavigation';
import { ResponsiveContainer } from './ResponsiveContainer';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  showBottomNav?: boolean;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  showHeader = true,
  showFooter = true,
  showBottomNav = true,
  containerSize = 'lg',
  className
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showHeader && <Header />}
      
      <main 
        className={cn(
          'flex-1',
          showBottomNav && 'pb-16 md:pb-0', // Add bottom padding for mobile nav
          className
        )}
      >
        {containerSize === 'full' ? (
          children
        ) : (
          <ResponsiveContainer size={containerSize}>
            {children}
          </ResponsiveContainer>
        )}
      </main>
      
      {showFooter && <Footer />}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className
}) => {
  return (
    <div className={cn('bg-white border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8', className)}>
      <div className="max-w-7xl mx-auto">
        {breadcrumbs && (
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-gray-700">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-gray-600">{subtitle}</p>
            )}
          </div>
          
          {actions && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const sectionPadding = {
  none: '',
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8'
};

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  className,
  padding = 'md'
}) => {
  return (
    <section className={cn(sectionPadding[padding], className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};