import { Decision, DevlogEntry } from '@devlog/types';

/**
 * Enhanced Document-Based Context for AI Agents
 *
 * This demonstrates how AI agents can persist and retrieve rich context
 * that goes beyond simple chat history, similar to how experienced developers
 * maintain mental models of their projects.
 */

export class AIContextManager {
  /**
   * Create a new development task with rich context for AI agents
   */
  async createTaskWithContext(taskData: {
    title: string;
    description: string;
    businessContext: string;
    technicalContext: string;
    acceptanceCriteria: string[];
    initialInsights?: string[];
    relatedPatterns?: string[];
  }): Promise<DevlogEntry> {
    const now = new Date().toISOString();
    // Generate integer ID using timestamp-based approach
    const id = parseInt(Date.now().toString().slice(-8), 10);

    const entry: DevlogEntry = {
      id,
      key: `task-${Date.now()}`, // Use string for the key field
      title: taskData.title,
      type: 'feature',
      description: taskData.description,
      status: 'todo',
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
      tags: [],
      notes: [],
      files: [],
      relatedDevlogs: [],

      // Rich context for business understanding
      context: {
        businessContext: taskData.businessContext,
        technicalContext: taskData.technicalContext,
        dependencies: [],
        decisions: [],
        acceptanceCriteria: taskData.acceptanceCriteria,
        risks: [],
      },

      // AI-specific context for cross-session persistence
      aiContext: {
        currentSummary: `New task: ${taskData.title}. Business goal: ${taskData.businessContext}`,
        keyInsights: taskData.initialInsights || [],
        openQuestions: [],
        relatedPatterns: taskData.relatedPatterns || [],
        suggestedNextSteps: [
          'Analyze technical requirements',
          'Design solution architecture',
          'Identify potential risks and dependencies',
        ],
        lastAIUpdate: now,
        contextVersion: 1,
      },
    };

    return entry;
  }

  /**
   * Update AI context as work progresses - this is what AI agents would call
   * to maintain persistent understanding across sessions
   */
  async updateAIUnderstanding(
    entry: DevlogEntry,
    update: {
      newInsights?: string[];
      questionsAnswered?: string[];
      newQuestions?: string[];
      progressSummary?: string;
      patternsDiscovered?: string[];
      nextSteps?: string[];
    },
  ): Promise<DevlogEntry> {
    const now = new Date().toISOString();

    // Update AI context
    if (update.newInsights) {
      entry.aiContext.keyInsights.push(...update.newInsights);
    }

    if (update.questionsAnswered) {
      // Remove answered questions
      entry.aiContext.openQuestions = entry.aiContext.openQuestions.filter(
        (q) => !update.questionsAnswered!.some((answered) => q.includes(answered)),
      );
    }

    if (update.newQuestions) {
      entry.aiContext.openQuestions.push(...update.newQuestions);
    }

    if (update.patternsDiscovered) {
      entry.aiContext.relatedPatterns.push(...update.patternsDiscovered);
    }

    if (update.nextSteps) {
      entry.aiContext.suggestedNextSteps = update.nextSteps;
    }

    if (update.progressSummary) {
      entry.aiContext.currentSummary = update.progressSummary;
    }

    entry.aiContext.lastAIUpdate = now;
    entry.aiContext.contextVersion += 1;
    entry.updatedAt = now;

    return entry;
  }

  /**
   * Record a decision with rationale - crucial for AI agents to understand
   * why certain choices were made
   */
  async recordDecision(
    entry: DevlogEntry,
    decision: {
      decision: string;
      rationale: string;
      alternatives?: string[];
      decisionMaker: string; // "ai-agent" or human name
    },
  ): Promise<DevlogEntry> {
    const now = new Date().toISOString();

    const decisionRecord: Decision = {
      id: `decision-${Date.now()}`,
      timestamp: now,
      decision: decision.decision,
      rationale: decision.rationale,
      alternatives: decision.alternatives || [],
      decisionMaker: decision.decisionMaker,
    };

    entry.context.decisions.push(decisionRecord);

    // Update AI context with this decision
    entry.aiContext.keyInsights.push(
      `Decision made: ${decision.decision}. Rationale: ${decision.rationale}`,
    );

    entry.aiContext.lastAIUpdate = now;
    entry.aiContext.contextVersion += 1;
    entry.updatedAt = now;

    return entry;
  }

