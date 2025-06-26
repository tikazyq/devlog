'use client';

import React from 'react';
import { Spin } from 'antd';

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="loading-container">
      <Spin size="large" tip={message} />
    </div>
  );
}
