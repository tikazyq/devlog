/**
 * Data mapper for converting between DevlogEntry and GitHub Issues
 */

import { DevlogEntry, DevlogStatus, DevlogType, DevlogPriority, DevlogNote, Decision, GitHubStorageConfig, ExternalReference } from '@devlog/types';
import { GitHubIssue, CreateIssueRequest, UpdateIssueRequest } from './github-api.js';

export interface DevlogMetadata {
  version: string;
  devlogKey: string;
  notes: DevlogNote[];
  decisions: Decision[];
  context: {
    businessContext?: string;
    technicalContext?: string;
    acceptanceCriteria: string[];
  };
  aiContext: {
    currentSummary?: string;
    keyInsights: string[];
    suggestedNextSteps: string[];
    openQuestions: string[];
  };
  files: string[];
  relatedDevlogs: string[];
  externalReferences: ExternalReference[];
}

export class DevlogGitHubMapper {
  private config: Required<GitHubStorageConfig>;

  constructor(config: Required<GitHubStorageConfig>) {
    this.config = config;
  }

  /**
   * Convert a GitHub Issue to a DevlogEntry
   */
  issueToDevlog(issue: GitHubIssue): DevlogEntry {
    const { userContent, metadata } = this.parseIssueBody(issue.body || '');
    
    // Extract devlog data from labels
    const typeLabel = issue.labels.find(l => l.name.startsWith(`${this.config.labelsPrefix}-type:`));
    const statusLabel = issue.labels.find(l => l.name.startsWith(`${this.config.labelsPrefix}-status:`));
    const priorityLabel = issue.labels.find(l => l.name.startsWith(`${this.config.labelsPrefix}-priority:`));
    
    return {
      id: issue.number,
      key: metadata?.devlogKey || this.titleToKey(issue.title),
      title: issue.title,
      description: userContent.description || '',
      type: this.extractEnumFromLabel(typeLabel?.name, 'type') as DevlogType || 'task',
      status: this.mapGitHubStateToDevlogStatus(issue.state, statusLabel?.name),
      priority: this.extractEnumFromLabel(priorityLabel?.name, 'priority') as DevlogPriority || 'medium',
      assignee: issue.assignees[0]?.login,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      notes: metadata?.notes || [],
      files: metadata?.files || [],
      relatedDevlogs: metadata?.relatedDevlogs || [],
      context: {
        businessContext: metadata?.context?.businessContext || userContent.businessContext || '',
        technicalContext: metadata?.context?.technicalContext || userContent.technicalContext || '',
        dependencies: [],
        decisions: metadata?.decisions || [],
        acceptanceCriteria: metadata?.context?.acceptanceCriteria || userContent.acceptanceCriteria || [],
        risks: [],
      },
      aiContext: {
        currentSummary: metadata?.aiContext?.currentSummary || '',
        keyInsights: metadata?.aiContext?.keyInsights || [],
        suggestedNextSteps: metadata?.aiContext?.suggestedNextSteps || [],
        openQuestions: metadata?.aiContext?.openQuestions || [],
        relatedPatterns: [],
        lastAIUpdate: new Date().toISOString(),
        contextVersion: 1,
      },
      externalReferences: metadata?.externalReferences || [],
    };
  }

  /**
   * Convert a DevlogEntry to GitHub Issue data for creation
   */
  devlogToIssue(entry: DevlogEntry): CreateIssueRequest | UpdateIssueRequest {
    const body = this.formatIssueBody(entry);
    const labels = this.generateLabels(entry);

    return {
      title: entry.title,
      body,
      labels,
      assignees: entry.assignee ? [entry.assignee] : undefined,
    };
  }

