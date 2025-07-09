'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Breadcrumb, Button, Popconfirm, Space, Tag } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { DevlogDetails, LoadingPage, PageLayout } from '@/components';
import { useDevlogs } from '@/hooks/useDevlogs';
import { DevlogEntry } from '@devlog/types';
import { useRouter } from 'next/navigation';
import {
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  getStatusIcon,
  getTypeIcon,
} from '@/lib/devlog-ui-utils';

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
      <PageLayout>
        <Alert message="Error" description={error} type="error" showIcon />
      </PageLayout>
    );
  }

  if (!devlog) {
    return (
      <PageLayout>
        <Alert message="Not Found" description="Devlog not found" type="warning" showIcon />
      </PageLayout>
    );
  }

  const customBreadcrumb = (
    <div className="breadcrumb-with-tags">
      <Breadcrumb
        items={[
          { title: <Link href="/">Dashboard</Link> },
          { title: <Link href="/devlogs">Devlogs</Link> },
          { title: <span>#{id}</span> },
        ]}
      />
      <Space>
        <Tag color={getStatusColor(devlog.status)} icon={getStatusIcon(devlog.status)}>
          {devlog.status}
        </Tag>
        <Tag color={getPriorityColor(devlog.priority)} icon={getPriorityIcon(devlog.priority)}>
          {devlog.priority}
        </Tag>
        <Tag color="blue" icon={getTypeIcon(devlog.type)}>
          {devlog.type}
        </Tag>
      </Space>
    </div>
  );

  const actions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
        Back to List
      </Button>
      <Popconfirm
        title="Delete Devlog"
        description="Are you sure you want to delete this devlog?"
        onConfirm={handleDelete}
        okText="Yes"
        cancelText="No"
      >
        <Button danger icon={<DeleteOutlined />}>
          Delete
        </Button>
      </Popconfirm>
    </Space>
  );

  return (
    <PageLayout actions={actions}>
      <DevlogDetails devlog={devlog} onUpdate={handleUpdate} onDelete={handleDelete} />
    </PageLayout>
  );
}
