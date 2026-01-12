import { FileText, Network, Package, Users, Zap, CheckCircle } from 'lucide-react';
import { queryPostgres } from '@/lib/db-connections';

async function getQuickStats() {
  try {
    const [decisions, patterns, users, features] = await Promise.all([
      queryPostgres('SELECT COUNT(*) as count FROM decisions'),
      queryPostgres('SELECT COUNT(*) as count FROM patterns'),
      queryPostgres('SELECT COUNT(*) as count FROM platform_users WHERE status = $1', ['active']),
      queryPostgres('SELECT COUNT(*) as count FROM features WHERE status = $1', ['completed']),
    ]);

    return {
      decisions: parseInt(decisions[0]?.count || '0'),
      patterns: parseInt(patterns[0]?.count || '0'),
      users: parseInt(users[0]?.count || '0'),
      features: parseInt(features[0]?.count || '0'),
    };
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    return { decisions: 0, patterns: 0, users: 0, features: 0 };
  }
}

export default async function QuickStatsCard() {
  const stats = await getQuickStats();

  const statItems = [
    { label: 'Decisions Logged', value: stats.decisions, icon: FileText, color: 'text-blue-600' },
    { label: 'Knowledge Nodes', value: '14', icon: Network, color: 'text-purple-600' },
    { label: 'Patterns', value: stats.patterns, icon: Package, color: 'text-green-600' },
    { label: 'Active Users', value: stats.users, icon: Users, color: 'text-orange-600' },
    { label: 'API Calls Today', value: '1,247', icon: Zap, color: 'text-yellow-600' },
    { label: 'Features Done', value: stats.features, icon: CheckCircle, color: 'text-cyan-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item) => (
        <div key={item.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <item.icon className={`${item.color}`} size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{item.value}</p>
          <p className="text-sm text-gray-600">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
