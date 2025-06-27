'use client';

import React from 'react';
import {
  Avatar,
  Card,
  Col,
  Empty,
  FloatButton,
  List,
  Row,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { DevlogEntry, DevlogStats } from '@devlog/types';
import { useRouter } from 'next/navigation';
import { getStatusColor, getStatusIcon, getPriorityColor, getPriorityIcon } from '../lib/devlog-ui-utils';

const { Title, Paragraph, Text } = Typography;

interface DashboardProps {
  stats: DevlogStats | null;
  recentDevlogs: DevlogEntry[];
  onViewDevlog: (devlog: DevlogEntry) => void;
}

export function Dashboard({ stats, recentDevlogs, onViewDevlog }: DashboardProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Fixed Header */}
      <div className="dashboard-header-section">
        <div className="dashboard-title-row">
          <Title level={2} className="dashboard-title">
            Dashboard
          </Title>
          {stats && (
            <div className="dashboard-stats-compact">
              <div className="stat-compact">
                <span className="stat-value">{stats.totalEntries}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-compact">
                <span className="stat-value in-progress">{stats.byStatus['in-progress'] || 0}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-compact">
                <span className="stat-value review">{stats.byStatus['review'] || 0}</span>
                <span className="stat-label">Review</span>
              </div>
              <div className="stat-compact">
                <span className="stat-value testing">{stats.byStatus['testing'] || 0}</span>
                <span className="stat-label">Testing</span>
              </div>
              <div className="stat-compact">
                <span className="stat-value completed">{stats.byStatus['done'] || 0}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-compact">
                <span className="stat-value todo">{stats.byStatus['todo'] || 0}</span>
                <span className="stat-label">Todo</span>
              </div>
              <div className="stat-compact">
                <span className="stat-value archived">{stats.byStatus['archived'] || 0}</span>
                <span className="stat-label">Archived</span>
              </div>
            </div>
          )}
        </div>
        <Paragraph type="secondary" className="dashboard-subtitle">
          Overview of your development progress
        </Paragraph>
      </div>

      {/* Fixed Stats Cards */}
      <div className="dashboard-stats-section">
        {!stats ? (
          <Row gutter={[24, 24]} className="dashboard-stats-row">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Col key={i} xs={24} sm={12} md={8} lg={8} xl={4}>
                <Card className="stats-card">
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: '60%', marginBottom: '8px' }}
                  />
                  <Skeleton.Input active size="large" style={{ width: '40%' }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Row gutter={[24, 24]} className="dashboard-stats-row">
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="stats-card">
                <Statistic
                  title="Total Devlogs"
                  value={stats.totalEntries}
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="stats-card">
                <Statistic
                  title="In Progress"
                  value={stats.byStatus['in-progress'] || 0}
                  prefix={<SyncOutlined spin style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="stats-card">
                <Statistic
                  title="Review"
                  value={stats.byStatus['review'] || 0}
                  prefix={<EyeOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="stats-card">
                <Statistic
                  title="Testing"
                  value={stats.byStatus['testing'] || 0}
                  prefix={<FileProtectOutlined style={{ color: '#13c2c2' }} />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="stats-card">
                <Statistic
                  title="Completed"
                  value={stats.byStatus['done'] || 0}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="stats-card">
                <Statistic
                  title="Todo"
                  value={stats.byStatus['todo'] || 0}
                  prefix={<ClockCircleOutlined style={{ color: '#8c8c8c' }} />}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} xl={4}>
              <Card className="stats-card">
                <Statistic
                  title="Archived"
                  value={stats.byStatus['archived'] || 0}
                  prefix={<MinusCircleOutlined style={{ color: '#595959' }} />}
                  valueStyle={{ color: '#595959' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Scrollable Content */}
      <Card
        title={
          <Title level={3} className="recent-devlogs-title">
            Recent Devlogs
          </Title>
        }
        styles={{ body: { padding: 0, overflowX: 'hidden', overflowY: 'auto' } }}
        className="recent-devlogs-card flex-1 overflow-hidden flex flex-col"
      >
        {recentDevlogs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No devlogs found"
            className="empty-devlogs"
          />
        ) : (
          <div className="scrollable-content">
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
          </div>
        )}
      </Card>

      <FloatButton
        icon={<PlusOutlined />}
        tooltip="Create new devlog"
        onClick={() => router.push('/devlogs/create')}
        style={{ right: 24, bottom: 24 }}
      />
    </div>
  );
}
