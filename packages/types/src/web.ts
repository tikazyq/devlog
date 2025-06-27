/**
 * Web component prop types
 */

import React from 'react';
import { DevlogEntry, DevlogId, DevlogStats } from './core.js';
import { CreateDevlogRequest } from './requests.js';

export interface DevlogDetailsProps {
  devlog: DevlogEntry;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onBack: () => void;
}

export interface NavigationSidebarProps {
  devlogs: DevlogEntry[];
  currentDevlogId?: DevlogId;
  onDevlogSelect: (id: DevlogId) => void;
}

export interface DevlogDetailsPageProps {
  params: {
    id: string;
  };
}

export interface SidebarProps {
  devlogs: DevlogEntry[];
  onDevlogSelect: (id: DevlogId) => void;
  selectedDevlogId?: DevlogId;
}

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export interface LoadingPageProps {
  message?: string;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
}

export interface DevlogListProps {
  devlogs: DevlogEntry[];
  loading: boolean;
  onViewDevlog: (devlog: DevlogEntry) => void;
  onDeleteDevlog: (id: DevlogId) => void;
}

export interface DevlogFormProps {
  devlog?: Partial<DevlogEntry>;
  onSubmit: (data: CreateDevlogRequest) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export interface DashboardProps {
  devlogs: DevlogEntry[];
  stats?: DevlogStats;
  onDevlogSelect: (id: DevlogId) => void;
}

export interface AppLayoutProps {
  children: React.ReactNode;
  devlogs: DevlogEntry[];
  onDevlogSelect: (id: DevlogId) => void;
  selectedDevlogId?: DevlogId;
}

export interface DevlogPageProps {
  params: { id: string };
}
