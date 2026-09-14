import React, { useState } from 'react';
import { useAuditTrail } from '../../hooks/useAuditTrail';
import { useMobileView } from '../../context/MobileViewContext';
import { ScreenHeader } from '../layout/ScreenHeader';
import { ArrowLeft, Clock, Eye, FileCode, Filter, Hash, ListOrdered, ShieldAlert } from 'lucide-react';

export const AuditTrailScreen: React.FC = () => {
  const { logs, isLoading, selectedLog, selectLog, filterAction, setFilterAction, filteredLogs } = useAuditTrail();
  const { isMobileView } = useMobileView();
  const [mobileTab, setMobileTab] = useState<'list' | 'diff'>('list');
  const filterOptions = ['ALL', 'APPROVE', 'EXTRACT', 'INTERRUPTION', 'GOVERNANCE'];

  const handleSelectLog = (log: (typeof logs)[0]) => {
    selectLog(log);
    if (isMobileView) setMobileTab('diff');
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted">
        <div className="mr-2 h-6 w-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
        Loading immutable log…
      </div>
    );
  }

  const renderRecordsList = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold tracking-wider text-ink uppercase">
        <span>Records ({filteredLogs.length})</span>
        <span className="font-normal normal-case tracking-normal text-muted">Newest first</span>
      </div>
      <div className="space-y-2">
        {filteredLogs.map((log) => {
          const isSelected = selectedLog?.id === log.id;
          return (
            <button
              key={log.id}
              id={`audit-row-${log.id}`}
              type="button"
              onClick={() => handleSelectLog(log)}
              className={`flex w-full flex-col gap-1.5 rounded-xl border p-3 text-left text-xs transition-all ${
                isSelected && !isMobileView
                  ? 'border-ember/50 bg-orange-50/70 ring-1 ring-ember/25'
                  : 'border-line bg-panel hover:border-ember/30'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-ember-dark">
                  {log.action}
                </span>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted">
                  <Clock className="h-3 w-3" />
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1 font-semibold text-ink">
                <span>{log.targetEntity}</span>
                <span className="font-mono font-normal text-muted">[{log.entityId}]</span>
              </div>
              <p className="line-clamp-2 text-[11px] text-muted italic">“{log.rationale}”</p>
              <div className="flex items-center justify-between gap-1 border-t border-line pt-1 font-mono text-[10px] text-muted">
                <span className="truncate">
                  {log.actorName} ({log.actorRole})
                </span>
                <span className="shrink-0">{log.evidenceHash}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDiffInspector = () => {
    if (!selectedLog) {
      return (
        <div className="rounded-xl border border-dashed border-line bg-panel p-8 text-center text-xs text-muted">
          Select a record to inspect the before/after state.
        </div>
      );
    }

    return (
      <div className="space-y-3 rounded-xl border border-line bg-panel p-3.5 sm:p-4">
        {isMobileView && (
          <div className="flex items-center justify-between border-b border-line pb-2">
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ember hover:text-ember-dark"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Records
            </button>
            <span className="font-mono text-[11px] text-muted">Diff</span>
          </div>
        )}

        <div className="flex items-start justify-between border-b border-line pb-2.5">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-muted uppercase">Inspection</div>
            <h3 className="mt-0.5 text-sm font-bold text-ink">{selectedLog.action}</h3>
          </div>
          <span className="rounded bg-paper px-2 py-0.5 font-mono text-xs text-ink-2">{selectedLog.id}</span>
        </div>

        <div className="space-y-2 rounded-lg border border-line bg-paper p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10px] text-muted">Actor</span>
              <strong className="text-ink">{selectedLog.actorName}</strong>
              <div className="text-[11px] text-muted">{selectedLog.actorRole}</div>
            </div>
            <div>
              <span className="block text-[10px] text-muted">Timestamp</span>
              <strong className="font-mono text-[11px] text-ink">
                {new Date(selectedLog.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </strong>
            </div>
          </div>
          <div className="border-t border-line pt-1.5">
            <span className="block text-[10px] text-muted">Rationale</span>
            <p className="mt-0.5 text-ink italic">“{selectedLog.rationale}”</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-ink-3 bg-ink p-2 font-mono text-[11px] text-orange-200">
          <div className="flex min-w-0 items-center gap-1.5 truncate">
            <Hash className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Hash: {selectedLog.evidenceHash}</span>
          </div>
          <span className="shrink-0 rounded border border-emerald-800 bg-emerald-950 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-emerald-300">
            Untampered
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink uppercase">
            <FileCode className="h-3.5 w-3.5 text-ember" />
            State mutation
          </div>
          <div className={`gap-2 font-mono text-[11px] ${isMobileView ? 'flex flex-col space-y-2' : 'grid grid-cols-2'}`}>
            <div className="w-full rounded-lg border border-rose-200 bg-rose-50/70 p-2.5">
              <div className="mb-1 flex items-center justify-between border-b border-rose-200/60 pb-1 font-sans font-bold text-rose-900">
                <span>Before</span>
                <span className="rounded bg-rose-100 px-1 font-mono text-[10px] text-rose-800">PREV</span>
              </div>
              <pre className="max-h-48 overflow-x-auto text-[10px] whitespace-pre-wrap text-ink-2 sm:text-[11px]">
                {selectedLog.beforeState
                  ? JSON.stringify(selectedLog.beforeState, null, 2)
                  : '// Initial ingestion\n// (No previous state)'}
              </pre>
            </div>
            <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5">
              <div className="mb-1 flex items-center justify-between border-b border-emerald-200/60 pb-1 font-sans font-bold text-emerald-900">
                <span>After</span>
                <span className="rounded bg-emerald-100 px-1 font-mono text-[10px] text-emerald-800">CURRENT</span>
              </div>
              <pre className="max-h-48 overflow-x-auto text-[10px] whitespace-pre-wrap text-ink-2 sm:text-[11px]">
                {JSON.stringify(selectedLog.afterState, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="audit-trail-screen" className="nexus-scroll flex h-full flex-col overflow-y-auto bg-paper">
      <ScreenHeader
        icon={ShieldAlert}
        eyebrow="Non-repudiation ledger"
        title="Immutable provenance"
        description="Every material change is attributable, timestamped, hashed, and versioned."
        trailing={
          <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-[10px] text-muted">
            Append-only
          </span>
        }
      />

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto rounded-xl border border-line bg-panel p-2.5">
          <Filter className="ml-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilterAction(opt)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                filterAction === opt ? 'bg-ink text-paper' : 'bg-paper text-ink-2 hover:bg-line'
              }`}
            >
              {opt === 'ALL' ? 'All ops' : opt}
            </button>
          ))}
        </div>

        {isMobileView ? (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-line bg-panel p-1">
              <button
                type="button"
                onClick={() => setMobileTab('list')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  mobileTab === 'list' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <ListOrdered className="h-3.5 w-3.5" />
                Records ({filteredLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('diff')}
                disabled={!selectedLog}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                  mobileTab === 'diff' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Diff
              </button>
            </div>
            {mobileTab === 'list' ? renderRecordsList() : renderDiffInspector()}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">{renderRecordsList()}</div>
            <div className="col-span-6">{renderDiffInspector()}</div>
          </div>
        )}
      </div>
    </div>
  );
};
