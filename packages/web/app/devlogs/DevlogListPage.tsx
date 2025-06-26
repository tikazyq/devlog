'use client';

import React from 'react';
import { DevlogList } from '../components/DevlogList';
import { LoadingPage } from '../components/LoadingPage';
import { useDevlogs } from '../hooks/useDevlogs';
import { DevlogEntry, DevlogId } from '@devlog/types';
import { useRouter } from 'next/navigation';

export function DevlogListPage() {
  const { devlogs, loading, deleteDevlog } = useDevlogs();
  const router = useRouter();

  const handleViewDevlog = (devlog: DevlogEntry) => {
    router.push(`/devlogs/${devlog.id}`);
  };

  const handleDeleteDevlog = async (id: DevlogId) => {
    try {
      await deleteDevlog(id);
    } catch (error) {
      console.error('Failed to delete devlog:', error);
    }
  };

  if (loading) {
    return <LoadingPage message="Loading devlogs..." />;
  }

  return (
    <DevlogList
      devlogs={devlogs}
      loading={loading}
      onViewDevlog={handleViewDevlog}
      onDeleteDevlog={handleDeleteDevlog}
    />
  );
}
