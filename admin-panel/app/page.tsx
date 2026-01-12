import { Suspense } from 'react';
import ProjectProgressCard from '@/components/dashboard/project-progress-card';
import ActiveAgentsCard from '@/components/dashboard/active-agents-card';
import SystemHealthCard from '@/components/dashboard/system-health-card';
import RecentActivityCard from '@/components/dashboard/recent-activity-card';
import QuickStatsCard from '@/components/dashboard/quick-stats-card';

export default function OverviewDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time snapshot of the OCEAN platform</p>
      </div>

      <Suspense fallback={<div className="h-32 bg-white rounded-lg animate-pulse" />}>
        <QuickStatsCard />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
          <ProjectProgressCard />
        </Suspense>

        <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
          <ActiveAgentsCard />
        </Suspense>

        <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
          <SystemHealthCard />
        </Suspense>

        <Suspense fallback={<div className="h-96 bg-white rounded-lg animate-pulse" />}>
          <RecentActivityCard />
        </Suspense>
      </div>
    </div>
  );
}
