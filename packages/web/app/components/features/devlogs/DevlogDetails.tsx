'use client';

import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
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
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { DevlogEntry } from '@devlog/types';
import { MarkdownRenderer } from '@/components/ui';
import { formatTimeAgoWithTooltip } from '@/lib/time-utils';
import styles from './DevlogDetails.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface DevlogDetailsProps {
  devlog: DevlogEntry;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}

// Inline editable field component
interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  type?: 'text' | 'select' | 'textarea';
  options?: { label: string; value: string }[];
  placeholder?: string;
  children: React.ReactNode;
}

function EditableField({
  value,
  onSave,
  multiline = false,
  type = 'text',
  options = [],
  placeholder,
  children,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`${styles.editableField} ${styles.editing}`}>
        {type === 'select' ? (
          <Select value={editValue} onChange={setEditValue} style={{ width: '100%' }} autoFocus>
            {options.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        ) : type === 'textarea' || multiline ? (
          <TextArea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            placeholder={placeholder}
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            placeholder={placeholder}
          />
        )}
        <div className={styles.fieldActions}>
          <Button size="small" onClick={handleCancel} icon={<CloseOutlined />}>
            Cancel
          </Button>
          <Button size="small" type="primary" onClick={handleSave} icon={<CheckOutlined />}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editableField} onClick={() => setIsEditing(true)} title="Click to edit">
      {children}
    </div>
  );
}

