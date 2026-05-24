import http from 'node:http';
import os from 'node:os';
import { WebSocketServer, type WebSocket } from 'ws';

let collabServer: http.Server | null = null;
let collabPort = 0;

const rooms = new Map<string, Set<WebSocket>>();

function localLanHost() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  return '127.0.0.1';
}

export function startCollabServer(): Promise<{ port: number; url: string }> {
  if (collabServer && collabPort) {
    return Promise.resolve({ port: collabPort, url: `ws://${localLanHost()}:${collabPort}` });
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('DansWord collaboration server');
    });
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
      const room = (req.url ?? '/room').slice(1).split('?')[0] || 'room';
      if (!rooms.has(room)) rooms.set(room, new Set());
      rooms.get(room)!.add(ws);

      ws.on('message', (data) => {
        for (const client of rooms.get(room) ?? []) {
          if (client !== ws && client.readyState === 1) {
            client.send(data);
          }
        }
      });

      ws.on('close', () => {
        rooms.get(room)?.delete(ws);
        if (rooms.get(room)?.size === 0) rooms.delete(room);
      });
    });

    server.listen(0, '0.0.0.0', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind collab port'));
        return;
      }
      collabServer = server;
      collabPort = addr.port;
      resolve({ port: collabPort, url: `ws://${localLanHost()}:${collabPort}` });
    });
    server.on('error', reject);
  });
}

export function stopCollabServer() {
  if (collabServer) {
    collabServer.close();
    collabServer = null;
    collabPort = 0;
    rooms.clear();
  }
}

export function getCollabUrl() {
  return collabPort ? `ws://${localLanHost()}:${collabPort}` : null;
}
