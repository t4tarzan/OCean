import { Database, CheckCircle, XCircle } from 'lucide-react';

async function getSystemHealth() {
  const services = [
    { name: 'PostgreSQL', status: 'online', connections: '5/20' },
    { name: 'Neo4j', status: 'online', nodes: '14' },
    { name: 'Qdrant', status: 'online', vectors: '0' },
    { name: 'Redis', status: 'online', memory: '2.1 MB' },
    { name: 'MinIO', status: 'online', storage: '45 MB' },
    { name: 'API Proxy', status: 'online', port: '3001' },
  ];

  return services;
}

export default async function SystemHealthCard() {
  const services = await getSystemHealth();

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
        <Database className="text-cyan-600" size={20} />
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {service.status === 'online' ? (
                <CheckCircle className="text-green-500" size={16} />
              ) : (
                <XCircle className="text-red-500" size={16} />
              )}
              <span className="text-sm font-medium text-gray-900">{service.name}</span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium ${
                service.status === 'online' ? 'text-green-600' : 'text-red-600'
              }`}>
                {service.status === 'online' ? '● Online' : '● Offline'}
              </span>
              <p className="text-xs text-gray-600">
                {service.connections || service.nodes || service.vectors || service.memory || service.storage || service.port}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Uptime</p>
            <p className="font-semibold text-gray-900">99.9%</p>
          </div>
          <div>
            <p className="text-gray-600">Response Time</p>
            <p className="font-semibold text-gray-900">45ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
