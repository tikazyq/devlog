'use client';

import React from 'react';
import { Button, Col, Form, Input, Row, Select, Space, Typography } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { statusOptions, priorityOptions, typeOptions } from '@/lib/devlog-options';
import styles from './DevlogForm.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface DevlogFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialValues?: any;
  isEditMode?: boolean;
}

export function DevlogForm({ onSubmit, onCancel, initialValues, isEditMode = false }: DevlogFormProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <div className={styles.devlogFormTitle}>
        <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
          {isEditMode ? 'Edit Devlog' : 'Create New Devlog'}
        </Title>
        <Text type="secondary">
          {isEditMode ? 'Update the development log entry' : 'Add a new development log entry'}
        </Text>
      </div>

      <Form
        className={styles.devlogForm}
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues || {
          type: 'feature',
          priority: 'medium',
        }}
      >
        <Row gutter={[16, 0]}>
          <Col span={24}>
            <Form.Item
              name="title"
              label="Title"
              rules={[
                { required: true, message: 'Please enter a title' },
                { min: 3, message: 'Title must be at least 3 characters' },
              ]}
            >
              <Input placeholder="Brief, descriptive title" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Please select a type' }]}
            >
              <Select size="large" placeholder="Select type">
                {typeOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select a priority' }]}
            >
              <Select size="large" placeholder="Select priority">
                {priorityOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {isEditMode && (
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select a status' }]}
              >
                <Select size="large" placeholder="Select status">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}

          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: 'Please enter a description' },
                { min: 10, message: 'Description must be at least 10 characters' },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Detailed description with context"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="businessContext"
              label="Business Context"
              extra="Why this work matters and what problem it solves"
            >
              <TextArea
                rows={3}
                placeholder="Business context and rationale"
                showCount
                maxLength={300}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="technicalContext"
              label="Technical Context"
              extra="Architecture decisions, constraints, assumptions"
            >
              <TextArea
                rows={3}
                placeholder="Technical context and implementation details"
                showCount
                maxLength={300}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
          <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button size="large" onClick={handleReset} style={{ minWidth: '100px' }}>
              Reset
            </Button>
            <Button
              size="large"
              onClick={onCancel}
              icon={<CloseOutlined />}
              style={{ minWidth: '100px' }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              icon={<SaveOutlined />}
              style={{ minWidth: '140px' }}
            >
              {isEditMode ? 'Update Devlog' : 'Create Devlog'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
