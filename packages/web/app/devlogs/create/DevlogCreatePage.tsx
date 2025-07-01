'use client';

import React from 'react';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { DevlogForm } from '../../components/DevlogForm';
import { PageLayout } from '../../components/PageLayout';
import { useDevlogs } from '../../hooks/useDevlogs';
import { useRouter } from 'next/navigation';

export function DevlogCreatePage() {
  const { createDevlog } = useDevlogs();
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      await createDevlog(data);
      router.push('/devlogs');
    } catch (error) {
      console.error('Failed to create devlog:', error);
    }
  };

  const handleCancel = () => {
    router.push('/devlogs');
  };

  const actions = (
    <Space>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleCancel}
      >
        Back to List
      </Button>
    </Space>
  );

  return (
    <PageLayout actions={actions}>
      <DevlogForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
      />
    </PageLayout>
  );
}
