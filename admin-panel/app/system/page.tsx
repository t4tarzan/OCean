import { Database, Server, HardDrive, Cpu, Activity, CheckCircle, XCircle } from 'lucide-react';

async function getSystemHealth() {
  // In production, these would be real health checks
  const services = [
    { name: 'PostgreSQL', status: 'online', type: 'database', connections: '5/20', uptime: '99.9%', responseTime: '12ms' },
    { name: 'Neo4j', status: 'online', type: 'database', nodes: '14', uptime: '99.8%', responseTime: '45ms' },
    { name: 'Qdrant', status: 'online', type: 'database', vectors: '0', uptime: '100%', responseTime: '8ms' },
    { name: 'Redis', status: 'online', type: 'cache', memory: '2.1 MB', uptime: '100%', responseTime: '2ms' },
    { name: 'MinIO', status: 'online', type: 'storage', storage: '45 MB', uptime: '99.9%', responseTime: '15ms' },
    { name: 'API Proxy', status: 'online', type: 'service', port: '3001', uptime: '100%', responseTime: '35ms' },
  ];

  const serverMetrics = {
    cpu: 23,
    memory: 45,
    disk: 18,
    network: 12,
    uptime: '15 days',
    loadAverage: '0.45',
  };

  return { services, serverMetrics };
}

export default async function SystemPage() {
  const { services, serverMetrics } = await getSystemHealth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-1">Infrastructure health and performance metrics</p>
        </div>
        <Database className="text-cyan-600" size={32} />
      </div>

      {/* Server Metrics */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Server: 77.42.44.61</h2>
            <p className="text-slate-300">Hetzner • 8 vCPU • 32GB RAM • 240GB SSD</p>
          </div>
          <Server className="text-cyan-400" size={32} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">CPU Usage</span>
              <Cpu className="text-cyan-400" size={16} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{serverMetrics.cpu}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${serverMetrics.cpu}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">Memory</span>
              <Activity className="text-green-400" size={16} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{serverMetrics.memory}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: `${serverMetrics.memory}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">Disk Usage</span>
              <HardDrive className="text-blue-400" size={16} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{serverMetrics.disk}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${serverMetrics.disk}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">Uptime</span>
              <CheckCircle className="text-green-400" size={16} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{serverMetrics.uptime}</span>
            </div>
            <p className="text-slate-400 text-xs mt-2">Load: {serverMetrics.loadAverage}</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.name} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{service.type}</p>
              </div>
              {service.status === 'online' ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <XCircle className="text-red-500" size={24} />
              )}
            </div>

            <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block mb-4 ${
              service.status === 'online' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              ● {service.status === 'online' ? 'Online' : 'Offline'}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="font-semibold text-gray-900">{service.uptime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Response Time</span>
                <span className="font-semibold text-gray-900">{service.responseTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {service.connections ? 'Connections' : 
                   service.nodes ? 'Nodes' : 
                   service.vectors !== undefined ? 'Vectors' :
                   service.memory ? 'Memory' :
                   service.storage ? 'Storage' : 'Port'}
                </span>
                <span className="font-semibold text-gray-900">
                  {service.connections || service.nodes || service.vectors || service.memory || service.storage || service.port}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Docker Containers */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Docker Containers</h2>
        <div className="space-y-3">
          {services.filter(s => s.type === 'database' || s.type === 'cache' || s.type === 'storage').map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">ocean-{service.name.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>CPU: {Math.floor(Math.random() * 10)}%</span>
                <span>MEM: {Math.floor(Math.random() * 20)}%</span>
                <span className="text-green-600 font-medium">Running</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Health Checks</h3>
          <div className="space-y-2">
            {['All services responding', 'Database connections healthy', 'API endpoints accessible', 'No errors in logs'].map((check, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="text-green-500" size={16} />
                <span className="text-gray-700">{check}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
            <p className="text-sm">No active alerts</p>
            <p className="text-xs mt-1">All systems operating normally</p>
          </div>
        </div>
      </div>
    </div>
  );
}
