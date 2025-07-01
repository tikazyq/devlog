'use client';

import React from 'react';
import { NavigationBreadcrumb } from './NavigationBreadcrumb';

interface PageLayoutProps {
  children: React.ReactNode;
  /**
   * Custom breadcrumb element to replace the default NavigationBreadcrumb
   */
  breadcrumb?: React.ReactNode;
  /**
   * Actions to display on the right side of the breadcrumb area
   */
  actions?: React.ReactNode;
  /**
   * Whether to show the default navigation breadcrumb (true by default)
   */
  showBreadcrumb?: boolean;
  /**
   * Custom header content that replaces the entire breadcrumb area
   */
  headerContent?: React.ReactNode;
  /**
   * Additional CSS class for the page layout container
   */
  className?: string;
  /**
   * Whether to use sticky header behavior (true by default)
   */
  stickyHeader?: boolean;
}

export function PageLayout({
  children,
  breadcrumb,
  actions,
  showBreadcrumb = true,
  headerContent,
  className = '',
  stickyHeader = true,
}: PageLayoutProps) {
  // If headerContent is provided, use it completely
  if (headerContent) {
    return (
      <div className={`page-layout ${className}`}>
        <div className={stickyHeader ? 'page-header-sticky' : 'page-header'}>
          {headerContent}
        </div>
        <div className="page-content">
          {children}
        </div>
      </div>
    );
  }

  // If no breadcrumb should be shown and no actions, render children directly
  if (!showBreadcrumb && !actions) {
    return (
      <div className={`page-layout ${className}`}>
        <div className="page-content">
          {children}
        </div>
      </div>
    );
  }

  // Default layout with breadcrumb and/or actions
  return (
    <div className={`page-layout ${className}`}>
      {(showBreadcrumb || actions) && (
        <div className={stickyHeader ? 'page-header-sticky' : 'page-header'}>
          <div className="page-header-content">
            <div className="page-header-left">
              {showBreadcrumb && (breadcrumb || <NavigationBreadcrumb />)}
            </div>
            {actions && (
              <div className="page-header-right">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
}
