import React from 'react';
import { EvidenceItem } from '../../types/nexus';
import { AlertTriangle, Camera, Clock, FileText, MapPin, ShieldCheck, User } from 'lucide-react';

export const EvidenceCard: React.FC<{ evidence: EvidenceItem }> = ({ evidence }) => {
  const isPhoto = evidence.fileType === 'photo';

  return (
    <div
      id={`evidence-card-${evidence.id}`}
      className="flex flex-col gap-2.5 rounded-lg border border-line bg-panel p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-paper p-1.5 text-ink-2">
            {isPhoto ? <Camera className="h-4 w-4" /> : <FileText className="h-4 w-4 text-ember" />}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-ink">{evidence.fileName}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">{evidence.fileType}</div>
          </div>
        </div>

        {evidence.metadataValid ? (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </span>
        )}
      </div>

      {isPhoto && evidence.fileUrl && (
        <div className="relative h-36 w-full overflow-hidden rounded-md bg-ink">
          <img
            src={evidence.fileUrl}
            alt={evidence.fileName}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-2 left-2 rounded bg-ink/80 px-2 py-0.5 font-mono text-[10px] text-paper">
            Visual {(evidence.visualConsistencyScore * 100).toFixed(0)}%
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-md bg-paper px-2 py-2 text-[11px] text-muted">
        <div className="flex items-center gap-1.5 truncate">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{evidence.uploaderName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{new Date(evidence.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {evidence.gpsCoordinates && (
          <div className="col-span-2 flex items-start gap-1.5 text-ink-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember" />
            <div className="text-[10px] leading-tight">
              <span className="font-semibold">{evidence.gpsCoordinates.siteZone}</span>
              <div className="font-mono text-muted">
                {evidence.gpsCoordinates.lat.toFixed(4)}°N, {evidence.gpsCoordinates.lng.toFixed(4)}°E (±
                {evidence.gpsCoordinates.accuracyMeters}m)
              </div>
            </div>
          </div>
        )}
      </div>

      {evidence.notes && (
        <p className="border-l-2 border-ember/40 pl-2 text-[11px] text-muted italic">"{evidence.notes}"</p>
      )}
    </div>
  );
};
