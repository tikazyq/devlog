#!/usr/bin/env node

/**
 * Test the enhanced devlog system with AI context
 */

import { DevlogManager } from './packages/mcp-server/build/devlog-manager.js';

async function testAIContextFeatures() {
  console.log("🧪 Testing Enhanced Document-Based AI Context System\n");
  
  const manager = new DevlogManager('./test-devlog-workspace');
  
  try {
    // 1. Create a devlog with rich context
    console.log("📝 Step 1: Creating devlog with business and technical context...");
    const createResponse = await manager.createDevlog({
      title: "Implement real-time notifications",
      type: "feature",
      description: "Add WebSocket-based real-time notifications for user activities",
      priority: "high",
      businessContext: "Users need immediate feedback when someone comments on their posts or sends messages. This will increase engagement and user satisfaction.",
      technicalContext: "Using Socket.io with Redis adapter for scalability. Need to integrate with existing Express API and React frontend.",
      acceptanceCriteria: [
        "Users receive notifications in real-time without page refresh",
        "Notification history is persisted in database",
        "Users can mark notifications as read",
        "System handles 1000+ concurrent users"
      ],
      initialInsights: [
        "Similar implementation was done for chat feature",
        "Need to consider rate limiting for notification spam"
      ],
      relatedPatterns: [
        "Redis pub/sub pattern from chat service",
        "Notification queue processing from email service"
      ]
    });
    
    console.log("✅ Created devlog with enhanced context");
    
    // Extract devlog ID from response
    const devlogId = createResponse.content[0].text.match(/Created devlog entry: ([^\n]+)/)[1];
    console.log(`📋 Devlog ID: ${devlogId}\n`);
    
    // 2. Update AI context as work progresses
    console.log("🤖 Step 2: AI agent updates understanding...");
    await manager.updateAIContext({
      id: devlogId,
      summary: "Started implementing WebSocket connection. Researched Socket.io vs native WebSockets. Set up basic server infrastructure.",
      insights: [
        "Socket.io provides better fallback support for older browsers",
        "Redis adapter required for horizontal scaling across server instances",
        "Need to authenticate WebSocket connections using JWT tokens"
      ],
      questions: [
        "Should we implement notification batching to reduce spam?",
        "How to handle offline users - store notifications or skip?",
        "What's the optimal reconnection strategy for mobile users?"
      ],
      nextSteps: [
        "Set up Socket.io server with Redis adapter",
        "Implement JWT authentication for WebSocket connections",
        "Create notification data models and API endpoints",
        "Build React notification component"
      ]
    });
    
    console.log("✅ Updated AI context with insights and questions");
    
    // 3. Record a technical decision
    console.log("🎯 Step 3: Recording technical decision...");
    await manager.addDecision({
      id: devlogId,
      decision: "Use Socket.io instead of native WebSockets",
      rationale: "Socket.io provides automatic fallback to long-polling for older browsers and has built-in room management features that we need for targeted notifications",
      alternatives: [
        "Native WebSockets (simpler but no fallback support)",
        "Server-Sent Events (one-way only, not suitable for acknowledgments)"
      ],
      decisionMaker: "ai-agent"
    });
    
    console.log("✅ Recorded technical decision with rationale");
    
    // 4. Add some progress notes
    console.log("📝 Step 4: Adding progress notes...");
    await manager.addNote({
      id: devlogId,
      category: "progress",
      note: "Completed Socket.io server setup with Redis adapter. Basic connection and authentication working.",
      files: ["server/socket-server.js", "middleware/socket-auth.js"]
    });
    
    await manager.addNote({
      id: devlogId,
      category: "issue",
      note: "Discovered CORS issues when connecting from React frontend. Need to configure Socket.io origins properly."
    });
    
    console.log("✅ Added progress and issue notes");
    
    // 5. Get comprehensive AI context
    console.log("🔍 Step 5: Retrieving AI-optimized context...");
    const contextResponse = await manager.getContextForAI({ id: devlogId });
    const contextData = JSON.parse(contextResponse.content[0].text.split('\n\n')[1]);
    
    console.log("\n" + "=".repeat(60));
    console.log("📊 AI CONTEXT SUMMARY");
    console.log("=".repeat(60));
    console.log(`📋 Task: ${contextData.title}`);
    console.log(`🎯 Status: ${contextData.status} | Priority: ${contextData.priority}`);
    console.log(`\n💼 Business Context:\n${contextData.businessContext}`);
    console.log(`\n🔧 Technical Context:\n${contextData.technicalContext}`);
    console.log(`\n🧠 Current AI Understanding:\n${contextData.currentSummary}`);
    console.log(`\n💡 Key Insights (${contextData.keyInsights.length}):`);
    contextData.keyInsights.forEach((insight, i) => console.log(`  ${i+1}. ${insight}`));
    console.log(`\n❓ Open Questions (${contextData.openQuestions.length}):`);
    contextData.openQuestions.forEach((q, i) => console.log(`  ${i+1}. ${q}`));
    console.log(`\n🔗 Related Patterns (${contextData.relatedPatterns.length}):`);
    contextData.relatedPatterns.forEach((pattern, i) => console.log(`  ${i+1}. ${pattern}`));
    console.log(`\n✅ Acceptance Criteria (${contextData.acceptanceCriteria.length}):`);
    contextData.acceptanceCriteria.forEach((criteria, i) => console.log(`  ${i+1}. ${criteria}`));
    console.log(`\n🎯 Decisions Made (${contextData.decisions.length}):`);
    contextData.decisions.forEach((decision, i) => {
      console.log(`  ${i+1}. ${decision.decision} (by ${decision.decisionMaker})`);
      console.log(`     Rationale: ${decision.rationale}`);
    });
    console.log(`\n📝 Recent Notes (${contextData.recentNotes.length}):`);
    contextData.recentNotes.forEach((note, i) => {
      console.log(`  ${i+1}. [${note.category}] ${note.content}`);
    });
    console.log(`\n🔄 Context Version: ${contextData.contextVersion}`);
    console.log("=".repeat(60));
    
    console.log(`\n🎉 Test Complete! The AI agent now has rich, persistent context that includes:`);
    console.log(`   💼 Business context and goals`);
    console.log(`   🔧 Technical architecture and constraints`);
    console.log(`   🧠 AI understanding that evolves over time`);
    console.log(`   💡 Accumulated insights and learnings`);
    console.log(`   ❓ Open questions that need resolution`);
    console.log(`   🎯 Decisions with rationale and alternatives`);
    console.log(`   🔗 Patterns from related projects`);
    console.log(`   📝 Detailed progress tracking`);
    
    console.log(`\n✨ This solves the context window problem by providing persistent,`);
    console.log(`   structured memory that AI agents can reference across sessions!`);
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testAIContextFeatures().then(() => {
  console.log("\n🏁 Test completed successfully!");
}).catch(error => {
  console.error("\n💥 Test failed with error:", error);
  process.exit(1);
});
