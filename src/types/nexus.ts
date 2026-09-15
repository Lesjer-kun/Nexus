export type DisciplineType =
  | 'Piping'
  | 'Civil'
  | 'Mechanical / Rotating'
  | 'Electrical'
  | 'Instrumentation'
  | 'HSE';

export type EventStatus =
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'interrupted'
  | 'resumed';

export type GovernanceStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'CORRECTED'
  | 'REJECTED'
  | 'NEEDS_CLARIFICATION';

export interface ProjectInfo {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  baselineVersion: string;
  totalActivities: number;
  completedActivities: number;
  delayedActivities: number;
  overallProgressPct: number;
}

export interface ScheduleActivity {
  id: string;
  wbsCode: string;
  name: string;
  discipline: DisciplineType;
  location: string;
  equipmentTag?: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  baselineDurationDays: number;
  actualDurationDays?: number | null;
  progressPct: number;
  isCriticalPath: boolean;
  predecessorIds: string[];
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'HALTED';
  varianceDays: number; // positive = delayed, negative = ahead
  unitOfMeasure?: string;
  plannedQuantity?: number;
  installedQuantity?: number;
}

export type InputMode = 'voice' | 'text' | 'document';

export type EvidenceFileType = 'photo' | 'report_pdf' | 'timesheet' | 'document' | 'video';

export interface EvidenceItem {
  id: string;
  eventId: string;
  fileName: string;
  fileType: EvidenceFileType;
  fileUrl?: string;
  uploaderId: string;
  uploaderName: string;
  timestamp: string;
  gpsCoordinates?: {
    lat: number;
    lng: number;
    siteZone: string;
    accuracyMeters: number;
  };
  metadataValid: boolean;
  visualConsistencyScore: number;
  notes?: string;
  evidenceHash?: string;
}

export interface RiskAlert {
  id: string;
  eventId: string;
  eventNumber: string;
  type: 'variance' | 'dependency' | 'blocker' | 'completion' | 'milestone';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  activityId?: string;
  activityWbsCode?: string;
  scheduledDaysAhead?: number;
  scheduledDaysBehind?: number;
  relatedBlockerId?: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CandidateMatch {
  activityId: string;
  wbsCode: string;
  activityName: string;
  discipline: DisciplineType;
  location: string;
  equipmentTag?: string;
  overallConfidence: number; // 0.0 - 1.0
  scoreBreakdown: {
    semantic: number;
    location: number;
    discipline: number;
    scheduleWindow: number;
    equipmentMatch: number;
  };
  rationale: string;
}

export interface ExecutionEvent {
  id: string;
  eventNumber: string; // e.g. EV-10492
  reporterId: string;
  reporterName: string;
  reporterRole: string;
  rawInput: string;
  inputMode: 'voice' | 'text' | 'document';
  audioDurationSeconds?: number;
  createdAt: string;

  // Extracted constrained schema fields (explicit null if unknown, per design doc)
  eventType: EventStatus | null;
  activityDescription: string | null;
  candidateLocation: string | null;
  startTime: string | null;
  endTime: string | null;
  status: EventStatus | null;
  quantity: number | null;
  unit: string | null;
  blocker: string | null;
  expectedResumption: string | null;
  evidenceReferences: string[];
  notes: string | null;

  // Schedule linking & governance
  matchingConfidence: number;
  evidenceConfidence: number;
  candidateMatches: CandidateMatch[];
  selectedActivityId: string | null;
  governanceStatus: GovernanceStatus;
  plannerReviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;

  evidenceList: EvidenceItem[];
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  entityId: string;
  beforeState: Record<string, any> | null;
  afterState: Record<string, any>;
  rationale: string;
  evidenceHash: string;
}

export interface InstitutionalMemoryRecord {
  id: string;
  title: string;
  projectCode: string;
  discipline: DisciplineType;
  date: string;
  summary: string;
  rootCause: string;
  resolution: string;
  relevanceScore: number;
  sourceEventRef: string;
  matchedKeywords: string[];
}

export interface RAGQueryResponse {
  query: string;
  answer: string;
  groundedFactsCount: number;
  retrievedCitations: InstitutionalMemoryRecord[];
}
