import React from 'react';
import { Typography, Card, Table, Tag, Button, Space, Popconfirm, Spin, Empty } from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  SyncOutlined,
  StopOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface DevlogEntry {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface DevlogListProps {
  devlogs: DevlogEntry[];
  loading: boolean;
  onViewDevlog: (devlog: DevlogEntry) => void;
  onDeleteDevlog: (id: string) => void;
}

export function DevlogList({ devlogs, loading, onViewDevlog, onDeleteDevlog }: DevlogListProps) {
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

  const columns: ColumnsType<DevlogEntry> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: DevlogEntry) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Text strong style={{ cursor: 'pointer' }} onClick={() => onViewDevlog(record)}>
              {title}
            </Text>
            <Tag color="blue">{record.type}</Tag>
          </div>
          <Text type="secondary" ellipsis style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      ),
      width: '40%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag 
          color={getStatusColor(status)} 
          icon={getStatusIcon(status)}
        >
          {status}
        </Tag>
      ),
      width: '15%',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag 
          color={getPriorityColor(priority)}
          icon={getPriorityIcon(priority)}
        >
          {priority}
        </Tag>
      ),
      width: '15%',
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (updatedAt: string) => (
        <Text type="secondary">
          {new Date(updatedAt).toLocaleDateString()}
        </Text>
      ),
      width: '15%',
    },
    {
      title: 'Actions',
      key: 'actions',
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
            onConfirm={() => onDeleteDevlog(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: '15%',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading devlogs..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>All Devlogs</Title>
        <Text type="secondary">{devlogs.length} total entries</Text>
      </div>

      <Card>
        {devlogs.length === 0 ? (
          <Empty 
            description="No devlogs found"
            style={{ padding: '40px' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={devlogs}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} devlogs`,
            }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
