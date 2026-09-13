import React from 'react';
import { EvidenceItem } from '../../types/nexus';
import { MapPin, Clock, User, ShieldCheck, FileText, Camera, AlertTriangle } from 'lucide-react';

export const EvidenceCard: React.FC<{ evidence: EvidenceItem }> = ({ evidence }) => {
  const isPhoto = evidence.fileType === 'photo';

  return (
    <div
      id={`evidence-card-${evidence.id}`}
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-col gap-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            {isPhoto ? <Camera className="w-4 h-4" /> : <FileText className="w-4 h-4 text-rose-600" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800 break-all">{evidence.fileName}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider">{evidence.fileType}</div>
          </div>
        </div>

        {evidence.metadataValid ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            Provenance Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Metadata Warning
          </span>
        )}
      </div>

      {isPhoto && evidence.fileUrl && (
        <div className="relative rounded-md overflow-hidden bg-slate-900 border border-slate-200 h-36 w-full">
          <img
            src={evidence.fileUrl}
            alt={evidence.fileName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
            Consistency: {(evidence.visualConsistencyScore * 100).toFixed(0)}%
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-150">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{evidence.uploaderName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{new Date(evidence.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {evidence.gpsCoordinates && (
          <div className="col-span-2 flex items-start gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-tight">
              <span className="font-semibold">{evidence.gpsCoordinates.siteZone}</span>
              <div className="text-slate-500 font-mono">
                {evidence.gpsCoordinates.lat.toFixed(4)}°N, {evidence.gpsCoordinates.lng.toFixed(4)}°E (±
                {evidence.gpsCoordinates.accuracyMeters}m)
              </div>
            </div>
          </div>
        )}
      </div>

      {evidence.notes && (
        <p className="text-[11px] text-slate-600 italic border-l-2 border-slate-300 pl-2">
          "{evidence.notes}"
        </p>
      )}
    </div>
  );
};
