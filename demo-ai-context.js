#!/usr/bin/env node

/**
 * Demo: Document-Based Context Persistence for AI Agents
 * 
 * This shows how AI agents can maintain persistent context across sessions,
 * similar to how experienced developers maintain mental models of projects.
 * 
 * Run: node demo-ai-context.js
 */

// Simple types for demonstration
const DevlogTypes = {
  feature: "feature",
  bugfix: "bugfix", 
  task: "task"
};

const DevlogStatus = {
  todo: "todo",
  inProgress: "in-progress",
  done: "done"
};

class DocumentBasedContext {
  
  /**
   * Create a development task with rich context
   */
  createTaskDocument(taskData) {
    const now = new Date().toISOString();
    const id = `task-${Date.now()}`;
    
    return {
      // Basic task info
      id,
      title: taskData.title,
      type: "feature",
      description: taskData.description,
      status: "todo",
      priority: "medium",
      createdAt: now,
      updatedAt: now,
      
      // Rich business & technical context
      context: {
        businessContext: taskData.businessContext,
        technicalContext: taskData.technicalContext,
        acceptanceCriteria: taskData.acceptanceCriteria,
        decisions: [],
        risks: [],
        dependencies: []
      },
      
      // AI-specific persistent memory
      aiMemory: {
        currentUnderstanding: `New task: ${taskData.title}. Goal: ${taskData.businessContext}`,
        keyInsights: taskData.initialInsights || [],
        openQuestions: [],
        relatedPatterns: taskData.relatedPatterns || [],
        suggestedNextSteps: [
          "Analyze requirements", 
          "Design solution", 
          "Identify risks"
        ],
        lastAIUpdate: now,
        memoryVersion: 1
      }
    };
  }
  
  /**
   * AI agent updates its understanding as work progresses
   */
  updateAIMemory(document, update) {
    const now = new Date().toISOString();
    
    // Accumulate insights over time
    if (update.newInsights) {
      document.aiMemory.keyInsights.push(...update.newInsights);
    }
    
    // Track questions and answers
    if (update.questionsAnswered) {
      document.aiMemory.openQuestions = document.aiMemory.openQuestions.filter(
        q => !update.questionsAnswered.some(answered => q.includes(answered))
      );
    }
    
    if (update.newQuestions) {
      document.aiMemory.openQuestions.push(...update.newQuestions);
    }
    
    // Update current understanding
    if (update.progressSummary) {
      document.aiMemory.currentUnderstanding = update.progressSummary;
    }
    
    // Update next steps
    if (update.nextSteps) {
      document.aiMemory.suggestedNextSteps = update.nextSteps;
    }
    
    // Track patterns across projects
    if (update.patternsDiscovered) {
      document.aiMemory.relatedPatterns.push(...update.patternsDiscovered);
    }
    
    document.aiMemory.lastAIUpdate = now;
    document.aiMemory.memoryVersion += 1;
    document.updatedAt = now;
    
    return document;
  }
  
  /**
   * Record important decisions with rationale
   */
  recordDecision(document, decision) {
    const now = new Date().toISOString();
    
    const decisionRecord = {
      id: `decision-${Date.now()}`,
      timestamp: now,
      decision: decision.decision,
      rationale: decision.rationale,
      alternatives: decision.alternatives || [],
      madeBy: decision.madeBy
    };
    
    document.context.decisions.push(decisionRecord);
    
    // Add to AI memory as insight
    document.aiMemory.keyInsights.push(
      `Decision: ${decision.decision}. Why: ${decision.rationale}`
    );
    
    document.aiMemory.lastAIUpdate = now;
    document.aiMemory.memoryVersion += 1;
    
    return document;
  }
  
  /**
   * Generate AI-optimized context for feeding to language models
   */
  getAIContextSummary(document) {
    return `
# Development Task: ${document.title}

## Current Status: ${document.status}

## Business Goal
${document.context.businessContext}

## Technical Context  
${document.context.technicalContext}

## Current AI Understanding
${document.aiMemory.currentUnderstanding}

## Key Insights Learned
${document.aiMemory.keyInsights.map(insight => `• ${insight}`).join('\n')}

## Open Questions
${document.aiMemory.openQuestions.map(q => `• ${q}`).join('\n')}

## Related Patterns from Other Projects
${document.aiMemory.relatedPatterns.map(pattern => `• ${pattern}`).join('\n')}

## Acceptance Criteria
${document.context.acceptanceCriteria.map(criteria => `• ${criteria}`).join('\n')}

## Decisions Made
${document.context.decisions.map(d => 
  `• ${d.decision} (by ${d.madeBy}): ${d.rationale}`
).join('\n')}

## Suggested Next Steps
${document.aiMemory.suggestedNextSteps.map(step => `• ${step}`).join('\n')}

---
Memory Version: ${document.aiMemory.memoryVersion} | Last Updated: ${document.aiMemory.lastAIUpdate}
`.trim();
  }
  
