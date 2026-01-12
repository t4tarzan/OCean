'use client';

/**
 * usePresence Hook
 * ================
 * 
 * React hook for real-time presence tracking via WebSocket.
 * Shows who's online and what they're working on.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PresenceUser {
  userId: string;
  userName: string;
  projectId: string;
  currentFile?: string;
  currentLine?: number;
  currentFeature?: string;
  aiAgentActive?: boolean;
  mood?: 'coding' | 'reviewing' | 'thinking' | 'break';
  timestamp: number;
}

export interface UsePresenceOptions {
  projectId: string;
  userId: string;
  userName: string;
  autoConnect?: boolean;
}

export function usePresence({
  projectId,
  userId,
  userName,
  autoConnect = true
}: UsePresenceOptions) {
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `ws://localhost:3003?userId=${userId}&userName=${encodeURIComponent(userName)}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('✅ Connected to presence service');
      setIsConnected(true);

      // Send initial presence
      updatePresence({
        projectId,
        mood: 'coding'
      });

      // Start heartbeat
      heartbeatInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'heartbeat',
            projectId
          }));
        }
      }, 30000); // Every 30 seconds
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse presence message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('❌ Disconnected from presence service');
      setIsConnected(false);
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }

      // Attempt reconnect after 5 seconds
      setTimeout(() => {
        if (autoConnect) {
          connect();
        }
      }, 5000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [projectId, userId, userName, autoConnect]);

  const disconnect = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    ws.current?.close();
    ws.current = null;
    setIsConnected(false);
  }, []);

  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'presence_snapshot':
        // Initial snapshot of all users
        setPresence(message.presences.filter((p: PresenceUser) => p.projectId === projectId));
        break;

      case 'presence_update':
        // Update or add user presence
        setPresence(prev => {
          const filtered = prev.filter(p => p.userId !== message.presence.userId);
          if (message.presence.projectId === projectId) {
            return [...filtered, message.presence];
          }
          return filtered;
        });
        break;

      case 'user_disconnected':
        // Remove disconnected user
        setPresence(prev => prev.filter(p => p.userId !== message.userId));
        break;

      default:
        console.log('Unknown presence message type:', message.type);
    }
  };

  const updatePresence = useCallback((update: Partial<PresenceUser>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'presence_update',
        projectId,
        ...update
      }));
    }
  }, [projectId]);

  const setCurrentFeature = useCallback((featureId: string | null) => {
    updatePresence({ currentFeature: featureId || undefined });
  }, [updatePresence]);

  const setCurrentFile = useCallback((file: string | null, line?: number) => {
    updatePresence({
      currentFile: file || undefined,
      currentLine: line
    });
  }, [updatePresence]);

  const setMood = useCallback((mood: PresenceUser['mood']) => {
    updatePresence({ mood });
  }, [updatePresence]);

  const setAIAgentActive = useCallback((active: boolean) => {
    updatePresence({ aiAgentActive: active });
  }, [updatePresence]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    presence: presence.filter(p => p.userId !== userId), // Exclude self
    isConnected,
    connect,
    disconnect,
    updatePresence,
    setCurrentFeature,
    setCurrentFile,
    setMood,
    setAIAgentActive
  };
}
