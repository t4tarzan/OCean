# 🌊 OCEAN Phase 5: Collaboration & Social Features

**Duration:** 4 weeks  
**Status:** Not Started  
**Dependencies:** Phase 1-4 (All previous phases)

---

## Overview

Phase 5 builds the social and collaborative features that make OCEAN feel like a team sport rather than isolated coding. This includes the activity feed, time-travel replay, pattern marketplace, gamification, and real-time collaboration.

**Goal:** Transform development into an engaging, social, collaborative experience where team members learn from each other and celebrate wins together.

---

## Objectives

1. ✅ Build collaborative Kanban board
2. ✅ Implement live presence system (Figma-style)
3. ✅ Create activity feed (CodeStream)
4. ✅ Build time-travel replay system
5. ✅ Develop pattern marketplace
6. ✅ Implement achievement system & gamification
7. ✅ Add real-time notifications

---

## Week 1: Collaborative Board & Live Presence

### 1.1 Enhanced Kanban Board

**Tasks:**
- [x] Extend AutoCoder's Kanban with collaboration features
- [x] Add drag-and-drop for feature assignment
- [x] Implement real-time updates via WebSocket
- [x] Add team member avatars on cards

**Deliverables:**

**Collaborative Kanban:**
```typescript
// app/projects/[id]/board/page.tsx
'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function CollaborativeBoard({ params }: { params: { id: string } }) {
  const { features, updateFeature } = useFeatures(params.id);
  const { teamMembers } = useTeamMembers(params.id);
  const { presence } = usePresence(params.id);
  const ws = useWebSocket(`/projects/${params.id}/board`);

  const columns = {
    backlog: features.filter(f => f.status === 'pending'),
    assigned: features.filter(f => f.status === 'assigned'),
    in_progress: features.filter(f => f.status === 'in_progress'),
    review: features.filter(f => f.status === 'review'),
    done: features.filter(f => f.status === 'done')
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const featureId = active.id as string;
    const newStatus = over.id as string;

    // Update locally
    await updateFeature(featureId, { status: newStatus });

    // Broadcast to team via WebSocket
    ws.send({
      type: 'feature_moved',
      featureId,
      newStatus,
      movedBy: currentUser.id
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Team Board</h1>
        
        {/* Live Presence */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Team online:</span>
          <div className="flex -space-x-2">
            {presence.map(member => (
              <Avatar key={member.id} className="border-2 border-background">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(columns).map(([status, items]) => (
            <KanbanColumn
              key={status}
              status={status}
              features={items}
              teamMembers={teamMembers}
              presence={presence}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ status, features, teamMembers, presence }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold">{status.replace('_', ' ').toUpperCase()}</h2>
        <Badge variant="outline">{features.length}</Badge>
      </div>

      <div className="space-y-2">
        {features.map(feature => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            teamMembers={teamMembers}
            presence={presence}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ feature, teamMembers, presence }) {
  const assignedMember = teamMembers.find(m => m.id === feature.assigned_to);
  const isWorking = presence.find(p => 
    p.userId === feature.assigned_to && p.currentFeature === feature.id
  );

  return (
    <Card className={cn(
      "cursor-move hover:shadow-lg transition-shadow",
      isWorking && "ring-2 ring-blue-500"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm">{feature.title}</h3>
          <Badge variant="outline" className="text-xs">
            P{feature.priority}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {feature.description}
        </p>

        <div className="flex items-center justify-between">
          {assignedMember ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={assignedMember.avatar} />
                <AvatarFallback>{assignedMember.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{assignedMember.name}</span>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="text-xs">
              Assign
            </Button>
          )}

          {isWorking && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Working</span>
            </div>
          )}
        </div>

        {/* AutoCoder Agent Status */}
        {feature.assigned_agent_id && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs">
              <Bot className="w-3 h-3" />
              <span className="text-muted-foreground">
                AI Agent: {feature.agent_progress}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria:**
- Drag-and-drop working
- Real-time updates across all users
- Team member avatars visible
- Agent progress shown

---

### 1.2 Live Presence System

**Tasks:**
- [x] Implement WebSocket presence tracking
- [x] Add cursor sharing (optional)
- [x] Show who's working on what
- [x] Display activity indicators

**Deliverables:**

**Presence Service:**
```typescript
// services/presence/src/PresenceService.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Redis } from 'ioredis';

