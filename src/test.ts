#!/usr/bin/env node

import { DevlogManager } from "./devlog-manager.js";

async function test() {
  console.log("Testing Devlog Manager...");
  
  const manager = new DevlogManager("./test-workspace");
  
  try {
    // Test creating a devlog
    console.log("\n1. Creating a devlog...");
    const createResult = await manager.createDevlog({
      title: "Test Feature",
      type: "feature",
      description: "This is a test feature",
      priority: "medium"
    });
    console.log(createResult.content[0].text);
    
    // Extract ID from the result
    const idMatch = createResult.content[0].text.match(/Created devlog entry: (.+)/);
    const devlogId = idMatch ? idMatch[1].split('\n')[0] : null;
    
    if (!devlogId) {
      throw new Error("Could not extract devlog ID");
    }
    
    // Test updating the devlog
    console.log("\n2. Updating the devlog...");
    const updateResult = await manager.updateDevlog({
      id: devlogId,
      status: "in-progress",
      progress: "Started working on the feature"
    });
    console.log(updateResult.content[0].text);
    
    // Test adding a note
    console.log("\n3. Adding a note...");
    const noteResult = await manager.addNote({
      id: devlogId,
      note: "This is a test note",
      category: "progress"
    });
    console.log(noteResult.content[0].text);
    
    // Test getting the devlog
    console.log("\n4. Getting devlog details...");
    const getResult = await manager.getDevlog(devlogId);
    console.log(getResult.content[0].text);
    
    // Test listing devlogs
    console.log("\n5. Listing all devlogs...");
    const listResult = await manager.listDevlogs();
    console.log(listResult.content[0].text);
    
    // Test active context
    console.log("\n6. Getting active context...");
    const contextResult = await manager.getActiveContext(5);
    console.log(contextResult.content[0].text);
    
    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

test();
