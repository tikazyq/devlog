#!/usr/bin/env node

import { DevlogManager } from '../packages/core/build/devlog-manager.js';
import path from 'path';

async function createIntegrationDevlog() {
  const devlog = new DevlogManager({
    workspaceRoot: process.cwd()
  });

  try {
    const entry = await devlog.createDevlog({
      title: "Enterprise Platform Integrations (Jira, ADO, GitHub)",
      type: "feature",
      description: "Implement bi-directional sync capabilities with enterprise project management platforms to bridge devlog with existing workflows",
      priority: "high",
      businessContext: "Development teams need to integrate devlog with their existing project management tools (Jira, Azure DevOps, GitHub Issues) to maintain workflow continuity and ensure all stakeholders have visibility into work progress.",
      technicalContext: "Implement REST API integrations with authentication, field mapping, and error handling. Support for creating/updating issues/work items while maintaining devlog as the source of truth for AI context.",
      acceptanceCriteria: [
        "Can create Jira issues from devlog entries",
        "Can update existing Jira issues when devlog changes",
        "Can create Azure DevOps work items from devlog entries", 
        "Can update existing ADO work items when devlog changes",
        "Can create GitHub issues from devlog entries",
        "Can update existing GitHub issues when devlog changes",
        "Proper error handling and user feedback",
        "Secure credential management",
        "Field mapping between devlog and external systems",
        "MCP tools for sync operations"
      ],
      initialInsights: [
        "Each platform has different authentication mechanisms (API tokens, PATs, OAuth)",
        "Field mapping is critical - devlog types need to map to platform-specific issue types",
        "External references should be stored in devlog entries for tracking",
        "Need to handle both creation and updates to avoid duplicates",
        "Different platforms have different priority systems"
      ],
      relatedPatterns: [
        "Integration pattern similar to Zapier/Make workflows",
        "API adapter pattern for multiple external services",
        "Configuration management for credentials"
      ]
    });

    console.log(`Created devlog entry: ${entry.id}`);
    console.log(`Title: ${entry.title}`);
    console.log(`Type: ${entry.type}`);
    console.log(`Priority: ${entry.priority}`);
    console.log(`Status: ${entry.status}`);

    // Update status to in-progress since we've started working on it
    await devlog.updateDevlog({
      id: entry.id,
      status: "in-progress",
      progress: "Implemented core integration framework with Jira, ADO, and GitHub APIs. Added MCP server endpoints and configuration management."
    });

    // Add some key insights we've gained during development
    await devlog.updateAIContext({
      id: entry.id,
      insights: [
        "REST API integration requires careful error handling for network issues",
        "Each platform has unique field structures that need mapping functions",
        "Configuration should support both file-based and environment variable approaches",
        "MCP adapter pattern works well for exposing integration features to AI agents"
      ],
      nextSteps: [
        "Test integrations with real platform instances",
        "Add webhook support for real-time bi-directional sync", 
        "Implement batch sync operations for multiple devlog entries",
        "Add integration status monitoring and health checks"
      ]
    });

    console.log(`\nDevlog entry updated to in-progress status`);
    console.log(`AI context updated with insights and next steps`);

  } catch (error) {
    console.error("Error creating devlog entry:", error);
    process.exit(1);
  }
}

createIntegrationDevlog();
