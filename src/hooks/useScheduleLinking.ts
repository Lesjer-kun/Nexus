import { useState, useEffect, useCallback } from 'react';
import { ExecutionEvent, GovernanceStatus, ScheduleActivity } from '../types/nexus';
import { apiClient } from '../services/apiClient';

export interface UseScheduleLinkingReturn {
  pendingEvents: ExecutionEvent[];
  selectedEvent: ExecutionEvent | null;
  selectEvent: (event: ExecutionEvent | null) => void;
  isLoading: boolean;
  isActionSubmitting: boolean;
  activities: ScheduleActivity[];
  approveEvent: (eventId: string, activityId: string, notes?: string) => Promise<boolean>;
  correctAndApproveEvent: (
    eventId: string,
    targetActivityId: string,
    correctedFields: Partial<ExecutionEvent>,
    notes: string
  ) => Promise<boolean>;
  rejectEvent: (eventId: string, reason: string) => Promise<boolean>;
  requestClarification: (eventId: string, query: string) => Promise<boolean>;
  refreshQueue: () => Promise<void>;
  actionSuccessMessage: string | null;
  clearMessage: () => void;
}

export function useScheduleLinking(): UseScheduleLinkingReturn {
  const [pendingEvents, setPendingEvents] = useState<ExecutionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ExecutionEvent | null>(null);
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await apiClient.getEvents();
      const acts = await apiClient.getActivities();
      setActivities(acts);
      const pending = all.filter((e) => e.governanceStatus === 'PENDING_REVIEW');
      setPendingEvents(pending);

      // Keep selected event in sync
      if (selectedEvent) {
        const updated = all.find((e) => e.id === selectedEvent.id);
        if (updated) setSelectedEvent(updated);
        else if (pending.length > 0) setSelectedEvent(pending[0]);
        else setSelectedEvent(null);
      } else if (pending.length > 0) {
        setSelectedEvent(pending[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    refreshQueue();
  }, []);

  const clearMessage = useCallback(() => {
    setActionSuccessMessage(null);
  }, []);

  const handleGovernanceAction = useCallback(
    async (
      eventId: string,
      decision: GovernanceStatus,
      targetActivityId: string,
      notes: string,
      correctedFields?: Partial<ExecutionEvent>
    ): Promise<boolean> => {
      setIsActionSubmitting(true);
      try {
        await apiClient.submitGovernanceDecision(
          eventId,
          decision,
          targetActivityId,
          notes,
          correctedFields
        );
        setActionSuccessMessage(
          `Event ${eventId.toUpperCase()} successfully marked as ${decision}. L5/L6 schedule synchronized.`
        );
        await refreshQueue();
        return true;
      } catch (err) {
        console.error('Governance action failed', err);
        return false;
      } finally {
        setIsActionSubmitting(false);
      }
    },
    [refreshQueue]
  );

  const approveEvent = useCallback(
    async (eventId: string, activityId: string, notes = 'Verified by planner'): Promise<boolean> => {
      return handleGovernanceAction(eventId, 'APPROVED', activityId, notes);
    },
    [handleGovernanceAction]
  );

  const correctAndApproveEvent = useCallback(
    async (
      eventId: string,
      targetActivityId: string,
      correctedFields: Partial<ExecutionEvent>,
      notes: string
    ): Promise<boolean> => {
      return handleGovernanceAction(
        eventId,
        'CORRECTED',
        targetActivityId,
        notes,
        correctedFields
      );
    },
    [handleGovernanceAction]
  );

  const rejectEvent = useCallback(
    async (eventId: string, reason: string): Promise<boolean> => {
      const ev = pendingEvents.find((e) => e.id === eventId);
      return handleGovernanceAction(
        eventId,
        'REJECTED',
        ev?.selectedActivityId || '',
        reason
      );
    },
    [handleGovernanceAction, pendingEvents]
  );

  const requestClarification = useCallback(
    async (eventId: string, query: string): Promise<boolean> => {
      const ev = pendingEvents.find((e) => e.id === eventId);
      return handleGovernanceAction(
        eventId,
        'NEEDS_CLARIFICATION',
        ev?.selectedActivityId || '',
        `Planner requested clarification: ${query}`
      );
    },
    [handleGovernanceAction, pendingEvents]
  );

  return {
    pendingEvents,
    selectedEvent,
    selectEvent: setSelectedEvent,
    isLoading,
    isActionSubmitting,
    activities,
    approveEvent,
    correctAndApproveEvent,
    rejectEvent,
    requestClarification,
    refreshQueue,
    actionSuccessMessage,
    clearMessage,
  };
}
