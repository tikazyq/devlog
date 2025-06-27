'use client';

import React from 'react';
import { Button, Card, Empty, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  StopOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DevlogEntry, DevlogId, DevlogListProps } from '@devlog/types';
import './styles.css';

const { Title, Text } = Typography;

export function DevlogList({ devlogs, loading, onViewDevlog, onDeleteDevlog }: DevlogListProps) {
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

  const columns: ColumnsType<DevlogEntry> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 280,
      render: (title: string, record: DevlogEntry) => (
        <div>
          <div className="devlog-title-container">
            <Text 
              strong 
              className="devlog-title" 
              onClick={() => onViewDevlog(record)}
              ellipsis={{ tooltip: title }}
            >
              {title}
            </Text>
            <Tag color="blue">{record.type}</Tag>
          </div>
          <Text type="secondary" ellipsis={{ tooltip: record.description }} className="devlog-description">
            {record.description}
          </Text>
          {record.key && (
            <Text type="secondary" className="devlog-key" ellipsis={{ tooltip: record.key }}>
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
      render: (assignee: string) => (
        assignee ? (
          <Text className="devlog-assignee" ellipsis={{ tooltip: assignee }}>{assignee}</Text>
        ) : (
          <Text type="secondary" className="devlog-assignee">—</Text>
        )
      ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 140,
      render: (tags: string[]) => (
        <div>
          {tags?.slice(0, 2).map(tag => (
            <Tag key={tag} color="purple" className="devlog-tag-small">
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && (
            <Tag color="default" className="devlog-tag-small">
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
        <div className="devlog-hours">
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
        <Text type="secondary" className="devlog-date-small">
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
        <Text type="secondary" className="devlog-date-small">
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
      <div className="loading-container">
        <Spin size="large" tip="Loading devlogs..." />
      </div>
    );
  }

  return (
    <div>
      <div className="devlog-list-header">
        <Title level={2}>All Devlogs</Title>
        <Text type="secondary">{devlogs.length} total entries</Text>
      </div>

      <Card>
        {devlogs.length === 0 ? (
          <Empty description="No devlogs found" style={{ padding: '40px' }} />
        ) : (
          <div className="devlog-table-container">
            <Table
              columns={columns}
              dataSource={devlogs}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} devlogs`,
              }}
              size="middle"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
