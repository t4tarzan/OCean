import { createClient, RedisClientType } from 'redis';
import { AgentMessage } from '../types';

class RedisMessageBus {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private handlers: Map<string, (message: AgentMessage) => void>;

  constructor() {
    this.publisher = createClient({ url: process.env.REDIS_URL });
    this.subscriber = createClient({ url: process.env.REDIS_URL });
    this.handlers = new Map();
  }

  async connect() {
    await this.publisher.connect();
    await this.subscriber.connect();
    console.log('Redis message bus connected');
  }

  async disconnect() {
    await this.publisher.disconnect();
    await this.subscriber.disconnect();
  }

  async publish(channel: string, message: AgentMessage) {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, handler: (message: AgentMessage) => void) {
    this.handlers.set(channel, handler);
    
    await this.subscriber.subscribe(channel, (messageStr) => {
      try {
        const message = JSON.parse(messageStr) as AgentMessage;
        const handler = this.handlers.get(channel);
        if (handler) {
          handler(message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
  }

  async unsubscribe(channel: string) {
    await this.subscriber.unsubscribe(channel);
    this.handlers.delete(channel);
  }

  // Publish to agent-specific channel
  async sendToAgent(agentId: string, message: AgentMessage) {
    await this.publish(`agent:${agentId}`, message);
  }

  // Subscribe to agent-specific channel
  async subscribeToAgent(agentId: string, handler: (message: AgentMessage) => void) {
    await this.subscribe(`agent:${agentId}`, handler);
  }

  // Broadcast to all agents
  async broadcast(message: AgentMessage) {
    await this.publish('agents:broadcast', message);
  }
}

export default new RedisMessageBus();
