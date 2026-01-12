import { queryPostgres } from '@/lib/db-connections';
import { Package, Star, Download, TrendingUp } from 'lucide-react';

async function getPatternsData() {
  try {
    const patterns = await queryPostgres(`
      SELECT id, name, category, description, usage_count, rating, created_at
      FROM patterns
      ORDER BY usage_count DESC
    `);
    return patterns;
  } catch (error) {
    console.error('Error fetching patterns:', error);
    return [];
  }
}

export default async function PatternsPage() {
  const patterns = await getPatternsData();

  const categories = ['All', 'Database', 'Agent', 'API', 'UI', 'Deployment'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pattern Marketplace</h1>
          <p className="text-gray-600 mt-1">Browse and share reusable code patterns</p>
        </div>
        <Package className="text-cyan-600" size={32} />
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button key={cat} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium whitespace-nowrap">
            {cat}
          </button>
        ))}
      </div>

      {/* Pattern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patterns.map((pattern: any) => (
          <div key={pattern.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{pattern.name}</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                {pattern.category}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pattern.description}</p>

            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Star className="text-yellow-500" size={16} />
                <span>{pattern.rating || '0.0'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download size={16} />
                <span>{pattern.usage_count || 0} uses</span>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
              View Pattern
            </button>
          </div>
        ))}
      </div>

      {patterns.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-medium text-gray-700">No patterns yet</p>
          <p className="text-sm text-gray-600 mt-1">Start adding reusable patterns to your marketplace</p>
        </div>
      )}
    </div>
  );
}
