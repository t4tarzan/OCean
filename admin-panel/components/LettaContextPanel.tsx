'use client';

/**
 * Letta Context Panel
 * ===================
 * 
 * Displays AI-powered suggestions based on team memory, including
 * tech stack recommendations, patterns, similar projects, and pitfalls.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Brain, Search, TrendingUp, AlertTriangle } from 'lucide-react';

interface PredictedContext {
  techStack: {
    [key: string]: string | null;
  };
  patterns: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    successRate: number;
    timesUsed: number;
  }>;
  similarProjects: Array<{
    id: string;
    name: string;
    similarity: number;
    successRate: number;
  }>;
  commonPitfalls: Array<{
    description: string;
    solution: string;
    frequency: number;
  }>;
  estimatedTime: number;
  teamMemories: Array<{
    title: string;
    description: string;
    relevance: number;
  }>;
}

interface LettaContextPanelProps {
  projectId?: string;
  teamId: string;
  projectType?: string;
  featureDescription?: string;
}

export function LettaContextPanel({
  projectId,
  teamId,
  projectType = 'web',
  featureDescription = ''
}: LettaContextPanelProps) {
  const [context, setContext] = useState<PredictedContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (teamId && featureDescription) {
      loadContext();
    }
  }, [teamId, projectType, featureDescription]);

  const loadContext = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/context/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          projectType,
          featureDescription
        })
      });

      if (response.ok) {
        const data = await response.json();
        setContext(data);
      }
    } catch (error) {
      console.error('Failed to load context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTechStack = async (techStack: any) => {
    console.log('Applying tech stack:', techStack);
    // Would integrate with project setup
  };

  const applyPattern = async (pattern: any) => {
    console.log('Applying pattern:', pattern);
    // Would integrate with code generation
  };

  const viewPattern = (pattern: any) => {
    console.log('Viewing pattern:', pattern);
    // Would open pattern details modal
  };

  const viewProject = (projectId: string) => {
    window.open(`/projects/${projectId}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Context Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <h3 className="text-lg font-bold">Letta Context</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions based on team memory
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recommended Tech Stack */}
          {context?.techStack && Object.values(context.techStack).some(v => v) && (
            <div>
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recommended Tech Stack
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(context.techStack)
                  .filter(([_, value]) => value)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-2 border rounded">
                      <Badge variant="outline" className="capitalize">{key}</Badge>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
              </div>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => applyTechStack(context.techStack)}
              >
                Use This Stack
              </Button>
            </div>
          )}

          {/* Suggested Patterns */}
          {context?.patterns && context.patterns.length > 0 && (
            <div>
              <Label>Suggested Patterns</Label>
              <div className="space-y-2 mt-2">
                {context.patterns.slice(0, 3).map(pattern => (
                  <div key={pattern.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pattern.name}</span>
                      <Badge variant="secondary">
                        {(pattern.successRate * 100).toFixed(0)}% success
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pattern.description}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Used {pattern.timesUsed} times
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => applyPattern(pattern)}>
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => viewPattern(pattern)}>
                        View Code
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Projects */}
          {context?.similarProjects && context.similarProjects.length > 0 && (
            <div>
              <Label>Similar Past Projects</Label>
              <div className="space-y-2 mt-2">
                {context.similarProjects.map(project => (
                  <div key={project.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <span className="font-medium">{project.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {(project.similarity * 100).toFixed(0)}% similar
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => viewProject(project.id)}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Pitfalls */}
          {context?.commonPitfalls && context.commonPitfalls.length > 0 && (
            <div>
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Common Pitfalls to Avoid
              </Label>
              <ul className="list-disc list-inside text-sm space-y-2 mt-2">
                {context.commonPitfalls.map((pitfall, i) => (
                  <li key={i} className="text-muted-foreground">
                    <span className="font-medium">{pitfall.description}</span>
                    {pitfall.solution && (
                      <p className="ml-5 text-xs mt-1">
                        💡 {pitfall.solution}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Estimated Time */}
          {context?.estimatedTime && (
            <div className="p-3 bg-muted rounded">
              <div className="text-sm font-medium">Estimated Time</div>
              <div className="text-2xl font-bold mt-1">
                {Math.floor(context.estimatedTime / 60)}h {context.estimatedTime % 60}m
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on {context.similarProjects?.length || 0} similar projects
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Memories */}
      {context?.teamMemories && context.teamMemories.length > 0 && (
        <Card>
          <CardHeader>
            <Label>Team Memories</Label>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {context.teamMemories.map((memory, i) => (
                <div key={i} className="p-2 border rounded">
                  <div className="font-medium text-sm">{memory.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {memory.description}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Search */}
      <Card>
        <CardHeader>
          <Label className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Team Memory
          </Label>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search past decisions, patterns, learnings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
