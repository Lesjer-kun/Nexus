import React from 'react';
import { useInstitutionalMemory } from '../../hooks/useInstitutionalMemory';
import { useMobileView } from '../../context/MobileViewContext';
import { DisciplineBadge } from '../common/DisciplineBadge';
import {
  Sparkles,
  Search,
  BookOpen,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export const InstitutionalMemoryScreen: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    activeResponse,
    executeSearch,
    sampleQueries,
  } = useInstitutionalMemory();

  const { isMobileView } = useMobileView();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  return (
    <div id="institutional-memory-screen" className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                Institutional Memory & Decision Support
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              RAG Intelligence Over Verified Actuals
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-300 px-2 py-0.5 sm:py-1 rounded border border-slate-700 font-mono shrink-0">
            pgvector
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
          Query validated historical execution patterns, root causes of delays, and lessons learned across Oil India Limited projects.
        </p>
      </div>

      <div className="p-3 sm:p-4 max-w-4xl mx-auto w-full space-y-3 sm:space-y-4 flex-1">
        {/* Search Input Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="memory-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question (e.g. pipe-spool delays, batching plant root causes)..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
              />
            </div>
            <button
              id="memory-search-submit-btn"
              type="button"
              disabled={!searchQuery.trim() || isSearching}
              onClick={() => executeSearch()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Retrieving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask RAG</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Suggested Questions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Example Queries from Blueprint:
            </span>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5">
              {sampleQueries.map((queryText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(queryText);
                    executeSearch(queryText);
                  }}
                  className="text-left text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 p-2 sm:px-2.5 sm:py-1 rounded-md border border-slate-200 transition-colors w-full sm:w-auto"
                >
                  "{queryText}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Response Card */}
        {activeResponse && (
          <div
            id="rag-active-response-card"
            className="bg-white rounded-xl border border-blue-200 p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4 animate-fadeIn"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Query Evaluated
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  "{activeResponse.query}"
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full self-start">
                <ShieldCheck className="w-3.5 h-3.5" />
                Grounded in {activeResponse.groundedFactsCount} Verified Actuals
              </span>
            </div>

            {/* Synthesized Answer */}
            <div className="space-y-1">
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Traceable Synthesis (Governed LLM Output)
              </div>
              <div className="bg-blue-50/50 p-3 sm:p-3.5 rounded-lg border border-blue-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                {activeResponse.answer}
              </div>
            </div>

            {/* Retrieved Citations & Grounded Records */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Retrieved Historical Citations (pgvector Matches)</span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-normal">
                  Historical DB
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {activeResponse.retrievedCitations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">{rec.title}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="font-mono text-[10px] sm:text-[11px] text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                            {rec.projectCode}
                          </span>
                          <DisciplineBadge discipline={rec.discipline} />
                          <span className="text-slate-400 text-[10px] sm:text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {rec.date}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] sm:text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        {(rec.relevanceScore * 100).toFixed(0)}% Match
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs bg-white p-2 rounded border border-slate-150">
                      <strong>Historical Summary:</strong> {rec.summary}
                    </p>

                    <div className={`gap-2 text-[11px] ${isMobileView ? 'space-y-2 flex flex-col' : 'grid grid-cols-2'}`}>
                      <div className="bg-rose-50/70 p-2 rounded border border-rose-150 text-rose-900">
                        <strong className="block text-rose-950 mb-0.5">Recorded Root Cause:</strong>
                        {rec.rootCause}
                      </div>
                      <div className="bg-emerald-50/70 p-2 rounded border border-emerald-150 text-emerald-900">
                        <strong className="block text-emerald-950 mb-0.5">Validated Mitigation:</strong>
                        {rec.resolution}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pt-1 flex items-center justify-between">
                      <span>Source: {rec.sourceEventRef}</span>
                      <span>Archive Check: PASSED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State when no query run yet */}
        {!activeResponse && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center text-slate-500 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <div className="text-sm font-semibold text-slate-800">
                Institutional Memory Repository Ready
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Type a question above or click one of the suggested query buttons to evaluate how NEXUS turns past execution events into reusable engineering insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
