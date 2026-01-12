'use client';

/**
 * Pattern Marketplace
 * ===================
 * 
 * Browse, share, and install successful development patterns.
 * Community-driven pattern library with ratings and reviews.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, Users, Clock, Download, Plus, Loader2, Check } from 'lucide-react';

interface Pattern {
  id: string;
  name: string;
  category: string;
  description: string;
  success_rate: number;
  times_used: number;
  avg_time_to_implement: number;
  author: {
    name: string;
    avatar?: string;
  };
  created_at: Date;
  pattern_data: {
    files?: Array<{ path: string; content: string }>;
    dependencies?: string[];
    instructions?: string;
  };
}

export default function PatternMarketplace() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/patterns');
      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatterns = patterns
    .filter(p => !category || p.category === category)
    .sort((a, b) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
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

            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Pattern
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit a Pattern</DialogTitle>
                </DialogHeader>
                <PatternSubmissionForm onSuccess={() => {
                  setShowSubmitDialog(false);
                  loadPatterns();
                }} />
              </DialogContent>
            </Dialog>
          </div>

          {filteredPatterns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No patterns found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredPatterns.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} onInstalled={loadPatterns} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PatternCard({ pattern, onInstalled }: { pattern: Pattern; onInstalled: () => void }) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const installPattern = async () => {
    setIsInstalling(true);
    try {
      const response = await fetch(`/api/patterns/${pattern.id}/install`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsInstalled(true);
        onInstalled();
        setTimeout(() => setIsInstalled(false), 3000);
      }
    } catch (error) {
      console.error('Failed to install pattern:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
            onClick={installPattern}
            disabled={isInstalling || isInstalled}
          >
            {isInstalling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isInstalled ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isInstalled ? 'Installed!' : 'Install'}
          </Button>
          <Button variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternSubmissionForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'auth',
    description: '',
    instructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to submit pattern:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Pattern Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., JWT Authentication Pattern"
          required
        />
      </div>

      <div>
        <Label>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(v) => setFormData({ ...formData, category: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['auth', 'api', 'database', 'ui', 'testing', 'deployment'].map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this pattern does and when to use it..."
          rows={3}
          required
        />
      </div>

      <div>
        <Label>Implementation Instructions</Label>
        <Textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Step-by-step instructions for implementing this pattern..."
          rows={5}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Pattern'
        )}
      </Button>
    </form>
  );
}
