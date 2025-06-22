#!/usr/bin/env node

import { DevlogManager } from "@devlog/core";

async function test() {
  console.log("Testing Devlog Manager...");
  
  const manager = new DevlogManager({ workspaceRoot: "./test-workspace" });
  
  try {
    // Test creating a devlog
    console.log("\n1. Creating a devlog...");
    const createResult = await manager.createDevlog({
      title: "Test Feature",
      type: "feature",
      description: "This is a test feature",
      priority: "medium"
    });
    console.log(`Created devlog: ${createResult.id} - ${createResult.title}`);
    
    const devlogId = createResult.id;
    
    // Test updating the devlog
    console.log("\n2. Updating the devlog...");
    const updateResult = await manager.updateDevlog({
      id: devlogId,
      status: "in-progress",
      progress: "Started working on the feature"
    });
    console.log(`Updated devlog status: ${updateResult.status}`);
    
    // Test adding a note
    console.log("\n3. Adding a note...");
    const noteResult = await manager.addNote(devlogId, {
      category: "progress",
      content: "This is a test note"
    });
    console.log(`Added note: ${noteResult.notes[noteResult.notes.length - 1].content}`);
    
    // Test getting the devlog
    console.log("\n4. Getting devlog details...");
    const getResult = await manager.getDevlog(devlogId);
    if (getResult) {
      console.log(`Retrieved devlog: ${getResult.title} (${getResult.status})`);
      console.log(`Notes: ${getResult.notes.length}`);
    }
    
    // Test listing devlogs
    console.log("\n5. Listing all devlogs...");
    const listResult = await manager.listDevlogs();
    console.log(`Found ${listResult.length} devlog entries`);
    
    // Test active context
    console.log("\n6. Getting active context...");
    const contextResult = await manager.getActiveContext(5);
    console.log(`Found ${contextResult.length} active devlog entries`);
    
    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

test();