export function DevlogDetails({ devlog, onUpdate }: DevlogDetailsProps) {
  const handleFieldUpdate = (field: string, value: any) => {
    const updateData = {
      id: devlog.id,
      [field]: value,
    };
    onUpdate(updateData);
  };

  const handleContextUpdate = (contextField: string, value: string) => {
    const updateData = {
      id: devlog.id,
      context: {
        ...devlog.context,
        [contextField]: value,
      },
    };
    onUpdate(updateData);
  };

  const statusOptions = [
    { label: 'New', value: 'new' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Blocked', value: 'blocked' },
    { label: 'In Review', value: 'in-preview' },
    { label: 'Testing', value: 'testing' },
    { label: 'Done', value: 'done' },
    { label: 'Closed', value: 'closed' },
  ];

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' },
  ];

  const typeOptions = [
    { label: 'Feature', value: 'feature' },
    { label: 'Bug Fix', value: 'bugfix' },
    { label: 'Task', value: 'task' },
    { label: 'Refactor', value: 'refactor' },
    { label: 'Documentation', value: 'docs' },
  ];

  return (
    <div>
      <div className={styles.devlogDetailsHeader}>
        <div className={styles.devlogDetailsTitle}>
          <EditableField
            value={devlog.title}
            onSave={(value) => handleFieldUpdate('title', value)}
            placeholder="Enter title"
          >
            <Title level={2} className={styles.devlogTitle}>
              {devlog.title}
            </Title>
          </EditableField>
          <Space split={<Text type="secondary">•</Text>} className={styles.metaInfo}>
            <Text type="secondary" className={styles.metaText}>
              ID: #{devlog.id}
            </Text>
            <Text type="secondary" title={formatTimeAgoWithTooltip(devlog.createdAt).fullDate}>
              Created: {formatTimeAgoWithTooltip(devlog.createdAt).timeAgo}
            </Text>
            <Text type="secondary" title={formatTimeAgoWithTooltip(devlog.updatedAt).fullDate}>
              Updated: {formatTimeAgoWithTooltip(devlog.updatedAt).timeAgo}
            </Text>
          </Space>

          {/* Editable Status, Priority, and Type */}
          <Space wrap className={styles.statusSection}>
            <span>
              <Text type="secondary">Status: </Text>
              <EditableField
                value={devlog.status}
                onSave={(value) => handleFieldUpdate('status', value)}
                type="select"
                options={statusOptions}
              >
                <Tag color="blue">{devlog.status}</Tag>
              </EditableField>
            </span>
            <span>
              <Text type="secondary">Priority: </Text>
              <EditableField
                value={devlog.priority}
                onSave={(value) => handleFieldUpdate('priority', value)}
                type="select"
                options={priorityOptions}
              >
                <Tag color="orange">{devlog.priority}</Tag>
              </EditableField>
            </span>
            <span>
              <Text type="secondary">Type: </Text>
              <EditableField
                value={devlog.type}
                onSave={(value) => handleFieldUpdate('type', value)}
                type="select"
                options={typeOptions}
              >
                <Tag color="green">{devlog.type}</Tag>
              </EditableField>
            </span>
          </Space>
        </div>
      </div>

      <div className={styles.devlogDetailsContent}>
        <div className={styles.descriptionSection}>
          <Title level={4}>Description</Title>
          <EditableField
            value={devlog.description}
            onSave={(value) => handleFieldUpdate('description', value)}
            multiline
            type="textarea"
            placeholder="Enter description"
          >
            <MarkdownRenderer content={devlog.description} />
          </EditableField>
        </div>

        <div className={styles.contextSection}>
          <Title level={4}>Business Context</Title>
          <EditableField
            value={devlog.context?.businessContext || ''}
            onSave={(value) => handleContextUpdate('businessContext', value)}
            multiline
            type="textarea"
            placeholder="Why this work matters and what problem it solves"
          >
            {devlog.context?.businessContext ? (
              <Alert
                message={<MarkdownRenderer content={devlog.context.businessContext} />}
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            ) : (
              <Text type="secondary" className={styles.emptyFieldText}>
                Click to add business context...
              </Text>
            )}
          </EditableField>
        </div>

        <div className={styles.contextSection}>
          <Title level={4}>Technical Context</Title>
          <EditableField
            value={devlog.context?.technicalContext || ''}
            onSave={(value) => handleContextUpdate('technicalContext', value)}
            multiline
            type="textarea"
            placeholder="Architecture decisions, constraints, assumptions"
          >
            {devlog.context?.technicalContext ? (
              <Alert
                message={<MarkdownRenderer content={devlog.context.technicalContext} />}
                type="warning"
                showIcon
                icon={<ToolOutlined />}
              />
            ) : (
              <Text type="secondary" className={styles.emptyFieldText}>
                Click to add technical context...
              </Text>
            )}
          </EditableField>
        </div>

        {devlog.context?.acceptanceCriteria && devlog.context.acceptanceCriteria.length > 0 && (
          <div className={styles.criteriaSection}>
            <Title level={4}>Acceptance Criteria</Title>
            <Card size="small">
              <List
                dataSource={devlog.context.acceptanceCriteria}
                renderItem={(criteria, index) => (
                  <List.Item className={styles.criteriaItem}>
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
          <div className={styles.dependencySection}>
            <Title level={4}>Dependencies</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {devlog.context.dependencies.map((dep, index) => (
                <Card key={index} size="small" className={styles.dependencyCard}>
                  <div className={styles.dependencyHeader}>
                    <div>
                      <Text strong>{dep.description}</Text>
                      {dep.externalId && (
                        <div className={styles.dependencyInfo}>
                          <Text type="secondary">External ID: {dep.externalId}</Text>
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
          <div className={styles.decisionSection}>
            <Title level={4}>Decisions</Title>
            <Timeline>
              {devlog.context.decisions.map((decision) => (
                <Timeline.Item key={decision.id}>
                  <div className={styles.decisionItem}>
                    <Text strong>{decision.decision}</Text>
                  </div>
                  <div className={styles.decisionContent}>
                    <Text>{decision.rationale}</Text>
                  </div>
                  {decision.alternatives && decision.alternatives.length > 0 && (
                    <div className={styles.decisionAlternatives}>
                      <Text type="secondary">Alternatives considered: </Text>
                      <Text type="secondary">{decision.alternatives.join(', ')}</Text>
                    </div>
                  )}
                  <Text type="secondary" className={styles.noteTimestamp}>
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
          <div className={styles.riskSection}>
            <Title level={4}>Risks</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {devlog.context.risks.map((risk, index) => (
                <Card key={index} size="small" className={styles.riskCard}>
                  <div>
                    <div className={styles.riskHeader}>
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
                    <div className={styles.riskMitigation}>
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
          <div className={styles.fileSection}>
            <Title level={4}>Related Files</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {devlog.files.map((file, index) => (
                <Card key={index} size="small" className={styles.fileCard}>
                  <Text code>{file}</Text>
                </Card>
              ))}
            </Space>
          </div>
        )}

        {devlog.relatedDevlogs && devlog.relatedDevlogs.length > 0 && (
          <div className={styles.relatedSection}>
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
          <div className={styles.aiContextSection}>
            <Title level={4}>AI Context</Title>
            <Card>
              {devlog.aiContext.currentSummary && (
                <div className={styles.aiSection}>
                  <Text strong>Summary:</Text>
                  <MarkdownRenderer content={devlog.aiContext.currentSummary} />
                </div>
              )}

              {devlog.aiContext.keyInsights && devlog.aiContext.keyInsights.length > 0 && (
                <div className={styles.aiSection}>
                  <Text strong>Key Insights:</Text>
                  <List
                    size="small"
                    style={{ marginTop: '8px' }}
                    dataSource={devlog.aiContext.keyInsights}
                    renderItem={(insight) => (
                      <List.Item className={styles.aiInsightItem}>
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
                <div className={styles.aiSection}>
                  <Text strong>Open Questions:</Text>
                  <List
                    size="small"
                    style={{ marginTop: '8px' }}
                    dataSource={devlog.aiContext.openQuestions}
                    renderItem={(question) => (
                      <List.Item className={styles.aiQuestionItem}>
                        <Space align="start">
                          <QuestionCircleOutlined style={{ color: '#f5222d', marginTop: '2px' }} />
                          <Text>{question}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {devlog.aiContext.suggestedNextSteps &&
                devlog.aiContext.suggestedNextSteps.length > 0 && (
                  <div className={styles.aiSection}>
                    <Text strong>Suggested Next Steps:</Text>
                    <List
                      size="small"
                      style={{ marginTop: '8px' }}
                      dataSource={devlog.aiContext.suggestedNextSteps}
                      renderItem={(step) => (
                        <List.Item className={styles.aiStepItem}>
                          <Space align="start">
                            <RightOutlined style={{ color: '#52c41a', marginTop: '2px' }} />
                            <Text>{step}</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </div>
                )}

              {devlog.aiContext.relatedPatterns && devlog.aiContext.relatedPatterns.length > 0 && (
                <div className={styles.aiSection}>
                  <Text strong>Related Patterns:</Text>
                  <Space wrap className={styles.aiPatterns}>
                    {devlog.aiContext.relatedPatterns.map((pattern, index) => (
                      <Tag key={index} color="geekblue">
                        {pattern}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              <div>
                <Text type="secondary" className={styles.aiUpdateInfo}>
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
          <div className={styles.externalRefSection}>
            <Title level={4}>External References</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {devlog.externalReferences.map((ref, index) => (
                <Card key={index} size="small" className={styles.externalRefCard}>
                  <div className={styles.externalRefHeader}>
                    <div>
                      <Text strong>{ref.title || ref.id}</Text>
                      {ref.url && (
                        <div>
                          <a href={ref.url} target="_blank" rel="noopener noreferrer">
                            <Text className={styles.externalRefLink}>{ref.url}</Text>
                          </a>
                        </div>
                      )}
                      {ref.status && (
                        <div className={styles.externalRefStatus}>
                          <Text type="secondary">Status: {ref.status}</Text>
                        </div>
                      )}
                      {ref.lastSync && (
                        <div className={styles.externalRefSync}>
                          <Text type="secondary">
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
          <div className={styles.notesSection}>
            <Title level={4}>Notes</Title>
            <Timeline>
              {[...devlog.notes].reverse().map((note) => (
                <Timeline.Item key={note.id}>
                  <div className={styles.noteItem}>
                    <MarkdownRenderer content={note.content} />
                  </div>
                  <Text type="secondary" className={styles.noteTimestamp}>
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
    </div>
  );
}
