import React, { useState } from 'react';
import { useFieldCapture } from '../../hooks/useFieldCapture';
import { useMobileView } from '../../context/MobileViewContext';
import { ConfidenceGauge } from '../common/ConfidenceGauge';
import { DisciplineBadge } from '../common/DisciplineBadge';
import { StatusBadge, GovernanceBadge } from '../common/StatusBadge';
import { EvidenceCard } from '../common/EvidenceCard';
import { ScreenHeader } from '../layout/ScreenHeader';
import {
  Camera,
  CheckCircle2,
  Clock,
  FileUp,
  Mic,
  MicOff,
  Radio,
  RotateCcw,
  Send,
} from 'lucide-react';

interface FieldCaptureScreenProps {
  onEventSubmitted?: () => void;
  onNavigateToReview?: () => void;
}

export const FieldCaptureScreen: React.FC<FieldCaptureScreenProps> = ({
  onEventSubmitted,
  onNavigateToReview,
}) => {
  const {
    isRecording,
    recordingDuration,
    audioLevels,
    transcribedText,
    setTranscribedText,
    startRecording,
    stopRecording,
    attachedEvidences,
    attachMockPhoto,
    removeEvidence,
    isProcessing,
    extractedPreview,
    submitReport,
    resetCapture,
    applyPresetPrompt,
    recentEvents,
  } = useFieldCapture();

  const { isMobileView } = useMobileView();
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [successBanner, setSuccessBanner] = useState(false);

  const handleSubmit = async () => {
    const res = await submitReport();
    if (res) {
      setSuccessBanner(true);
      if (onEventSubmitted) onEventSubmitted();
      setTimeout(() => setSuccessBanner(false), 5000);
    }
  };

  const presets = [
    {
      id: 'preset-pipe-spool',
      key: 'pipe_spool' as const,
      title: 'Line 24 Pipe Spool',
      code: 'EV-10492',
      quote: 'Finished erecting pipe spools on Line 24 around 3 PM today…',
    },
    {
      id: 'preset-concrete-pour',
      key: 'concrete_pour' as const,
      title: 'Block C Concrete Pour',
      code: 'EV-10493',
      quote: 'Concrete pouring started at 10, stopped at 1 (batching plant)…',
    },
    {
      id: 'preset-pump-align',
      key: 'pump_align' as const,
      title: 'P-14 Pump Alignment',
      code: 'EV-10491',
      quote: 'Booster pump alignment completed, vibrations within tolerance…',
    },
  ];

  return (
    <div id="field-capture-screen" className="nexus-scroll flex h-full flex-col overflow-y-auto bg-paper">
      <ScreenHeader
        icon={Radio}
        eyebrow="Field capture"
        title="Report what happened on site"
        description="Speak or type in construction language. NEXUS extracts a structured event and links it to L5/L6 work."
        trailing={
          <span className="hidden rounded-md border border-line bg-panel px-2 py-1 font-mono text-[10px] text-muted sm:inline">
            27.3482°N, 95.3219°E
          </span>
        }
      />

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-3 sm:space-y-4 sm:p-5">
        {successBanner && (
          <div
            id="submission-success-banner"
            className="animate-fadeIn flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="flex-1 text-xs">
              <div className="font-semibold">Event ingested</div>
              <p className="mt-0.5 text-emerald-800">Routed to the planner governance queue.</p>
            </div>
            {onNavigateToReview && (
              <button
                type="button"
                onClick={onNavigateToReview}
                className="self-center shrink-0 text-xs font-semibold text-emerald-900 underline"
              >
                Open queue
              </button>
            )}
          </div>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-ink">Quick scenarios</h3>
            <span className="font-mono text-[10px] text-muted">Demo load</span>
          </div>
          <div className={`grid gap-2 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                id={preset.id}
                type="button"
                onClick={() => applyPresetPrompt(preset.key)}
                className="flex w-full flex-col gap-1 rounded-lg border border-line bg-panel p-2.5 text-left text-xs transition-colors hover:border-ember/50 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-2 font-semibold text-ink">
                  <span>{preset.title}</span>
                  <span className="rounded bg-paper px-1 font-mono text-[10px] font-bold text-ember">{preset.code}</span>
                </div>
                <span className="line-clamp-2 text-[11px] text-muted">“{preset.quote}”</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-line bg-panel p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Mic className="h-3.5 w-3.5 text-ember" />
              Supervisor report
            </span>
            <div className="flex items-center gap-0.5 rounded-md bg-paper p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setInputMode('voice')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  inputMode === 'voice' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                Voice
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  inputMode === 'text' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                Text
              </button>
            </div>
          </div>

          {inputMode === 'voice' && (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-xl bg-ink p-5 text-paper">
              <div className="relative">
                {isRecording && <div className="animate-pulse-ring absolute inset-0 rounded-full bg-rose-500/35" />}
                <button
                  id="mic-record-button"
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${
                    isRecording ? 'bg-rose-600 text-white' : 'bg-ember text-white hover:bg-ember-dark'
                  }`}
                >
                  {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                </button>
              </div>
              <div className="px-2 text-center">
                <div className="text-sm font-semibold">
                  {isRecording ? 'Listening…' : 'Tap to record'}
                </div>
                <div className="mt-0.5 text-xs text-paper/55">
                  {isRecording
                    ? `00:0${recordingDuration}s · noise cancelling`
                    : 'Activities, delays, tags, quantities'}
                </div>
              </div>
              {isRecording && (
                <div className="flex h-6 w-full max-w-xs items-center justify-center gap-1">
                  {audioLevels.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 rounded-full bg-orange-300 transition-all duration-100"
                      style={{ height: `${Math.max(15, lvl)}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-ink-2">
              <span>Statement / transcription</span>
              {transcribedText && (
                <button
                  type="button"
                  onClick={resetCapture}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-ink"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            <textarea
              id="field-report-textarea"
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="e.g., We finished erecting the pipe spools on Line 24 around 3 PM today. Flange torqued."
              rows={3}
              className="w-full rounded-lg border border-line bg-white p-2.5 text-xs text-ink placeholder:text-muted/70 focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/30"
            />
          </div>

          <div className="space-y-2 border-t border-line pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Camera className="h-3.5 w-3.5 text-muted" />
                Evidence ({attachedEvidences.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="attach-photo-button"
                  type="button"
                  onClick={() => attachMockPhoto('Site Inspection Photo')}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-ember/40"
                >
                  <Camera className="h-3 w-3" />
                  Photo
                </button>
                <button
                  id="attach-report-button"
                  type="button"
                  onClick={() => attachMockPhoto('Daily Shift Log PDF')}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-ember/40"
                >
                  <FileUp className="h-3 w-3" />
                  PDF
                </button>
              </div>
            </div>

            {attachedEvidences.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {attachedEvidences.map((evid) => (
                  <div key={evid.id} className="relative">
                    <EvidenceCard evidence={evid} />
                    <button
                      type="button"
                      onClick={() => removeEvidence(evid.id)}
                      className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-paper hover:bg-rose-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-paper/60 p-3 text-center">
                <p className="text-[11px] text-muted">Attach a photo or shift log so the claim has provenance.</p>
              </div>
            )}
          </div>

          <button
            id="submit-field-event-btn"
            type="button"
            disabled={!transcribedText.trim() || isProcessing}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ember px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-ember-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Extracting & matching…</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit to planner review</span>
              </>
            )}
          </button>
        </section>

        {extractedPreview && (
          <div
            id="extracted-preview-card"
            className="animate-fadeIn space-y-3 rounded-xl border border-ember/25 bg-panel p-3.5 shadow-sm sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="rounded border border-ember/20 bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-bold text-ember-dark">
                  {extractedPreview.eventNumber}
                </span>
                <h3 className="mt-1 text-sm font-bold text-ink">Structured execution event</h3>
              </div>
              <GovernanceBadge status={extractedPreview.governanceStatus} />
            </div>

            <div className="space-y-1.5 rounded-lg border border-line bg-paper p-3 font-mono text-xs">
              <div className="mb-1 flex items-center justify-between font-sans text-[11px] font-semibold uppercase tracking-wider text-muted">
                <span>Constrained schema</span>
                <span className="rounded bg-emerald-100 px-1.5 font-mono text-[10px] text-emerald-800">Null-safe</span>
              </div>
              <div className="divide-y divide-line/80 text-ink-2">
                <div className="flex flex-col gap-0.5 py-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[11px] text-muted">activity:</span>
                  <span className="break-words font-semibold text-ink sm:text-right">
                    {extractedPreview.activityDescription || 'null'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 py-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[11px] text-muted">location:</span>
                  <span className="font-semibold text-ink sm:text-right">
                    {extractedPreview.candidateLocation || 'null'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted">event_type:</span>
                  <span className="font-semibold text-ember">{extractedPreview.eventType || 'null'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted">actual_time:</span>
                  <span className="text-ink">{extractedPreview.endTime || extractedPreview.startTime || 'null'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted">status:</span>
                  <StatusBadge status={extractedPreview.status} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted">quantity:</span>
                  <span className="text-ink">
                    {extractedPreview.quantity !== null
                      ? `${extractedPreview.quantity} ${extractedPreview.unit || ''}`
                      : 'null'}
                  </span>
                </div>
                {extractedPreview.blocker && (
                  <div className="mt-1 rounded border border-rose-200 bg-rose-50 p-2 pt-1.5 text-rose-800">
                    <span className="font-bold">blocker:</span> {extractedPreview.blocker}
                  </div>
                )}
                {extractedPreview.expectedResumption && (
                  <div className="mt-1 rounded border border-amber-200 bg-amber-50 p-1.5 pt-1 text-amber-900">
                    <span className="font-bold">resumption:</span> {extractedPreview.expectedResumption}
                  </div>
                )}
              </div>
            </div>

            <ConfidenceGauge score={extractedPreview.matchingConfidence} label="L5/L6 activity match" showDetails />

            {extractedPreview.candidateMatches.length > 0 && (
              <div className="space-y-1.5 rounded-lg border border-line bg-white p-3 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
                  <span>Linked candidate</span>
                  <span className="rounded bg-paper px-1.5 py-0.5 font-mono font-bold text-ember">
                    {extractedPreview.candidateMatches[0].wbsCode}
                  </span>
                </div>
                <div className="font-bold text-ink">{extractedPreview.candidateMatches[0].activityName}</div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <DisciplineBadge discipline={extractedPreview.candidateMatches[0].discipline} />
                  <span className="text-[11px] text-muted">
                    {extractedPreview.candidateMatches[0].location}
                  </span>
                </div>
                <p className="rounded border border-line bg-paper p-2 text-[11px] text-ink-2 italic">
                  “{extractedPreview.candidateMatches[0].rationale}”
                </p>
              </div>
            )}
          </div>
        )}

        <section className="space-y-2 pt-1">
          <h3 className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink">
            <span>Recent events</span>
            <span className="font-normal normal-case tracking-normal text-muted">
              {recentEvents.length} in trail
            </span>
          </h3>
          <div className="space-y-2">
            {recentEvents.map((ev) => (
              <div
                key={ev.id}
                id={`recent-event-${ev.id}`}
                className="space-y-2 rounded-xl border border-line bg-panel p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink">{ev.eventNumber}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      <Clock className="h-3 w-3" />
                      {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <GovernanceBadge status={ev.governanceStatus} />
                </div>
                <p className="rounded-md bg-paper p-2 text-ink-2 italic">“{ev.rawInput}”</p>
                <div className="flex flex-wrap items-center justify-between gap-1 border-t border-line pt-1 text-[11px] text-muted">
                  <span>
                    {ev.reporterName}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-medium text-emerald-800">
                      Match {(ev.matchingConfidence * 100).toFixed(0)}%
                    </span>
                    <span>Evidence {(ev.evidenceConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
