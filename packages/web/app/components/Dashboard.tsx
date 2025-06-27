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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DevlogEntry, DevlogStats, TimeSeriesStats } from '@devlog/types';
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
  const [timeSeriesData, setTimeSeriesData] = React.useState<TimeSeriesStats | null>(null);
  const [isLoadingTimeSeries, setIsLoadingTimeSeries] = React.useState(true);

  // Fetch time series data from the API
  React.useEffect(() => {
    async function fetchTimeSeriesData() {
      try {
        setIsLoadingTimeSeries(true);
        const response = await fetch('/api/devlogs/stats/timeseries?days=30');
        if (response.ok) {
          const data: TimeSeriesStats = await response.json();
          setTimeSeriesData(data);
        } else {
          console.error('Failed to fetch time series data');
        }
      } catch (error) {
        console.error('Error fetching time series data:', error);
      } finally {
        setIsLoadingTimeSeries(false);
      }
    }

    fetchTimeSeriesData();
  }, []);

  // Format data for charts
  const chartData = React.useMemo(() => {
    if (!timeSeriesData) return [];
    
    return timeSeriesData.dataPoints.map(point => ({
      ...point,
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: point.date,
    }));
  }, [timeSeriesData]);

  // Format pie chart data for current status distribution
  const pieChartData = React.useMemo(() => {
    if (!stats) return [];
    
    const statusData = [
      { name: 'Todo', value: stats.byStatus['todo'] || 0, color: '#8c8c8c' },
      { name: 'In Progress', value: stats.byStatus['in-progress'] || 0, color: '#faad14' },
      { name: 'Review', value: stats.byStatus['review'] || 0, color: '#fa8c16' },
      { name: 'Testing', value: stats.byStatus['testing'] || 0, color: '#13c2c2' },
      { name: 'Done', value: stats.byStatus['done'] || 0, color: '#52c41a' },
      { name: 'Archived', value: stats.byStatus['archived'] || 0, color: '#595959' },
    ].filter(item => item.value > 0);

    return statusData;
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
                <span className="stat-value todo">{stats.byStatus['todo'] || 0}</span>
                <span className="stat-label">Todo</span>
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
        {isLoadingTimeSeries ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              <Card title="Development Activity (Last 30 Days)" className="chart-card">
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="Current Status Distribution" className="chart-card">
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>
          </Row>
        ) : chartData.length === 0 ? (
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card className="chart-card">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No historical data available yet"
                />
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              <Card title="Development Activity (Last 30 Days)" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
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
              <Card title="Current Status Distribution" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value, percent }) => 
                        value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''
                      }
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [value, name]}
                      labelFormatter={() => ''}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value: string) => (
                        <span className="chart-legend-text">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
