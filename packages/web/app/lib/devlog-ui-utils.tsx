import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileProtectOutlined,
  MinusCircleOutlined,
  StopOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';

/**
 * Gets the Ant Design tag color for a devlog status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'done':
      return 'success';
    case 'in-progress':
      return 'processing';
    case 'review':
      return 'warning';
    case 'testing':
      return 'cyan';
    case 'blocked':
      return 'error';
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
export const getStatusIcon = (status: string): React.ReactNode => {
  switch (status) {
    case 'done':
      return <CheckCircleOutlined />;
    case 'in-progress':
      return <SyncOutlined spin />;
    case 'review':
      return <EyeOutlined />;
    case 'testing':
      return <FileProtectOutlined />;
    case 'blocked':
      return <StopOutlined />;
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
export const getPriorityColor = (priority: string): string => {
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
