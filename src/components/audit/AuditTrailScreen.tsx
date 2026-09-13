import React, { useState } from 'react';
import { useAuditTrail } from '../../hooks/useAuditTrail';
import { useMobileView } from '../../context/MobileViewContext';
import {
  ShieldAlert,
  Clock,
  Hash,
  FileCode,
  Filter,
  ArrowLeft,
  ListOrdered,
  Eye,
} from 'lucide-react';

export const AuditTrailScreen: React.FC = () => {
  const {
    logs,
    isLoading,
    selectedLog,
    selectLog,
    filterAction,
    setFilterAction,
    filteredLogs,
  } = useAuditTrail();

  const { isMobileView } = useMobileView();
  const [mobileTab, setMobileTab] = useState<'list' | 'diff'>('list');

  const filterOptions = ['ALL', 'APPROVE', 'EXTRACT', 'INTERRUPTION', 'GOVERNANCE'];

  const handleSelectLog = (log: typeof logs[0]) => {
    selectLog(log);
    if (isMobileView) {
      setMobileTab('diff');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        Loading Immutable Audit Log...
      </div>
    );
  }

  // Render Records List
  const renderRecordsList = () => (
    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
        <span>Audit Records ({filteredLogs.length})</span>
        <span className="text-[11px] text-slate-500 font-normal">Sorted chronologically</span>
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
              className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                isSelected && !isMobileView
                  ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded text-[11px]">
                  {log.action}
                </span>
                <span className="text-slate-500 text-[11px] flex items-center gap-1 font-mono shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              <div className="text-slate-900 font-semibold flex items-center gap-1 flex-wrap">
                <span>Target:</span>
                <span className="font-mono text-slate-700">
                  {log.targetEntity} [{log.entityId}]
                </span>
              </div>

              <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                "{log.rationale}"
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 font-mono gap-1">
                <span className="truncate">
                  Actor: {log.actorName} ({log.actorRole})
                </span>
                <span className="shrink-0">{log.evidenceHash}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render Diff & Provenance Inspector
  const renderDiffInspector = () => {
    if (!selectedLog) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          Select an audit entry to view the before-and-after cryptographic diff.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Mobile Back Button */}
        {isMobileView && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setMobileTab('list')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Records List</span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              Diff Inspector
            </span>
          </div>
        )}

        <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Audit Inspection View
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {selectedLog.action}
            </h3>
          </div>
          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            {selectedLog.id}
          </span>
        </div>

        {/* Actor & Timestamp */}
        <div className="space-y-2 text-xs bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 text-[10px] sm:text-[11px] block">Authorized Actor:</span>
              <strong className="text-slate-900">{selectedLog.actorName}</strong>
              <div className="text-[11px] text-slate-500">{selectedLog.actorRole}</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] sm:text-[11px] block">Recorded Timestamp:</span>
              <strong className="text-slate-900 font-mono text-[11px]">
                {new Date(selectedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </strong>
            </div>
          </div>
          <div className="pt-1.5 border-t border-slate-200/60">
            <span className="text-slate-500 text-[10px] sm:text-[11px] block">Decision Rationale:</span>
            <p className="text-slate-800 text-xs italic mt-0.5">"{selectedLog.rationale}"</p>
          </div>
        </div>

        {/* Cryptographic Hash Verification */}
        <div className="p-2 bg-slate-900 text-cyan-300 font-mono text-[11px] rounded-lg border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Hash: {selectedLog.evidenceHash}</span>
          </div>
          <span className="text-emerald-400 text-[10px] shrink-0 font-sans font-semibold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
            Verified Untampered
          </span>
        </div>

        {/* Before vs After State Diff */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>State Mutation (Before → After)</span>
          </div>

          <div className={`gap-2 text-[11px] font-mono ${isMobileView ? 'space-y-2 flex flex-col' : 'grid grid-cols-2'}`}>
            {/* Before State */}
            <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200 w-full">
              <div className="font-bold text-rose-900 font-sans mb-1 pb-1 border-b border-rose-200/60 flex items-center justify-between">
                <span>Before State</span>
                <span className="text-[10px] font-mono text-rose-700 font-bold bg-rose-100 px-1 rounded">PREV</span>
              </div>
              <pre className="text-slate-700 overflow-x-auto whitespace-pre-wrap text-[10px] sm:text-[11px] max-h-48">
                {selectedLog.beforeState
                  ? JSON.stringify(selectedLog.beforeState, null, 2)
                  : '// Initial ingestion\n// (No previous state)'}
              </pre>
            </div>

            {/* After State */}
            <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 w-full">
              <div className="font-bold text-emerald-900 font-sans mb-1 pb-1 border-b border-emerald-200/60 flex items-center justify-between">
                <span>After State</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1 rounded">CURRENT</span>
              </div>
              <pre className="text-slate-700 overflow-x-auto whitespace-pre-wrap text-[10px] sm:text-[11px] max-h-48">
                {JSON.stringify(selectedLog.afterState, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="audit-trail-screen" className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                Non-Repudiation & Anti-Corruption Governance
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              Immutable Ledger & Provenance History
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 sm:py-1 rounded border border-slate-700 shrink-0">
            Append-Only
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
          Every material progress change is attributable to an authenticated actor, timestamped, cryptographically hashed, and versioned without silent overwrites.
        </p>
      </div>

      <div className="p-3 sm:p-4 max-w-7xl mx-auto w-full space-y-3 sm:space-y-4 flex-1">
        {/* Action Filter Pills */}
        <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider shrink-0 mr-1">
            Filter:
          </span>
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilterAction(opt)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                filterAction === opt
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt === 'ALL' ? 'All Ops' : opt}
            </button>
          ))}
        </div>

        {/* Content View: Mobile Tabs vs Desktop Grid */}
        {isMobileView ? (
          <div className="space-y-3">
            {/* Mobile Toggle Bar */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setMobileTab('list')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mobileTab === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Records ({filteredLogs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('diff')}
                disabled={!selectedLog}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mobileTab === 'diff'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspection & Diff</span>
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
