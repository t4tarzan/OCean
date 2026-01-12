'use client';

/**
 * Replay Player
 * =============
 * 
 * Time-travel replay player with speed controls.
 * Watch how features were built at 10x-20x speed.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recording {
  id: string;
  userId: string;
  featureId: string;
  duration: number;
  events: {
    keyMoments: Array<{ time: number; event: string; icon: string }>;
    decisions: Array<{ time: number; decision: string; icon: string }>;
    codeChanges: Array<{ time: number; file: string; linesChanged: number }>;
  };
  highlights: Array<{ time: number; event: string; icon: string }>;
  user: {
    name: string;
    avatar?: string;
  };
  feature: {
    title: string;
    description: string;
  };
  createdAt: Date;
}

export default function ReplayPlayer({ params }: { params: { id: string } }) {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadRecording();
  }, [params.id]);

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

  const loadRecording = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/replay/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setRecording(data.recording);
      }
    } catch (error) {
      console.error('Failed to load recording:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const skipToHighlight = (time: number) => {
    setCurrentTime(time);
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Recording not found</p>
      </div>
    );
  }

  const currentEvents = [
    ...recording.events.keyMoments.filter(e => e.time <= currentTime),
    ...recording.events.decisions.filter(e => e.time <= currentTime),
    ...recording.events.codeChanges.filter(e => e.time <= currentTime)
  ].sort((a, b) => a.time - b.time);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Replay: {recording.feature.title}</h1>
            <p className="text-sm text-muted-foreground">
              Built by {recording.user.name} in {Math.round(recording.duration / 60000)} minutes
            </p>
          </div>
          <Badge variant="secondary">
            {formatDuration(currentTime)} / {formatDuration(recording.duration)}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline & Events */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Playback Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Timeline Slider */}
                <Slider
                  value={[currentTime]}
                  max={recording.duration}
                  step={100}
                  onValueChange={([value]) => setCurrentTime(value)}
                  className="w-full"
                />

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentTime(Math.max(0, currentTime - 5000))}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button onClick={togglePlayPause}>
                      {isPlaying ? (
                        <Pause className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentTime(Math.min(recording.duration, currentTime + 5000))}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Speed Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Speed:</span>
                    {[1, 5, 10, 20].map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={speed === s ? 'default' : 'outline'}
                        onClick={() => changeSpeed(s)}
                      >
                        {s}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Events */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold mb-4">Timeline</h2>
            {currentEvents.map((event, i) => (
              <Card key={i} className="animate-in fade-in slide-in-from-left">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{event.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {'event' in event ? event.event : 'decision' in event ? event.decision : `${event.file} (+${event.linesChanged} lines)`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(event.time)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Highlights Sidebar */}
        <div className="w-80 border-l p-4 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4">Highlights</h2>
          <div className="space-y-2">
            {recording.highlights.map((highlight, i) => (
              <Card
                key={i}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  currentTime >= highlight.time && 'bg-blue-50 border-blue-500'
                )}
                onClick={() => skipToHighlight(highlight.time)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{highlight.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{highlight.event}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(highlight.time)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