  /**
   * Get AI-optimized context summary for feeding to language models
   * This is what would be passed to AI agents to give them full context
   */
  getContextForAI(entry: DevlogEntry): string {
    const context = `
# Development Task Context

## Task Overview
**ID:** ${entry.id}
**Title:** ${entry.title}
**Status:** ${entry.status}
**Priority:** ${entry.priority}

## Business Context
${entry.context.businessContext}

## Technical Context
${entry.context.technicalContext}

## Current AI Understanding
${entry.aiContext.currentSummary}

## Key Insights (learned over time)
${entry.aiContext.keyInsights.map((insight) => `- ${insight}`).join('\n')}

## Open Questions
${entry.aiContext.openQuestions.map((q) => `- ${q}`).join('\n')}

## Related Patterns from Other Projects
${entry.aiContext.relatedPatterns.map((pattern) => `- ${pattern}`).join('\n')}

## Acceptance Criteria
${entry.context.acceptanceCriteria.map((criteria) => `- ${criteria}`).join('\n')}

## Decisions Made
${entry.context.decisions
  .map((d) => `- **${d.decision}** (by ${d.decisionMaker}): ${d.rationale}`)
  .join('\n')}

## Suggested Next Steps
${entry.aiContext.suggestedNextSteps.map((step) => `- ${step}`).join('\n')}

## Dependencies & Risks
Dependencies: ${entry.context.dependencies.length === 0 ? 'None identified' : entry.context.dependencies.map((d) => d.description).join(', ')}
Risks: ${entry.context.risks.length === 0 ? 'None identified' : entry.context.risks.map((r) => r.description).join(', ')}

---
*Context Version: ${entry.aiContext.contextVersion} | Last Updated: ${entry.aiContext.lastAIUpdate}*
`;

    return context.trim();
  }

  /**
   * Example: How an AI agent would use this system
   */
  async demonstrateAIWorkflow() {
    // 1. AI agent starts work on a new feature
    let taskEntry = await this.createTaskWithContext({
      title: 'Add user authentication system',
      description: 'Implement JWT-based authentication with role-based access control',
      businessContext:
        'We need to secure our API endpoints and provide different access levels for admin vs regular users. This is blocking the customer portal launch.',
      technicalContext:
        'Using Node.js/Express backend with PostgreSQL. Need to integrate with existing user table. Consider using passport.js or implementing custom JWT middleware.',
      acceptanceCriteria: [
        'Users can register with email/password',
        'Users can login and receive JWT token',
        'API endpoints are protected based on user roles',
        'Password reset functionality works',
        'Session management with token refresh',
      ],
      initialInsights: [
        'Similar pattern was used in the billing service project',
        'Need to consider GDPR compliance for user data',
      ],
      relatedPatterns: [
        'JWT refresh token pattern from billing-service',
        'Role-based middleware from admin-dashboard project',
      ],
    });

    // 2. AI agent makes progress and updates understanding
    taskEntry = await this.updateAIUnderstanding(taskEntry, {
      progressSummary:
        'Analyzed existing user table schema. Designed JWT token structure with roles. Started implementing authentication middleware.',
      newInsights: [
        "Existing user table already has 'role' column, perfect for RBAC",
        "Need to add 'last_login' and 'refresh_token' columns",
        'passport-jwt strategy seems overkill, custom middleware is simpler',
      ],
      newQuestions: [
        'Should we implement rate limiting for login attempts?',
        'How long should refresh tokens be valid?',
        'Do we need 2FA for admin users?',
      ],
      nextSteps: [
        'Implement JWT token generation and validation',
        'Create middleware for role-based route protection',
        'Add database migrations for new user fields',
        'Implement password reset flow',
      ],
    });

    // 3. AI agent makes a technical decision
    taskEntry = await this.recordDecision(taskEntry, {
      decision: 'Use bcrypt with 12 rounds for password hashing',
      rationale:
        'Balance between security and performance. 12 rounds provides strong security while keeping response times under 100ms on our server specs.',
      alternatives: [
        'argon2 (newer but more complex setup)',
        'scrypt (good but bcrypt is more widely adopted)',
      ],
      decisionMaker: 'ai-agent',
    });

    // 4. Get context summary for next AI session
    const contextSummary = this.getContextForAI(taskEntry);

    console.log('=== AI Context Summary ===');
    console.log(contextSummary);

    return taskEntry;
  }
}

// Export for use in MCP server
