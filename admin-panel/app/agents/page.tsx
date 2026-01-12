import { queryPostgres } from '@/lib/db-connections';
import { Bot, Activity, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

async function getAgentsData() {
  try {
    const agents = await queryPostgres(`
      SELECT 
        id,
        name,
        type,
        model,
        status,
        tasks_completed,
        success_rate,
        avg_response_time,
        last_active
      FROM agents
      ORDER BY name
    `);

    return agents.length > 0 ? agents : [
      { name: 'Architect Agent', type: 'architect', model: 'claude-3-opus', status: 'idle', tasks_completed: 0, success_rate: 0, avg_response_time: 0 },
      { name: 'Database Agent', type: 'database', model: 'claude-3-sonnet', status: 'idle', tasks_completed: 0, success_rate: 0, avg_response_time: 0 },
      { name: 'API Agent', type: 'api', model: 'claude-3-sonnet', status: 'idle', tasks_completed: 0, success_rate: 0, avg_response_time: 0 },
      { name: 'Frontend Agent', type: 'frontend', model: 'claude-3-haiku', status: 'idle', tasks_completed: 0, success_rate: 0, avg_response_time: 0 },
      { name: 'QA Agent', type: 'qa', model: 'claude-3-haiku', status: 'idle', tasks_completed: 0, success_rate: 0, avg_response_time: 0 },
      { name: 'Security Agent', type: 'security', model: 'claude-3-sonnet', status: 'idle', tasks_completed: 0, success_rate: 0, avg_response_time: 0 },
      { name: 'Integrator Agent', type: 'integrator', model: 'claude-3-opus', status: 'idle', tasks_completed: 0, success_rate: 0, avg_response_time: 0 },
    ];
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

export default async function AgentsPage() {
  const agents = await getAgentsData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: Activity, color: 'text-green-500', bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
      case 'idle':
        return { icon: CheckCircle, color: 'text-gray-400', bg: 'bg-gray-100', text: 'text-gray-700', label: 'Idle' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', text: 'text-red-700', label: 'Error' };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', text: 'text-gray-700', label: 'Offline' };
    }
  };

  const getAgentIcon = (type: string) => {
    const icons: Record<string, string> = {
      architect: '🏗️',
      database: '🗄️',
      api: '🔌',
      frontend: '🎨',
      qa: '✅',
      security: '🔒',
      integrator: '🔗',
    };
    return icons[type] || '🤖';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Ecosystem</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all 7 specialized AI agents</p>
        </div>
        <Bot className="text-cyan-600" size={32} />
      </div>

      {/* Orchestrator Status */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Agent Orchestrator</h2>
            <p className="text-cyan-100">Multi-agent coordination system</p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="animate-pulse" size={24} />
            <span className="text-xl font-semibold">Ready</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-cyan-100 text-sm">Total Agents</p>
            <p className="text-3xl font-bold">{agents.length}</p>
          </div>
          <div>
            <p className="text-cyan-100 text-sm">Active</p>
            <p className="text-3xl font-bold">{agents.filter((a: any) => a.status === 'active').length}</p>
          </div>
          <div>
            <p className="text-cyan-100 text-sm">Messages Today</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div>
            <p className="text-cyan-100 text-sm">Success Rate</p>
            <p className="text-3xl font-bold">100%</p>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent: any, index: number) => {
          const status = getStatusBadge(agent.status);
          const StatusIcon = status.icon;

          return (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getAgentIcon(agent.type)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{agent.type}</p>
                  </div>
                </div>
                <StatusIcon className={status.color} size={20} />
              </div>

              {/* Status Badge */}
              <div className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-sm font-medium inline-block mb-4`}>
                {status.label}
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Model</span>
                  <span className="text-sm font-medium text-gray-900">{agent.model || 'claude-3-sonnet'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="text-sm font-semibold text-cyan-600">{agent.tasks_completed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-sm font-semibold text-green-600">{agent.success_rate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Response</span>
                  <span className="text-sm font-medium text-gray-900">{agent.avg_response_time || 0}ms</span>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {/* Agent Communication */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inter-Agent Communication</h2>
          <Zap className="text-yellow-500" size={20} />
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No messages in the last 24 hours</p>
          <p className="text-sm mt-1">Agent communication will appear here</p>
        </div>
      </div>
    </div>
  );
}
