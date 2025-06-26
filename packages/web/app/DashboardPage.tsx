'use client';

import React, { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { useDevlogs } from './hooks/useDevlogs';
import { DevlogStats, DevlogEntry } from '@devlog/types';
import { useRouter } from 'next/navigation';

export function DashboardPage() {
  const { devlogs } = useDevlogs();
  const [stats, setStats] = useState<DevlogStats | null>(null);
  const router = useRouter();

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

  const handleViewDevlog = (devlog: DevlogEntry) => {
    router.push(`/devlogs/${devlog.id}`);
  };

  return (
    <Dashboard
      stats={stats}
      recentDevlogs={devlogs.slice(0, 5)}
      onViewDevlog={handleViewDevlog}
    />
  );
}
