#!/usr/bin/env node

// Test script to verify .env loading works
import { config } from "dotenv";
config();

console.log("=== Environment Variables Test ===");
console.log("DEVLOG_STORAGE_TYPE:", process.env.DEVLOG_STORAGE_TYPE);
console.log("DEVLOG_SQLITE_PATH:", process.env.DEVLOG_SQLITE_PATH);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("=== Test Complete ===");
