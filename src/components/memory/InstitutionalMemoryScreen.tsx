import React from 'react';
import { useInstitutionalMemory } from '../../hooks/useInstitutionalMemory';
import { useMobileView } from '../../context/MobileViewContext';
import { DisciplineBadge } from '../common/DisciplineBadge';
import { ScreenHeader } from '../layout/ScreenHeader';
import { BookOpen, Calendar, Search, ShieldCheck, Sparkles } from 'lucide-react';

export const InstitutionalMemoryScreen: React.FC = () => {
  const { searchQuery, setSearchQuery, isSearching, activeResponse, executeSearch, sampleQueries } =
    useInstitutionalMemory();
  const { isMobileView } = useMobileView();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') executeSearch();
  };

  return (
    <div id="institutional-memory-screen" className="nexus-scroll flex h-full flex-col overflow-y-auto bg-paper">
      <ScreenHeader
        icon={Sparkles}
        eyebrow="Institutional memory"
        title="Ask verified execution history"
        description="Answers are grounded in approved actuals — not free-form generation."
        trailing={
          <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-[10px] text-muted">
            pgvector
          </span>
        }
      />

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className="space-y-3 rounded-xl border border-line bg-panel p-3 sm:p-4">
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-3 left-3 h-4 w-4 text-muted" />
              <input
                id="memory-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. pipe-spool delays, batching plant root causes…"
                className="w-full rounded-lg border border-line bg-white py-2.5 pr-3 pl-9 text-xs text-ink focus:border-ember focus:ring-2 focus:ring-ember/25 focus:outline-none"
              />
            </div>
            <button
              id="memory-search-submit-btn"
              type="button"
              disabled={!searchQuery.trim() || isSearching}
              onClick={() => executeSearch()}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-ember px-4 py-2.5 text-xs font-semibold text-white hover:bg-ember-dark disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Retrieving…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Search memory
                </>
              )}
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="block text-[10px] font-semibold tracking-wider text-muted uppercase">Example questions</span>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
              {sampleQueries.map((queryText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(queryText);
                    executeSearch(queryText);
                  }}
                  className="w-full rounded-md border border-line bg-paper p-2 text-left text-xs text-ink-2 transition-colors hover:border-ember/40 hover:bg-orange-50 sm:w-auto sm:px-2.5 sm:py-1"
                >
                  “{queryText}”
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeResponse && (
          <div
            id="rag-active-response-card"
            className="animate-fadeIn space-y-4 rounded-xl border border-ember/20 bg-panel p-3.5 sm:p-5"
          >
            <div className="flex flex-col justify-between gap-2 border-b border-line pb-3 sm:flex-row sm:items-start">
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-muted uppercase">Query</div>
                <h3 className="mt-0.5 text-xs font-bold text-ink sm:text-sm">“{activeResponse.query}”</h3>
              </div>
              <span className="inline-flex items-center gap-1 self-start rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                {activeResponse.groundedFactsCount} verified actuals
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
                <Sparkles className="h-3.5 w-3.5 text-ember" />
                Governed synthesis
              </div>
              <div className="rounded-lg border border-line bg-paper p-3 text-xs leading-relaxed whitespace-pre-line text-ink">
                {activeResponse.answer}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold tracking-wider text-ink uppercase">
                <span>Citations</span>
                <span className="font-normal normal-case tracking-normal text-muted">Historical DB</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {activeResponse.retrievedCitations.map((rec) => (
                  <div key={rec.id} className="space-y-2 rounded-lg border border-line bg-paper p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-ink">{rec.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[10px] text-ember-dark">
                            {rec.projectCode}
                          </span>
                          <DisciplineBadge discipline={rec.discipline} />
                          <span className="flex items-center gap-1 text-[10px] text-muted">
                            <Calendar className="h-3 w-3" />
                            {rec.date}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                        {(rec.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="rounded border border-line bg-white p-2 text-ink-2">
                      <strong>Summary:</strong> {rec.summary}
                    </p>
                    <div className={isMobileView ? 'flex flex-col space-y-2' : 'grid grid-cols-2 gap-2'}>
                      <div className="rounded border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-950">
                        <strong className="mb-0.5 block">Root cause</strong>
                        {rec.rootCause}
                      </div>
                      <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-950">
                        <strong className="mb-0.5 block">Mitigation</strong>
                        {rec.resolution}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-muted">
                      <span>Source: {rec.sourceEventRef}</span>
                      <span>Archive: PASSED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!activeResponse && (
          <div className="space-y-3 rounded-xl border border-dashed border-line bg-panel p-8 text-center text-muted">
            <BookOpen className="mx-auto h-10 w-10 text-line" />
            <div>
              <div className="text-sm font-semibold text-ink">Memory is ready</div>
              <p className="mx-auto mt-1 max-w-md text-xs">
                Ask a question or pick an example to see how verified events become reusable engineering insight.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
