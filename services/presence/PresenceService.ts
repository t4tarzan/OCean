/**
 * Presence Service
 * ================
 * 
 * WebSocket-based real-time presence tracking showing who's working on what.
 * Uses Redis for distributed presence state with TTL.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createClient, RedisClientType } from 'redis';
import { IncomingMessage } from 'http';

export interface PresenceUpdate {
  projectId: string;
  currentFile?: string;
  currentLine?: number;
  currentFeature?: string;
  aiAgentActive?: boolean;
  mood?: 'coding' | 'reviewing' | 'thinking' | 'break';
}

export interface PresenceData extends PresenceUpdate {
  userId: string;
  userName: string;
  timestamp: number;
}

export class PresenceService {
  private wss: WebSocketServer;
  private redis: RedisClientType;
  private connections: Map<string, WebSocket> = new Map();
  private userInfo: Map<string, { id: string; name: string }> = new Map();

  constructor(port: number = 3003) {
    this.wss = new WebSocketServer({ port });
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.redis.connect();
    this.setupWebSocket();
    this.startHeartbeat();
    console.log(`✅ Presence Service running on port ${this.wss.options.port}`);
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const userId = this.extractUserId(req);
      const userName = this.extractUserName(req);

      if (!userId) {
        ws.close(1008, 'User ID required');
        return;
      }

      this.connections.set(userId, ws);
      this.userInfo.set(userId, { id: userId, name: userName });

      console.log(`👤 User connected: ${userName} (${userId})`);

      // Send current presence snapshot to new connection
      this.sendCurrentPresence(ws);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(userId, userName, message);
        } catch (error) {
          console.error('Failed to handle message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(userId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });
    });
  }

  private extractUserId(req: IncomingMessage): string | null {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    return url.searchParams.get('userId');
  }

  private extractUserName(req: IncomingMessage): string {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    return url.searchParams.get('userName') || 'Anonymous';
  }

  private async handleMessage(
    userId: string,
    userName: string,
    message: any
  ): Promise<void> {
    switch (message.type) {
      case 'presence_update':
        await this.handlePresenceUpdate(userId, userName, message);
        break;
      case 'heartbeat':
        await this.handleHeartbeat(userId, userName, message.projectId);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private async handlePresenceUpdate(
    userId: string,
    userName: string,
    update: PresenceUpdate
  ): Promise<void> {
    const presenceData: PresenceData = {
      userId,
      userName,
      projectId: update.projectId,
      currentFile: update.currentFile,
      currentLine: update.currentLine,
      currentFeature: update.currentFeature,
      aiAgentActive: update.aiAgentActive,
      mood: update.mood || 'coding',
      timestamp: Date.now()
    };

    // Store in Redis with 60 second TTL
    await this.redis.setEx(
      `presence:${userId}`,
      60,
      JSON.stringify(presenceData)
    );

    // Broadcast to all users in the same project
    await this.broadcastToProject(update.projectId, {
      type: 'presence_update',
      presence: presenceData
    });

    console.log(`📍 Presence update: ${userName} working on ${update.currentFeature || 'project'}`);
  }

  private async handleHeartbeat(
    userId: string,
    userName: string,
    projectId: string
  ): Promise<void> {
    // Refresh TTL on heartbeat
    const key = `presence:${userId}`;
    const presenceStr = await this.redis.get(key);
    
    if (presenceStr) {
      const presence = JSON.parse(presenceStr);
      presence.timestamp = Date.now();
      await this.redis.setEx(key, 60, JSON.stringify(presence));
    }
  }

  private async broadcastToProject(projectId: string, message: any): Promise<void> {
    const keys = await this.redis.keys('presence:*');
    const presences = await Promise.all(
      keys.map(key => this.redis.get(key))
    );

    for (const presenceStr of presences) {
      if (!presenceStr) continue;
      
      try {
        const presence: PresenceData = JSON.parse(presenceStr);
        
        if (presence.projectId === projectId) {
          const ws = this.connections.get(presence.userId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        }
      } catch (error) {
        console.error('Failed to broadcast to user:', error);
      }
    }
  }

  private async sendCurrentPresence(ws: WebSocket): Promise<void> {
    try {
      const keys = await this.redis.keys('presence:*');
      const presences = await Promise.all(
        keys.map(key => this.redis.get(key))
      );

      const activePresences = presences
        .filter(p => p)
        .map(p => JSON.parse(p as string));

      ws.send(JSON.stringify({
        type: 'presence_snapshot',
        presences: activePresences
      }));
    } catch (error) {
      console.error('Failed to send presence snapshot:', error);
    }
  }

  private async handleDisconnect(userId: string): Promise<void> {
    const userInfo = this.userInfo.get(userId);
    console.log(`👋 User disconnected: ${userInfo?.name || userId}`);

    this.connections.delete(userId);
    this.userInfo.delete(userId);

    // Get user's project before deleting
    const presenceStr = await this.redis.get(`presence:${userId}`);
    let projectId: string | null = null;

    if (presenceStr) {
      const presence: PresenceData = JSON.parse(presenceStr);
      projectId = presence.projectId;
    }

    // Delete from Redis
    await this.redis.del(`presence:${userId}`);

    // Broadcast disconnect to project members
    if (projectId) {
      await this.broadcastToProject(projectId, {
        type: 'user_disconnected',
        userId
      });
    }
  }

  private startHeartbeat(): void {
    // Clean up stale connections every 30 seconds
    setInterval(async () => {
      const keys = await this.redis.keys('presence:*');
      const now = Date.now();

      for (const key of keys) {
        const presenceStr = await this.redis.get(key);
        if (!presenceStr) continue;

        try {
          const presence: PresenceData = JSON.parse(presenceStr);
          
          // If presence is older than 90 seconds, remove it
          if (now - presence.timestamp > 90000) {
            await this.redis.del(key);
            console.log(`🧹 Cleaned up stale presence: ${presence.userName}`);
          }
        } catch (error) {
          console.error('Failed to check presence:', error);
        }
      }
    }, 30000);
  }

  /**
   * Get all active users in a project
   */
  async getProjectPresence(projectId: string): Promise<PresenceData[]> {
    const keys = await this.redis.keys('presence:*');
    const presences = await Promise.all(
      keys.map(key => this.redis.get(key))
    );

    return presences
      .filter(p => p)
      .map(p => JSON.parse(p as string))
      .filter((p: PresenceData) => p.projectId === projectId);
  }

  /**
   * Close the service
   */
  async close(): Promise<void> {
    this.wss.close();
    await this.redis.quit();
    console.log('✅ Presence Service closed');
  }
}

// Start the service if run directly
if (require.main === module) {
  const port = parseInt(process.env.PRESENCE_PORT || '3003');
  new PresenceService(port);
}

export default PresenceService;
