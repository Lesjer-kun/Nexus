import React, { useState } from 'react';
import { useFieldCapture } from '../../hooks/useFieldCapture';
import { useMobileView } from '../../context/MobileViewContext';
import { ConfidenceGauge } from '../common/ConfidenceGauge';
import { DisciplineBadge } from '../common/DisciplineBadge';
import { StatusBadge, GovernanceBadge } from '../common/StatusBadge';
import { EvidenceCard } from '../common/EvidenceCard';
import {
  Mic,
  MicOff,
  Camera,
  FileUp,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
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

  return (
    <div id="field-capture-screen" className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Mobile Top Header Banner */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-300 uppercase tracking-wider">
                Field Intelligence Portal
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              Natural Field Capture
            </h2>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] sm:text-xs bg-slate-800 text-slate-300 px-2 py-0.5 sm:py-1 rounded border border-slate-700 font-mono">
              27.3482°N, 95.3219°E
            </span>
          </div>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-snug">
          Report progress, timestamps, or site delays naturally. NEXUS extracts structured events and links them to L5/L6 schedules.
        </p>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-2xl mx-auto w-full flex-1">
        {/* Success Alert Banner */}
        {successBanner && (
          <div
            id="submission-success-banner"
            className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-emerald-900 animate-fadeIn shadow-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-emerald-950">Field Event Successfully Ingested</div>
              <p className="text-emerald-800 mt-0.5">
                Structured Execution Event generated and routed to the Project Planner Governance Queue.
              </p>
            </div>
            {onNavigateToReview && (
              <button
                type="button"
                onClick={onNavigateToReview}
                className="text-xs underline font-semibold text-emerald-900 hover:text-emerald-950 self-center shrink-0"
              >
                Inspect Queue →
              </button>
            )}
          </div>
        )}

        {/* Quick Scenario Fill Buttons */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Quick Field Scenarios
            </span>
            <span className="text-[10px] text-slate-400 font-mono">One-tap load</span>
          </div>

          <div className={`grid gap-2 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <button
              id="preset-pipe-spool"
              type="button"
              onClick={() => applyPresetPrompt('pipe_spool')}
              className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-xs flex flex-col gap-1 w-full"
            >
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Line 24 Pipe Spool</span>
                <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1 rounded">EV-10492</span>
              </div>
              <span className="text-[11px] text-slate-500 line-clamp-2">
                "Finished erecting pipe spools on Line 24 around 3 PM today..."
              </span>
            </button>

            <button
              id="preset-concrete-pour"
              type="button"
              onClick={() => applyPresetPrompt('concrete_pour')}
              className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors text-xs flex flex-col gap-1 w-full"
            >
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Block C Concrete Pour</span>
                <span className="text-[10px] text-amber-600 font-mono font-bold bg-amber-50 px-1 rounded">EV-10493</span>
              </div>
              <span className="text-[11px] text-slate-500 line-clamp-2">
                "Concrete pouring started at 10, stopped at 1 (batching plant)..."
              </span>
            </button>

            <button
              id="preset-pump-align"
              type="button"
              onClick={() => applyPresetPrompt('pump_align')}
              className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors text-xs flex flex-col gap-1 w-full"
            >
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>P-14 Pump Alignment</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-1 rounded">EV-10491</span>
              </div>
              <span className="text-[11px] text-slate-500 line-clamp-2">
                "Booster pump alignment completed, vibrations within tolerance..."
              </span>
            </button>
          </div>
        </div>

        {/* Input Interface: Voice or Keyboard Mode */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              Supervisor Field Report
            </span>

            {/* Voice vs Text Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-[11px]">
              <button
                type="button"
                onClick={() => setInputMode('voice')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  inputMode === 'voice' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Voice Capture
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  inputMode === 'text' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Text Input
              </button>
            </div>
          </div>

          {/* Voice Recording Widget */}
          {inputMode === 'voice' && (
            <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-slate-900 rounded-xl text-white space-y-3">
              <div className="relative">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />
                )}
                <button
                  id="mic-record-button"
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
              </div>

              {/* Status and Audio Levels */}
              <div className="text-center px-2">
                <div className="text-sm font-semibold tracking-wide">
                  {isRecording ? 'Listening to Field Supervisor...' : 'Tap to Record Voice Report'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {isRecording
                    ? `Recording: 00:0${recordingDuration}s • High Noise Cancelling Active`
                    : 'Speak in natural construction terms (activities, delays, spools, tags)'}
                </div>
              </div>

              {/* Animated Waveform Bars */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1 h-6 w-full max-w-xs">
                  {audioLevels.map((lvl, idx) => (
                    <div
                      key={idx}
                      className="w-1.5 bg-cyan-400 rounded-full transition-all duration-100"
                      style={{ height: `${Math.max(15, lvl)}%` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transcribed or Manual Text Box */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Report Statement / Voice Transcription</span>
              {transcribedText && (
                <button
                  type="button"
                  onClick={resetCapture}
                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <textarea
              id="field-report-textarea"
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="e.g., We finished erecting the pipe spools on Line 24 around 3 PM today. Flange torqued."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
            />
          </div>

          {/* Evidence Attachments Section */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                Evidence Support ({attachedEvidences.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="attach-photo-button"
                  type="button"
                  onClick={() => attachMockPhoto('Site Inspection Photo')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  <span>Attach Photo</span>
                </button>
                <button
                  id="attach-report-button"
                  type="button"
                  onClick={() => attachMockPhoto('Daily Shift Log PDF')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-300 transition-colors"
                >
                  <FileUp className="w-3 h-3" />
                  <span>Attach PDF</span>
                </button>
              </div>
            </div>

            {/* Render Attached Evidences */}
            {attachedEvidences.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {attachedEvidences.map((evid) => (
                  <div key={evid.id} className="relative">
                    <EvidenceCard evidence={evid} />
                    <button
                      type="button"
                      onClick={() => removeEvidence(evid.id)}
                      className="absolute top-2 right-2 text-xs bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-rose-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center bg-slate-50/50">
                <p className="text-[11px] text-slate-500">
                  No photo or shift log attached yet. Unverified claims lack physical provenance.
                </p>
              </div>
            )}
          </div>

          {/* Submit / Extract Button */}
          <div className="pt-1">
            <button
              id="submit-field-event-btn"
              type="button"
              disabled={!transcribedText.trim() || isProcessing}
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting & Matching...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ingest & Route to Planner Governance</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Structured Execution Event Extracted Preview Card */}
        {extractedPreview && (
          <div
            id="extracted-preview-card"
            className="bg-white rounded-xl border-2 border-blue-200 p-3.5 sm:p-4 shadow-sm space-y-3 animate-fadeIn"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
                  {extractedPreview.eventNumber}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Structured Execution Event
                </h3>
              </div>
              <GovernanceBadge status={extractedPreview.governanceStatus} />
            </div>

            {/* Constrained Schema Key-Value List */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs font-mono space-y-1.5">
              <div className="text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Constrained LLM Schema</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                  Null-Safe Validation
                </span>
              </div>

              <div className="divide-y divide-slate-200/60 text-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 gap-0.5">
                  <span className="text-slate-400 text-[11px]">activity:</span>
                  <span className="font-semibold text-slate-900 text-left sm:text-right break-words">
                    {extractedPreview.activityDescription || 'null'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 gap-0.5">
                  <span className="text-slate-400 text-[11px]">location:</span>
                  <span className="font-semibold text-slate-900 text-left sm:text-right">
                    {extractedPreview.candidateLocation || 'null'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-[11px]">event_type:</span>
                  <span className="text-blue-700 font-semibold">{extractedPreview.eventType || 'null'}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-[11px]">actual_time:</span>
                  <span className="text-slate-900">{extractedPreview.endTime || extractedPreview.startTime || 'null'}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-[11px]">status:</span>
                  <StatusBadge status={extractedPreview.status} />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-[11px]">quantity:</span>
                  <span className="text-slate-900">
                    {extractedPreview.quantity !== null
                      ? `${extractedPreview.quantity} ${extractedPreview.unit || ''}`
                      : 'null'}
                  </span>
                </div>

                {extractedPreview.blocker && (
                  <div className="pt-1.5 text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 mt-1">
                    <span className="font-bold">blocker:</span> {extractedPreview.blocker}
                  </div>
                )}
                {extractedPreview.expectedResumption && (
                  <div className="pt-1 text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                    <span className="font-bold">resumption:</span> {extractedPreview.expectedResumption}
                  </div>
                )}
              </div>
            </div>

            {/* Confidence Gauge */}
            <ConfidenceGauge
              score={extractedPreview.matchingConfidence}
              label="L5/L6 Activity Match Confidence"
              showDetails
            />

            {/* Top Candidate Matching Card */}
            {extractedPreview.candidateMatches.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-3 bg-blue-50/30 text-xs space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>Linked L5/L6 Candidate</span>
                  <span className="font-mono text-blue-700 font-bold bg-blue-100/70 px-1.5 py-0.5 rounded">
                    {extractedPreview.candidateMatches[0].wbsCode}
                  </span>
                </div>
                <div className="font-bold text-slate-800">
                  {extractedPreview.candidateMatches[0].activityName}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <DisciplineBadge discipline={extractedPreview.candidateMatches[0].discipline} />
                  <span className="text-[11px] text-slate-500">
                    Location: {extractedPreview.candidateMatches[0].location}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded border border-slate-200">
                  "{extractedPreview.candidateMatches[0].rationale}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Field Submissions History */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Ingested Events</span>
            <span className="text-[11px] text-slate-500 font-normal">
              {recentEvents.length} records in audit trail
            </span>
          </h3>

          <div className="space-y-2">
            {recentEvents.map((ev) => (
              <div
                key={ev.id}
                id={`recent-event-${ev.id}`}
                className="bg-white rounded-xl border border-slate-200 p-3 text-xs shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{ev.eventNumber}</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <GovernanceBadge status={ev.governanceStatus} />
                </div>

                <p className="text-slate-700 text-xs italic bg-slate-50 p-2 rounded border border-slate-100">
                  "{ev.rawInput}"
                </p>

                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>
                    Reported by: <strong className="text-slate-700">{ev.reporterName}</strong>
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-700 font-medium">
                      Match: {(ev.matchingConfidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-slate-600">
                      Evidence: {(ev.evidenceConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
