'use client';

/**
 * Advanced Analytics Dashboard
 * ============================
 * 
 * Team performance analytics with trends, predictions, and insights.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, TrendingUp, Zap, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

interface TeamStats {
  featuresCompleted: number;
  featuresChange: number;
  avgTimeToShip: number;
  timeChange: number;
  successRate: number;
  successChange: number;
  aiEfficiency: number;
  efficiencyChange: number;
  teamMembers: Array<{
    userId: string;
    name: string;
    featuresCompleted: number;
    avgTime: number;
    successRate: number;
  }>;
}

interface Predictions {
  nextFeatureTime: number;
  recommendedFocus: string[];
  bottlenecks: string[];
  confidence: number;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [statsRes, predictionsRes] = await Promise.all([
        fetch('/api/analytics/stats'),
        fetch('/api/analytics/predictions')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team Analytics</h1>
        <p className="text-muted-foreground">
          Performance insights and predictive analytics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Features Shipped"
          value={stats?.featuresCompleted || 0}
          change={stats?.featuresChange || 0}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg Time to Ship"
          value={`${Math.round(stats?.avgTimeToShip || 0)}min`}
          change={stats?.timeChange || 0}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricCard
          title="Success Rate"
          value={`${Math.round(stats?.successRate || 0)}%`}
          change={stats?.successChange || 0}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="AI Efficiency"
          value={`${Math.round(stats?.aiEfficiency || 0)}%`}
          change={stats?.efficiencyChange || 0}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      {/* Predictions */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold">🔮 Predictions</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <Label>Next Feature Completion</Label>
              <p className="text-3xl font-bold mt-2">
                {predictions?.nextFeatureTime || 0} min
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Based on recent performance
              </p>
              <Badge variant="outline" className="mt-2">
                {Math.round((predictions?.confidence || 0) * 100)}% confidence
              </Badge>
            </div>

            <div>
              <Label>Recommended Focus</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {predictions?.recommendedFocus?.map(area => (
                  <Badge key={area} variant="secondary">{area}</Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>⚠️ Potential Bottlenecks</Label>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                {predictions?.bottlenecks?.map((bottleneck, i) => (
                  <li key={i} className="text-muted-foreground">{bottleneck}</li>
                ))}
                {(!predictions?.bottlenecks || predictions.bottlenecks.length === 0) && (
                  <li className="text-green-600">No bottlenecks detected</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Team Performance</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.teamMembers?.map(member => (
              <div key={member.userId} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {member.featuresCompleted} features • {Math.round(member.avgTime)}min avg
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                    <div className="font-bold">{Math.round(member.successRate)}%</div>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.teamMembers || stats.teamMembers.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No team member data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">{title}</div>
          {icon}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : isNegative ? (
              <ArrowDown className="h-3 w-3" />
            ) : null}
            <span>{Math.abs(change)}% vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
