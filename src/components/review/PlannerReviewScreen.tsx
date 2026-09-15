import React, { useState } from 'react';
import { useScheduleLinking } from '../../hooks/useScheduleLinking';
import { apiClient } from '../../services/apiClient';
import { useMobileView } from '../../context/MobileViewContext';
import { ConfidenceGauge } from '../common/ConfidenceGauge';
import { DisciplineBadge } from '../common/DisciplineBadge';
import { GovernanceBadge } from '../common/StatusBadge';
import { EvidenceCard } from '../common/EvidenceCard';
import { ScreenHeader } from '../layout/ScreenHeader';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  HelpCircle,
  Layers,
  ListFilter,
  ShieldCheck,
  XCircle,
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
  const [isEvidenceUploading, setIsEvidenceUploading] = useState(false);
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null);

  const handleSelectEvent = (ev: (typeof pendingEvents)[0]) => {
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
    if (isMobileView) setMobileTab('queue');
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
    if (isMobileView) setMobileTab('queue');
  };

  const handleRejectSubmit = async () => {
    if (!selectedEvent || !rejectReason.trim()) return;
    await rejectEvent(selectedEvent.id, rejectReason);
    setIsRejectModalOpen(false);
    setRejectReason('');
    if (isMobileView) setMobileTab('queue');
  };

  const handleClarifySubmit = async () => {
    if (!selectedEvent || !clarificationQuery.trim()) return;
    await requestClarification(selectedEvent.id, clarificationQuery);
    setIsClarifyModalOpen(false);
    setClarificationQuery('');
    if (isMobileView) setMobileTab('queue');
  };

  const handleEvidenceUpload = async (file: File) => {
    if (!selectedEvent || !/^\d+$/.test(selectedEvent.id)) {
      setEvidenceMessage('Evidence upload requires a live backend event ID.');
      return;
    }

    setIsEvidenceUploading(true);
    setEvidenceMessage(null);
    try {
      const fileType = file.type === 'application/pdf' ? 'report_pdf' : 'photo';
      const uploaded = await apiClient.uploadEvidence(
        file,
        Number(selectedEvent.id),
        'PLN-003',
        'Lead Project Planner',
        fileType,
        27.3482,
        95.3219,
        selectedEvent.candidateLocation || undefined,
        'Uploaded during planner evidence review.',
      );
      const verified = await apiClient.verifyEvidence(Number(uploaded.id), true, uploaded.visualConsistencyScore, 'Planner verification completed.');
      setEvidenceMessage(`Verified ${verified.fileName} · provenance score ${(verified.visualConsistencyScore * 100).toFixed(0)}%`);
    } catch (error) {
      setEvidenceMessage(error instanceof Error ? error.message : 'Evidence upload failed.');
    } finally {
      setIsEvidenceUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted">
        <div className="mr-2 h-6 w-6 animate-spin rounded-full border-2 border-ember border-t-transparent" />
        Loading governance queue…
      </div>
    );
  }

  const renderQueueList = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink">
          <ListFilter className="h-3.5 w-3.5 text-ember" />
          Queue
        </h3>
        <span className="font-mono text-[11px] text-muted">{pendingEvents.length} items</span>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-line bg-panel p-8 text-center text-muted">
          <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
          <div className="text-xs font-semibold text-ink">Queue clear</div>
          <p className="text-[11px]">No field events waiting for planner governance.</p>
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
                className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left text-xs transition-all ${
                  isSelected && !isMobileView
                    ? 'border-ember/50 bg-orange-50/60 ring-1 ring-ember/30'
                    : 'border-line bg-panel hover:border-ember/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-ink">{ev.eventNumber}</span>
                  <GovernanceBadge status={ev.governanceStatus} />
                </div>
                <p className="line-clamp-2 font-medium text-ink-2 italic">“{ev.rawInput}”</p>
                <div className="flex items-center justify-between border-t border-line pt-1 text-[11px] text-muted">
                  <span>{ev.reporterName}</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {(ev.matchingConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderDetailInspection = () => {
    if (!selectedEvent) {
      return (
        <div className="rounded-xl border border-dashed border-line bg-panel p-8 text-center text-sm text-muted">
          Select a queue item to inspect matches and decide.
        </div>
      );
    }

    return (
      <div className="space-y-3.5 rounded-xl border border-line bg-panel p-3.5 sm:p-4">
        {isMobileView && (
          <div className="flex items-center justify-between border-b border-line pb-2">
            <button
              type="button"
              onClick={() => setMobileTab('queue')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ember hover:text-ember-dark"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Queue ({pendingEvents.length})
            </button>
            <span className="font-mono text-[11px] text-muted">Inspect</span>
          </div>
        )}

        <div className="flex flex-col justify-between gap-2 border-b border-line pb-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded border border-ember/20 bg-orange-50 px-2 py-0.5 font-mono text-xs font-bold text-ember-dark">
                {selectedEvent.eventNumber}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <Clock className="h-3 w-3" />
                {new Date(selectedEvent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-ink sm:text-base">
              {selectedEvent.activityDescription || 'Field event review'}
            </h3>
            <div className="mt-0.5 text-xs text-muted">
              {selectedEvent.reporterName} · {selectedEvent.reporterRole}
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 pt-1 sm:flex-col sm:items-end sm:pt-0">
            <GovernanceBadge status={selectedEvent.governanceStatus} />
            <span className="font-mono text-[10px] text-muted">{selectedEvent.inputMode.toUpperCase()}</span>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Verbatim input</div>
          <p className="text-xs font-medium text-ink italic">“{selectedEvent.rawInput}”</p>
          {selectedEvent.notes && (
            <p className="mt-1 text-[11px] text-muted">
              <strong>Notes:</strong> {selectedEvent.notes}
            </p>
          )}
        </div>

        <div
          className={`rounded-xl border border-line bg-paper p-3 ${
            isMobileView ? 'flex flex-col space-y-3' : 'grid grid-cols-1 gap-3 md:grid-cols-2'
          }`}
        >
          <ConfidenceGauge score={selectedEvent.matchingConfidence} label="Semantic & structured match" showDetails />
          <ConfidenceGauge score={selectedEvent.evidenceConfidence} label="Physical evidence" showDetails />
        </div>

        <div className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink">
            <Layers className="h-3.5 w-3.5 text-ember" />
            L5/L6 candidates
          </h4>
          <div className="space-y-2">
            {selectedEvent.candidateMatches.map((cand, idx) => (
              <div
                key={cand.activityId}
                className={`space-y-2 rounded-lg border p-3 text-xs ${
                  idx === 0 ? 'border-ember/40 bg-orange-50/40' : 'border-line bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-paper px-1.5 py-0.5 font-mono text-[11px] font-bold text-ember">
                        {cand.wbsCode}
                      </span>
                      <span className="font-semibold text-ink">{cand.activityName}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <DisciplineBadge discipline={cand.discipline} />
                      <span className="text-[11px] text-muted">
                        {cand.location}
                      </span>
                      {cand.equipmentTag && (
                        <span className="font-mono text-[11px] text-muted">Tag: {cand.equipmentTag}</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800">
                    {(cand.overallConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 rounded bg-paper p-1.5 font-mono text-[10px] text-muted">
                  {(['semantic', 'location', 'discipline', 'scheduleWindow', 'equipmentMatch'] as const).map((k) => (
                    <span key={k} className="rounded border border-line bg-white px-1.5 py-0.5">
                      {k === 'scheduleWindow' ? 'Window' : k === 'equipmentMatch' ? 'Equipment' : k}:{' '}
                      {(cand.scoreBreakdown[k] * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted italic">“{cand.rationale}”</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink">
            <span>Evidence ({selectedEvent.evidenceList.length})</span>
            <label className="cursor-pointer font-normal normal-case tracking-normal text-ember hover:text-ember-dark">
              {isEvidenceUploading ? 'Uploading...' : 'Upload evidence'}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                disabled={isEvidenceUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleEvidenceUpload(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </h4>
          {evidenceMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-900">
              {evidenceMessage}
            </div>
          )}
          {selectedEvent.evidenceList.length > 0 ? (
            <div className={isMobileView ? 'flex flex-col space-y-2' : 'grid grid-cols-1 gap-2 md:grid-cols-2'}>
              {selectedEvent.evidenceList.map((evid) => (
                <EvidenceCard key={evid.id} evidence={evid} />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              Missing photo proof. Request clarification before syncing status.
            </div>
          )}
        </div>

        {isEditingCorrection && (
          <div className="animate-fadeIn space-y-2.5 rounded-xl border border-ember/30 bg-orange-50/50 p-3 text-xs">
            <div className="flex items-center justify-between font-bold text-ink">
              <span>Re-assign activity</span>
              <button type="button" onClick={() => setIsEditingCorrection(false)} className="px-2 py-0.5 text-muted hover:text-ink">
                Cancel
              </button>
            </div>
            <div>
              <label className="mb-1 block font-medium text-ink-2">Target L5/L6 activity</label>
              <select
                value={selectedActivityForCorrection}
                onChange={(e) => setSelectedActivityForCorrection(e.target.value)}
                className="w-full rounded border border-line bg-white p-2 font-mono text-xs"
              >
                <option value="">— Select activity —</option>
                {activities.map((act) => (
                  <option key={act.id} value={act.id}>
                    [{act.wbsCode}] {act.name} ({act.discipline})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium text-ink-2">Correction rationale</label>
              <textarea
                value={correctionNotes}
                onChange={(e) => setCorrectionNotes(e.target.value)}
                placeholder="Explain reason for remapping..."
                rows={2}
                className="w-full rounded border border-line bg-white p-2 text-xs text-ink"
              />
            </div>
            <button
              type="button"
              disabled={!selectedActivityForCorrection || isActionSubmitting}
              onClick={handleCorrectSubmit}
              className="w-full rounded-lg bg-ember py-2 font-semibold text-white hover:bg-ember-dark disabled:opacity-50"
            >
              Confirm correction & authorize
            </button>
          </div>
        )}

        <div className="space-y-2 border-t border-line pt-3">
          <button
            id="gov-approve-btn"
            type="button"
            disabled={isActionSubmitting || !selectedEvent.selectedActivityId}
            onClick={handleApprove}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            Approve & sync schedule
          </button>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              id="gov-correct-btn"
              type="button"
              onClick={() => {
                setSelectedActivityForCorrection(selectedEvent.selectedActivityId || '');
                setIsEditingCorrection(true);
              }}
              className="flex items-center justify-center gap-1 rounded-lg border border-line bg-white py-2 text-xs font-semibold text-ink hover:bg-paper"
            >
              <Edit3 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Correct</span>
            </button>
            <button
              id="gov-clarify-btn"
              type="button"
              onClick={() => setIsClarifyModalOpen(true)}
              className="flex items-center justify-center gap-1 rounded-lg border border-line bg-white py-2 text-xs font-medium text-ink hover:bg-paper"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Clarify</span>
            </button>
            <button
              id="gov-reject-btn"
              type="button"
              onClick={() => setIsRejectModalOpen(true)}
              className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 py-2 text-xs font-medium text-rose-800 hover:bg-rose-100"
            >
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Reject</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="planner-review-screen" className="nexus-scroll flex h-full flex-col overflow-y-auto bg-paper">
      <ScreenHeader
        icon={ShieldCheck}
        eyebrow="Planner governance"
        title="Link events to L5/L6 work"
        description="Verify candidate matches, check provenance, then authorize schedule sync. Models propose; you decide."
        trailing={
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
            {pendingEvents.length} waiting
          </span>
        }
      />

      {actionSuccessMessage && (
        <div className="animate-fadeIn mx-3 mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950 sm:mx-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button type="button" onClick={clearMessage} className="px-2 py-0.5 font-bold text-emerald-800">
            ✕
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl flex-1 p-3 sm:p-5">
        {isMobileView ? (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-line bg-panel p-1">
              <button
                type="button"
                onClick={() => setMobileTab('queue')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  mobileTab === 'queue' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                Queue ({pendingEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('detail')}
                disabled={!selectedEvent}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                  mobileTab === 'detail' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Inspect
              </button>
            </div>
            {mobileTab === 'queue' ? renderQueueList() : renderDetailInspection()}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">{renderQueueList()}</div>
            <div className="col-span-8">{renderDetailInspection()}</div>
          </div>
        )}
      </div>

      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-line bg-panel p-4 text-xs shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <XCircle className="h-4 w-4 text-rose-600" />
              Reject {selectedEvent?.eventNumber}
            </h3>
            <p className="text-muted">This reason is written to the permanent audit trail.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Photographic evidence indicates work on Line 22, not Line 24."
              rows={3}
              className="w-full rounded border border-line p-2.5 text-ink"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="rounded border border-line px-3 py-1.5 text-ink-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleRejectSubmit}
                className="rounded bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {isClarifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-line bg-panel p-4 text-xs shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <HelpCircle className="h-4 w-4 text-ember" />
              Clarify {selectedEvent?.eventNumber}
            </h3>
            <p className="text-muted">
              Sent to <strong>{selectedEvent?.reporterName}</strong>. Schedule state is unchanged.
            </p>
            <textarea
              value={clarificationQuery}
              onChange={(e) => setClarificationQuery(e.target.value)}
              placeholder="e.g., Please clarify if the remaining 2 spools are already aligned or awaiting gasket delivery."
              rows={3}
              className="w-full rounded border border-line p-2.5 text-ink"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClarifyModalOpen(false)}
                className="rounded border border-line px-3 py-1.5 text-ink-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!clarificationQuery.trim()}
                onClick={handleClarifySubmit}
                className="rounded bg-ember px-3 py-1.5 font-semibold text-white hover:bg-ember-dark disabled:opacity-50"
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
