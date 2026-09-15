import { useState, useEffect, useCallback } from 'react';
import { RiskAlert } from '../types/nexus';
import { apiClient } from '../services/apiClient';

export interface UseRiskAlertsReturn {
  alerts: RiskAlert[];
  isLoading: boolean;
  refreshAlerts: () => Promise<void>;
  evaluateRisk: () => Promise<void>;
  clearAlert: (alertId: string) => void;
}

export function useRiskAlerts(): UseRiskAlertsReturn {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const riskAlerts = await apiClient.getRiskAlerts();
      setAlerts(riskAlerts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const evaluate = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.evaluateRisk();
      setAlerts(result.alerts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
  }, []);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  return {
    alerts,
    isLoading,
    refreshAlerts,
    evaluateRisk: evaluate,
    clearAlert,
  };
}
