export default function UsageAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage Analytics</h1>
          <p className="text-gray-600 mb-8">Monitor API usage, costs, and performance metrics</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-sm text-blue-600 font-medium mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-blue-900">0</p>
              <p className="text-xs text-blue-600 mt-1">This month</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <p className="text-sm text-green-600 font-medium mb-1">Tokens Used</p>
              <p className="text-3xl font-bold text-green-900">0</p>
              <p className="text-xs text-green-600 mt-1">This month</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <p className="text-sm text-purple-600 font-medium mb-1">Total Cost</p>
              <p className="text-3xl font-bold text-purple-900">$0.00</p>
              <p className="text-xs text-purple-600 mt-1">This month</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-6">
              <p className="text-sm text-orange-600 font-medium mb-1">Active Users</p>
              <p className="text-3xl font-bold text-orange-900">0</p>
              <p className="text-xs text-orange-600 mt-1">Last 24 hours</p>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent API Calls</h2>
            <div className="text-center py-12">
              <p className="text-gray-500">No API usage data available yet.</p>
              <p className="text-sm text-gray-400 mt-2">Usage will be tracked once the API proxy is configured.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
