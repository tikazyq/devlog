'use client';

import React from 'react';
import { Avatar, Card, Col, Empty, List, Row, Skeleton, Statistic, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  MinusCircleOutlined,
  StopOutlined,
  SyncOutlined,
  WarningOutlined,
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
      case 'done':
        return 'success';
      case 'in-progress':
        return 'processing';
      case 'blocked':
        return 'error';
      case 'todo':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircleOutlined />;
      case 'in-progress':
        return <SyncOutlined spin />;
      case 'blocked':
        return <StopOutlined />;
      case 'todo':
        return <ClockCircleOutlined />;
      default:
        return <MinusCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'gold';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <ExclamationCircleOutlined />;
      case 'high':
        return <WarningOutlined />;
      case 'medium':
        return <MinusCircleOutlined />;
      case 'low':
        return <CheckCircleOutlined />;
      default:
        return <MinusCircleOutlined />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title level={2} className="dashboard-title">Dashboard</Title>
        <Paragraph type="secondary" className="dashboard-subtitle">
          Overview of your development progress
        </Paragraph>
      </div>

      {/* Stats Cards */}
      {!stats ? (
        <Row gutter={[24, 24]} className="dashboard-stats-row">
          {[1, 2, 3, 4].map((i) => (
            <Col key={i} xs={24} sm={12} lg={6}>
              <Card className="stats-card">
                <Skeleton.Input active size="small" style={{ width: '60%', marginBottom: '8px' }} />
                <Skeleton.Input active size="large" style={{ width: '40%' }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[24, 24]} className="dashboard-stats-row">
          <Col xs={24} sm={12} lg={6}>
            <Card className="stats-card">
              <Statistic
                title="Total Devlogs"
                value={stats.totalEntries}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stats-card">
              <Statistic
                title="In Progress"
                value={stats.byStatus['in-progress'] || 0}
                prefix={<SyncOutlined spin style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stats-card">
              <Statistic
                title="Completed"
                value={stats.byStatus['done'] || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stats-card">
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
        title={<Title level={3} className="recent-devlogs-title">Recent Devlogs</Title>} 
        bodyStyle={{ padding: 0 }}
        className="recent-devlogs-card"
      >
        {recentDevlogs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No devlogs found"
            className="empty-devlogs"
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={recentDevlogs}
            renderItem={(devlog) => (
              <List.Item
                className="devlog-list-item"
                onClick={() => onViewDevlog(devlog)}
                actions={[
                  <Text type="secondary" key="date" className="devlog-date">
                    {new Date(devlog.updatedAt).toLocaleDateString()}
                  </Text>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={40}
                      icon={getStatusIcon(devlog.status)}
                      style={{
                        backgroundColor:
                          getStatusColor(devlog.status) === 'success'
                            ? '#52c41a'
                            : getStatusColor(devlog.status) === 'processing'
                              ? '#1890ff'
                              : getStatusColor(devlog.status) === 'error'
                                ? '#ff4d4f'
                                : '#d9d9d9',
                      }}
                    />
                  }
                  title={
                    <div className="devlog-title-section">
                      <Text strong className="devlog-title-text">
                        {devlog.title}
                      </Text>
                      <div className="recent-devlogs-meta">
                        <Tag
                          color={getStatusColor(devlog.status)}
                          icon={getStatusIcon(devlog.status)}
                          className="devlog-tag"
                        >
                          {devlog.status}
                        </Tag>
                        <Tag
                          color={getPriorityColor(devlog.priority)}
                          icon={getPriorityIcon(devlog.priority)}
                          className="devlog-tag"
                        >
                          {devlog.priority}
                        </Tag>
                      </div>
                    </div>
                  }
                  description={
                    <Text type="secondary" ellipsis className="devlog-description">
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
