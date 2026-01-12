import { queryPostgres } from '@/lib/db-connections';
import { FileText, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function getDecisionsData() {
  try {
    const decisions = await queryPostgres(`
      SELECT 
        id,
        type,
        decision,
        reasoning,
        impact,
        made_by,
        created_at
      FROM decisions
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const stats = await queryPostgres(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE impact = 'critical') as critical,
        COUNT(*) FILTER (WHERE impact = 'high') as high,
        COUNT(*) FILTER (WHERE impact = 'medium') as medium,
        COUNT(*) FILTER (WHERE impact = 'low') as low
      FROM decisions
    `);

    return { decisions, stats: stats[0] || { total: 0, critical: 0, high: 0, medium: 0, low: 0 } };
  } catch (error) {
    console.error('Error fetching decisions:', error);
    return { decisions: [], stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0 } };
  }
}

export default async function DecisionsPage() {
  const { decisions, stats } = await getDecisionsData();

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Critical</span>;
      case 'high':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">High</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Low</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">Unknown</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      architecture: 'bg-purple-100 text-purple-700',
      database: 'bg-blue-100 text-blue-700',
      framework: 'bg-green-100 text-green-700',
      api: 'bg-cyan-100 text-cyan-700',
      security: 'bg-red-100 text-red-700',
      deployment: 'bg-orange-100 text-orange-700',
      infrastructure: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Decision Map</h1>
          <p className="text-gray-600 mt-1">Track and visualize architecture decisions</p>
        </div>
        <FileText className="text-cyan-600" size={32} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Decisions</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Critical</p>
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">High</p>
          <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Medium</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Low</p>
          <p className="text-2xl font-bold text-green-600">{stats.low}</p>
        </div>
      </div>

      {/* Decision Timeline */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Decision Timeline</h2>
          <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
            Log New Decision
          </button>
        </div>

        {decisions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-medium">No decisions logged yet</p>
            <p className="text-sm mt-1">Start logging architecture decisions to track your project's evolution</p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision: any) => (
              <div key={decision.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(decision.type)}
                    {getImpactBadge(decision.impact)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {decision.created_at ? formatDistanceToNow(new Date(decision.created_at), { addSuffix: true }) : 'recently'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{decision.decision}</h3>
                
                {decision.reasoning && (
                  <p className="text-sm text-gray-600 mb-3">{decision.reasoning}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-600">
                    Made by: <span className="font-medium">{decision.made_by || 'team'}</span>
                  </span>
                  <button className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Decision Velocity</h3>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-gray-900">{decisions.length}</p>
            <p className="text-sm text-gray-600 mt-1">decisions this month</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Decision Types</h3>
            <CheckCircle className="text-cyan-500" size={20} />
          </div>
          <div className="space-y-2">
            {['architecture', 'database', 'framework', 'api', 'security'].map((type) => {
              const count = decisions.filter((d: any) => d.type === type).length;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
