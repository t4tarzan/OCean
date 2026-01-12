import { GitBranch, Clock } from 'lucide-react';
import { queryPostgres } from '@/lib/db-connections';

async function getProjectProgress() {
  try {
    const progress = await queryPostgres(`
      SELECT 
        phase_number,
        phase_name,
        status,
        completion_percentage,
        total_tasks,
        completed_tasks
      FROM prd_progress
      ORDER BY phase_number
    `);

    const totalTasks = progress.reduce((sum, p) => sum + parseInt(p.total_tasks || '0'), 0);
    const completedTasks = progress.reduce((sum, p) => sum + parseInt(p.completed_tasks || '0'), 0);
    const overallPercentage = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

    const currentPhase = progress.find(p => p.status === 'in_progress') || progress[0];

    return {
      currentPhase: currentPhase?.phase_name || 'Phase 1: Foundation & Infrastructure',
      phaseNumber: currentPhase?.phase_number || 1,
      overallPercentage,
      completedTasks,
      totalTasks,
      phases: progress,
    };
  } catch (error) {
    console.error('Error fetching project progress:', error);
    return {
      currentPhase: 'Phase 1: Foundation & Infrastructure',
      phaseNumber: 1,
      overallPercentage: '100',
      completedTasks: 0,
      totalTasks: 208,
      phases: [],
    };
  }
}

export default async function ProjectProgressCard() {
  const progress = await getProjectProgress();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
        <GitBranch className="text-cyan-600" size={20} />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Current Phase</span>
            <span className="text-sm text-gray-600">Phase {progress.phaseNumber}/6</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{progress.currentPhase}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-cyan-600">{progress.overallPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.overallPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {progress.completedTasks} of {progress.totalTasks} tasks completed
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          {progress.phases.slice(0, 6).map((phase: any) => (
            <div key={phase.phase_number} className="text-center">
              <div className={`w-full h-2 rounded-full mb-1 ${
                phase.status === 'completed' ? 'bg-green-500' :
                phase.status === 'in_progress' ? 'bg-cyan-500' :
                'bg-gray-300'
              }`} />
              <p className="text-xs text-gray-600">P{phase.phase_number}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>26 weeks total • Week {Math.ceil((progress.completedTasks / progress.totalTasks) * 26)}/26</span>
        </div>
      </div>
    </div>
  );
}
