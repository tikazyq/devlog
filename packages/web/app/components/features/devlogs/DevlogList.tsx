'use client';

import React from 'react';
import { Button, Empty, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  DevlogEntry,
  DevlogId,
  DevlogPriority,
  DevlogStatus,
  DevlogStats,
  DevlogType,
} from '@devlog/types';
import {
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  getStatusIcon,
} from '@/lib/devlog-ui-utils';
import { formatTimeAgoWithTooltip } from '@/lib/time-utils';
import { OverviewStats } from '@/components';
import styles from './DevlogList.module.css';

const { Title, Text } = Typography;

interface DevlogListProps {
  devlogs: DevlogEntry[];
  loading: boolean;
  onViewDevlog: (devlog: DevlogEntry) => void;
  onDeleteDevlog: (id: DevlogId) => void;
}

export function DevlogList({ devlogs, loading, onViewDevlog, onDeleteDevlog }: DevlogListProps) {
  // Calculate stats from devlogs array
  const calculateStats = (): DevlogStats => {
    const byStatus = devlogs.reduce(
      (acc, devlog) => {
        acc[devlog.status] = (acc[devlog.status] || 0) + 1;
        return acc;
      },
      {} as Record<DevlogStatus, number>,
    );

    const byType = devlogs.reduce(
      (acc, devlog) => {
        acc[devlog.type] = (acc[devlog.type] || 0) + 1;
        return acc;
      },
      {} as Record<DevlogType, number>,
    );

    const byPriority = devlogs.reduce(
      (acc, devlog) => {
        acc[devlog.priority] = (acc[devlog.priority] || 0) + 1;
        return acc;
      },
      {} as Record<DevlogPriority, number>,
    );

    return {
      totalEntries: devlogs.length,
      byStatus,
      byType,
      byPriority,
    };
  };

  const stats = calculateStats();
  const columns: ColumnsType<DevlogEntry> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      fixed: 'left',
      width: 60,
      render: (id: number) => (
        <Text strong className={styles.devlogId}>
          {id}
        </Text>
      ),
      onHeaderCell: (column) => ({
        style: {
          paddingLeft: '24px',
        },
      }),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 400,
      render: (title: string, record: DevlogEntry) => (
        <>
          <div className={styles.devlogTitleCell}>
            <Text
              strong
              className={styles.devlogTitle}
              onClick={() => onViewDevlog(record)}
              ellipsis={{ tooltip: title }}
            >
              {title}
            </Text>
            <Tag color="blue">{record.type}</Tag>
          </div>
          <Text
            type="secondary"
            ellipsis={{ tooltip: record.description }}
            className={styles.devlogDescription}
          >
            {record.description}
          </Text>
        </>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: DevlogStatus) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: DevlogPriority) => (
        <Tag color={getPriorityColor(priority)} icon={getPriorityIcon(priority)}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 120,
      render: (assignee: string) =>
        assignee ? (
          <Text className={styles.devlogAssignee} ellipsis={{ tooltip: assignee }}>
            {assignee}
          </Text>
        ) : (
          <Text type="secondary" className={styles.devlogAssignee}>
            —
          </Text>
        ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 140,
      render: (tags: string[]) => (
        <div>
          {tags?.slice(0, 2).map((tag) => (
            <Tag key={tag} color="purple" className={styles.devlogTagSmall}>
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && (
            <Tag color="default" className={styles.devlogTagSmall}>
              +{tags.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Hours',
      key: 'hours',
      width: 100,
      render: (_, record: DevlogEntry) => (
        <div className={styles.devlogHours}>
          {record.estimatedHours || record.actualHours ? (
            <>
              <div>{record.estimatedHours ? `Est: ${record.estimatedHours}h` : '—'}</div>
              <div>{record.actualHours ? `Act: ${record.actualHours}h` : '—'}</div>
            </>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (createdAt: string) => {
        const { timeAgo, fullDate } = formatTimeAgoWithTooltip(createdAt);
        return (
          <Text type="secondary" className={styles.devlogDateSmall} title={fullDate}>
            {timeAgo}
          </Text>
        );
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 100,
      render: (updatedAt: string) => {
        const { timeAgo, fullDate } = formatTimeAgoWithTooltip(updatedAt);
        return (
          <Text type="secondary" className={styles.devlogDateSmall} title={fullDate}>
            {timeAgo}
          </Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record: DevlogEntry) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDevlog(record)}
          >
            View
          </Button>
          <Popconfirm
            title="Delete Devlog"
            description="Are you sure you want to delete this devlog?"
            onConfirm={() => onDeleteDevlog(record.id!)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Loading devlogs..." />
      </div>
    );
  }

  return (
    <div className={styles.devlogListContainer}>
      {/* Sticky Header with Summary */}
      <div className="page-header-sticky">
        <div className={styles.devlogListHeader}>
          <div className={styles.devlogTitleRow}>
            <div>
              <Title level={2} className={styles.devlogListTitle}>
                All Devlogs
              </Title>
              <Text type="secondary">List of all development items</Text>
            </div>
            <OverviewStats stats={stats} variant="detailed" />
          </div>
        </div>
      </div>

      <div className={styles.devlogListTable}>
        {devlogs.length === 0 ? (
          <Empty description="No devlogs found" style={{ padding: '40px' }} />
        ) : (
          <Table
            columns={columns}
            dataSource={devlogs}
            rowKey="id"
            scroll={{ x: 1200, y: 'calc(100vh - 300px)' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} devlogs`,
            }}
            size="middle"
            onHeaderRow={() => ({
              style: {
                backgroundColor: '#fff',
              },
            })}
          />
        )}
      </div>
    </div>
  );
}
