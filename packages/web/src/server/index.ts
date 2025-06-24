// Load environment variables from .env file
import { config } from "dotenv";
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

import { DevlogManager } from '@devlog/core';
import { devlogRoutes } from './routes/devlog-routes.js';
import { setupWebSocket } from './websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Find the best location for .devlog directory based on context
  function findDevlogDirectory(): string {
    // Check for user configuration first
    const configuredPath = process.env.DEVLOG_DIR;
    if (configuredPath) {
      console.log(`Using configured devlog directory: ${configuredPath}`);
      return configuredPath;
    }

    let currentDir = process.cwd();

    // Strategy 1: If we're in the devlog project itself, use its root
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, "package.json");
      const pnpmWorkspacePath = path.join(currentDir, "pnpm-workspace.yaml");

      // Check if this is the devlog project by looking for specific markers
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

          // This is the devlog project itself if it has our specific package name
          if (packageJson.name === "devlog" && packageJson.description?.includes("development logging tools")) {
            const devlogDir = path.join(currentDir, ".devlog");
            console.log(`Detected devlog project development, using project .devlog: ${devlogDir}`);
            return devlogDir;
          }

          // Check if this is a workspace root with the devlog project
          if (packageJson.workspaces || fs.existsSync(pnpmWorkspacePath)) {
            // Look for devlog-specific packages in workspace
            const packagesDir = path.join(currentDir, "packages");
            if (fs.existsSync(packagesDir)) {
              const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

              if (packages.includes("mcp-server") && packages.includes("core") && packages.includes("types")) {
                const devlogDir = path.join(currentDir, ".devlog");
                console.log(`Detected devlog monorepo, using workspace .devlog: ${devlogDir}`);
                return devlogDir;
              }
            }
          }
        } catch (error) {
          // Continue searching if package.json is invalid
        }
      }

      currentDir = path.dirname(currentDir);
    }

    // Strategy 2: Find the nearest project root for external projects
    currentDir = process.cwd();
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, "package.json");
      const gitPath = path.join(currentDir, ".git");

      // If we find a package.json or .git, this is likely a project root
      if (fs.existsSync(packageJsonPath) || fs.existsSync(gitPath)) {
        const devlogDir = path.join(currentDir, ".devlog");
        console.log(`Found project root, using project-local .devlog: ${devlogDir}`);
        return devlogDir;
      }

      currentDir = path.dirname(currentDir);
    }

    // Strategy 3: Fall back to global ~/.devlog if no project context found
    const homeDir = process.env.HOME || process.env.USERPROFILE || "~";
    const globalDevlogDir = path.join(homeDir, ".devlog");
    console.log(`No project context found, using global .devlog: ${globalDevlogDir}`);
    return globalDevlogDir;
  }

  // Initialize DevlogManager
  const devlogDirectory = findDevlogDirectory();
  console.log(`Web server using devlog directory: ${devlogDirectory}`);
  const devlogManager = new DevlogManager({
    workspaceRoot: path.dirname(devlogDirectory),
    storage: {
      type: 'sqlite',
      filePath: path.join(devlogDirectory, 'devlogs.db')
    }
  });

  // Initialize the devlog manager
  await devlogManager.initialize();

  // API Routes
  app.use('/api/devlogs', devlogRoutes(devlogManager));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../../dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Setup WebSocket for real-time updates
  setupWebSocket(wss, devlogManager);

  const PORT = process.env.PORT || 3001;

  server.listen(PORT, () => {
    console.log(`🚀 Devlog Web Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      process.exit(0);
    });
  });

}

// Start the server
startServer().catch(console.error);