'use client';

import { BarChart3, TrendingUp, Activity, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const velocityData = [
  { week: 'Week 1', tasks: 8 },
  { week: 'Week 2', tasks: 10 },
  { week: 'Week 3', tasks: 12 },
  { week: 'Week 4', tasks: 15 },
  { week: 'Week 5', tasks: 14 },
  { week: 'Week 6', tasks: 16 },
];

const agentPerformanceData = [
  { name: 'Architect', tasks: 45, success: 98 },
  { name: 'Database', tasks: 38, success: 100 },
  { name: 'API', tasks: 42, success: 97 },
  { name: 'Frontend', tasks: 35, success: 95 },
  { name: 'QA', tasks: 40, success: 99 },
  { name: 'Security', tasks: 30, success: 100 },
  { name: 'Integrator', tasks: 28, success: 96 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">Data-driven insights and performance metrics</p>
        </div>
        <BarChart3 className="text-cyan-600" size={32} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks/Week', value: '12', icon: Activity, color: 'text-blue-600' },
          { label: 'Velocity', value: '+15%', icon: TrendingUp, color: 'text-green-600' },
          { label: 'API Calls', value: '1.2K', icon: Zap, color: 'text-yellow-600' },
          { label: 'Success Rate', value: '98%', icon: Activity, color: 'text-cyan-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Velocity Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tasks" stroke="#0284c7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasks" fill="#0284c7" />
              <Bar dataKey="success" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
