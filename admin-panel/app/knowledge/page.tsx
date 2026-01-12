'use client';

import { Network, Search, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function KnowledgePage() {
  const [data, setData] = useState({
    technologies: [
      { name: 'Next.js', category: 'framework', popularity: 0.90 },
      { name: 'PostgreSQL', category: 'database', popularity: 0.95 },
      { name: 'Neo4j', category: 'database', popularity: 0.85 },
      { name: 'React', category: 'frontend', popularity: 0.95 },
      { name: 'TailwindCSS', category: 'styling', popularity: 0.88 },
      { name: 'TypeScript', category: 'language', popularity: 0.92 },
      { name: 'Docker', category: 'infrastructure', popularity: 0.87 },
      { name: 'Redis', category: 'cache', popularity: 0.83 },
      { name: 'Qdrant', category: 'vector-db', popularity: 0.75 },
      { name: 'MinIO', category: 'storage', popularity: 0.70 },
      { name: 'Claude', category: 'ai-model', popularity: 0.95 },
      { name: 'OpenAI', category: 'ai-model', popularity: 0.93 },
      { name: 'Gemini', category: 'ai-model', popularity: 0.85 },
      { name: 'Groq', category: 'ai-model', popularity: 0.80 },
    ],
    patterns: [
      { name: 'Database-First', category: 'architecture' },
      { name: 'Multi-Agent', category: 'ai' },
      { name: 'API Proxy', category: 'api' },
      { name: 'Microservices', category: 'architecture' },
    ],
    relationships: [],
    stats: [
      { nodeType: 'Technology', count: 14 },
      { nodeType: 'Pattern', count: 4 },
      { nodeType: 'Agent', count: 7 },
      { nodeType: 'Decision', count: 23 },
    ]
  });

  const { technologies, patterns, relationships, stats } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Graph</h1>
          <p className="text-gray-600 mt-1">Explore team memory and collective intelligence</p>
        </div>
        <Network className="text-cyan-600" size={32} />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search nodes, relationships..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Graph Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat: any) => (
          <div key={stat.nodeType} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">{stat.nodeType}s</p>
            <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
          </div>
        ))}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Relationships</p>
          <p className="text-3xl font-bold text-gray-900">{relationships.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Nodes</p>
          <p className="text-3xl font-bold text-gray-900">{stats.reduce((sum: number, s: any) => sum + Number(s.count), 0)}</p>
        </div>
      </div>

      {/* Graph Visualization Placeholder */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Graph Visualization</h2>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-12 text-center">
          <Network className="mx-auto mb-4 text-slate-400" size={64} />
          <p className="text-lg font-medium text-gray-700">Interactive Graph Coming Soon</p>
          <p className="text-sm text-gray-600 mt-2">D3.js visualization will be implemented here</p>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technology Stack</h3>
          <div className="space-y-3">
            {technologies.map((tech: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{tech.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{tech.category}</p>
                </div>
                <div className="text-right">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full" 
                      style={{ width: `${(tech.popularity || 0.5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{((tech.popularity || 0.5) * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Library</h3>
          <div className="space-y-3">
            {patterns.map((pattern: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{pattern.name}</p>
                <p className="text-xs text-gray-600 capitalize">{pattern.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relationships */}
      {relationships.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Relationships</h3>
          <div className="space-y-2">
            {relationships.slice(0, 10).map((rel: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{rel.from}</span>
                <span className="text-gray-500">→</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{rel.type}</span>
                <span className="text-gray-500">→</span>
                <span className="font-medium text-gray-900">{rel.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
