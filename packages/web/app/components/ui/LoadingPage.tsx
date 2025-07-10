'use client';

import React from 'react';
import { Spin } from 'antd';
import styles from './LoadingPage.module.css';

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className={styles.loadingContainer}>
      <Spin size="large" tip={message} />
    </div>
  );
}
