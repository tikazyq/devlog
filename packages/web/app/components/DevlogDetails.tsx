'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  BookOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  SaveOutlined,
  StopOutlined,
  SyncOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { DevlogEntry } from '@devlog/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface DevlogDetailsProps {
  devlog: DevlogEntry;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onBack: () => void;
}

export function DevlogDetails({ devlog, onUpdate, onDelete, onBack }: DevlogDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onUpdate({ id: devlog.id, ...values });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'in-progress':
        return 'processing';
      case 'blocked':
        return 'error';
      case 'review':
        return 'warning';
      case 'testing':
        return 'cyan';
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
      case 'review':
        return <ExclamationCircleOutlined />;
      case 'testing':
        return <ToolOutlined />;
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
        return <InfoCircleOutlined />;
      case 'low':
        return <CheckCircleOutlined />;
      default:
        return <MinusCircleOutlined />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return '✨';
      case 'bugfix':
        return <BugOutlined />;
      case 'task':
        return '📋';
      case 'refactor':
        return <ToolOutlined />;
      case 'docs':
        return <BookOutlined />;
      default:
        return '📝';
    }
  };

  return (
    <div>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} size="large">
          Back to List
        </Button>
        <Space>
          <Button
            type={isEditing ? 'default' : 'primary'}
            icon={isEditing ? <CloseOutlined /> : <EditOutlined />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Popconfirm
            title="Delete Devlog"
            description="Are you sure you want to delete this devlog? This action cannot be undone."
            onConfirm={onDelete}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Card>
        {isEditing ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              title: devlog.title,
              type: devlog.type,
              status: devlog.status,
              priority: devlog.priority,
              description: devlog.description,
              businessContext: devlog.context?.businessContext || '',
              technicalContext: devlog.context?.technicalContext || '',
            }}
          >
            <Row gutter={[16, 0]}>
              <Col span={24}>
                <Form.Item
                  name="title"
                  label="Title"
                  rules={[{ required: true, message: 'Please enter a title' }]}
                >
                  <Input size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="type"
                  label="Type"
                  rules={[{ required: true, message: 'Please select a type' }]}
                >
                  <Select size="large">
                    <Option value="feature">Feature</Option>
                    <Option value="bugfix">Bug Fix</Option>
                    <Option value="task">Task</Option>
                    <Option value="refactor">Refactor</Option>
                    <Option value="docs">Documentation</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: 'Please select a status' }]}
                >
                  <Select size="large">
                    <Option value="todo">To Do</Option>
                    <Option value="in-progress">In Progress</Option>
                    <Option value="blocked">Blocked</Option>
                    <Option value="review">Review</Option>
                    <Option value="testing">Testing</Option>
                    <Option value="done">Done</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  rules={[{ required: true, message: 'Please select a priority' }]}
                >
                  <Select size="large">
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                    <Option value="critical">Critical</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="description"
                  label="Description"
                  rules={[{ required: true, message: 'Please enter a description' }]}
                >
                  <TextArea rows={4} showCount maxLength={500} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="businessContext" label="Business Context">
                  <TextArea rows={3} showCount maxLength={300} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="technicalContext" label="Technical Context">
                  <TextArea rows={3} showCount maxLength={300} />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  Save Changes
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <Title level={2} style={{ margin: 0 }}>
                  {devlog.title}
                </Title>
                <Space>
                  <Tag
                    color={getStatusColor(devlog.status)}
                    icon={getStatusIcon(devlog.status)}
                    style={{ fontSize: '14px', padding: '4px 12px' }}
                  >
                    {devlog.status}
                  </Tag>
                  <Tag
                    color={getPriorityColor(devlog.priority)}
                    icon={getPriorityIcon(devlog.priority)}
                    style={{ fontSize: '14px', padding: '4px 12px' }}
                  >
                    {devlog.priority}
                  </Tag>
                  <Tag
                    color="blue"
                    icon={getTypeIcon(devlog.type)}
                    style={{ fontSize: '14px', padding: '4px 12px' }}
                  >
                    {devlog.type}
                  </Tag>
                </Space>
              </div>

              <Text type="secondary">
                Created: {new Date(devlog.createdAt).toLocaleString()} • Updated:{' '}
                {new Date(devlog.updatedAt).toLocaleString()}
              </Text>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>Description</Title>
              <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                {devlog.description}
              </Paragraph>
            </div>

            {devlog.context?.businessContext && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Business Context</Title>
                <Alert
                  message={devlog.context.businessContext}
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ fontSize: '16px' }}
                />
              </div>
            )}

            {devlog.context?.technicalContext && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Technical Context</Title>
                <Alert
                  message={devlog.context.technicalContext}
                  type="warning"
                  showIcon
                  icon={<ToolOutlined />}
                  style={{ fontSize: '16px' }}
                />
              </div>
            )}

            {devlog.notes && devlog.notes.length > 0 && (
              <div>
                <Title level={4}>Notes</Title>
                <Timeline>
                  {devlog.notes.map((note) => (
                    <Timeline.Item key={note.id}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text>{note.content}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {note.category} • {new Date(note.timestamp).toLocaleString()}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
