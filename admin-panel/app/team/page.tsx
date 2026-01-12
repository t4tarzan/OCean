import { Users, MessageSquare, Activity } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
          <p className="text-gray-600 mt-1">Real-time team collaboration and activity</p>
        </div>
        <Users className="text-cyan-600" size={32} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kanban Board</h2>
          <div className="grid grid-cols-4 gap-4">
            {['Backlog', 'In Progress', 'Review', 'Done'].map((col) => (
              <div key={col} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">{col}</h3>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border border-gray-200 text-sm">
                    Sample task
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <p className="font-medium text-gray-900">Admin</p>
                <p className="text-xs text-gray-600">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
