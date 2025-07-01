'use client';

import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DevlogList, LoadingPage, PageLayout } from '@/components';
import { useDevlogs } from '@/hooks/useDevlogs';
import { DevlogEntry, DevlogId } from '@devlog/types';
import { useRouter } from 'next/navigation';

export function DevlogListPage() {
  const { devlogs, loading, deleteDevlog, refetch } = useDevlogs();
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

  const handleCreateDevlog = () => {
    router.push('/devlogs/create');
  };

  const handleRefresh = () => {
    refetch();
  };

  if (loading) {
    return <LoadingPage message="Loading devlogs..." />;
  }

  const actions = (
    <Space>
      <Button 
        icon={<ReloadOutlined />} 
        onClick={handleRefresh}
        disabled={loading}
      >
        Refresh
      </Button>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={handleCreateDevlog}
      >
        Create Devlog
      </Button>
    </Space>
  );

  return (
    <PageLayout actions={actions}>
      <DevlogList
        devlogs={devlogs}
        loading={loading}
        onViewDevlog={handleViewDevlog}
        onDeleteDevlog={handleDeleteDevlog}
      />
    </PageLayout>
  );
}