  /**
   * Demonstrate AI workflow with persistent context
   */
  demonstrateAIWorkflow() {
    console.log("🤖 Demonstrating Document-Based AI Context Persistence\n");
    
    // 1. AI agent starts new feature
    console.log("📝 Step 1: AI Agent creates new feature task...");
    let taskDoc = this.createTaskDocument({
      title: "Add user authentication system",
      description: "Implement JWT-based auth with role-based access control",
      businessContext: "Secure API endpoints for customer portal launch. Need admin vs user access levels.",
      technicalContext: "Node.js/Express + PostgreSQL. Consider JWT middleware vs passport.js integration.",
      acceptanceCriteria: [
        "Users can register and login",
        "JWT tokens issued with roles", 
        "API endpoints protected by role",
        "Password reset functionality",
        "Token refresh mechanism"
      ],
      initialInsights: [
        "Similar JWT pattern used in billing service",
        "Need GDPR compliance consideration"
      ],
      relatedPatterns: [
        "JWT refresh pattern from billing-service",
        "RBAC middleware from admin-dashboard"
      ]
    });
    
    console.log(`✅ Created task document: ${taskDoc.id}\n`);
    
    // 2. AI agent makes progress
    console.log("🔄 Step 2: AI Agent updates understanding after analysis...");
    taskDoc = this.updateAIMemory(taskDoc, {
      progressSummary: "Analyzed user table schema. Designed JWT structure. Started auth middleware implementation.",
      newInsights: [
        "User table already has 'role' column - perfect for RBAC",
        "Need to add 'last_login' and 'refresh_token' columns",
        "Custom middleware simpler than passport-jwt for our use case"
      ],
      newQuestions: [
        "Should we implement login rate limiting?",
        "How long should refresh tokens be valid?",
        "Do admin users need 2FA?"
      ],
      nextSteps: [
        "Implement JWT generation and validation",
        "Create role-based route protection middleware", 
        "Add database migrations for user table",
        "Build password reset flow"
      ]
    });
    
    console.log("✅ Updated AI memory with new insights and questions\n");
    
    // 3. AI agent makes technical decision
    console.log("🎯 Step 3: AI Agent makes technical decision...");
    taskDoc = this.recordDecision(taskDoc, {
      decision: "Use bcrypt with 12 rounds for password hashing",
      rationale: "Balances security with performance. 12 rounds gives strong security while keeping response times under 100ms on our servers.",
      alternatives: [
        "argon2 (newer but complex setup)",
        "scrypt (good but bcrypt more adopted)"
      ],
      madeBy: "ai-agent"
    });
    
    console.log("✅ Recorded decision with rationale\n");
    
    // 4. Generate context for next AI session
    console.log("📋 Step 4: Generate AI context for next session...");
    const contextSummary = this.getAIContextSummary(taskDoc);
    
    console.log("=" .repeat(60));
    console.log("AI CONTEXT SUMMARY (for next session)");
    console.log("=" .repeat(60));
    console.log(contextSummary);
    console.log("=" .repeat(60));
    
    console.log(`\n🎉 Demo complete! The AI agent now has persistent context across sessions.`);
    console.log(`📊 Memory version: ${taskDoc.aiMemory.memoryVersion}`);
    console.log(`💡 Total insights: ${taskDoc.aiMemory.keyInsights.length}`);
    console.log(`❓ Open questions: ${taskDoc.aiMemory.openQuestions.length}`);
    console.log(`🔗 Related patterns: ${taskDoc.aiMemory.relatedPatterns.length}`);
    
    return taskDoc;
  }
}

// Run the demonstration
if (require.main === module) {
  const demo = new DocumentBasedContext();
  demo.demonstrateAIWorkflow();
}

module.exports = { DocumentBasedContext };
