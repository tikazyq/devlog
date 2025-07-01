'use client';

import React from 'react';
import { Button, Card, Empty, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DevlogEntry, DevlogId, DevlogListProps } from '@devlog/types';
import {
  getStatusColor,
  getStatusIcon,
  getPriorityColor,
  getPriorityIcon,
} from '@/lib/devlog-ui-utils';
import styles from './DevlogList.module.css';

const { Title, Text } = Typography;

export function DevlogList({ devlogs, loading, onViewDevlog, onDeleteDevlog }: DevlogListProps) {
  const columns: ColumnsType<DevlogEntry> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 280,
      render: (title: string, record: DevlogEntry) => (
        <div>
          <div className={styles.devlogTitleContainer}>
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
          {record.key && (
            <Text type="secondary" className={styles.devlogKey} ellipsis={{ tooltip: record.key }}>
              {record.key}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
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
      render: (priority: string) => (
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
      render: (createdAt: string) => (
        <Text type="secondary" className={styles.devlogDateSmall}>
          {new Date(createdAt).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 100,
      render: (updatedAt: string) => (
        <Text type="secondary" className={styles.devlogDateSmall}>
          {new Date(updatedAt).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
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

  // Calculate stats for the sticky header
  const totalCount = devlogs.length;
  const statusCounts = devlogs.reduce(
    (acc, devlog) => {
      acc[devlog.status] = (acc[devlog.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className={styles.devlogListContainer}>
      {/* Sticky Header with Summary */}
      <div className="page-header-sticky">
        <div className={styles.devlogListHeaderCompact}>
          <div className={styles.devlogTitleRow}>
            <div>
              <Title level={2} className={styles.devlogListTitleCompact}>
                All Devlogs
              </Title>
              <Text type="secondary" className={styles.devlogListSubtitleCompact}>
                Manage and track your development logs
              </Text>
            </div>
            <div className={styles.devlogStatsCompact}>
              <div className={styles.statCompact}>
                <span className={styles.statValue}>{totalCount}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.inProgress}`}>{statusCounts['in-progress'] || 0}</span>
                <span className={styles.statLabel}>In Progress</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.completed}`}>{statusCounts['done'] || 0}</span>
                <span className={styles.statLabel}>Done</span>
              </div>
              <div className={styles.statCompact}>
                <span className={`${styles.statValue} ${styles.todo}`}>{statusCounts['todo'] || 0}</span>
                <span className={styles.statLabel}>Todo</span>
              </div>
              {statusCounts['blocked'] && (
                <div className={styles.statCompact}>
                  <span className={`${styles.statValue} ${styles.blocked}`}>{statusCounts['blocked']}</span>
                  <span className={styles.statLabel}>Blocked</span>
                </div>
              )}
            </div>
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
          />
        )}
      </div>
    </div>
  );
}
