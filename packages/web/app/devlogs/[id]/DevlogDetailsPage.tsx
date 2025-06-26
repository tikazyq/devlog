'use client';

import React, { useEffect, useState } from 'react';
import { DevlogDetails } from '../../components/DevlogDetails';
import { LoadingPage } from '../../components/LoadingPage';
import { useDevlogs } from '../../hooks/useDevlogs';
import { DevlogEntry } from '@devlog/types';
import { useRouter } from 'next/navigation';
import { Alert } from 'antd';

interface DevlogDetailsPageProps {
  id: string;
}

export function DevlogDetailsPage({ id }: DevlogDetailsPageProps) {
  const { devlogs, updateDevlog, deleteDevlog } = useDevlogs();
  const [devlog, setDevlog] = useState<DevlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const foundDevlog = devlogs.find((d: DevlogEntry) => d.id === parseInt(id));
    if (foundDevlog) {
      setDevlog(foundDevlog);
      setLoading(false);
    } else if (devlogs.length > 0) {
      // If devlogs are loaded but no match found
      setError('Devlog not found');
      setLoading(false);
    }
    // If devlogs are still loading, keep loading state
  }, [devlogs, id]);

  const handleUpdate = async (data: any) => {
    try {
      await updateDevlog(data);
      // Refresh the devlog data
      const updated = devlogs.find((d: DevlogEntry) => d.id === parseInt(id));
      setDevlog(updated || null);
    } catch (error) {
      console.error('Failed to update devlog:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDevlog(parseInt(id));
      router.push('/devlogs');
    } catch (error) {
      console.error('Failed to delete devlog:', error);
    }
  };

  const handleBack = () => {
    router.push('/devlogs');
  };

  if (loading) {
    return <LoadingPage message="Loading devlog..." />;
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!devlog) {
    return (
      <Alert
        message="Not Found"
        description="Devlog not found"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <DevlogDetails
      devlog={devlog}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onBack={handleBack}
    />
  );
}
