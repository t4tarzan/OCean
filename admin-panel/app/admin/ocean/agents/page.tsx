import { queryOcean } from '@/lib/ocean-db';

export default async function AgentMonitoringPage() {
  const agents = await queryOcean(
    'SELECT id, name, type, status, model, tasks_completed, success_rate, last_active FROM agents ORDER BY name'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Monitoring</h1>
          <p className="text-gray-600 mb-8">View status and activity of all AI agents</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {agents.map((agent: any) => (
              <div key={agent.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <span className={`w-3 h-3 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{agent.type}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>Tasks: {agent.tasks_completed || 0}</p>
                  <p>Success: {agent.success_rate ? `${(agent.success_rate * 100).toFixed(0)}%` : 'N/A'}</p>
                  <p>Model: {agent.model || 'Not set'}</p>
                </div>
              </div>
            ))}
          </div>

          {agents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No agents configured yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
