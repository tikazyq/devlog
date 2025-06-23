import React from 'react';
import { Typography, Card, Row, Col, List, Tag, Avatar, Statistic, Empty } from 'antd';
import { 
  FileTextOutlined, 
  SyncOutlined, 
  CheckCircleOutlined, 
  StopOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  MinusCircleOutlined 
} from '@ant-design/icons';
import { DevlogEntry, DevlogStats } from '@devlog/types';

const { Title, Paragraph, Text } = Typography;

interface DashboardProps {
  stats: DevlogStats | null;
  recentDevlogs: DevlogEntry[];
  onViewDevlog: (devlog: DevlogEntry) => void;
}

export function Dashboard({ stats, recentDevlogs, onViewDevlog }: DashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'in-progress': return 'processing';
      case 'blocked': return 'error';
      case 'todo': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircleOutlined />;
      case 'in-progress': return <SyncOutlined spin />;
      case 'blocked': return <StopOutlined />;
      case 'todo': return <ClockCircleOutlined />;
      default: return <MinusCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'gold';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <ExclamationCircleOutlined />;
      case 'high': return <WarningOutlined />;
      case 'medium': return <MinusCircleOutlined />;
      case 'low': return <CheckCircleOutlined />;
      default: return <MinusCircleOutlined />;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Dashboard</Title>
        <Paragraph type="secondary">
          Overview of your development progress
        </Paragraph>
      </div>

      {/* Stats Cards */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Devlogs"
                value={stats.totalEntries}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={stats.byStatus['in-progress'] || 0}
                prefix={<SyncOutlined spin style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.byStatus['done'] || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Todo"
                value={stats.byStatus['todo'] || 0}
                prefix={<ClockCircleOutlined style={{ color: '#8c8c8c' }} />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Recent Devlogs */}
      <Card 
        title="Recent Devlogs"
        bodyStyle={{ padding: 0 }}
      >
        {recentDevlogs.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No devlogs found"
            style={{ padding: '40px' }} 
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={recentDevlogs}
            renderItem={(devlog) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '16px 24px' }}
                onClick={() => onViewDevlog(devlog)}
                actions={[
                  <Text type="secondary" key="date">
                    {new Date(devlog.updatedAt).toLocaleDateString()}
                  </Text>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={getStatusIcon(devlog.status)} 
                      style={{ 
                        backgroundColor: getStatusColor(devlog.status) === 'success' ? '#52c41a' :
                                         getStatusColor(devlog.status) === 'processing' ? '#1890ff' :
                                         getStatusColor(devlog.status) === 'error' ? '#ff4d4f' : '#d9d9d9'
                      }}
                    />
                  }
                  title={
                    <div>
                      <Text strong>{devlog.title}</Text>
                      <div style={{ marginTop: '4px' }}>
                        <Tag 
                          color={getStatusColor(devlog.status)} 
                          icon={getStatusIcon(devlog.status)}
                        >
                          {devlog.status}
                        </Tag>
                        <Tag 
                          color={getPriorityColor(devlog.priority)}
                          icon={getPriorityIcon(devlog.priority)}
                        >
                          {devlog.priority}
                        </Tag>
                      </div>
                    </div>
                  }
                  description={
                    <Text type="secondary" ellipsis>
                      {devlog.description}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
