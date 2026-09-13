import { useState, useCallback } from 'react';
import { RAGQueryResponse, InstitutionalMemoryRecord } from '../types/nexus';
import { apiClient } from '../services/apiClient';

export interface UseInstitutionalMemoryReturn {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching: boolean;
  activeResponse: RAGQueryResponse | null;
  history: RAGQueryResponse[];
  executeSearch: (queryOverride?: string) => Promise<void>;
  clearSearch: () => void;
  sampleQueries: string[];
}

export const sampleQueries = [
  'Have we seen similar pipe-spool erection delays in previous projects, and what were the recorded causes?',
  'What were the historic root causes of batching plant concrete pour interruptions and mitigations?',
  'What was the historical resolution for crude booster pump alignment vibration runout?',
  'How did earlier pipeline phases handle radiographic NDT delays during monsoon seasons?',
];

export function useInstitutionalMemory(): UseInstitutionalMemoryReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeResponse, setActiveResponse] = useState<RAGQueryResponse | null>(null);
  const [history, setHistory] = useState<RAGQueryResponse[]>([]);

  const executeSearch = useCallback(
    async (queryOverride?: string) => {
      const q = queryOverride || searchQuery;
      if (!q.trim()) return;

      setIsSearching(true);
      try {
        const res = await apiClient.searchInstitutionalMemory(q);
        setActiveResponse(res);
        setHistory((prev) => [res, ...prev.filter((item) => item.query !== q)]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setActiveResponse(null);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    activeResponse,
    history,
    executeSearch,
    clearSearch,
    sampleQueries,
  };
}
