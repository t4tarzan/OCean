import { Bot, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { queryPostgres } from '@/lib/db-connections';

async function getAgentStatus() {
  try {
    const agents = await queryPostgres(`
      SELECT 
        id,
        name,
        type,
        status,
        tasks_completed,
        success_rate,
        last_active
      FROM agents
      ORDER BY name
    `);

    return agents.length > 0 ? agents : [
      { name: 'Architect Agent', type: 'architect', status: 'idle', tasks_completed: 0, success_rate: 0 },
      { name: 'Database Agent', type: 'database', status: 'idle', tasks_completed: 0, success_rate: 0 },
      { name: 'API Agent', type: 'api', status: 'idle', tasks_completed: 0, success_rate: 0 },
      { name: 'Frontend Agent', type: 'frontend', status: 'idle', tasks_completed: 0, success_rate: 0 },
      { name: 'QA Agent', type: 'qa', status: 'idle', tasks_completed: 0, success_rate: 0 },
      { name: 'Security Agent', type: 'security', status: 'idle', tasks_completed: 0, success_rate: 0 },
      { name: 'Integrator Agent', type: 'integrator', status: 'idle', tasks_completed: 0, success_rate: 0 },
    ];
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

export default async function ActiveAgentsCard() {
  const agents = await getAgentStatus();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="text-green-500" size={16} />;
      case 'idle':
        return <CheckCircle className="text-gray-400" size={16} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <CheckCircle className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Agents</h3>
        <Bot className="text-cyan-600" size={20} />
      </div>

      <div className="space-y-3">
        {agents.map((agent: any, index: number) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(agent.status)}
              <div>
                <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                <p className="text-xs text-gray-600 capitalize">{agent.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{agent.tasks_completed || 0}</p>
              <p className="text-xs text-gray-600">tasks</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Orchestrator Status</span>
          <span className="flex items-center gap-2 text-green-600 font-medium">
            <Activity size={16} />
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}
