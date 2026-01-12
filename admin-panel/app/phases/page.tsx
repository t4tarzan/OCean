import { queryPostgres } from '@/lib/db-connections';
import { GitBranch, CheckCircle, Circle, Clock } from 'lucide-react';

async function getPhaseData() {
  try {
    const phases = await queryPostgres(`
      SELECT 
        p.id,
        p.phase_number,
        p.phase_name,
        p.duration_weeks,
        p.status,
        p.start_date,
        p.end_date,
        COUNT(DISTINCT w.id) as total_weeks,
        COUNT(t.id) as total_tasks,
        COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks,
        ROUND(COUNT(t.id) FILTER (WHERE t.completed = true) * 100.0 / NULLIF(COUNT(t.id), 0), 1) as completion_percentage
      FROM prd_phases p
      LEFT JOIN prd_weeks w ON w.phase_id = p.id
      LEFT JOIN prd_tasks t ON t.week_id = w.id
      GROUP BY p.id, p.phase_number, p.phase_name, p.duration_weeks, p.status, p.start_date, p.end_date
      ORDER BY p.phase_number
    `);

    return phases.length > 0 ? phases : [
      { phase_number: 1, phase_name: 'Foundation & Infrastructure', duration_weeks: 4, status: 'completed', total_weeks: 4, total_tasks: 50, completed_tasks: 50, completion_percentage: 100 },
      { phase_number: 2, phase_name: 'Core Agent System', duration_weeks: 5, status: 'not_started', total_weeks: 5, total_tasks: 45, completed_tasks: 0, completion_percentage: 0 },
      { phase_number: 3, phase_name: 'AutoCoder Integration', duration_weeks: 4, status: 'not_started', total_weeks: 4, total_tasks: 35, completed_tasks: 0, completion_percentage: 0 },
      { phase_number: 4, phase_name: 'Letta & Knowledge Systems', duration_weeks: 5, status: 'not_started', total_weeks: 5, total_tasks: 40, completed_tasks: 0, completion_percentage: 0 },
      { phase_number: 5, phase_name: 'Collaboration & Social Features', duration_weeks: 4, status: 'not_started', total_weeks: 4, total_tasks: 30, completed_tasks: 0, completion_percentage: 0 },
      { phase_number: 6, phase_name: 'Advanced Features & Polish', duration_weeks: 4, status: 'not_started', total_weeks: 4, total_tasks: 28, completed_tasks: 0, completion_percentage: 0 },
    ];
  } catch (error) {
    console.error('Error fetching phase data:', error);
    return [];
  }
}

export default async function PhasesPage() {
  const phases = await getPhaseData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Completed</span>;
      case 'in_progress':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">In Progress</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Not Started</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'in_progress':
        return <Clock className="text-blue-500" size={24} />;
      default:
        return <Circle className="text-gray-400" size={24} />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phase Progress Tracker</h1>
          <p className="text-gray-600 mt-1">Track all 6 phases across 26 weeks</p>
        </div>
        <GitBranch className="text-cyan-600" size={32} />
      </div>

      {/* Timeline Overview */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h2>
        <div className="flex items-center gap-2">
          {phases.map((phase: any) => (
            <div key={phase.phase_number} className="flex-1">
              <div className={`h-3 rounded-full ${
                phase.status === 'completed' ? 'bg-green-500' :
                phase.status === 'in_progress' ? 'bg-blue-500' :
                'bg-gray-300'
              }`} />
              <p className="text-xs text-gray-600 mt-1 text-center">Phase {phase.phase_number}</p>
              <p className="text-xs text-gray-500 text-center">{phase.duration_weeks}w</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Week 1</span>
          <span>Week 26</span>
        </div>
      </div>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {phases.map((phase: any) => (
          <div key={phase.phase_number} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(phase.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Phase {phase.phase_number}: {phase.phase_name}
                  </h3>
                  <p className="text-sm text-gray-600">{phase.duration_weeks} weeks</p>
                </div>
              </div>
              {getStatusBadge(phase.status)}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-semibold text-cyan-600">
                  {phase.completion_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${phase.completion_percentage || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {phase.completed_tasks || 0} of {phase.total_tasks || 0} tasks completed
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600">Weeks</p>
                <p className="text-lg font-semibold text-gray-900">{phase.total_weeks || phase.duration_weeks}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Tasks</p>
                <p className="text-lg font-semibold text-gray-900">{phase.total_tasks || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-lg font-semibold text-green-600">{phase.completed_tasks || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
