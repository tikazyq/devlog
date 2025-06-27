'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Layout } from 'antd';
import { DevlogStats } from '@devlog/types';
import { NavigationSidebar } from './components/NavigationSidebar';
import { NavigationBreadcrumb } from './components/NavigationBreadcrumb';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayoutSkeleton } from './components/AppLayoutSkeleton';
import { useDevlogs } from './hooks/useDevlogs';
import { useWebSocket } from './hooks/useWebSocket';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [stats, setStats] = useState<DevlogStats | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { devlogs, error, refetch } = useDevlogs();
  const { connected } = useWebSocket();

  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/devlogs/stats/overview');
        if (response.ok) {
          const statsData = await response.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [devlogs]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <AppLayoutSkeleton />;
  }

  return (
    <ErrorBoundary>
      <Layout className="app-layout">
        <NavigationSidebar
          stats={stats}
          collapsed={sidebarCollapsed}
        />
        <Layout>
          <Header
            connected={connected}
            onRefresh={refetch}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <Content className="app-content">
            <div className="app-content-wrapper">
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  className="app-error-alert"
                />
              )}
              <NavigationBreadcrumb />
              <div className="page-content">
                {children}
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ErrorBoundary>
  );
}
