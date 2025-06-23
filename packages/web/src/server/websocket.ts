import { WebSocketServer, WebSocket } from 'ws';
import { DevlogManager } from '@devlog/core';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  channel?: string;
  data?: any;
}

interface ClientConnection {
  ws: WebSocket;
  subscriptions: Set<string>;
}

export function setupWebSocket(wss: WebSocketServer, devlogManager: DevlogManager) {
  const clients: Set<ClientConnection> = new Set();

  wss.on('connection', (ws: WebSocket) => {
    const client: ClientConnection = {
      ws,
      subscriptions: new Set()
    };
    
    clients.add(client);
    console.log('New WebSocket connection established');

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'subscribe':
            if (message.channel) {
              client.subscriptions.add(message.channel);
              ws.send(JSON.stringify({
                type: 'subscribed',
                channel: message.channel
              }));
            }
            break;
            
          case 'unsubscribe':
            if (message.channel) {
              client.subscriptions.delete(message.channel);
              ws.send(JSON.stringify({
                type: 'unsubscribed',
                channel: message.channel
              }));
            }
            break;
            
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(client);
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(client);
    });

    // Send initial connection success
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString()
    }));
  });

  // Broadcast updates to subscribed clients
  function broadcast(channel: string, data: any) {
    const message = JSON.stringify({
      type: 'update',
      channel,
      data,
      timestamp: new Date().toISOString()
    });

    clients.forEach(client => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  // Return broadcast function for use by other modules
  return { broadcast };
}
