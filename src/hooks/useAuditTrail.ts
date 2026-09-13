import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuditLogRecord } from '../types/nexus';
import { apiClient } from '../services/apiClient';

export interface UseAuditTrailReturn {
  logs: AuditLogRecord[];
  isLoading: boolean;
  selectedLog: AuditLogRecord | null;
  selectLog: (log: AuditLogRecord | null) => void;
  filterAction: string;
  setFilterAction: (action: string) => void;
  filteredLogs: AuditLogRecord[];
  refreshLogs: () => Promise<void>;
}

export function useAuditTrail(): UseAuditTrailReturn {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const refreshLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await apiClient.getAuditLogs();
      setLogs(records);
      if (records.length > 0 && !selectedLog) {
        setSelectedLog(records[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedLog]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  const filteredLogs = useMemo(() => {
    if (filterAction === 'ALL') return logs;
    return logs.filter((log) => log.action.includes(filterAction));
  }, [logs, filterAction]);

  return {
    logs,
    isLoading,
    selectedLog,
    selectLog: setSelectedLog,
    filterAction,
    setFilterAction,
    filteredLogs,
    refreshLogs,
  };
}
