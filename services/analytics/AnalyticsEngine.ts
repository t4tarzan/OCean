/**
 * Analytics Engine
 * ================
 * 
 * Advanced analytics for team performance, productivity trends,
 * and predictive insights.
 */

import { Pool } from 'pg';

export interface TeamStats {
  featuresCompleted: number;
  featuresChange: number;
  avgTimeToShip: number;
  timeChange: number;
  successRate: number;
  successChange: number;
  aiEfficiency: number;
  efficiencyChange: number;
  teamMembers: TeamMemberStats[];
}

export interface TeamMemberStats {
  userId: string;
  name: string;
  featuresCompleted: number;
  avgTime: number;
  successRate: number;
}

export interface Trends {
  dates: string[];
  featuresCompleted: number[];
  avgTime: number[];
  successRate: number[];
}

export interface Predictions {
  nextFeatureTime: number;
  recommendedFocus: string[];
  bottlenecks: string[];
  confidence: number;
}

export class AnalyticsEngine {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Calculate comprehensive team statistics
   */
  async calculateTeamStats(teamId: string, period: string = '30d'): Promise<TeamStats> {
    const startDate = this.getStartDate(period);
    const previousStartDate = this.getPreviousStartDate(period);

    // Current period stats
    const currentStats = await this.getStatsForPeriod(teamId, startDate, new Date());
    
    // Previous period stats for comparison
    const previousStats = await this.getStatsForPeriod(teamId, previousStartDate, startDate);

    // Team member stats
    const teamMembers = await this.getTeamMemberStats(teamId, startDate);

    return {
      featuresCompleted: currentStats.featuresCompleted,
      featuresChange: this.calculateChange(currentStats.featuresCompleted, previousStats.featuresCompleted),
      avgTimeToShip: currentStats.avgTimeToShip,
      timeChange: this.calculateChange(previousStats.avgTimeToShip, currentStats.avgTimeToShip), // Lower is better
      successRate: currentStats.successRate,
      successChange: this.calculateChange(currentStats.successRate, previousStats.successRate),
      aiEfficiency: currentStats.aiEfficiency,
      efficiencyChange: this.calculateChange(currentStats.aiEfficiency, previousStats.aiEfficiency),
      teamMembers
    };
  }

  /**
   * Get statistics for a specific period
   */
  private async getStatsForPeriod(teamId: string, startDate: Date, endDate: Date) {
    // Features completed
    const featuresResult = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_time
      FROM features
      WHERE team_id = $1
        AND status = 'done'
        AND completed_at >= $2
        AND completed_at < $3
    `, [teamId, startDate, endDate]);

    const features = featuresResult.rows[0];

    // Success rate (features completed without major issues)
    const successResult = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'done') * 100.0 / NULLIF(COUNT(*), 0) as rate
      FROM features
      WHERE team_id = $1
        AND created_at >= $2
        AND created_at < $3
    `, [teamId, startDate, endDate]);