  /**
   * Format the issue body with structured data
   */
  private formatIssueBody(entry: DevlogEntry): string {
    const metadata: DevlogMetadata = {
      version: '1.0.0',
      devlogKey: entry.key,
      notes: entry.notes || [],
      decisions: entry.context?.decisions || [],
      context: {
        businessContext: entry.context?.businessContext,
        technicalContext: entry.context?.technicalContext,
        acceptanceCriteria: entry.context?.acceptanceCriteria || [],
      },
      aiContext: {
        currentSummary: entry.aiContext?.currentSummary,
        keyInsights: entry.aiContext?.keyInsights || [],
        suggestedNextSteps: entry.aiContext?.suggestedNextSteps || [],
        openQuestions: entry.aiContext?.openQuestions || [],
      },
      files: entry.files || [],
      relatedDevlogs: entry.relatedDevlogs || [],
      externalReferences: entry.externalReferences || [],
    };

    let body = '<!-- DEVLOG_METADATA_START -->\n';
    
    // User-readable content
    if (entry.description) {
      body += '## Description\n';
      body += `${entry.description}\n\n`;
    }
    
    if (entry.context?.technicalContext) {
      body += '## Technical Context\n';
      body += `${entry.context.technicalContext}\n\n`;
    }
    
    if (entry.context?.businessContext) {
      body += '## Business Context\n';
      body += `${entry.context.businessContext}\n\n`;
    }
    
    if (entry.context?.acceptanceCriteria && entry.context.acceptanceCriteria.length > 0) {
      body += '## Acceptance Criteria\n';
      entry.context.acceptanceCriteria.forEach(criterion => {
        body += `- [ ] ${criterion}\n`;
      });
      body += '\n';
    }
    
    // Structured metadata
    body += '<!-- DEVLOG_DATA -->\n';
    body += '```json\n';
    body += JSON.stringify(metadata, null, 2);
    body += '\n```\n';
    body += '<!-- DEVLOG_METADATA_END -->\n';
    
    return body;
  }

  /**
   * Parse the issue body to extract user content and metadata
   */
  private parseIssueBody(body: string): { 
    userContent: {
      description?: string;
      technicalContext?: string;
      businessContext?: string;
      acceptanceCriteria?: string[];
    };
    metadata?: DevlogMetadata;
  } {
    const userContent: any = {};
    let metadata: DevlogMetadata | undefined;

    // Extract structured metadata
    const metadataMatch = body.match(/<!-- DEVLOG_DATA -->\n```json\n([\s\S]*?)\n```/);
    if (metadataMatch) {
      try {
        metadata = JSON.parse(metadataMatch[1]);
      } catch (error) {
        console.warn('Failed to parse devlog metadata from GitHub issue:', error);
      }
    }

    // Extract user-readable content
    const sections = body.split(/^## /m);
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const title = lines[0]?.toLowerCase();
      const content = lines.slice(1).join('\n').trim();

      if (title === 'description') {
        userContent.description = content;
      } else if (title === 'technical context') {
        userContent.technicalContext = content;
      } else if (title === 'business context') {
        userContent.businessContext = content;
      } else if (title === 'acceptance criteria') {
        userContent.acceptanceCriteria = content
          .split('\n')
          .filter(line => line.startsWith('- [ ]') || line.startsWith('- [x]'))
          .map(line => line.replace(/^- \[[x ]\] /, ''));
      }
    }

    return { userContent, metadata };
  }

  /**
   * Generate labels for the GitHub issue
   */
  private generateLabels(entry: DevlogEntry): string[] {
    const labels: string[] = [
      `${this.config.labelsPrefix}-type:${entry.type}`,
      `${this.config.labelsPrefix}-priority:${entry.priority}`,
    ];

    // Only add status label if not default
    if (entry.status !== 'new') {
      labels.push(`${this.config.labelsPrefix}-status:${entry.status}`);
    }

    return labels;
  }

  /**
   * Extract enum value from label name
   */
  private extractEnumFromLabel(labelName: string | undefined, type: string): string | undefined {
    if (!labelName) return undefined;
    const prefix = `${this.config.labelsPrefix}-${type}:`;
    return labelName.startsWith(prefix) ? labelName.substring(prefix.length) : undefined;
  }

  /**
   * Map GitHub issue state and status label to devlog status
   */
  private mapGitHubStateToDevlogStatus(state: 'open' | 'closed', statusLabel?: string): DevlogStatus {
    if (state === 'closed') {
      return 'done';
    }

    if (statusLabel) {
      const status = this.extractEnumFromLabel(statusLabel, 'status');
      if (status && ['new', 'in-progress', 'blocked', 'in-review', 'testing'].includes(status)) {
        return status as DevlogStatus;
      }
    }

    return 'new';
  }

  /**
   * Convert title to a valid devlog key
   */
  private titleToKey(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}
