'use client';

/**
 * Activity Feed Page
 * ==================
 * 
 * CodeStream-style social activity feed showing team events,
 * achievements, and collaborative moments.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { Play, Plus, MessageCircle, GitFork, Loader2, Filter } from 'lucide-react';

interface Activity {
  id: string;
  team_id: string;
  activity_type: 'feature_completed' | 'pattern_shared' | 'achievement' | 'decision_made' | 'agent_task';
  actor_id: string;
  actor_type: 'user' | 'agent';
  actor: {
    name: string;
    avatar?: string;
  };
  title: string;
  description: string;
  metadata?: {
    timeTaken?: number;
    aiAssisted?: boolean;
    agentCount?: number;
    linesOfCode?: number;
    complexity?: string;
  };
  replay_url?: string;
  reactions?: Record<string, string[]>;
  comments_count: number;
  created_at: Date;
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'features' | 'patterns' | 'achievements'>('all');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/activity?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addReaction = async (activityId: string, emoji: string) => {
    try {
      await fetch(`/api/activity/${activityId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      loadActivities();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Activity</h1>
          <p className="text-muted-foreground">
            See what your team is building and celebrate wins together
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No activity yet. Start building!</p>
            </CardContent>
          </Card>
        ) : (
          activities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onReact={addReaction}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  onReact
}: {
  activity: Activity;
  onReact: (activityId: string, emoji: string) => void;
}) {
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'feature_completed':
        return '🎉';
      case 'pattern_shared':
        return '💡';
      case 'achievement':
        return '🏆';
      case 'decision_made':
        return '🎯';
      case 'agent_task':
        return '🤖';
      default:
        return '📝';
    }
  };

  const getActivityText = () => {
    switch (activity.activity_type) {
      case 'feature_completed':
        return 'completed a feature';
      case 'pattern_shared':
        return 'shared a pattern';
      case 'achievement':
        return 'unlocked an achievement';
      case 'decision_made':
        return 'made a decision';
      case 'agent_task':
        return 'completed an AI task';
      default:
        return 'did something';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={activity.actor.avatar} />
            <AvatarFallback>{activity.actor.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-medium">{activity.actor.name}</span>
              <span className="text-sm text-muted-foreground">
                {getActivityIcon()} {getActivityText()}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at))} ago
              </span>
              {activity.actor_type === 'agent' && (
                <Badge variant="secondary" className="text-xs">
                  AI Agent
                </Badge>
              )}
            </div>

            {/* Content */}
            <h3 className="font-bold mb-1">{activity.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {activity.description}
            </p>

            {/* Metadata */}
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 mb-3 space-y-1">
                {activity.metadata.timeTaken && (
                  <div className="text-sm flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Completed in {activity.metadata.timeTaken} minutes</span>
                  </div>
                )}
                {activity.metadata.aiAssisted && (
                  <div className="text-sm flex items-center gap-2">
                    <span>🤖</span>
                    <span>Built with {activity.metadata.agentCount || 1} AI agents</span>
                  </div>
                )}
                {activity.metadata.linesOfCode && (
                  <div className="text-sm flex items-center gap-2">
                    <span>📝</span>
                    <span>{activity.metadata.linesOfCode} lines of code</span>
                  </div>
                )}
                {activity.metadata.complexity && (
                  <div className="text-sm flex items-center gap-2">
                    <span>📊</span>
                    <span>Complexity: {activity.metadata.complexity}</span>
                  </div>
                )}
              </div>
            )}

            {/* Replay Button */}
            {activity.replay_url && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(activity.replay_url, '_blank')}
                className="mb-3"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Replay (10x speed)
              </Button>
            )}

            {/* Reactions & Actions */}
            <div className="flex items-center gap-4 pt-3 border-t">
              {/* Reactions */}
              <div className="flex items-center gap-1">
                {activity.reactions && Object.entries(activity.reactions).map(([emoji, users]) => (
                  <Button
                    key={emoji}
                    size="sm"
                    variant="ghost"
                    onClick={() => onReact(activity.id, emoji)}
                    className="h-8 px-2"
                    title={`${users.length} reactions`}
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="ml-1 text-xs text-muted-foreground">{users.length}</span>
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => onReact(activity.id, '👍')}
                  title="Add reaction"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Comments */}
              <Button size="sm" variant="ghost" className="h-8">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">{activity.comments_count}</span>
              </Button>

              {/* Fork */}
              {activity.activity_type === 'pattern_shared' && (
                <Button size="sm" variant="ghost" className="h-8">
                  <GitFork className="w-4 h-4 mr-1" />
                  <span className="text-xs">Fork</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