    // AI efficiency (features with AI assistance)
    const aiResult = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE assigned_agent_id IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as rate
      FROM features
      WHERE team_id = $1
        AND status = 'done'
        AND completed_at >= $2
        AND completed_at < $3
    `, [teamId, startDate, endDate]);

    return {
      featuresCompleted: parseInt(features.total) || 0,
      avgTimeToShip: parseFloat(features.avg_time) || 0,
      successRate: parseFloat(successResult.rows[0]?.rate) || 0,
      aiEfficiency: parseFloat(aiResult.rows[0]?.rate) || 0
    };
  }

  /**
   * Get team member statistics
   */
  private async getTeamMemberStats(teamId: string, startDate: Date): Promise<TeamMemberStats[]> {
    const result = await this.db.query(`
      SELECT 
        u.id as "userId",
        u.name,
        COUNT(f.id) as features_completed,
        AVG(EXTRACT(EPOCH FROM (f.completed_at - f.created_at))/60) as avg_time,
        COUNT(*) FILTER (WHERE f.status = 'done') * 100.0 / NULLIF(COUNT(*), 0) as success_rate
      FROM platform_users u
      LEFT JOIN features f ON f.created_by = u.id AND f.completed_at >= $2
      WHERE u.id IN (
        SELECT user_id FROM team_members WHERE team_id = $1
      )
      GROUP BY u.id, u.name
      ORDER BY features_completed DESC
    `, [teamId, startDate]);

    return result.rows.map(row => ({
      userId: row.userId,
      name: row.name,
      featuresCompleted: parseInt(row.features_completed) || 0,
      avgTime: parseFloat(row.avg_time) || 0,
      successRate: parseFloat(row.success_rate) || 0
    }));
  }

  /**
   * Calculate productivity trends over time
   */
  async calculateTrends(teamId: string, days: number = 30): Promise<Trends> {
    const trends: Trends = {
      dates: [],
      featuresCompleted: [],
      avgTime: [],
      successRate: []
    };

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const result = await this.db.query(`
        SELECT 
          COUNT(*) as completed,
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_time,
          COUNT(*) FILTER (WHERE status = 'done') * 100.0 / NULLIF(COUNT(*), 0) as success_rate
        FROM features
        WHERE team_id = $1
          AND DATE(completed_at) = $2
      `, [teamId, dateStr]);

      const stats = result.rows[0];
      trends.dates.push(dateStr);
      trends.featuresCompleted.push(parseInt(stats.completed) || 0);
      trends.avgTime.push(parseFloat(stats.avg_time) || 0);
      trends.successRate.push(parseFloat(stats.success_rate) || 0);
    }

    return trends;
  }

  /**
   * Generate predictive analytics
   */
  async generatePredictions(teamId: string): Promise<Predictions> {
    // Get recent performance data
    const recentFeatures = await this.db.query(`
      SELECT 
        EXTRACT(EPOCH FROM (completed_at - created_at))/60 as time_taken,
        assigned_agent_id
      FROM features
      WHERE team_id = $1
        AND status = 'done'
        AND completed_at >= NOW() - INTERVAL '7 days'
      ORDER BY completed_at DESC
      LIMIT 20
    `, [teamId]);

    const times = recentFeatures.rows.map((r: any) => parseFloat(r.time_taken));
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length || 120;

    // Predict next feature completion time
    const nextFeatureTime = Math.round(avgTime * 0.9); // Optimistic prediction

    // Analyze bottlenecks
    const bottlenecks = await this.identifyBottlenecks(teamId);

    // Recommend focus areas
    const recommendedFocus = await this.recommendFocusAreas(teamId);

    return {
      nextFeatureTime,
      recommendedFocus,
      bottlenecks,
      confidence: times.length >= 10 ? 0.85 : 0.6
    };
  }

  /**
   * Identify potential bottlenecks
   */
  private async identifyBottlenecks(teamId: string): Promise<string[]> {
    const bottlenecks: string[] = [];

    // Check for features stuck in review
    const reviewResult = await this.db.query(`
      SELECT COUNT(*) as count
      FROM features
      WHERE team_id = $1
        AND status = 'review'
        AND updated_at < NOW() - INTERVAL '2 days'
    `, [teamId]);

    if (parseInt(reviewResult.rows[0].count) > 3) {
      bottlenecks.push('Multiple features stuck in review');
    }

    // Check for high WIP
    const wipResult = await this.db.query(`
      SELECT COUNT(*) as count
      FROM features
      WHERE team_id = $1
        AND status = 'in_progress'
    `, [teamId]);

    if (parseInt(wipResult.rows[0].count) > 5) {
      bottlenecks.push('High work-in-progress count');
    }

    // Check for low AI usage
    const aiResult = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE assigned_agent_id IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as rate
      FROM features
      WHERE team_id = $1
        AND created_at >= NOW() - INTERVAL '7 days'
    `, [teamId]);

    if (parseFloat(aiResult.rows[0]?.rate || '0') < 50) {
      bottlenecks.push('Low AI agent utilization');
    }

    return bottlenecks;
  }

  /**
   * Recommend focus areas
   */
  private async recommendFocusAreas(teamId: string): Promise<string[]> {
    const recommendations: string[] = [];

    // Check pattern usage
    const patternResult = await this.db.query(`
      SELECT COUNT(*) as count
      FROM patterns
      WHERE team_id = $1
        AND times_used > 0
    `, [teamId]);

    if (parseInt(patternResult.rows[0].count) < 5) {
      recommendations.push('Pattern Library');
    }

    // Check knowledge graph usage
    const kgResult = await this.db.query(`
      SELECT COUNT(*) as count
      FROM decisions
      WHERE team_id = $1
        AND created_at >= NOW() - INTERVAL '7 days'
    `, [teamId]);

    if (parseInt(kgResult.rows[0].count) < 10) {
      recommendations.push('Decision Documentation');
    }

    // Always recommend collaboration
    recommendations.push('Team Collaboration');

    return recommendations;
  }

  /**
   * Calculate percentage change
   */
  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Get start date for period
   */
  private getStartDate(period: string): Date {
    const date = new Date();
    const days = parseInt(period.replace('d', ''));
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * Get previous period start date
   */
  private getPreviousStartDate(period: string): Date {
    const date = new Date();
    const days = parseInt(period.replace('d', ''));
    date.setDate(date.getDate() - (days * 2));
    return date;
  }
}

// Singleton instance
let analyticsEngineInstance: AnalyticsEngine | null = null;

export function getAnalyticsEngine(db: Pool): AnalyticsEngine {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = new AnalyticsEngine(db);
  }
  return analyticsEngineInstance;
}

export default AnalyticsEngine;
