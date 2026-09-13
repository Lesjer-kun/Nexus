import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProjectInfo, ScheduleActivity, DisciplineType } from '../types/nexus';
import { apiClient } from '../services/apiClient';

export interface UseProjectScheduleReturn {
  project: ProjectInfo | null;
  activities: ScheduleActivity[];
  selectedDiscipline: DisciplineType | 'ALL';
  setSelectedDiscipline: (d: DisciplineType | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredActivities: ScheduleActivity[];
  isLoading: boolean;
  refreshSchedule: () => Promise<void>;
  scheduleStats: {
    total: number;
    completed: number;
    inProgress: number;
    halted: number;
    notStarted: number;
    delayedCount: number;
    criticalPathCount: number;
    averageVarianceDays: number;
  };
}

export function useProjectSchedule(): UseProjectScheduleReturn {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [activities, setActivities] = useState<ScheduleActivity[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refreshSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const [proj, acts] = await Promise.all([
        apiClient.getProject(),
        apiClient.getActivities(),
      ]);
      setProject(proj);
      setActivities(acts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesDiscipline =
        selectedDiscipline === 'ALL' || act.discipline === selectedDiscipline;
      const matchesSearch =
        !searchQuery ||
        act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.wbsCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (act.equipmentTag && act.equipmentTag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesDiscipline && matchesSearch;
    });
  }, [activities, selectedDiscipline, searchQuery]);

  const scheduleStats = useMemo(() => {
    const total = activities.length;
    let completed = 0;
    let inProgress = 0;
    let halted = 0;
    let notStarted = 0;
    let delayedCount = 0;
    let criticalPathCount = 0;
    let totalVariance = 0;

    activities.forEach((act) => {
      if (act.status === 'COMPLETED') completed++;
      else if (act.status === 'IN_PROGRESS') inProgress++;
      else if (act.status === 'HALTED') halted++;
      else notStarted++;

      if (act.varianceDays > 0) delayedCount++;
      if (act.isCriticalPath) criticalPathCount++;
      totalVariance += act.varianceDays;
    });

    const averageVarianceDays = total > 0 ? Math.round((totalVariance / total) * 10) / 10 : 0;

    return {
      total,
      completed,
      inProgress,
      halted,
      notStarted,
      delayedCount,
      criticalPathCount,
      averageVarianceDays,
    };
  }, [activities]);

  return {
    project,
    activities,
    selectedDiscipline,
    setSelectedDiscipline,
    searchQuery,
    setSearchQuery,
    filteredActivities,
    isLoading,
    refreshSchedule,
    scheduleStats,
  };
}
