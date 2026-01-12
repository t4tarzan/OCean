/**
 * Session Recorder
 * ================
 * 
 * Records coding sessions for time-travel replay.
 * Captures key moments, decisions, and code changes.
 */

import { Pool } from 'pg';

export interface RecordingEvent {
  type: 'ai_decision' | 'code_change' | 'test_passed' | 'test_failed' | 'agent_action';
  timestamp: number;
  data: any;
}

export interface Recording {
  sessionId: string;
  userId: string;
  featureId: string;
  startTime: number;
  events: RecordingEvent[];
  screenshots: string[];
}

export interface CompressedEvents {
  keyMoments: Array<{ time: number; event: string; icon: string }>;
  decisions: Array<{ time: number; decision: string; icon: string }>;
  codeChanges: Array<{ time: number; file: string; linesChanged: number }>;
}

export interface Highlight {
  time: number;
  event: string;
  icon: string;
}

export class SessionRecorder {
  private db: Pool;
  private recordings: Map<string, Recording> = new Map();

  constructor(db: Pool) {
    this.db = db;
    this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS session_recordings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id VARCHAR(255) NOT NULL,
        feature_id UUID NOT NULL,
        duration INTEGER NOT NULL,
        events JSONB NOT NULL,
        highlights JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_session_recordings_user ON session_recordings(user_id);
      CREATE INDEX IF NOT EXISTS idx_session_recordings_feature ON session_recordings(feature_id);
    `);
  }

  /**
   * Start recording a session
   */
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
    console.log(`🎬 Started recording session: ${sessionId}`);
  }

  /**
   * Record an event
   */
  async recordEvent(sessionId: string, event: RecordingEvent): Promise<void> {
    const recording = this.recordings.get(sessionId);
    if (!recording) {
      console.warn(`Recording not found: ${sessionId}`);
      return;
    }

    recording.events.push({
      ...event,
      timestamp: Date.now() - recording.startTime
    });
  }

  /**
   * Stop recording and save
   */
  async stopRecording(sessionId: string): Promise<string> {
    const recording = this.recordings.get(sessionId);
    if (!recording) {
      throw new Error('Recording not found');
    }

    const duration = Date.now() - recording.startTime;

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
      duration,
      JSON.stringify(compressed),
      JSON.stringify(highlights)
    ]);

    const recordingId = result.rows[0].id;

    // 4. Clean up
    this.recordings.delete(sessionId);

    console.log(`✅ Saved recording: ${recordingId} (${Math.round(duration / 1000)}s)`);
    return recordingId;
  }

  /**
   * Compress events for efficient storage
   */
  private compressEvents(events: RecordingEvent[]): CompressedEvents {
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
            decision: event.data.decision || 'AI decision made',
            icon: '⚡'
          });
          break;

        case 'code_change':
          // Only record significant changes (>10 lines)
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

        case 'test_failed':
          grouped.keyMoments.push({
            time: event.timestamp,
            event: 'Tests failed',
            icon: '❌'
          });
          break;

        case 'agent_action':
          grouped.keyMoments.push({
            time: event.timestamp,
            event: event.data.action || 'Agent action',
            icon: '🤖'
          });
          break;
      }
    }

    return grouped;
  }

  /**
   * Generate highlights for quick navigation
   */
  private generateHighlights(events: RecordingEvent[]): Highlight[] {
    const highlights: Highlight[] = [
      { time: 0, event: 'Started feature', icon: '🚀' }
    ];

    // Add key moments
    events
      .filter(e => e.type === 'ai_decision' || e.type === 'test_passed' || e.type === 'agent_action')
      .forEach(e => {
        let event = '';
        let icon = '';

        switch (e.type) {
          case 'ai_decision':
            event = e.data.decision || 'AI decision';
            icon = '⚡';
            break;
          case 'test_passed':
            event = 'Tests passed';
            icon = '✅';
            break;
          case 'agent_action':
            event = e.data.action || 'Agent action';
            icon = '🤖';
            break;
        }

        highlights.push({ time: e.timestamp, event, icon });
      });

    // Add completion
    const lastEvent = events[events.length - 1];
    if (lastEvent) {
      highlights.push({
        time: lastEvent.timestamp,
        event: 'Feature complete!',
        icon: '🎉'
      });
    }

    return highlights;
  }

  /**
   * Get recording by ID
   */
  async getRecording(recordingId: string): Promise<any> {
    const result = await this.db.query(`
      SELECT 
        id,
        user_id as "userId",
        feature_id as "featureId",
        duration,
        events,
        highlights,
        created_at as "createdAt"
      FROM session_recordings
      WHERE id = $1
    `, [recordingId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get recordings for a feature
   */
  async getFeatureRecordings(featureId: string): Promise<any[]> {
    const result = await this.db.query(`
      SELECT 
        id,
        user_id as "userId",
        duration,
        highlights,
        created_at as "createdAt"
      FROM session_recordings
      WHERE feature_id = $1
      ORDER BY created_at DESC
    `, [featureId]);

    return result.rows;
  }
}

// Singleton instance
let sessionRecorderInstance: SessionRecorder | null = null;

export function getSessionRecorder(db: Pool): SessionRecorder {
  if (!sessionRecorderInstance) {
    sessionRecorderInstance = new SessionRecorder(db);
  }
  return sessionRecorderInstance;
}

export default SessionRecorder;
