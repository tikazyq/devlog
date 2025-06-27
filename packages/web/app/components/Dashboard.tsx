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
  Tag,
  Typography,
} from 'antd';
import {
  PlusOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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

  // Mock time series data - this would come from the backend in a real implementation
  const mockTimeSeriesData = React.useMemo(() => {
    const now = new Date();
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic mock data
      const baseCreated = Math.floor(Math.random() * 3) + 1;
      const baseCompleted = Math.floor(Math.random() * 2) + 1;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString().split('T')[0],
        created: baseCreated,
        completed: baseCompleted,
        inProgress: Math.floor(Math.random() * 4) + 2,
        review: Math.floor(Math.random() * 2),
        testing: Math.floor(Math.random() * 2),
        todo: Math.floor(Math.random() * 3) + 1,
      });
    }
    
    return data;
  }, []);

  const mockStatusDistributionData = React.useMemo(() => {
    if (!stats) return [];
    
    return [
      { name: 'Todo', value: stats.byStatus['todo'] || 0, color: '#8c8c8c' },
      { name: 'In Progress', value: stats.byStatus['in-progress'] || 0, color: '#faad14' },
      { name: 'Review', value: stats.byStatus['review'] || 0, color: '#fa8c16' },
      { name: 'Testing', value: stats.byStatus['testing'] || 0, color: '#13c2c2' },
      { name: 'Done', value: stats.byStatus['done'] || 0, color: '#52c41a' },
      { name: 'Archived', value: stats.byStatus['archived'] || 0, color: '#595959' },
    ].filter(item => item.value > 0);
  }, [stats]);

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

      {/* Charts Section */}
      <div className="dashboard-charts-section">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card title="Development Activity (Last 30 Days)" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} />
                  <Tooltip 
                    labelFormatter={(label, payload) => {
                      const data = payload[0]?.payload;
                      return data ? data.fullDate : label;
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="created" 
                    stackId="1" 
                    stroke="#1890ff" 
                    fill="#1890ff" 
                    fillOpacity={0.7}
                    name="Created"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1" 
                    stroke="#52c41a" 
                    fill="#52c41a" 
                    fillOpacity={0.7}
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="Status Distribution Trends" className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} />
                  <Tooltip 
                    labelFormatter={(label, payload) => {
                      const data = payload[0]?.payload;
                      return data ? data.fullDate : label;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="inProgress" 
                    stroke="#faad14" 
                    strokeWidth={2}
                    name="In Progress"
                    dot={{ r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="review" 
                    stroke="#fa8c16" 
                    strokeWidth={2}
                    name="Review"
                    dot={{ r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="testing" 
                    stroke="#13c2c2" 
                    strokeWidth={2}
                    name="Testing"
                    dot={{ r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="todo" 
                    stroke="#8c8c8c" 
                    strokeWidth={2}
                    name="Todo"
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
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
