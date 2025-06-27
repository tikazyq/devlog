'use client';

import React from 'react';
import { Layout, Skeleton } from 'antd';
import './styles.css';

const { Sider, Content } = Layout;

export function AppLayoutSkeleton() {
  return (
    <Layout className="app-layout">
      <Sider
        width={280}
        className="sidebar-skeleton"
      >
        <div className="sidebar-skeleton-content">
          <Skeleton active paragraph={{ rows: 2 }} />
          <br />
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </Sider>
      <Layout>
        <div className="header-skeleton">
          <Skeleton.Button active className="header-skeleton-button" />
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
