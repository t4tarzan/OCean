import { queryPostgres } from '@/lib/db-connections';
import { Settings, Users, Key, DollarSign } from 'lucide-react';

async function getAdminData() {
  try {
    const users = await queryPostgres('SELECT COUNT(*) as count FROM platform_users');
    const apiUsage = await queryPostgres('SELECT COUNT(*) as count FROM api_usage WHERE DATE(timestamp) = CURRENT_DATE');
    
    return {
      totalUsers: parseInt(users[0]?.count || '0'),
      todayApiCalls: parseInt(apiUsage[0]?.count || '0'),
    };
  } catch (error) {
    return { totalUsers: 0, todayApiCalls: 0 };
  }
}

export default async function AdminPage() {
  const { totalUsers, todayApiCalls } = await getAdminData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">User and API management</p>
        </div>
        <Settings className="text-cyan-600" size={32} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Users</p>
            <Users className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">API Keys</p>
            <Key className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">4</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">API Calls Today</p>
            <DollarSign className="text-yellow-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{todayApiCalls}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Cost Today</p>
            <DollarSign className="text-cyan-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">$0.00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Key Management</h2>
          <div className="space-y-3">
            {['OpenAI', 'Claude', 'Gemini', 'Groq'].map((provider) => (
              <div key={provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{provider}</p>
                  <p className="text-xs text-gray-600">sk-***...{Math.random().toString(36).slice(-4)}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage by Provider</h2>
          <div className="space-y-3">
            {[
              { name: 'OpenAI', calls: 450, cost: '$2.15' },
              { name: 'Claude', calls: 320, cost: '$1.80' },
              { name: 'Gemini', calls: 280, cost: '$0.45' },
              { name: 'Groq', calls: 197, cost: '$0.02' },
            ].map((provider) => (
              <div key={provider.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{provider.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{provider.calls} calls</span>
                  <span className="text-sm font-semibold text-gray-900">{provider.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
