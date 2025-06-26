'use client';

import React from 'react';
import { DevlogForm } from '../../components/DevlogForm';
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

  return (
    <DevlogForm 
      onSubmit={handleSubmit} 
      onCancel={handleCancel} 
    />
  );
}
