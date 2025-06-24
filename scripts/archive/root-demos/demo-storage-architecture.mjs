#!/usr/bin/env node

/**
 * Test script to demonstrate the new storage architecture
 */

import { NewDevlogManager, ConfigurationManager, StorageMigration } from "./packages/core/build/index.js";

async function demonstrateStorageArchitecture() {
  console.log("=".repeat(60));
  console.log("🚀 Devlog Storage Architecture V3 Demonstration");
  console.log("=".repeat(60));
  
  // 1. Configuration Manager Demo
  console.log("\n1. 📋 Configuration Manager");
  console.log("-".repeat(30));
  
  const configManager = new ConfigurationManager();
  const config = await configManager.loadConfig();
  console.log("✅ Loaded configuration:", JSON.stringify(config, null, 2));
  
  const recommendations = configManager.getStorageRecommendations();
  console.log(`\n📊 Available storage types: ${recommendations.map(r => r.type).join(", ")}`);
  
  // 2. Storage Provider Demo
  console.log("\n2. 🗄️  Storage Provider Demonstration");
  console.log("-".repeat(40));
  
  // Demo with SQLite (if available) or JSON fallback
  let storageConfig = config.storage;
  
  // Fallback to SQLite in memory if better-sqlite3 is not available
  if (storageConfig.type === "sqlite") {
    try {
      await import("better-sqlite3");
      console.log("✅ SQLite available - using SQLite storage");
    } catch {
      console.log("⚠️  SQLite not available - falling back to in-memory SQLite");
      storageConfig = {
        type: "sqlite",
        filePath: ":memory:"
      };
    }
  }
  
  const manager = new NewDevlogManager({
    storage: storageConfig
  });
  
  await manager.initialize();
  console.log(`✅ Initialized storage: ${storageConfig.type}`);
  
  // 3. Basic Operations Demo
  console.log("\n3. 🔄 Basic Operations");
  console.log("-".repeat(25));
  
  // Create a demo devlog entry
  const demoEntry = await manager.findOrCreateDevlog({
    title: "Storage Architecture Demo",
    type: "feature",
    description: "Demonstrating the new flexible storage architecture",
    businessContext: "Improve storage flexibility and performance",
    technicalContext: "Implement abstract storage providers with multiple backends",
    acceptanceCriteria: [
      "Support multiple storage types",
      "Backward compatibility with JSON",
      "Enterprise integration support"
    ],
    priority: "high"
  });
  
  console.log(`✅ Created/Found entry: ${demoEntry.id}`);
  console.log(`   Title: ${demoEntry.title}`);
  console.log(`   Status: ${demoEntry.status}`);
  
  // Add a note
  const updatedEntry = await manager.addNote(
    demoEntry.id, 
    "Successfully demonstrated new storage architecture!", 
    "progress"
  );
  
  console.log(`✅ Added note (total notes: ${updatedEntry.notes.length})`);
  
  // List entries
  const allEntries = await manager.listDevlogs();
  console.log(`✅ Listed ${allEntries.length} total entries`);
  
  // Search functionality
  const searchResults = await manager.searchDevlogs("storage");
  console.log(`✅ Search for "storage" found ${searchResults.length} entries`);
  
  // 4. Statistics Demo
  console.log("\n4. 📊 Statistics");
  console.log("-".repeat(15));
  
  const stats = await manager.getStats();
  console.log("✅ Storage statistics:");
  console.log(`   Total entries: ${stats.totalEntries}`);
  console.log(`   By status:`, stats.byStatus);
  console.log(`   By type:`, stats.byType);
  console.log(`   By priority:`, stats.byPriority);
  
  // 5. Migration Demo (if JSON data exists)
  console.log("\n5. 🔄 Migration Capabilities");
  console.log("-".repeat(30));
  
  const migration = new StorageMigration();
  const needsMigration = await migration.needsMigration(".devlog");
  
  if (needsMigration) {
    console.log("✅ Found existing JSON data for migration");
    const migrationStats = await migration.getMigrationStats(".devlog");
    console.log(`   ${migrationStats.totalEntries} entries, ${Math.round(migrationStats.totalSize / 1024)}KB`);
  } else {
    console.log("ℹ️  No existing JSON data found (migration not needed)");
  }
  
  // 6. Enterprise Integration Info
  console.log("\n6. 🏢 Enterprise Integration");
  console.log("-".repeat(35));
  
  if (config.integrations) {
    const configuredSystems = Object.keys(config.integrations).filter(key => !key.startsWith('_'));
    if (configuredSystems.length > 0) {
      console.log(`✅ Configured integrations: ${configuredSystems.join(", ")}`);
    } else {
      console.log("ℹ️  No enterprise integrations configured");
    }
  } else {
    console.log("ℹ️  No enterprise integrations available");
  }
  
  console.log("\nEnterprise storage benefits:");
  console.log("  • No local storage duplication");
  console.log("  • Integrated with existing workflows");
  console.log("  • Enterprise-grade security");
  console.log("  • Automatic synchronization");
  
  // 7. Performance Information
  console.log("\n7. ⚡ Performance Information");
  console.log("-".repeat(35));
  
  const perfInfo = {
    json: "Good for <100 entries, human-readable",
    sqlite: "Excellent for <10k entries, full-text search",
    postgres: "Excellent for any scale, multi-user, production-ready",
    mysql: "Excellent for web apps, existing infrastructure",
    enterprise: "Depends on remote system, workflow integration"
  };
  
  Object.entries(perfInfo).forEach(([type, info]) => {
    const indicator = type === storageConfig.type ? "👉" : "  ";
    console.log(`${indicator} ${type.padEnd(10)}: ${info}`);
  });
  
  // Cleanup
  await manager.dispose();
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Storage Architecture V3 demonstration completed!");
  console.log("=".repeat(60));
  
  console.log("\nNext steps:");
  console.log("1. Choose your storage type based on your needs");
  console.log("2. Configure devlog.config.json or environment variables");
  console.log("3. Install optional dependencies (better-sqlite3, pg, mysql2)");
  console.log("4. Migrate existing data if needed");
  console.log("5. Use the new MCP server for AI integration");
}

// Run demonstration
demonstrateStorageArchitecture().catch(error => {
  console.error("❌ Demo failed:", error);
  process.exit(1);
});