export class PresenceService {
  private wss: WebSocketServer;
  private redis: Redis;
  private connections: Map<string, WebSocket> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.redis = new Redis();
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const userId = this.extractUserId(req);
      this.connections.set(userId, ws);

      // Send current presence to new connection
      this.sendCurrentPresence(ws);

      ws.on('message', async (data) => {
        const message = JSON.parse(data.toString());
        await this.handlePresenceUpdate(userId, message);
      });

      ws.on('close', () => {
        this.handleDisconnect(userId);
      });
    });
  }

  private async handlePresenceUpdate(userId: string, update: PresenceUpdate): Promise<void> {
    // Store in Redis with TTL
    await this.redis.setex(
      `presence:${userId}`,
      60, // 60 second TTL
      JSON.stringify({
        userId,
        projectId: update.projectId,
        currentFile: update.currentFile,
        currentLine: update.currentLine,
        currentFeature: update.currentFeature,
        aiAgentActive: update.aiAgentActive,
        mood: update.mood,
        timestamp: Date.now()
      })
    );

    // Broadcast to all users in the same project
    await this.broadcastToProject(update.projectId, {
      type: 'presence_update',
      userId,
      presence: update
    });
  }

  private async broadcastToProject(projectId: string, message: any): Promise<void> {
    // Get all users in this project
    const keys = await this.redis.keys(`presence:*`);
    const presences = await Promise.all(
      keys.map(key => this.redis.get(key))
    );

    for (const presenceStr of presences) {
      if (!presenceStr) continue;
      const presence = JSON.parse(presenceStr);
      
      if (presence.projectId === projectId) {
        const ws = this.connections.get(presence.userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    }
  }

  private async sendCurrentPresence(ws: WebSocket): Promise<void> {
    const keys = await this.redis.keys(`presence:*`);
    const presences = await Promise.all(
      keys.map(key => this.redis.get(key))
    );

    ws.send(JSON.stringify({
      type: 'presence_snapshot',
      presences: presences.filter(p => p).map(p => JSON.parse(p))
    }));
  }

  private async handleDisconnect(userId: string): Promise<void> {
    this.connections.delete(userId);
    await this.redis.del(`presence:${userId}`);

    // Broadcast disconnect
    const allKeys = await this.redis.keys(`presence:*`);
    const presences = await Promise.all(
      allKeys.map(key => this.redis.get(key))
    );

    for (const presenceStr of presences) {
      if (!presenceStr) continue;
      const presence = JSON.parse(presenceStr);
      const ws = this.connections.get(presence.userId);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'user_disconnected',
          userId
        }));
      }
    }
  }
}
```

**Presence Hook:**
```typescript
// hooks/usePresence.ts
export function usePresence(projectId: string) {
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to presence WebSocket
    ws.current = new WebSocket(`ws://localhost:3002/presence`);

    ws.current.onopen = () => {
      // Send initial presence
      ws.current?.send(JSON.stringify({
        type: 'presence_update',
        projectId,
        currentFile: null,
        currentLine: null,
        mood: 'coding'
      }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'presence_snapshot':
          setPresence(message.presences.filter(p => p.projectId === projectId));
          break;
        
        case 'presence_update':
          setPresence(prev => {
            const filtered = prev.filter(p => p.userId !== message.userId);
            return [...filtered, message.presence];
          });
          break;
        
        case 'user_disconnected':
          setPresence(prev => prev.filter(p => p.userId !== message.userId));
          break;
      }
    };

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => {
      ws.current?.send(JSON.stringify({
        type: 'heartbeat',
        projectId
      }));
    }, 30000);

    return () => {
      clearInterval(interval);
      ws.current?.close();
    };
  }, [projectId]);

  const updatePresence = (update: Partial<PresenceUpdate>) => {
    ws.current?.send(JSON.stringify({
      type: 'presence_update',
      projectId,
      ...update
    }));
  };

  return { presence, updatePresence };
}
```

**Acceptance Criteria:**
- Real-time presence updates
- Shows who's online
- Displays current activity
- Heartbeat keeping connections alive

---

## Week 2: Activity Feed & Time-Travel Replay

### 2.1 Activity Feed (CodeStream)

**Tasks:**
- [x] Create activity feed system
- [x] Capture all team events
- [x] Add social reactions
- [x] Implement feed filtering

**Deliverables:**

**Activity Feed:**
```typescript
// app/feed/page.tsx
export default function ActivityFeedPage() {
  const { activities, isLoading } = useActivityFeed();
  const { addReaction } = useReactions();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Team Activity</h1>

      <div className="space-y-4">
        {activities.map(activity => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onReact={addReaction}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({ activity, onReact }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={activity.actor.avatar} />
            <AvatarFallback>{activity.actor.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{activity.actor.name}</span>
              <span className="text-sm text-muted-foreground">
                {activity.activity_type === 'feature_completed' && '🎉 completed a feature'}
                {activity.activity_type === 'pattern_shared' && '💡 shared a pattern'}
                {activity.activity_type === 'achievement' && '🏆 unlocked an achievement'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(activity.created_at)} ago
              </span>
            </div>

            <h3 className="font-bold mb-1">{activity.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {activity.description}
            </p>

            {/* Metadata */}
            {activity.metadata && (
              <div className="bg-muted rounded p-3 mb-3">
                {activity.metadata.timeTaken && (
                  <div className="text-sm">
                    ⏱️ Completed in {activity.metadata.timeTaken} minutes
                  </div>
                )}
                {activity.metadata.aiAssisted && (
                  <div className="text-sm">
                    🤖 Built with {activity.metadata.agentCount} AI agents
                  </div>
                )}
              </div>
            )}

            {/* Replay Button */}
            {activity.replay_url && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(activity.replay_url)}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Replay (10x speed)
              </Button>
            )}

            {/* Reactions */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                {Object.entries(activity.reactions || {}).map(([emoji, users]) => (
                  <Button
                    key={emoji}
                    size="sm"
                    variant="ghost"
                    onClick={() => onReact(activity.id, emoji)}
                    className="h-8"
                  >
                    <span>{emoji}</span>
                    <span className="ml-1 text-xs">{users.length}</span>
                  </Button>
                ))}
                <Button size="sm" variant="ghost" className="h-8">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <Button size="sm" variant="ghost">
                💬 {activity.comments_count} comments
              </Button>

              <Button size="sm" variant="ghost">
                🔀 Fork
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Activity Logger:**
```typescript
// services/activity/src/ActivityLogger.ts
export class ActivityLogger {
  private db: Pool;
  private redis: Redis;

  async logActivity(activity: ActivityInput): Promise<void> {
    // 1. Store in database
    const result = await this.db.query(`
      INSERT INTO activity_feed (
        team_id, activity_type, actor_id, actor_type,
        title, description, metadata, replay_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      activity.teamId,
      activity.type,
      activity.actorId,
      activity.actorType,
      activity.title,
      activity.description,
      JSON.stringify(activity.metadata),
      activity.replayUrl
    ]);

    // 2. Publish to Redis for real-time updates
    await this.redis.publish(`activity:${activity.teamId}`, JSON.stringify(result.rows[0]));

    // 3. Send notifications
    await this.notifyTeam(activity.teamId, result.rows[0]);
  }

  async logFeatureCompletion(feature: Feature, timeTaken: number): Promise<void> {
    await this.logActivity({
      teamId: feature.team_id,
      type: 'feature_completed',
      actorId: feature.assigned_to,
      actorType: 'user',
      title: `Completed: ${feature.title}`,
      description: feature.description,
      metadata: {
        featureId: feature.id,
        timeTaken,
        aiAssisted: !!feature.assigned_agent_id,
        agentCount: feature.assigned_agent_id ? 1 : 0
      },
      replayUrl: await this.generateReplayUrl(feature.id)
    });
  }

  private async generateReplayUrl(featureId: string): Promise<string> {
    // Generate time-travel replay URL
    return `/replay/${featureId}`;
  }
}
```

**Acceptance Criteria:**
- Activity feed showing all team events
- Real-time updates
- Reactions working
- Replay links functional

---

### 2.2 Time-Travel Replay System

**Tasks:**
- [x] Record coding sessions
- [x] Generate compressed replays
- [x] Build replay player
- [x] Add speed controls (10x, 20x)

**Deliverables:**

**Session Recorder:**
```typescript
// services/replay/src/SessionRecorder.ts
export class SessionRecorder {
  private db: Pool;
  private recordings: Map<string, Recording> = new Map();

  async startRecording(sessionId: string, userId: string, featureId: string): Promise<void> {
    const recording: Recording = {
      sessionId,
      userId,
      featureId,
      startTime: Date.now(),
      events: [],
      screenshots: []
    };

    this.recordings.set(sessionId, recording);
  }

  async recordEvent(sessionId: string, event: RecordingEvent): Promise<void> {
    const recording = this.recordings.get(sessionId);
    if (!recording) return;

    recording.events.push({
      ...event,
      timestamp: Date.now() - recording.startTime
    });
  }

  async stopRecording(sessionId: string): Promise<string> {
    const recording = this.recordings.get(sessionId);
    if (!recording) throw new Error('Recording not found');

    // 1. Compress events
    const compressed = this.compressEvents(recording.events);

    // 2. Generate highlights
    const highlights = this.generateHighlights(recording.events);

    // 3. Store in database
    const result = await this.db.query(`
      INSERT INTO session_recordings (
        user_id, feature_id, duration, events, highlights
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      recording.userId,
      recording.featureId,
      Date.now() - recording.startTime,
      JSON.stringify(compressed),
      JSON.stringify(highlights)
    ]);

    // 4. Clean up
    this.recordings.delete(sessionId);

    return result.rows[0].id;
  }

  private compressEvents(events: RecordingEvent[]): CompressedEvents {
    // Group similar events
    const grouped: CompressedEvents = {
      keyMoments: [],
      decisions: [],
      codeChanges: []
    };

    for (const event of events) {
      switch (event.type) {
        case 'ai_decision':
          grouped.decisions.push({
            time: event.timestamp,
            decision: event.data.decision,
            icon: '⚡'
          });
          break;
        
        case 'code_change':
          // Only record significant changes
          if (event.data.linesChanged > 10) {
            grouped.codeChanges.push({
              time: event.timestamp,
              file: event.data.file,
              linesChanged: event.data.linesChanged
            });
          }
          break;
        
        case 'test_passed':
          grouped.keyMoments.push({
            time: event.timestamp,
            event: 'Tests passed',
            icon: '✅'
          });
          break;
      }
    }

    return grouped;
  }

  private generateHighlights(events: RecordingEvent[]): Highlight[] {
    return [
      { time: 0, event: 'Started feature', icon: '🚀' },
      ...events
        .filter(e => e.type === 'ai_decision' || e.type === 'test_passed')
        .map(e => ({
          time: e.timestamp,
          event: e.type === 'ai_decision' ? e.data.decision : 'Tests passed',
          icon: e.type === 'ai_decision' ? '⚡' : '✅'
        })),
      { time: events[events.length - 1]?.timestamp || 0, event: 'Feature complete!', icon: '🎉' }
    ];
  }
}
```

**Replay Player:**
```typescript
// app/replay/[id]/page.tsx
export default function ReplayPlayer({ params }: { params: { id: string } }) {
  const { recording, isLoading } = useRecording(params.id);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(10); // 10x speed
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying || !recording) return;

    const interval = setInterval(() => {
      setCurrentTime(t => {
        const next = t + (100 * speed);
        if (next >= recording.duration) {
          setIsPlaying(false);
          return recording.duration;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, speed, recording]);

  const currentEvents = recording?.events.filter(e => e.time <= currentTime) || [];

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Replay: {recording?.feature.title}</h1>
        <p className="text-sm text-muted-foreground">
          Built by {recording?.user.name} in {Math.round(recording?.duration / 60000)} minutes
        </p>
      </div>

      <div className="flex-1 flex">
        {/* Timeline */}
        <div className="flex-1 p-6">
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={recording?.duration || 0}
              step={100}
              onValueChange={([value]) => setCurrentTime(value)}
            />
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            {recording?.highlights.map((highlight, i) => (
              <div
                key={i}
                className={cn(
                  "p-2 rounded border cursor-pointer",
                  currentTime >= highlight.time && "bg-blue-50 border-blue-500"
                )}
                onClick={() => setCurrentTime(highlight.time)}
              >
                <div className="flex items-center gap-2">
                  <span>{highlight.icon}</span>
                  <span className="text-sm">{highlight.event}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDuration(highlight.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code View */}
        <div className="w-1/2 border-l p-6">
          <h3 className="font-bold mb-4">Code Changes</h3>
          <div className="space-y-2">
            {currentEvents.filter(e => e.type === 'code_change').map((event, i) => (
              <div key={i} className="border rounded p-2">
                <div className="text-sm font-mono">{event.data.file}</div>
                <div className="text-xs text-muted-foreground">
                  +{event.data.linesAdded} -{event.data.linesDeleted}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t flex items-center justify-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentTime(0)}
        >
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <div className="flex items-center gap-2">
          <Label>Speed:</Label>
          <Select value={speed.toString()} onValueChange={v => setSpeed(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="5">5x</SelectItem>
              <SelectItem value="10">10x</SelectItem>
              <SelectItem value="20">20x</SelectItem>
              <SelectItem value="50">50x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- Sessions recorded automatically
- Replays generated with highlights
- Player working with speed controls
- Shareable replay links

---

## Week 3: Pattern Marketplace

### 3.1 Pattern Marketplace

**Tasks:**
- [x] Build pattern browsing UI
- [x] Add pattern submission flow
- [x] Implement one-click installation
- [x] Add rating and reviews

**Deliverables:**

**Pattern Marketplace:**
```typescript
// app/marketplace/page.tsx
export default function PatternMarketplace() {
  const { patterns, isLoading } = usePatterns();
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');

  const filteredPatterns = patterns
    ?.filter(p => !category || p.category === category)
    ?.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.times_used - a.times_used;
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating':
          return b.success_rate - a.success_rate;
        default:
          return 0;
      }
    });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Pattern Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and share successful development patterns
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64">
          <Card>
            <CardHeader>
              <h3 className="font-bold">Categories</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Button
                  variant={!category ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setCategory(null)}
                >
                  All Patterns
                </Button>
                {['auth', 'api', 'database', 'ui', 'testing', 'deployment'].map(cat => (
                  <Button
                    key={cat}
                    variant={category === cat ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patterns Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label>Sort by:</Label>
              <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Submit Pattern
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredPatterns?.map(pattern => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatternCard({ pattern }) {
  const { installPattern } = usePatternInstaller();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold">{pattern.name}</h3>
            <Badge variant="outline" className="mt-1">{pattern.category}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {(pattern.success_rate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {pattern.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{pattern.times_used} uses</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{pattern.avg_time_to_implement}min avg</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => installPattern(pattern.id)}
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
          <Button variant="outline" onClick={() => viewPattern(pattern.id)}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Pattern Installer:**
```typescript
// hooks/usePatternInstaller.ts
export function usePatternInstaller() {
  const installPattern = async (patternId: string) => {
    // 1. Fetch pattern details
    const pattern = await fetch(`/api/patterns/${patternId}`).then(r => r.json());

    // 2. Install dependencies
    if (pattern.dependencies) {
      await installDependencies(pattern.dependencies);
    }

    // 3. Copy files to project
    for (const file of pattern.files) {
      await writeFile(file.path, file.content);
    }

    // 4. Activate MCPs if needed
    if (pattern.mcps_used) {
      await activateMCPs(pattern.mcps_used);
    }

    // 5. Log usage
    await fetch(`/api/patterns/${patternId}/usage`, {
      method: 'POST'
    });

    toast.success(`Pattern "${pattern.name}" installed successfully!`);
  };

  return { installPattern };
}
```

**Acceptance Criteria:**
- Patterns browsable by category
- One-click installation working
- Usage tracked
- Ratings displayed

---

## Week 4: Gamification & Achievements

### 4.1 Achievement System

**Tasks:**
- [ ] Define achievement criteria
- [ ] Implement achievement tracking
- [ ] Build achievement UI
- [ ] Add unlock rewards (MCPs, features)

**Deliverables:**

**Achievement System:**
```typescript
// services/achievements/src/AchievementSystem.ts
export class AchievementSystem {
  private db: Pool;

  async checkAchievements(userId: string, event: UserEvent): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];

    // Get all achievements
    const achievements = await this.db.query('SELECT * FROM achievements');

    for (const achievement of achievements.rows) {
      // Check if already unlocked
      const existing = await this.db.query(`
        SELECT * FROM user_achievements
        WHERE user_id = $1 AND achievement_id = $2
      `, [userId, achievement.id]);

      if (existing.rows.length > 0) continue;

      // Check if criteria met
      if (await this.checkCriteria(userId, achievement.requirements, event)) {
        // Unlock achievement
        await this.unlockAchievement(userId, achievement);
        unlocked.push(achievement);
      }
    }

    return unlocked;
  }

  private async checkCriteria(
    userId: string,
    requirements: any,
    event: UserEvent
  ): Promise<boolean> {
    switch (requirements.type) {
      case 'feature_count':
        const count = await this.getUserFeatureCount(userId);
        return count >= requirements.count;
      
      case 'speed':
        return event.type === 'feature_completed' &&
               event.timeTaken <= requirements.maxTime;
      
      case 'help_count':
        const helpCount = await this.getUserHelpCount(userId);
        return helpCount >= requirements.count;
      
      case 'pattern_share':
        const patterns = await this.getUserPatterns(userId);
        return patterns.length >= requirements.count;
      
      default:
        return false;
    }
  }

  private async unlockAchievement(userId: string, achievement: Achievement): Promise<void> {
    // 1. Store unlock
    await this.db.query(`
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES ($1, $2)
    `, [userId, achievement.id]);

    // 2. Grant rewards
    if (achievement.unlocks_mcps) {
      await this.unlockMCPs(userId, achievement.unlocks_mcps);
    }

    if (achievement.unlocks_features) {
      await this.unlockFeatures(userId, achievement.unlocks_features);
    }

    // 3. Notify user
    await this.notifyUser(userId, {
      type: 'achievement_unlocked',
      achievement
    });

    // 4. Log to activity feed
    await activityLogger.logActivity({
      teamId: await this.getUserTeam(userId),
      type: 'achievement',
      actorId: userId,
      actorType: 'user',
      title: `🏆 Unlocked: ${achievement.name}`,
      description: achievement.description,
      metadata: {
        achievementId: achievement.id,
        rarity: achievement.rarity
      }
    });
  }
}
```

**Achievements Definition:**
```typescript
// database/seed-achievements.sql
INSERT INTO achievements (name, description, icon, rarity, requirements, unlocks_mcps) VALUES
('First Blood', 'Ship your first feature with AI', '🎯', 'common', 
 '{"type": "feature_count", "count": 1}', 
 ARRAY['database-provisioner']),

('Speed Demon', 'Ship a feature in under 10 minutes', '⚡', 'rare',
 '{"type": "speed", "maxTime": 600000}',
 ARRAY['rag-pipeline', 'knowledge-graph']),

('Team Player', 'Help 5 teammates with patterns', '🤝', 'epic',
 '{"type": "help_count", "count": 5}',
 ARRAY['pattern-library-access']),

('AI Whisperer', 'Get AI to solve complex problem in one prompt', '🧙', 'legendary',
 '{"type": "prompt_efficiency", "maxAttempts": 1}',
 ARRAY['all-advanced-mcps']),

('Full Stack Hero', 'Ship complete app in one day', '🦸', 'legendary',
 '{"type": "full_stack", "maxTime": 86400000}',
 ARRAY['deployment-automation']);
```

**Achievement UI:**
```typescript
// app/achievements/page.tsx
export default function AchievementsPage() {
  const { achievements, userAchievements } = useAchievements();

  const unlocked = achievements?.filter(a =>
    userAchievements?.some(ua => ua.achievement_id === a.id)
  );
  const locked = achievements?.filter(a =>
    !userAchievements?.some(ua => ua.achievement_id === a.id)
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Achievements</h1>

      <Tabs defaultValue="unlocked">
        <TabsList>
          <TabsTrigger value="unlocked">
            Unlocked ({unlocked?.length})
          </TabsTrigger>
          <TabsTrigger value="locked">
            Locked ({locked?.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unlocked">
          <div className="grid grid-cols-3 gap-4">
            {unlocked?.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} unlocked />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="locked">
          <div className="grid grid-cols-3 gap-4">
            {locked?.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AchievementCard({ achievement, unlocked }) {
  return (
    <Card className={cn(!unlocked && "opacity-50")}>
      <CardContent className="p-6 text-center">
        <div className="text-6xl mb-4">{achievement.icon}</div>
        <h3 className="font-bold mb-2">{achievement.name}</h3>
        <Badge className="mb-4">{achievement.rarity}</Badge>
        <p className="text-sm text-muted-foreground mb-4">
          {achievement.description}
        </p>

        {unlocked ? (
          <div className="text-sm text-green-600">
            ✓ Unlocked
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            🔒 Locked
          </div>
        )}

        {achievement.unlocks_mcps && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs font-medium mb-2">Unlocks:</div>
            <div className="flex flex-wrap gap-1 justify-center">
              {achievement.unlocks_mcps.map(mcp => (
                <Badge key={mcp} variant="outline" className="text-xs">
                  {mcp}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Acceptance Criteria:**
- Achievements tracking automatically
- Unlocks granting rewards
- UI showing progress
- Notifications on unlock

---

## Deliverables Summary

- ✅ Collaborative Kanban board with real-time updates
- ✅ Live presence system (Figma-style)
- ✅ Activity feed (CodeStream)
- ✅ Time-travel replay system
- ✅ Pattern marketplace
- ✅ Achievement system & gamification
- ✅ Real-time notifications

---

## Success Metrics

- [ ] 100% of team activity visible in feed
- [ ] Presence updates < 1 second latency
- [ ] Replay generation < 5 seconds
- [ ] 20+ patterns in marketplace
- [ ] 10+ achievements defined
- [ ] Team engagement increased 3x

---

## Next Phase

Once Phase 5 is complete, proceed to [Phase 6: Advanced Features & Polish](./ocean6.md)

---

**Phase Owner:** [Name]  
**Start Date:** [Date]  
**Target Completion:** [Date + 4 weeks]  
**Status:** Not Started
