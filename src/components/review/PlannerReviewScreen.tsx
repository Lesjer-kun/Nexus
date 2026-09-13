import React, { useState } from 'react';
import { useScheduleLinking } from '../../hooks/useScheduleLinking';
import { useMobileView } from '../../context/MobileViewContext';
import { ConfidenceGauge } from '../common/ConfidenceGauge';
import { DisciplineBadge } from '../common/DisciplineBadge';
import { StatusBadge, GovernanceBadge } from '../common/StatusBadge';
import { EvidenceCard } from '../common/EvidenceCard';
import {
  CheckCircle,
  Edit3,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowLeft,
  ListFilter,
  Eye,
} from 'lucide-react';

export const PlannerReviewScreen: React.FC = () => {
  const {
    pendingEvents,
    selectedEvent,
    selectEvent,
    isLoading,
    isActionSubmitting,
    activities,
    approveEvent,
    correctAndApproveEvent,
    rejectEvent,
    requestClarification,
    actionSuccessMessage,
    clearMessage,
  } = useScheduleLinking();

  const { isMobileView } = useMobileView();
  const [mobileTab, setMobileTab] = useState<'queue' | 'detail'>('queue');
  const [isEditingCorrection, setIsEditingCorrection] = useState(false);
  const [selectedActivityForCorrection, setSelectedActivityForCorrection] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [clarificationQuery, setClarificationQuery] = useState('');
  const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);

  const handleSelectEvent = (ev: typeof pendingEvents[0]) => {
    selectEvent(ev);
    setIsEditingCorrection(false);
    if (isMobileView) {
      setMobileTab('detail');
    }
  };

  const handleApprove = async () => {
    if (!selectedEvent || !selectedEvent.selectedActivityId) return;
    await approveEvent(
      selectedEvent.id,
      selectedEvent.selectedActivityId,
      'Approved as authoritative execution update by Planner.'
    );
    if (isMobileView) {
      setMobileTab('queue');
    }
  };

  const handleCorrectSubmit = async () => {
    if (!selectedEvent || !selectedActivityForCorrection) return;
    await correctAndApproveEvent(
      selectedEvent.id,
      selectedActivityForCorrection,
      {},
      correctionNotes || 'Planner re-routed activity to correct WBS node.'
    );
    setIsEditingCorrection(false);
    if (isMobileView) {
      setMobileTab('queue');
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedEvent || !rejectReason.trim()) return;
    await rejectEvent(selectedEvent.id, rejectReason);
    setIsRejectModalOpen(false);
    setRejectReason('');
    if (isMobileView) {
      setMobileTab('queue');
    }
  };

  const handleClarifySubmit = async () => {
    if (!selectedEvent || !clarificationQuery.trim()) return;
    await requestClarification(selectedEvent.id, clarificationQuery);
    setIsClarifyModalOpen(false);
    setClarificationQuery('');
    if (isMobileView) {
      setMobileTab('queue');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        Loading Governance Queue...
      </div>
    );
  }

  // Render Queue List Component
  const renderQueueList = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <ListFilter className="w-3.5 h-3.5 text-blue-600" />
          <span>Pending Ingestion Queue</span>
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">
          {pendingEvents.length} items
        </span>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center text-slate-500 space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-xs font-semibold text-slate-800">All Queue Items Verified</div>
          <p className="text-[11px] text-slate-500">
            No outstanding unlinked field events requiring human planner governance.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingEvents.map((ev) => {
            const isSelected = selectedEvent?.id === ev.id;
            return (
              <button
                key={ev.id}
                id={`queue-item-${ev.id}`}
                type="button"
                onClick={() => handleSelectEvent(ev)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 ${
                  isSelected && !isMobileView
                    ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-slate-900">{ev.eventNumber}</span>
                  <GovernanceBadge status={ev.governanceStatus} />
                </div>

                <p className="text-slate-800 font-medium line-clamp-2 italic">
                  "{ev.rawInput}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>{ev.reporterName}</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Match: {(ev.matchingConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render Detailed Inspection Component
  const renderDetailInspection = () => {
    if (!selectedEvent) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Select an execution event from the queue to inspect candidate matches and make governance decisions.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-3.5">
        {/* Mobile Navigation Back Button */}
        {isMobileView && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setMobileTab('queue')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Queue ({pendingEvents.length})</span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              Inspection Mode
            </span>
          </div>
        )}

        {/* Event Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {selectedEvent.eventNumber}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(selectedEvent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              {selectedEvent.activityDescription || 'Field Event Review'}
            </h3>
            <div className="text-xs text-slate-600 mt-0.5">
              Reported by: <strong>{selectedEvent.reporterName}</strong> ({selectedEvent.reporterRole})
            </div>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 pt-1 sm:pt-0">
            <GovernanceBadge status={selectedEvent.governanceStatus} />
            <span className="text-[10px] text-slate-500 font-mono">
              Mode: {selectedEvent.inputMode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Original Raw Field Input */}
        <div className="bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Verbatim Field Supervisor Input
          </div>
          <p className="text-xs text-slate-800 font-medium italic">
            "{selectedEvent.rawInput}"
          </p>
          {selectedEvent.notes && (
            <p className="text-[11px] text-slate-600 mt-1">
              <strong>Field Notes:</strong> {selectedEvent.notes}
            </p>
          )}
        </div>

        {/* Confidence Metrics Split */}
        <div className={`gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200 ${isMobileView ? 'space-y-3 flex flex-col' : 'grid grid-cols-1 md:grid-cols-2'}`}>
          <div className="w-full">
            <ConfidenceGauge
              score={selectedEvent.matchingConfidence}
              label="Semantic & Structured Match"
              showDetails
            />
          </div>
          <div className="w-full">
            <ConfidenceGauge
              score={selectedEvent.evidenceConfidence}
              label="Physical Evidence Support"
              showDetails
            />
          </div>
        </div>

        {/* Candidate L5/L6 Schedule Matching Disambiguation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>L5/L6 Candidate Activity Disambiguation</span>
            </h4>
          </div>

          <div className="space-y-2">
            {selectedEvent.candidateMatches.map((cand, idx) => {
              const isTopMatch = idx === 0;
              return (
                <div
                  key={cand.activityId}
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    isTopMatch
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded text-[11px]">
                          {cand.wbsCode}
                        </span>
                        <span className="font-semibold text-slate-900">{cand.activityName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <DisciplineBadge discipline={cand.discipline} />
                        <span className="text-[11px] text-slate-600">
                          Location: <strong>{cand.location}</strong>
                        </span>
                        {cand.equipmentTag && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Tag: {cand.equipmentTag}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {(cand.overallConfidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  </div>

                  {/* Signal Breakdown Pills */}
                  <div className="flex flex-wrap gap-1 text-[10px] text-slate-600 bg-slate-100/80 p-1.5 rounded font-mono">
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Semantic: {(cand.scoreBreakdown.semantic * 100).toFixed(0)}%
                    </span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Location: {(cand.scoreBreakdown.location * 100).toFixed(0)}%
                    </span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Discipline: {(cand.scoreBreakdown.discipline * 100).toFixed(0)}%
                    </span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Window: {(cand.scoreBreakdown.scheduleWindow * 100).toFixed(0)}%
                    </span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Equipment: {(cand.scoreBreakdown.equipmentMatch * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 italic">"{cand.rationale}"</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence & Provenance Verification Panel */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Attached Evidence ({selectedEvent.evidenceList.length})</span>
            <span className="text-[11px] text-slate-500 font-normal">
              EXIF & Hash Verified
            </span>
          </h4>

          {selectedEvent.evidenceList.length > 0 ? (
            <div className={`gap-2 ${isMobileView ? 'space-y-2 flex flex-col' : 'grid grid-cols-1 md:grid-cols-2'}`}>
              {selectedEvent.evidenceList.map((evid) => (
                <EvidenceCard key={evid.id} evidence={evid} />
              ))}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Missing physical photo proof. Governance policy recommends requesting clarification before status synchronization.
              </span>
            </div>
          )}
        </div>

        {/* Correction Form (if opened) */}
        {isEditingCorrection && (
          <div className="p-3 bg-blue-50/70 border border-blue-300 rounded-xl space-y-2.5 animate-fadeIn text-xs">
            <div className="font-bold text-blue-950 flex items-center justify-between">
              <span>Manual Activity Re-assignment</span>
              <button
                type="button"
                onClick={() => setIsEditingCorrection(false)}
                className="text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Target L5/L6 Activity in Project Schedule:
              </label>
              <select
                value={selectedActivityForCorrection}
                onChange={(e) => setSelectedActivityForCorrection(e.target.value)}
                className="w-full p-2 rounded border border-slate-300 bg-white text-xs font-mono"
              >
                <option value="">-- Select L5/L6 Activity --</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    [{act.wbsCode}] {act.name} ({act.discipline})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Planner Correction Rationale:
              </label>
              <textarea
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Explain reason for remapping..."
                rows={2}
                className="w-full p-2 rounded border border-slate-300 bg-white text-xs text-slate-900"
              />
            </div>

            <button
              type="button"
              disabled={!selectedActivityForCorrection || isActionSubmitting}
              onClick={handleCorrectSubmit}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Confirm Correction & Authorize
            </button>
          </div>
        )}

        {/* Governance Decision Action Bar */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          {/* Row 1: Primary Action Button */}
          <button
            id="gov-approve-btn"
            type="button"
            disabled={isActionSubmitting || !selectedEvent.selectedActivityId}
            onClick={handleApprove}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve & Sync Schedule</span>
          </button>

          {/* Row 2: Secondary Actions in a Clean Responsive Row */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Correct */}
            <button
              id="gov-correct-btn"
              type="button"
              onClick={() => {
                setSelectedActivityForCorrection(selectedEvent.selectedActivityId || '');
                setIsEditingCorrection(true);
              }}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-semibold text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Correct</span>
            </button>

            {/* Request Clarification */}
            <button
              id="gov-clarify-btn"
              type="button"
              onClick={() => setIsClarifyModalOpen(true)}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Clarify</span>
            </button>

            {/* Reject */}
            <button
              id="gov-reject-btn"
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Reject</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="planner-review-screen" className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                Planning-to-Execution Governance Desk
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              L5/L6 Schedule Linking & Audit Gate
            </h2>
          </div>
          <span className="text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full shrink-0">
            {pendingEvents.length} Awaiting
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
          Deterministic governance: verify activity candidate matches, cross-check provenance, and authorize schedule synchronization.
        </p>
      </div>

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="m-3 sm:m-4 mb-0 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearMessage}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="p-3 sm:p-4 flex-1 max-w-7xl mx-auto w-full">
        {isMobileView ? (
          /* Mobile Single-Column Navigation (Queue Tab vs Detail Tab) */
          <div className="space-y-3">
            {/* Mobile View Toggle Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setMobileTab('queue')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mobileTab === 'queue'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Queue ({pendingEvents.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('detail')}
                disabled={!selectedEvent}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mobileTab === 'detail'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspection & Actions</span>
              </button>
            </div>

            {/* Render Tab Content */}
            {mobileTab === 'queue' ? renderQueueList() : renderDetailInspection()}
          </div>
        ) : (
          /* Desktop Side-by-Side 12-Column Grid */
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">{renderQueueList()}</div>
            <div className="col-span-8">{renderDetailInspection()}</div>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-4 space-y-3 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Reject Execution Event {selectedEvent?.eventNumber}
            </h3>
            <p className="text-slate-600">
              Provide a verifiable reason. This rejection is recorded in the permanent audit trail.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Photographic evidence indicates work on Line 22, not Line 24."
              rows={3}
              className="w-full p-2.5 rounded border border-slate-300 text-slate-900"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleRejectSubmit}
                className="px-3 py-1.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {isClarifyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-4 space-y-3 shadow-xl border border-slate-200 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Request Field Clarification for {selectedEvent?.eventNumber}
            </h3>
            <p className="text-slate-600">
              Message will be routed to field supervisor{' '}
              <strong>{selectedEvent?.reporterName}</strong> without changing schedule state.
            </p>
            <textarea
              value={clarificationQuery}
              onChange={(e) => setClarificationQuery(e.target.value)}
              placeholder="e.g., Please clarify if the remaining 2 spools are already aligned or awaiting gasket delivery."
              rows={3}
              className="w-full p-2.5 rounded border border-slate-300 text-slate-900"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClarifyModalOpen(false)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!clarificationQuery.trim()}
                onClick={handleClarifySubmit}
                className="px-3 py-1.5 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
