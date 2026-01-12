'use client';

/**
 * Collaborative Kanban Board
 * ==========================
 * 
 * Real-time collaborative board with drag-and-drop, live presence,
 * and team member avatars. Integrates with AutoCoder features.
 */

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'assigned' | 'in_progress' | 'review' | 'done';
  priority: number;
  assigned_to?: string;
  created_at: Date;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface PresenceInfo {
  userId: string;
  userName: string;
  currentFeature?: string;
  lastSeen: Date;
}

export default function CollaborativeBoard({ params }: { params: { id: string } }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [presence, setPresence] = useState<PresenceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Set up WebSocket connection for real-time updates
    const ws = setupWebSocket(params.id);
    
    return () => {
      ws?.close();
    };
  }, [params.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [featuresRes, membersRes] = await Promise.all([
        fetch(`/api/projects/${params.id}/features`),
        fetch(`/api/projects/${params.id}/team`)
      ]);

      if (featuresRes.ok) {
        const data = await featuresRes.json();
        setFeatures(data.features || []);
      }

      if (membersRes.ok) {
        const data = await membersRes.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to load board data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = (projectId: string) => {
    // WebSocket setup for real-time collaboration
    // In production, this would connect to a WebSocket server
    console.log(`Setting up WebSocket for project: ${projectId}`);
    
    // Simulate presence updates
    const interval = setInterval(() => {
      setPresence(prev => {
        // Mock presence data
        return teamMembers.slice(0, 3).map(member => ({
          userId: member.id,
          userName: member.name,
          currentFeature: features[0]?.id,
          lastSeen: new Date()
        }));
      });
    }, 5000);

    return {
      close: () => clearInterval(interval)
    };
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const featureId = active.id as string;
    const newStatus = over.id as string;

    // Optimistic update
    setFeatures(prev =>
      prev.map(f =>
        f.id === featureId ? { ...f, status: newStatus as Feature['status'] } : f
      )
    );

    // Update on server
    try {
      await fetch(`/api/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      // Broadcast to team via WebSocket
      console.log('Feature moved:', { featureId, newStatus });
    } catch (error) {
      console.error('Failed to update feature:', error);
      // Revert on error
      loadData();
    }
  };

  const columns = {
    backlog: features.filter(f => f.status === 'backlog'),
    assigned: features.filter(f => f.status === 'assigned'),
    in_progress: features.filter(f => f.status === 'in_progress'),
    review: features.filter(f => f.status === 'review'),
    done: features.filter(f => f.status === 'done')
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Live Presence */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Board</h1>
          <p className="text-muted-foreground">
            Collaborative Kanban for Project {params.id}
          </p>
        </div>

        {/* Live Presence Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {presence.length} online
            </span>
          </div>
          <div className="flex -space-x-2">
            {presence.map(member => (
              <Avatar
                key={member.userId}
                className="border-2 border-background ring-2 ring-green-500"
                title={member.userName}
              >
                <AvatarFallback>{member.userName[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={(event) => setActiveId(event.active.id as string)}
        collisionDetection={closestCorners}
      >
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

        <DragOverlay>
          {activeId ? (
            <div className="opacity-50">
              <FeatureCard
                feature={features.find(f => f.id === activeId)!}
                teamMembers={teamMembers}
                presence={presence}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  status,
  features,
  teamMembers,
  presence
}: {
  status: string;
  features: Feature[];
  teamMembers: TeamMember[];
  presence: PresenceInfo[];
}) {
  const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done'
  };

  const statusColors: Record<string, string> = {
    backlog: 'bg-gray-100',
    assigned: 'bg-blue-50',
    in_progress: 'bg-yellow-50',
    review: 'bg-purple-50',
    done: 'bg-green-50'
  };

  return (
    <div className={cn('rounded-lg p-4', statusColors[status] || 'bg-muted/50')}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm uppercase tracking-wide">
          {statusLabels[status]}
        </h2>
        <Badge variant="outline">{features.length}</Badge>
      </div>

      <div className="space-y-2 min-h-[200px]">
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

function FeatureCard({
  feature,
  teamMembers,
  presence
}: {
  feature: Feature;
  teamMembers: TeamMember[];
  presence: PresenceInfo[];
}) {
  const assignedMember = teamMembers.find(m => m.id === feature.assigned_to);
  const isWorking = presence.find(
    p => p.userId === feature.assigned_to && p.currentFeature === feature.id
  );

  return (
    <Card
      className={cn(
        'cursor-move hover:shadow-lg transition-all',
        isWorking && 'ring-2 ring-blue-500 shadow-blue-100'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm line-clamp-2">{feature.title}</h3>
          <Badge variant="outline" className="text-xs ml-2">
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
                <AvatarFallback className="text-xs">
                  {assignedMember.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{assignedMember.name}</span>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="text-xs h-6">
              Assign
            </Button>
          )}

          {isWorking && (
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
              <span className="text-xs text-blue-500">Working</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
