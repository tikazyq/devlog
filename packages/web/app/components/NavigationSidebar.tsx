'use client';

import React from 'react';
import { Card, Col, Layout, Menu, Row, Statistic, Typography } from 'antd';
import { CodeOutlined, DashboardOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { DevlogStats } from '@devlog/types';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface NavigationSidebarProps {
  stats?: DevlogStats | null;
  collapsed?: boolean;
}

export function NavigationSidebar({ stats, collapsed = false }: NavigationSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine selected key based on current pathname
  const getSelectedKey = () => {
    if (pathname === '/') return 'dashboard';
    if (pathname === '/devlogs') return 'list';
    if (pathname === '/devlogs/create') return 'create';
    if (pathname.startsWith('/devlogs/')) return 'list'; // For individual devlog pages
    return 'dashboard';
  };

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardOutlined />,
    },
    {
      key: 'list',
      label: 'All Devlogs',
      icon: <FileTextOutlined />,
    },
    {
      key: 'create',
      label: 'New Devlog',
      icon: <PlusOutlined />,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard':
        router.push('/');
        break;
      case 'list':
        router.push('/devlogs');
        break;
      case 'create':
        router.push('/devlogs/create');
        break;
    }
  };

  return (
    <Sider
      width={280}
      collapsed={collapsed}
      collapsedWidth={0}
      breakpoint="md"
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <CodeOutlined className="sidebar-brand-icon" />
          <Title level={3} className="sidebar-brand-title">
            Devlog
          </Title>
        </div>
        <Text type="secondary">Development Tracker</Text>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        style={{ borderRight: 0 }}
        items={menuItems}
        onClick={handleMenuClick}
      />

      {stats && (
        <div className="sidebar-stats">
          <Title level={5} className="sidebar-stats-title">
            QUICK STATS
          </Title>
          <Card size="small" className="sidebar-stats-card">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic
                  title="Total"
                  value={stats.totalEntries || 0}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="In Progress"
                  value={stats.byStatus?.['in-progress'] || 0}
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Completed"
                  value={stats.byStatus?.done || 0}
                  valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </div>
      )}
    </Sider>
  );
}
