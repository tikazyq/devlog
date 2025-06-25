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

import { DevlogManager, ConfigurationManager } from '@devlog/core';
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
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize DevlogManager using ConfigurationManager for consistency with MCP server
  console.log(`Web server working directory: ${process.cwd()}`);
  
  const configManager = new ConfigurationManager(process.cwd());
  const config = await configManager.loadConfig();
  
  console.log(`Web server using storage config:`, {
    type: config.storage.type,
    ...(config.storage.type === 'sqlite' && { filePath: config.storage.filePath }),
    workspaceRoot: config.workspaceRoot
  });
  
  const devlogManager = new DevlogManager({
    workspaceRoot: config.workspaceRoot,
    storage: config.storage,
    integrations: config.integrations
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

  server.listen(PORT, (err?: Error) => {
    if (err) {
      console.error('Failed to start server:', err);
      if (err.message.includes('EADDRINUSE')) {
        console.log('Port in use, trying alternative port...');
        const altPort = parseInt(PORT.toString()) + 1;
        server.listen(altPort, () => {
          console.log(`🚀 Devlog Web Server running on port ${altPort}`);
          console.log(`📊 Dashboard: http://localhost:${altPort}`);
          console.log(`🔌 WebSocket: ws://localhost:${altPort}/ws`);
        });
      }
      return;
    }
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