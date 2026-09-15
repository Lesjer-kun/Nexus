import React, { useState, useEffect, useCallback } from 'react';
import { TopHeader } from './components/navigation/TopHeader';
import { MobileTabBar, ActiveTabType } from './components/navigation/MobileTabBar';
import { NavRail } from './components/navigation/NavRail';
import { MobileDeviceWrapper } from './components/mobile/MobileDeviceWrapper';
import { FieldCaptureScreen } from './components/field/FieldCaptureScreen';
import { PlannerReviewScreen } from './components/review/PlannerReviewScreen';
import { ScheduleTrackingScreen } from './components/schedule/ScheduleTrackingScreen';
import { RiskAlertsScreen } from './components/risk/RiskAlertsScreen';
import { InstitutionalMemoryScreen } from './components/memory/InstitutionalMemoryScreen';
import { AuditTrailScreen } from './components/audit/AuditTrailScreen';
import { MobileViewProvider, useMobileView } from './context/MobileViewContext';
import { apiClient } from './services/apiClient';
import { ProjectInfo } from './types/nexus';

function Workspace({
  activeRole,
  setActiveRole,
  activeTab,
  setActiveTab,
  isMobileFrame,
  setIsMobileFrame,
  project,
  pendingReviewCount,
  fetchProjectAndCounts,
  backendOnline,
}: {
  activeRole: 'SUPERVISOR' | 'PLANNER';
  setActiveRole: (role: 'SUPERVISOR' | 'PLANNER') => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  project: ProjectInfo | null;
  pendingReviewCount: number;
  fetchProjectAndCounts: () => Promise<void>;
  backendOnline: boolean | null;
}) {
  const { isMobileView } = useMobileView();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'CAPTURE':
        return (
          <FieldCaptureScreen
            onEventSubmitted={fetchProjectAndCounts}
            onNavigateToReview={() => {
              setActiveTab('REVIEW');
              setActiveRole('PLANNER');
            }}
          />
        );
      case 'REVIEW':
        return <PlannerReviewScreen />;
      case 'SCHEDULE':
        return <ScheduleTrackingScreen />;
      case 'RISKS':
        return <RiskAlertsScreen />;
      case 'MEMORY':
        return <InstitutionalMemoryScreen />;
      case 'AUDIT':
        return <AuditTrailScreen />;
      default:
        return <FieldCaptureScreen />;
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-paper font-sans text-ink select-text">
      <TopHeader
        project={project}
        activeRole={activeRole}
        setActiveRole={(role) => {
          setActiveRole(role);
          setActiveTab(role === 'SUPERVISOR' ? 'CAPTURE' : 'REVIEW');
        }}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        pendingReviewCount={pendingReviewCount}
        backendOnline={backendOnline}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <MobileDeviceWrapper isMobileFrame={isMobileFrame}>
          <div className="relative flex h-full w-full overflow-hidden">
            {!isMobileView && (
              <NavRail
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                pendingReviewCount={pendingReviewCount}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{renderActiveScreen()}</main>
              {isMobileView && (
                <MobileTabBar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  pendingReviewCount={pendingReviewCount}
                />
              )}
            </div>
          </div>
        </MobileDeviceWrapper>
      </div>
    </div>
  );
}

export default function App() {
  const [activeRole, setActiveRole] = useState<'SUPERVISOR' | 'PLANNER'>('SUPERVISOR');
  const [activeTab, setActiveTab] = useState<ActiveTabType>('CAPTURE');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(2);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const fetchProjectAndCounts = useCallback(async () => {
    setBackendOnline(await apiClient.getBackendHealth());
    try {
      const proj = await apiClient.getProject();
      setProject(proj);
      const pending = await apiClient.getPendingReviews();
      setPendingReviewCount(pending.length);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchProjectAndCounts();
  }, [fetchProjectAndCounts]);

  useEffect(() => {
    const handleReviewQueueChanged = () => {
      fetchProjectAndCounts();
    };

    window.addEventListener('nexus:review-queue-changed', handleReviewQueueChanged);
    return () => window.removeEventListener('nexus:review-queue-changed', handleReviewQueueChanged);
  }, [fetchProjectAndCounts]);

  return (
    <MobileViewProvider isMobileFrame={isMobileFrame} setIsMobileFrame={setIsMobileFrame}>
      <Workspace
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        project={project}
        pendingReviewCount={pendingReviewCount}
        fetchProjectAndCounts={fetchProjectAndCounts}
        backendOnline={backendOnline}
      />
    </MobileViewProvider>
  );
}
