import React, { useState, useEffect, useCallback } from 'react';
import { TopHeader } from './components/navigation/TopHeader';
import { MobileTabBar, ActiveTabType } from './components/navigation/MobileTabBar';
import { MobileDeviceWrapper } from './components/mobile/MobileDeviceWrapper';
import { FieldCaptureScreen } from './components/field/FieldCaptureScreen';
import { PlannerReviewScreen } from './components/review/PlannerReviewScreen';
import { ScheduleTrackingScreen } from './components/schedule/ScheduleTrackingScreen';
import { InstitutionalMemoryScreen } from './components/memory/InstitutionalMemoryScreen';
import { AuditTrailScreen } from './components/audit/AuditTrailScreen';
import { MobileViewProvider } from './context/MobileViewContext';
import { apiClient } from './services/apiClient';
import { ProjectInfo } from './types/nexus';

export default function App() {
  const [activeRole, setActiveRole] = useState<'SUPERVISOR' | 'PLANNER'>('SUPERVISOR');
  const [activeTab, setActiveTab] = useState<ActiveTabType>('CAPTURE');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true); // Default to mobile frame to immediately show the fixed mobile view
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(2);

  const fetchProjectAndCounts = useCallback(async () => {
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

  const handleRoleChange = (role: 'SUPERVISOR' | 'PLANNER') => {
    setActiveRole(role);
    if (role === 'SUPERVISOR') {
      setActiveTab('CAPTURE');
    } else {
      setActiveTab('REVIEW');
    }
  };

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
      case 'MEMORY':
        return <InstitutionalMemoryScreen />;
      case 'AUDIT':
        return <AuditTrailScreen />;
      default:
        return <FieldCaptureScreen />;
    }
  };

  return (
    <MobileViewProvider isMobileFrame={isMobileFrame} setIsMobileFrame={setIsMobileFrame}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans select-text">
        {/* Top Application Header */}
        <TopHeader
          project={project}
          activeRole={activeRole}
          setActiveRole={handleRoleChange}
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
          pendingReviewCount={pendingReviewCount}
        />

        {/* Main View Container */}
        <div className="flex-1 flex overflow-hidden">
          <MobileDeviceWrapper isMobileFrame={isMobileFrame}>
            <div className="flex flex-col h-full w-full overflow-hidden relative">
              {/* Screen Content View */}
              <main className="flex-1 overflow-hidden relative flex flex-col">
                {renderActiveScreen()}
              </main>

              {/* Bottom Tab Bar for Mobile Navigation */}
              <MobileTabBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                pendingReviewCount={pendingReviewCount}
              />
            </div>
          </MobileDeviceWrapper>
        </div>
      </div>
    </MobileViewProvider>
  );
}
