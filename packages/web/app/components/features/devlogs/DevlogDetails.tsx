'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  List,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  BulbOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  SaveOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { DevlogDetailsProps } from '@devlog/types';
import { MarkdownRenderer } from '@/components/ui';
import { formatTimeAgoWithTooltip } from '@/lib/time-utils';
import styles from './DevlogDetails.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export function DevlogDetails({
  devlog,
  onUpdate,
  isEditing: externalIsEditing,
  onEditToggle,
}: DevlogDetailsProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [form] = Form.useForm();

  // Use external editing state if provided, otherwise use internal state
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

  const handleSubmit = (values: any) => {
    onUpdate({ id: devlog.id, ...values });
    if (onEditToggle) {
      onEditToggle();
    } else {
      setInternalIsEditing(false);
    }
  };

  return (
    <div>
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
            estimatedHours: devlog.estimatedHours,
            actualHours: devlog.actualHours,
            assignee: devlog.assignee || '',
            tags: devlog.tags || [],
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

            <Col xs={24} md={8}>
              <Form.Item name="estimatedHours" label="Estimated Hours">
                <Input type="number" min={0} step={0.5} placeholder="0" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="actualHours" label="Actual Hours">
                <Input type="number" min={0} step={0.5} placeholder="0" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="assignee" label="Assignee">
                <Input placeholder="Enter assignee name" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="tags" label="Tags">
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="Add tags"
                  tokenSeparators={[',']}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => (onEditToggle ? onEditToggle() : setInternalIsEditing(false))}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ) : (
        <>
          <div className={styles.devlogDetailsHeader}>
            <div className={styles.devlogDetailsTitle}>
              <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
                {devlog.title}
              </Title>
              <Space split={<Text type="secondary">•</Text>} style={{ marginBottom: '8px' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  ID: #{devlog.id}
                </Text>
                <Text 
                  type="secondary" 
                  title={formatTimeAgoWithTooltip(devlog.createdAt).fullDate}
                >
                  Created: {formatTimeAgoWithTooltip(devlog.createdAt).timeAgo}
                </Text>
                <Text 
                  type="secondary"
                  title={formatTimeAgoWithTooltip(devlog.updatedAt).fullDate}
                >
                  Updated: {formatTimeAgoWithTooltip(devlog.updatedAt).timeAgo}
                </Text>
              </Space>
            </div>

            {(devlog.estimatedHours || devlog.actualHours) && (
              <Row gutter={[16, 8]} style={{ marginBottom: '16px' }}>
                {devlog.estimatedHours && (
                  <Col xs={12} md={6}>
                    <Text type="secondary">Estimated Hours:</Text>
                    <br />
                    <Text>{devlog.estimatedHours}h</Text>
                  </Col>
                )}
                {devlog.actualHours && (
                  <Col xs={12} md={6}>
                    <Text type="secondary">Actual Hours:</Text>
                    <br />
                    <Text>{devlog.actualHours}h</Text>
                  </Col>
                )}
              </Row>
            )}

            {devlog.tags && devlog.tags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary" style={{ marginRight: '8px' }}>
                  Tags:
                </Text>
                <Space wrap>
                  {devlog.tags.map((tag, index) => (
                    <Tag key={index} color="purple">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          <div className={styles.devlogDetailsContent}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4}>Description</Title>
              <MarkdownRenderer content={devlog.description} />
            </div>

            {devlog.context?.businessContext && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Business Context</Title>
                <Alert
                  message={<MarkdownRenderer content={devlog.context.businessContext} />}
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                />
              </div>
            )}

            {devlog.context?.technicalContext && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Technical Context</Title>
                <Alert
                  message={<MarkdownRenderer content={devlog.context.technicalContext} />}
                  type="warning"
                  showIcon
                  icon={<ToolOutlined />}
                />
              </div>
            )}

            {devlog.context?.acceptanceCriteria && devlog.context.acceptanceCriteria.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Acceptance Criteria</Title>
                <Card size="small">
                  <List
                    dataSource={devlog.context.acceptanceCriteria}
                    renderItem={(criteria, index) => (
                      <List.Item style={{ padding: '8px 0', border: 'none' }}>
                        <Space align="start">
                          <Checkbox disabled checked={false} />
                          <Text>{criteria}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            )}

            {devlog.context?.dependencies && devlog.context.dependencies.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Dependencies</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {devlog.context.dependencies.map((dep, index) => (
                    <Card key={index} size="small" style={{ width: '100%' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <Text strong>{dep.description}</Text>
                          {dep.externalId && (
                            <div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                External ID: {dep.externalId}
                              </Text>
                            </div>
                          )}
                        </div>
                        <Tag
                          color={
                            dep.type === 'blocks'
                              ? 'red'
                              : dep.type === 'blocked-by'
                                ? 'orange'
                                : 'blue'
                          }
                        >
                          {dep.type}
                        </Tag>
                      </div>
                    </Card>
                  ))}
                </Space>
              </div>
            )}

            {devlog.context?.decisions && devlog.context.decisions.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Decisions</Title>
                <Timeline>
                  {devlog.context.decisions.map((decision) => (
                    <Timeline.Item key={decision.id}>
                      <div style={{ marginBottom: '8px' }}>
                        <Text strong>{decision.decision}</Text>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <Text>{decision.rationale}</Text>
                      </div>
                      {decision.alternatives && decision.alternatives.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <Text type="secondary">Alternatives considered: </Text>
                          <Text type="secondary">{decision.alternatives.join(', ')}</Text>
                        </div>
                      )}
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        By {decision.decisionMaker} •{' '}
                        <span title={formatTimeAgoWithTooltip(decision.timestamp).fullDate}>
                          {formatTimeAgoWithTooltip(decision.timestamp).timeAgo}
                        </span>
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}

            {devlog.context?.risks && devlog.context.risks.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Risks</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {devlog.context.risks.map((risk, index) => (
                    <Card key={index} size="small" style={{ width: '100%' }}>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                          }}
                        >
                          <Text strong>{risk.description}</Text>
                          <Space>
                            <Tag
                              color={
                                risk.impact === 'high'
                                  ? 'red'
                                  : risk.impact === 'medium'
                                    ? 'orange'
                                    : 'green'
                              }
                            >
                              Impact: {risk.impact}
                            </Tag>
                            <Tag
                              color={
                                risk.probability === 'high'
                                  ? 'red'
                                  : risk.probability === 'medium'
                                    ? 'orange'
                                    : 'green'
                              }
                            >
                              Probability: {risk.probability}
                            </Tag>
                          </Space>
                        </div>
                        <div>
                          <Text type="secondary">Mitigation: </Text>
                          <Text>{risk.mitigation}</Text>
                        </div>
                      </div>
                    </Card>
                  ))}
                </Space>
              </div>
            )}

            {devlog.files && devlog.files.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Related Files</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {devlog.files.map((file, index) => (
                    <Card key={index} size="small" style={{ background: '#f8f9fa' }}>
                      <Text code>{file}</Text>
                    </Card>
                  ))}
                </Space>
              </div>
            )}

            {devlog.relatedDevlogs && devlog.relatedDevlogs.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>Related Devlogs</Title>
                <Space wrap>
                  {devlog.relatedDevlogs.map((relatedId, index) => (
                    <Tag key={index} color="cyan">
                      #{relatedId}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {devlog.aiContext && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>AI Context</Title>
                <Card>
                  {devlog.aiContext.currentSummary && (
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>Summary:</Text>
                      <MarkdownRenderer content={devlog.aiContext.currentSummary} />
                    </div>
                  )}

                  {devlog.aiContext.keyInsights && devlog.aiContext.keyInsights.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>Key Insights:</Text>
                      <List
                        size="small"
                        style={{ marginTop: '8px' }}
                        dataSource={devlog.aiContext.keyInsights}
                        renderItem={(insight, index) => (
                          <List.Item style={{ padding: '4px 0', border: 'none' }}>
                            <Space align="start">
                              <BulbOutlined style={{ color: '#faad14', marginTop: '2px' }} />
                              <Text>{insight}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}

                  {devlog.aiContext.openQuestions && devlog.aiContext.openQuestions.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>Open Questions:</Text>
                      <List
                        size="small"
                        style={{ marginTop: '8px' }}
                        dataSource={devlog.aiContext.openQuestions}
                        renderItem={(question, index) => (
                          <List.Item style={{ padding: '4px 0', border: 'none' }}>
                            <Space align="start">
                              <QuestionCircleOutlined
                                style={{ color: '#f5222d', marginTop: '2px' }}
                              />
                              <Text>{question}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}

                  {devlog.aiContext.suggestedNextSteps &&
                    devlog.aiContext.suggestedNextSteps.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong>Suggested Next Steps:</Text>
                        <List
                          size="small"
                          style={{ marginTop: '8px' }}
                          dataSource={devlog.aiContext.suggestedNextSteps}
                          renderItem={(step, index) => (
                            <List.Item style={{ padding: '4px 0', border: 'none' }}>
                              <Space align="start">
                                <RightOutlined style={{ color: '#52c41a', marginTop: '2px' }} />
                                <Text>{step}</Text>
                              </Space>
                            </List.Item>
                          )}
                        />
                      </div>
                    )}

                  {devlog.aiContext.relatedPatterns &&
                    devlog.aiContext.relatedPatterns.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <Text strong>Related Patterns:</Text>
                        <Space wrap style={{ marginTop: '8px' }}>
                          {devlog.aiContext.relatedPatterns.map((pattern, index) => (
                            <Tag key={index} color="geekblue">
                              {pattern}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Last AI Update:{' '}
                      <span title={formatTimeAgoWithTooltip(devlog.aiContext.lastAIUpdate).fullDate}>
                        {formatTimeAgoWithTooltip(devlog.aiContext.lastAIUpdate).timeAgo}
                      </span>{' '}
                      • Version: {devlog.aiContext.contextVersion}
                    </Text>
                  </div>
                </Card>
              </div>
            )}

            {devlog.externalReferences && devlog.externalReferences.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>External References</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {devlog.externalReferences.map((ref, index) => (
                    <Card key={index} size="small">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <Text strong>{ref.title || ref.id}</Text>
                          {ref.url && (
                            <div>
                              <a href={ref.url} target="_blank" rel="noopener noreferrer">
                                <Text style={{ color: '#1890ff' }}>{ref.url}</Text>
                              </a>
                            </div>
                          )}
                          {ref.status && (
                            <div>
                              <Text type="secondary">Status: {ref.status}</Text>
                            </div>
                          )}
                          {ref.lastSync && (
                            <div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Last Sync:{' '}
                                <span title={formatTimeAgoWithTooltip(ref.lastSync).fullDate}>
                                  {formatTimeAgoWithTooltip(ref.lastSync).timeAgo}
                                </span>
                              </Text>
                            </div>
                          )}
                        </div>
                        <Tag color="blue">{ref.system}</Tag>
                      </div>
                    </Card>
                  ))}
                </Space>
              </div>
            )}

            {devlog.notes && devlog.notes.length > 0 && (
              <div>
                <Title level={4}>Notes</Title>
                <Timeline>
                  {devlog.notes.map((note) => (
                    <Timeline.Item key={note.id}>
                      <div style={{ marginBottom: '8px' }}>
                        <MarkdownRenderer content={note.content} />
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {note.category} •{' '}
                        <span title={formatTimeAgoWithTooltip(note.timestamp).fullDate}>
                          {formatTimeAgoWithTooltip(note.timestamp).timeAgo}
                        </span>
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
