import { useState, useEffect, useCallback, useRef } from 'react';
import { ExecutionEvent, EvidenceItem, InputMode } from '../types/nexus';
import { apiClient } from '../services/apiClient';

export interface UseFieldCaptureReturn {
  isRecording: boolean;
  recordingDuration: number;
  audioLevels: number[];
  transcribedText: string;
  setTranscribedText: (text: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  attachedEvidences: EvidenceItem[];
  attachMockPhoto: (scenario?: string) => void;
  attachPhotoFile: (file: File, source: string) => void;
  removeEvidence: (id: string) => void;
  isProcessing: boolean;
  extractedPreview: ExecutionEvent | null;
  submitReport: (inputMode?: InputMode) => Promise<ExecutionEvent | null>;
  resetCapture: () => void;
  applyPresetPrompt: (presetKey: 'pipe_spool' | 'concrete_pour' | 'pump_align') => void;
  recentEvents: ExecutionEvent[];
  refreshEvents: () => Promise<void>;
  selectedDocumentFile: File | null;
  setSelectedDocumentFile: (file: File | null) => void;
  isUploadingDocument: boolean;
  uploadAndSubmitDocument: () => Promise<ExecutionEvent | null>;
}

export function useFieldCapture(): UseFieldCaptureReturn {
const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 45, 30, 20]);
  const [transcribedText, setTranscribedText] = useState('');
  const [attachedEvidences, setAttachedEvidences] = useState<EvidenceItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<ExecutionEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<ExecutionEvent[]>([]);
  const [replayInputMode, setReplayInputMode] = useState<InputMode>('voice');
  const [isProcessingRAG, setIsProcessingRAG] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  const refreshEvents = useCallback(async () => {
    const list = await apiClient.getEvents();
    setRecentEvents(list);
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  // Audio recording simulation
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingDuration(0);

    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    animRef.current = setInterval(() => {
      setAudioLevels([
        Math.floor(20 + Math.random() * 60),
        Math.floor(35 + Math.random() * 55),
        Math.floor(50 + Math.random() * 45),
        Math.floor(30 + Math.random() * 60),
        Math.floor(20 + Math.random() * 50),
      ]);
    }, 120);
  }, []);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animRef.current) clearInterval(animRef.current);

    // If no text was typed, set default realistic transcribed voice report
    if (!transcribedText.trim()) {
      setTranscribedText('Line 24 pipe spool erection completed around 3 PM today.');
    }
  }, [transcribedText]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  const applyPresetPrompt = useCallback((presetKey: 'pipe_spool' | 'concrete_pour' | 'pump_align') => {
    if (presetKey === 'pipe_spool') {
      setTranscribedText('Line 24 pipe spool erection completed around 3 PM today.');
      setAttachedEvidences([
        {
          id: `evid-${Date.now()}-1`,
          eventId: '',
          fileName: 'P-1827_Line24_FlangeTorque.jpg',
          fileType: 'photo',
          fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=800&auto=format&fit=crop&q=60',
          uploaderId: 'SUP-017',
          uploaderName: 'Supervisor R. Bora',
          timestamp: new Date().toISOString(),
          gpsCoordinates: {
            lat: 27.3482,
            lng: 95.3219,
            siteZone: 'Line 24 East Corridor (Zone A)',
            accuracyMeters: 3.1,
          },
          metadataValid: true,
          visualConsistencyScore: 0.95,
          notes: 'EXIF timestamp synchronized. Structural steel and flange joints verified.',
        },
      ]);
    } else if (presetKey === 'concrete_pour') {
      setTranscribedText(
        'Concrete pouring for Block C started at 10. We stopped at 1 because the batching plant failed and we will resume tomorrow.'
      );
      setAttachedEvidences([
        {
          id: `evid-${Date.now()}-2`,
          eventId: '',
          fileName: 'Batching_Plant_Trip_Alarm_DR.pdf',
          fileType: 'report_pdf',
          fileUrl: '',
          uploaderId: 'SUP-022',
          uploaderName: 'Supervisor M. Kalita',
          timestamp: new Date().toISOString(),
          gpsCoordinates: {
            lat: 27.3512,
            lng: 95.3184,
            siteZone: 'Block C Compressor Base (Zone B)',
            accuracyMeters: 4.0,
          },
          metadataValid: true,
          visualConsistencyScore: 0.89,
          notes: 'Motor failure trip code verified by electrical maintenance shift.',
        },
      ]);
    } else {
      setTranscribedText(
        'Pump P-14 booster alignment completed. Vibrations within ISO tolerance under 1.8 mm/s.'
      );
      setAttachedEvidences([
        {
          id: `evid-${Date.now()}-3`,
          eventId: '',
          fileName: 'P-1801_DialGauge_Readout.jpg',
          fileType: 'photo',
          fileUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
          uploaderId: 'SUP-009',
          uploaderName: 'Supervisor A. Goswami',
          timestamp: new Date().toISOString(),
          gpsCoordinates: {
            lat: 27.3499,
            lng: 95.3245,
            siteZone: 'Booster Pump Station 2 Skid',
            accuracyMeters: 2.5,
          },
          metadataValid: true,
          visualConsistencyScore: 0.97,
          notes: 'Laser dial indicator zero-runout alignment photo.',
        },
      ]);
    }
  }, []);

  const attachMockPhoto = useCallback((scenario = 'Site Inspection Photo') => {
    const newEvidence: EvidenceItem = {
      id: `evid-${Date.now()}`,
      eventId: '',
      fileName: `IMG_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Math.floor(1000 + Math.random() * 9000)}.jpg`,
      fileType: 'photo',
      fileUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=60',
      uploaderId: 'SUP-017',
      uploaderName: 'Supervisor R. Bora',
      timestamp: new Date().toISOString(),
      gpsCoordinates: {
        lat: 27.3482 + (Math.random() - 0.5) * 0.005,
        lng: 95.3219 + (Math.random() - 0.5) * 0.005,
        siteZone: 'Sector Line 24 Workfront',
        accuracyMeters: 3.4,
      },
      metadataValid: true,
      visualConsistencyScore: 0.92,
      notes: `${scenario} with verified device timestamp and GNSS satellite fix.`,
    };
    setAttachedEvidences((prev) => [...prev, newEvidence]);
  }, []);

  const attachPhotoFile = useCallback((file: File, source: string) => {
    const newEvidence: EvidenceItem = {
      id: `evid-${Date.now()}`,
      eventId: '',
      fileName: file.name || `IMG_${Date.now()}.jpg`,
      fileType: 'photo',
      fileUrl: URL.createObjectURL(file),
      uploaderId: 'SUP-017',
      uploaderName: 'Supervisor R. Bora',
      timestamp: new Date().toISOString(),
      gpsCoordinates: {
        lat: 27.3482,
        lng: 95.3219,
        siteZone: 'Sector Line 24 Workfront',
        accuracyMeters: 3.4,
      },
      metadataValid: true,
      visualConsistencyScore: 1,
      notes: `${source} image captured on the reporting device.`,
    };
    setAttachedEvidences((prev) => [...prev, newEvidence]);
  }, []);

  const removeEvidence = useCallback((id: string) => {
    setAttachedEvidences((prev) => {
      const evidence = prev.find((item) => item.id === id);
      if (evidence?.fileUrl?.startsWith('blob:')) URL.revokeObjectURL(evidence.fileUrl);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const submitReport = useCallback(async (inputMode: InputMode = 'voice'): Promise<ExecutionEvent | null> => {
    if (!transcribedText.trim()) return null;

    setIsProcessing(true);
    try {
      const event = await apiClient.simulateAIExtraction(
        transcribedText,
        inputMode,
        attachedEvidences
      );
      setExtractedPreview(event);
      await refreshEvents();
      return event;
    } finally {
      setIsProcessing(false);
    }
  }, [transcribedText, attachedEvidences, refreshEvents]);

  const uploadAndSubmitDocument = useCallback(async (): Promise<ExecutionEvent | null> => {
    if (!selectedDocumentFile) return null;

    setIsUploadingDocument(true);
    try {
      const event = await apiClient.uploadDocument(selectedDocumentFile);
      setExtractedPreview(event);
      await refreshEvents();
      return event;
    } finally {
      setIsUploadingDocument(false);
    }
  }, [selectedDocumentFile, refreshEvents]);

  const resetCapture = useCallback(() => {
    setTranscribedText('');
    setAttachedEvidences([]);
    setExtractedPreview(null);
    setSelectedDocumentFile(null);
    setRecordingDuration(0);
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    recordingDuration,
    audioLevels,
    transcribedText,
    setTranscribedText,
    startRecording,
    stopRecording,
    attachedEvidences,
    attachMockPhoto,
    attachPhotoFile,
    removeEvidence,
    isProcessing,
    extractedPreview,
    submitReport,
    resetCapture,
    applyPresetPrompt,
    recentEvents,
    refreshEvents,
    selectedDocumentFile,
    setSelectedDocumentFile,
    isUploadingDocument,
    uploadAndSubmitDocument,
  };
}
