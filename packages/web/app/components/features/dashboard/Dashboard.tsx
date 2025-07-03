'use client';

import React from 'react';
import { Avatar, Col, Empty, FloatButton, List, Row, Skeleton, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DevlogEntry, DevlogStats, TimeSeriesStats } from '@devlog/types';
import { useRouter } from 'next/navigation';
import {
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  getStatusIcon,
} from '@/lib/devlog-ui-utils';
import { formatTimeAgoWithTooltip } from '@/lib/time-utils';
import styles from './Dashboard.module.css';
import { Gutter } from 'antd/es/grid/row';

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

    return timeSeriesData.dataPoints.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: point.date,
    }));
  }, [timeSeriesData]);

  // Format pie chart data for current status distribution
  const pieChartData = React.useMemo(() => {
    if (!stats) return [];

    return [
      { name: 'Todo', value: stats.byStatus['todo'] || 0, color: '#8c8c8c' },
      { name: 'In Progress', value: stats.byStatus['in-progress'] || 0, color: '#faad14' },
      { name: 'Review', value: stats.byStatus['review'] || 0, color: '#fa8c16' },
      { name: 'Testing', value: stats.byStatus['testing'] || 0, color: '#13c2c2' },
      { name: 'Done', value: stats.byStatus['done'] || 0, color: '#52c41a' },
      { name: 'Archived', value: stats.byStatus['archived'] || 0, color: '#595959' },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Define gutter for chart rows
  const chartRowGutter = [48, 24] as [Gutter, Gutter];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Fixed Header */}
      <div className={styles.dashboardHeaderSection}>
        <div className={styles.dashboardTitleRow}>
          <div>
            <Title level={2} className={styles.dashboardTitle}>
              Dashboard
            </Title>
            <Paragraph type="secondary" className={styles.dashboardSubtitle}>
              Overview of your development progress
            </Paragraph>
          </div>
          {stats && (
            <div className={styles.dashboardStats}>
              <div className={styles.statCompact}>
                <span className={styles.statValue}>{stats.totalEntries}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.todo}`}>
                  {stats.byStatus['todo'] || 0}
                </span>
                <span className={styles.statLabel}>Todo</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.inProgress}`}>
                  {stats.byStatus['in-progress'] || 0}
                </span>
                <span className={styles.statLabel}>In Progress</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.review}`}>
                  {stats.byStatus['review'] || 0}
                </span>
                <span className={styles.statLabel}>Review</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.testing}`}>
                  {stats.byStatus['testing'] || 0}
                </span>
                <span className={styles.statLabel}>Testing</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.completed}`}>
                  {stats.byStatus['done'] || 0}
                </span>
                <span className={styles.statLabel}>Completed</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.archived}`}>
                  {stats.byStatus['archived'] || 0}
                </span>
                <span className={styles.statLabel}>Archived</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="scrollable-content">
        {/* Charts Section */}
        <div className={styles.dashboardChartsSection}>
          {isLoadingTimeSeries ? (
            <Row gutter={chartRowGutter} className={styles.chartRow}>
              <Col xs={24} lg={12}>
                <div className={styles.chartCard}>
                  <Title level={4} className="mb-4">
                    Development Activity (Last 30 Days)
                  </Title>
                  <Skeleton active paragraph={{ rows: 8 }} />
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div className={styles.chartCard}>
                  <Title level={4} className="mb-4">
                    Current Status Distribution
                  </Title>
                  <Skeleton active paragraph={{ rows: 8 }} />
                </div>
              </Col>
            </Row>
          ) : chartData.length === 0 ? (
            <Row gutter={chartRowGutter}>
              <Col xs={24}>
                <div className={styles.chartCard}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No historical data available yet"
                  />
                </div>
              </Col>
            </Row>
          ) : (
            <Row gutter={chartRowGutter}>
              <Col xs={24} lg={12}>
                <div className={styles.chartCard}>
                  <Title level={4} className="mb-4">
                    Development Activity (Last 30 Days)
                  </Title>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} tickLine={false} />
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
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div className={styles.chartCard}>
                  <Title level={4} className="mb-4">
                    Current Status Distribution
                  </Title>
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
                          <span className={styles.chartLegendText}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            </Row>
          )}
        </div>

        {/* Scrollable Content */}
        <div className={`${styles.recentDevlogs} flex-1 overflow-hidden flex flex-col`}>
          <Title level={3} className={styles.recentDevlogsTitle}>
            Recent Devlogs
          </Title>
          <div className="flex-1 overflow-x-hidden overflow-y-auto">
            {recentDevlogs.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No devlogs found"
                className={styles.emptyDevlogs}
              />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={recentDevlogs}
                renderItem={(devlog) => (
                  <List.Item
                    className={styles.devlogListItem}
                    onClick={() => onViewDevlog(devlog)}
                    actions={[
                      <Text 
                        type="secondary" 
                        key="date" 
                        className={styles.devlogDate}
                        title={formatTimeAgoWithTooltip(devlog.updatedAt).fullDate}
                      >
                        {formatTimeAgoWithTooltip(devlog.updatedAt).timeAgo}
                      </Text>,
                    ]}
                  >
                    <List.Item.Meta
                      className={styles.devlogListItemMeta}
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
                        <div className={styles.devlogTitleSection}>
                          <Text strong className={styles.devlogTitleText}>
                            {devlog.title}
                          </Text>
                          <div className={styles.recentDevlogsMeta}>
                            <Tag
                              color={getStatusColor(devlog.status)}
                              icon={getStatusIcon(devlog.status)}
                              className={styles.devlogTag}
                            >
                              {devlog.status}
                            </Tag>
                            <Tag
                              color={getPriorityColor(devlog.priority)}
                              icon={getPriorityIcon(devlog.priority)}
                              className={styles.devlogTag}
                            >
                              {devlog.priority}
                            </Tag>
                          </div>
                        </div>
                      }
                      description={
                        <Text type="secondary" ellipsis className={styles.devlogDescription}>
                          {devlog.description}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
      </div>

      <FloatButton
        icon={<PlusOutlined />}
        tooltip="Create new devlog"
        onClick={() => router.push('/devlogs/create')}
        style={{ right: 24, bottom: 24 }}
      />
    </div>
  );
}
