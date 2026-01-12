import { queryOcean } from '@/lib/ocean-db';

export default async function DecisionsPage() {
  const decisions = await queryOcean(
    'SELECT id, type, decision, reasoning, impact, made_by, created_at FROM decisions ORDER BY created_at DESC LIMIT 50'
  );

  const impactColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Architecture Decisions</h1>
          <p className="text-gray-600 mb-8">View all logged technical and architecture decisions</p>

          <div className="space-y-4">
            {decisions.map((decision: any) => (
              <div key={decision.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      {decision.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      impactColors[decision.impact] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {decision.impact} impact
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(decision.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{decision.decision}</h3>
                <p className="text-gray-600 mb-2">{decision.reasoning}</p>
                <p className="text-sm text-gray-500">Made by: {decision.made_by}</p>
              </div>
            ))}
          </div>

          {decisions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No decisions logged yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
