import React from 'react';
import {
  BookOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileProtectOutlined,
  MinusCircleOutlined,
  StopOutlined,
  SyncOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { DevlogPriority, DevlogStatus, DevlogType } from '@devlog/types';

/**
 * Gets the Ant Design tag color for a devlog status
 */
export const getStatusColor = (status: DevlogStatus): string => {
  switch (status) {
    case 'done':
      return 'success';
    case 'in-progress':
      return 'processing';
    case 'review':
      return 'warning';
    case 'testing':
      return 'cyan';
    case 'archived':
      return 'default';
    case 'todo':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Gets the appropriate icon component for a devlog status
 */
export const getStatusIcon = (status: DevlogStatus): React.ReactNode => {
  switch (status) {
    case 'done':
      return <CheckCircleOutlined />;
    case 'in-progress':
      return <SyncOutlined spin />;
    case 'review':
      return <EyeOutlined />;
    case 'testing':
      return <FileProtectOutlined />;
    case 'archived':
      return <MinusCircleOutlined />;
    case 'todo':
      return <ClockCircleOutlined />;
    default:
      return <MinusCircleOutlined />;
  }
};

/**
 * Gets the Ant Design tag color for a devlog priority
 */
export const getPriorityColor = (priority: DevlogPriority): string => {
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

/**
 * Gets the appropriate icon component for a devlog priority
 */
export const getPriorityIcon = (priority: string): React.ReactNode => {
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

export const getTypeIcon = (type: DevlogType): React.ReactNode => {
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
