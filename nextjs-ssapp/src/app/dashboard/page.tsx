import { Suspense } from 'react';
import { Layout } from '@/components/layout/layout';
import { Stats } from '@/components/dashboard/Stats';
import { Charts } from '@/components/dashboard/Charts';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="flex-1 space-y-4 p-1 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Suspense fallback={<Skeleton className="h-[20vh] w-full" />}>
          <Stats />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[40vh] w-full" />}>
          <Charts />
        </Suspense>
      </div>
    </Layout>
  );
}