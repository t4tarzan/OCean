'use client';

/**
 * Achievements Page
 * =================
 * 
 * Display user achievements with unlock progress and rewards.
 * Gamification system showing locked and unlocked achievements.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Lock, Unlock, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: any;
  unlocks_mcps?: string[];
  unlocks_features?: string[];
  unlocked_at?: Date;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setIsLoading(true);
    try {
      const [allRes, userRes] = await Promise.all([
        fetch('/api/achievements'),
        fetch('/api/achievements/user')
      ]);

      if (allRes.ok) {
        const data = await allRes.json();
        setAchievements(data.achievements || []);
      }

      if (userRes.ok) {
        const data = await userRes.json();
        setUserAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unlocked = achievements.filter(a =>
    userAchievements.some(ua => ua.id === a.id)
  );
  const locked = achievements.filter(a =>
    !userAchievements.some(ua => ua.id === a.id)
  );

  const rarityColors = {
    common: 'bg-gray-100 text-gray-800 border-gray-300',
    rare: 'bg-blue-100 text-blue-800 border-blue-300',
    epic: 'bg-purple-100 text-purple-800 border-purple-300',
    legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
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
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-muted-foreground">
          Unlock achievements to gain access to advanced features and MCPs
        </p>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{unlocked.length}</div>
            <div className="text-sm text-muted-foreground">Unlocked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{locked.length}</div>
            <div className="text-sm text-muted-foreground">Locked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round((unlocked.length / achievements.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Completion</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {unlocked.filter(a => a.rarity === 'legendary').length}
            </div>
            <div className="text-sm text-muted-foreground">Legendary</div>
          </CardContent>
        </Card>
      </div>

      <Progress value={(unlocked.length / achievements.length) * 100} className="mb-6" />

      {/* Achievement Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({achievements.length})</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlocked.length})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({locked.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            {achievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={unlocked.some(a => a.id === achievement.id)}
                rarityColors={rarityColors}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="unlocked" className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            {unlocked.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={true}
                rarityColors={rarityColors}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="locked" className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            {locked.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={false}
                rarityColors={rarityColors}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AchievementCard({
  achievement,
  isUnlocked,
  rarityColors
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  rarityColors: Record<string, string>;
}) {
  return (
    <Card
      className={cn(
        'transition-all',
        isUnlocked ? 'hover:shadow-lg' : 'opacity-60'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'text-4xl',
              !isUnlocked && 'grayscale'
            )}>
              {achievement.icon}
            </div>
            <div>
              <h3 className="font-bold">{achievement.name}</h3>
              <Badge
                variant="outline"
                className={cn('mt-1', rarityColors[achievement.rarity])}
              >
                {achievement.rarity}
              </Badge>
            </div>
          </div>
          {isUnlocked ? (
            <Unlock className="h-5 w-5 text-green-500" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {achievement.description}
        </p>

        {/* Rewards */}
        {(achievement.unlocks_mcps || achievement.unlocks_features) && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Unlocks:
            </div>
            {achievement.unlocks_mcps && achievement.unlocks_mcps.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {achievement.unlocks_mcps.map((mcp, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {mcp}
                  </Badge>
                ))}
              </div>
            )}
            {achievement.unlocks_features && achievement.unlocks_features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {achievement.unlocks_features.map((feature, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unlock date */}
        {isUnlocked && achievement.unlocked_at && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              <span>
                Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
