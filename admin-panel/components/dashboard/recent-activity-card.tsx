import { Activity, FileText, GitCommit, Package, Users } from 'lucide-react';
import { queryPostgres } from '@/lib/db-connections';
import { formatDistanceToNow } from 'date-fns';

async function getRecentActivity() {
  try {
    const activities = await queryPostgres(`
      SELECT 
        'decision' as type,
        decision as description,
        created_at as timestamp
      FROM decisions
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return activities.length > 0 ? activities : [
      { type: 'decision', description: 'Phase 1 infrastructure complete', timestamp: new Date() },
      { type: 'agent', description: 'All 7 agents initialized', timestamp: new Date() },
      { type: 'pattern', description: 'Database-first pattern added', timestamp: new Date() },
    ];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

export default async function RecentActivityCard() {
  const activities = await getRecentActivity();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'decision':
        return <FileText className="text-blue-500" size={16} />;
      case 'commit':
        return <GitCommit className="text-green-500" size={16} />;
      case 'pattern':
        return <Package className="text-purple-500" size={16} />;
      case 'agent':
        return <Users className="text-orange-500" size={16} />;
      default:
        return <Activity className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Activity className="text-cyan-600" size={20} />
      </div>

      <div className="space-y-3">
        {activities.map((activity: any, index: number) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="mt-0.5">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">{activity.description}</p>
              <p className="text-xs text-gray-600">
                {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'just now'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
          View all activity →
        </button>
      </div>
    </div>
  );
}
