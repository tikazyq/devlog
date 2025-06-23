import React from 'react';
import { Layout, Menu, Typography, Card, Statistic, Row, Col } from 'antd';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  PlusOutlined,
  CodeOutlined 
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any, devlog?: any) => void;
  stats: any;
}

export function Sidebar({ currentView, onViewChange, stats }: SidebarProps) {
  const menuItems = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      icon: <DashboardOutlined /> 
    },
    { 
      key: 'list', 
      label: 'All Devlogs', 
      icon: <FileTextOutlined /> 
    },
    { 
      key: 'create', 
      label: 'New Devlog', 
      icon: <PlusOutlined /> 
    },
  ];

  return (
    <Sider 
      width={280} 
      style={{ 
        background: '#fff',
        borderRight: '1px solid #f0f0f0'
      }}
    >
      <div style={{ padding: '24px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <CodeOutlined style={{ fontSize: '24px', color: '#3b82f6' }} />
          <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
            Devlog
          </Title>
        </div>
        <Text type="secondary">Development Tracker</Text>
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[currentView]}
        style={{ borderRight: 0 }}
        items={menuItems}
        onClick={({ key }) => onViewChange(key)}
      />

      {stats && (
        <div style={{ padding: '24px 16px' }}>
          <Title level={5} style={{ marginBottom: '16px', color: '#6b7280' }}>
            QUICK STATS
          </Title>
          <Card size="small" style={{ background: '#fafafa' }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic 
                  title="Total" 
                  value={stats.total || 0} 
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="In Progress" 
                  value={stats.inProgress || 0}
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Completed" 
                  value={stats.completed || 0}
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
