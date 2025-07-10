'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Checkbox, List, Space, Tag, Timeline, Typography, Skeleton } from 'antd';
import {
  ApartmentOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  NodeIndexOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  RobotOutlined,
  SettingOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { DevlogEntry } from '@devlog/types';
import { EditableField, MarkdownRenderer } from '@/components/ui';
import { formatTimeAgoWithTooltip } from '@/lib/time-utils';
import styles from './DevlogDetails.module.css';
import { getTypeIcon } from '@/lib/devlog-ui-utils';
import { statusOptions, priorityOptions, typeOptions } from '@/lib/devlog-options';
import { DevlogStatusTag, DevlogPriorityTag, DevlogTypeTag } from '@/components';

const { Title, Text } = Typography;

interface DevlogDetailsProps {
  devlog?: DevlogEntry;
  loading?: boolean;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onUnsavedChangesChange?: (
    hasChanges: boolean,
    saveHandler: () => Promise<void>,
    discardHandler: () => void,
    isSaving: boolean,
    saveError: string | null,
  ) => void;
}

export function DevlogDetails({
  devlog,
  loading = false,
  onUpdate,
  onUnsavedChangesChange,
}: DevlogDetailsProps) {
  // If loading, show skeleton
  if (loading || !devlog) {
    return (
      <div>
        <div className={styles.devlogDetailsHeader}>
          <div className={styles.devlogTitleWrapper}>
            <Skeleton.Input
              style={{ width: '60%', height: '32px', marginBottom: '16px' }}
              active
              size="large"
            />

            <Space wrap className={styles.statusSection}>
              <Skeleton.Button style={{ width: '80px' }} active size="small" />
              <Skeleton.Button style={{ width: '80px' }} active size="small" />
              <Skeleton.Button style={{ width: '80px' }} active size="small" />
            </Space>

            <div className={styles.metaInfo}>
              <Skeleton.Input style={{ width: '200px' }} active size="small" />
            </div>
          </div>
        </div>

        <div className={styles.devlogDetailsContent}>
          <div className={styles.descriptionSection}>
            <Title level={4}>
              <FileTextOutlined className={styles.sectionIcon} />
              Description
            </Title>
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>

          <div className={styles.contextSection}>
            <Title level={4}>
              <InfoCircleOutlined className={styles.sectionIcon} />
              Business Context
            </Title>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>

          <div className={styles.contextSection}>
            <Title level={4}>
              <ToolOutlined className={styles.sectionIcon} />
              Technical Context
            </Title>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>

          <div className={styles.criteriaSection}>
            <Title level={4}>
              <CheckCircleOutlined className={styles.sectionIcon} />
              Acceptance Criteria
            </Title>
            <Card size="small">
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </div>

          <div className={styles.notesSection}>
            <Title level={4}>
              <CommentOutlined className={styles.sectionIcon} />
              Notes
            </Title>
            <Timeline>
              <Timeline.Item>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Timeline.Item>
              <Timeline.Item>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Timeline.Item>
            </Timeline>
          </div>
        </div>
      </div>
    );
  }

  // Local state for tracking changes
  const [localChanges, setLocalChanges] = useState<Record<string, any>>({});
  const [originalDevlog, setOriginalDevlog] = useState<DevlogEntry>(devlog);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset local changes when devlog prop changes (e.g., after save)
  useEffect(() => {
    setLocalChanges({});
    setOriginalDevlog(devlog);
    setHasUnsavedChanges(false);
    setSaveError(null);
  }, [devlog.id, devlog.updatedAt]);

  // Get the original value for a field from the original devlog data
  const getOriginalValue = useCallback(
    (field: string) => {
      if (field.startsWith('context.')) {
        const contextField = field.substring(8) as keyof typeof originalDevlog.context;
        return (originalDevlog.context?.[contextField] as any) || '';
      }
      return (originalDevlog as any)[field];
    },
    [originalDevlog],
  );

  // Get the current value for a field (local change if exists, otherwise current devlog value)
  const getCurrentValue = useCallback(
    (field: string) => {
      if (localChanges[field] !== undefined) {
        return localChanges[field];
      }

      if (field.startsWith('context.')) {
        const contextField = field.substring(8) as keyof typeof devlog.context;
        return (devlog.context?.[contextField] as any) || '';
      }
      return (devlog as any)[field];
    },
    [localChanges, devlog],
  );

  // Check if a field has actually changed from its original value
  const isFieldActuallyChanged = useCallback(
    (field: string) => {
      const currentValue = getCurrentValue(field);
      const originalValue = getOriginalValue(field);
      return currentValue !== originalValue;
    },
    [getCurrentValue, getOriginalValue],
  );

  // Check if a field has been changed locally (regardless of original value)
  const isFieldChanged = useCallback(
    (field: string) => {
      return localChanges[field] !== undefined;
    },
    [localChanges],
  );

  // Check if there are any actual changes from the original devlog
  const hasActualChanges = useCallback(() => {
    // Get all fields that might have been changed
    const allPossibleFields = [
      'title',
      'description',
      'status',
      'priority',
      'type',
      'context.businessContext',
      'context.technicalContext',
    ];

    return allPossibleFields.some((field) => isFieldActuallyChanged(field));
  }, [isFieldActuallyChanged]);

  const handleFieldChange = (field: string, value: any) => {
    const originalValue = getOriginalValue(field);
    const newChanges = { ...localChanges };

    // If the value matches the original, remove it from local changes
    if (value === originalValue) {
      delete newChanges[field];
    } else {
      // Otherwise, track the change
      newChanges[field] = value;
    }

    setLocalChanges(newChanges);

    // Check if there are any actual changes from the original devlog with the new changes
    const allPossibleFields = [
      'title',
      'description',
      'status',
      'priority',
      'type',
      'context.businessContext',
      'context.technicalContext',
    ];

    const actualChanges = allPossibleFields.some((checkField) => {
      const currentValue =
        newChanges[checkField] !== undefined
          ? newChanges[checkField]
          : getOriginalValue(checkField);
      const originalFieldValue = getOriginalValue(checkField);
      return currentValue !== originalFieldValue;
    });

    setHasUnsavedChanges(actualChanges);
    setSaveError(null);
  };

  const handleContextChange = (contextField: string, value: string) => {
    handleFieldChange(`context.${contextField}`, value);
  };

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Build update data from local changes
      const updateData: any = { id: devlog.id };

      // Handle regular field changes
      Object.entries(localChanges).forEach(([field, value]) => {
        if (field.startsWith('context.')) {
          const contextField = field.substring(8);
          if (!updateData.context) {
            updateData.context = { ...devlog.context };
          }
          updateData.context[contextField] = value;
        } else {
          updateData[field] = value;
        }
      });

      // Call the update function
      onUpdate(updateData);

      // Note: localChanges will be cleared when the devlog prop updates and triggers the useEffect
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [localChanges, devlog.id, devlog.context, onUpdate]);

  const handleDiscard = useCallback(() => {
    setLocalChanges({});
    setHasUnsavedChanges(false);
    setSaveError(null);
  }, []);

  // Notify parent about unsaved changes state
  useEffect(() => {
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges, handleSave, handleDiscard, isSaving, saveError);
    }
  }, [hasUnsavedChanges, isSaving, saveError, onUnsavedChangesChange, handleSave, handleDiscard]);

  return (
    <div>
      <div className={styles.devlogDetailsHeader}>
        <EditableField
          key={`title-${getCurrentValue('title')}`}
          value={getCurrentValue('title')}
          onSave={(value) => handleFieldChange('title', value)}
          placeholder="Enter title"
          className={`${isFieldChanged('title') ? styles.fieldChanged : ''} ${styles.devlogTitleWrapper}`}
        >
          <Title level={2} className={styles.devlogTitle}>
            {getCurrentValue('title')}
          </Title>
        </EditableField>

        <Space wrap className={styles.statusSection}>
          <EditableField
            key={`status-${getCurrentValue('status')}`}
            className={`${styles.statusItem} ${isFieldChanged('status') ? styles.fieldChanged : ''}`}
            type="select"
            value={getCurrentValue('status')}
            options={statusOptions}
            onSave={(value) => handleFieldChange('status', value)}
          >
            <DevlogStatusTag status={getCurrentValue('status')} className={styles.statusTag} />
          </EditableField>
          <EditableField
            key={`priority-${getCurrentValue('priority')}`}
            className={`${styles.statusItem} ${isFieldChanged('priority') ? styles.fieldChanged : ''}`}
            type="select"
            value={getCurrentValue('priority')}
            options={priorityOptions}
            onSave={(value) => handleFieldChange('priority', value)}
          >
            <DevlogPriorityTag
              priority={getCurrentValue('priority')}
              className={styles.statusTag}
            />
          </EditableField>
          <EditableField
            key={`type-${getCurrentValue('type')}`}
            className={`${styles.statusItem} ${isFieldChanged('type') ? styles.fieldChanged : ''}`}
            type="select"
            value={getCurrentValue('type')}
            onSave={(value) => handleFieldChange('type', value)}
            options={typeOptions}
          >
            <DevlogTypeTag type={getCurrentValue('type')} className={styles.statusTag} />
          </EditableField>
        </Space>

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
      </div>

      <div className={styles.devlogDetailsContent}>
        <div className={styles.descriptionSection}>
          <Title level={4}>
            <FileTextOutlined className={styles.sectionIcon} />
            Description
          </Title>
          <EditableField
            value={getCurrentValue('description')}
            onSave={(value) => handleFieldChange('description', value)}
            type="markdown"
            placeholder="Enter description"
            emptyText="Click to add description..."
            className={isFieldChanged('description') ? styles.fieldChanged : ''}
            borderless={false}
          >
            <MarkdownRenderer content={getCurrentValue('description')} />
          </EditableField>
        </div>

        <div className={styles.contextSection}>
          <Title level={4}>
            <InfoCircleOutlined className={styles.sectionIcon} />
            Business Context
          </Title>
          <EditableField
            value={getCurrentValue('context.businessContext')}
            onSave={(value) => handleContextChange('businessContext', value)}
            type="markdown"
            placeholder="Why this work matters and what problem it solves"
            emptyText="Click to add business context..."
            className={isFieldChanged('context.businessContext') ? styles.fieldChanged : ''}
            borderless={false}
          >
            <MarkdownRenderer content={getCurrentValue('context.businessContext')} />
          </EditableField>
        </div>

        <div className={styles.contextSection}>
          <Title level={4}>
            <ToolOutlined className={styles.sectionIcon} />
            Technical Context
          </Title>
          <EditableField
            value={getCurrentValue('context.technicalContext')}
            onSave={(value) => handleContextChange('technicalContext', value)}
            type="markdown"
            placeholder="Architecture decisions, constraints, assumptions"
            emptyText="Click to add technical context..."
            className={isFieldChanged('context.technicalContext') ? styles.fieldChanged : ''}
            borderless={false}
          >
            <MarkdownRenderer content={getCurrentValue('context.technicalContext')} />
          </EditableField>
        </div>

        {devlog.context?.acceptanceCriteria && devlog.context.acceptanceCriteria.length > 0 && (
          <div className={styles.criteriaSection}>
            <Title level={4}>
              <CheckCircleOutlined className={styles.sectionIcon} />
              Acceptance Criteria
            </Title>
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
            <Title level={4}>
              <NodeIndexOutlined className={styles.sectionIcon} />
              Dependencies
            </Title>
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
            <Title level={4}>
              <SettingOutlined style={{ marginRight: 8, color: '#13c2c2' }} />
              Decisions
            </Title>
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
            <Title level={4}>
              <WarningOutlined className={styles.sectionIcon} />
              Risks
            </Title>
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
            <Title level={4}>
              <FileTextOutlined className={styles.sectionIcon} />
              Related Files
            </Title>
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
            <Title level={4}>
              <LinkOutlined className={styles.sectionIcon} />
              Related Devlogs
            </Title>
            <Space wrap>
              {devlog.relatedDevlogs.map((relatedId, index) => (
                <Tag key={index} color="cyan">
                  #{relatedId}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {devlog.aiContext &&
          (devlog.aiContext.currentSummary ||
            (devlog.aiContext.keyInsights && devlog.aiContext.keyInsights.length > 0) ||
            (devlog.aiContext.openQuestions && devlog.aiContext.openQuestions.length > 0) ||
            (devlog.aiContext.suggestedNextSteps &&
              devlog.aiContext.suggestedNextSteps.length > 0) ||
            (devlog.aiContext.relatedPatterns && devlog.aiContext.relatedPatterns.length > 0)) && (
            <div className={styles.aiContextSection}>
              <Title level={4}>
                <RobotOutlined className={styles.sectionIcon} />
                AI Context
              </Title>
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

                {devlog.aiContext.relatedPatterns &&
                  devlog.aiContext.relatedPatterns.length > 0 && (
                    <div className={styles.aiSection}>
                      <Text strong>Related Patterns:</Text>
                      <List
                        size="small"
                        style={{ marginTop: '8px' }}
                        dataSource={devlog.aiContext.relatedPatterns}
                        renderItem={(pattern) => (
                          <List.Item className={styles.aiPatternItem}>
                            <Space align="start">
                              <ApartmentOutlined style={{ color: '#722ed1', marginTop: '2px' }} />
                              <Text>{pattern}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
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
            <Title level={4}>
              <LinkOutlined className={styles.sectionIcon} />
              External References
            </Title>
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
            <Title level={4}>
              <CommentOutlined className={styles.sectionIcon} />
              Notes
            </Title>
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
