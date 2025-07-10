'use client';

import React from 'react';
import { Layout, Skeleton } from 'antd';
import styles from './AppLayoutSkeleton.module.css';

const { Sider, Content } = Layout;

export function AppLayoutSkeleton() {
  return (
    <Layout className="app-layout">
      <Sider
        width={280}
        className={styles.sidebarSkeleton}
      >
        <div className={styles.sidebarSkeletonContent}>
          <Skeleton active paragraph={{ rows: 2 }} />
          <br />
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </Sider>
      <Layout>
        <div className={styles.headerSkeleton}>
          <Skeleton.Button active className={styles.headerSkeletonButton} />
        </div>
        <Content className="app-content">
          <div className="app-content-wrapper">
            <Skeleton active paragraph={{ rows: 10 }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
