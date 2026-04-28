import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { AnalyticsOverviewCards } from '../components/admin/analytics/AnalyticsOverviewCards';
import { CreatorAnalyticsTable } from '../components/admin/analytics/CreatorAnalyticsTable';
import { CreatorAnalyticsDrawer } from '../components/admin/analytics/CreatorAnalyticsDrawer';
import { ProcessPayoutModal } from '../components/admin/analytics/ProcessPayoutModal';
import { useAnalyticsOverview, useCreatorsAnalytics } from '../hooks/useAdminAnalytics';
import { ADMIN_ANALYTICS_TABS } from '../constants/admin-analytics.constants';
import { CreatorFinancialSummary } from '../types/admin-analytics.types';
import { BarChart, Users } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(ADMIN_ANALYTICS_TABS.OVERVIEW);
  
  // Drawer state
  const [drawerCreatorId, setDrawerCreatorId] = useState<string | null>(null);
  
  // Modal state
  const [payoutCreator, setPayoutCreator] = useState<CreatorFinancialSummary | null>(null);

  // Data fetching
  const { data: overviewData, isLoading: isLoadingOverview } = useAnalyticsOverview();
  const { data: creatorsData, isLoading: isLoadingCreators } = useCreatorsAnalytics();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Platform Analytics & Payouts</h2>
      </div>

      <Tabs defaultValue={ADMIN_ANALYTICS_TABS.OVERVIEW} className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value={ADMIN_ANALYTICS_TABS.OVERVIEW} className="flex items-center space-x-2">
            <BarChart className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value={ADMIN_ANALYTICS_TABS.CREATORS} className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Creators Breakdown</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={ADMIN_ANALYTICS_TABS.OVERVIEW} className="space-y-4">
          <AnalyticsOverviewCards data={overviewData} isLoading={isLoadingOverview} />
        </TabsContent>

        <TabsContent value={ADMIN_ANALYTICS_TABS.CREATORS} className="space-y-4">
          <CreatorAnalyticsTable
            creators={creatorsData || []}
            isLoading={isLoadingCreators}
            onOpenPayoutModal={setPayoutCreator}
            onViewDetails={setDrawerCreatorId}
          />
        </TabsContent>
      </Tabs>

      <CreatorAnalyticsDrawer
        creatorId={drawerCreatorId}
        isOpen={!!drawerCreatorId}
        onClose={() => setDrawerCreatorId(null)}
      />

      <ProcessPayoutModal
        creator={payoutCreator}
        isOpen={!!payoutCreator}
        onClose={() => setPayoutCreator(null)}
      />
    </div>
  );
};

export default AdminAnalyticsPage;
