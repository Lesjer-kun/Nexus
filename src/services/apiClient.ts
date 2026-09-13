import {
  ProjectInfo,
  ScheduleActivity,
  ExecutionEvent,
  AuditLogRecord,
  InstitutionalMemoryRecord,
  RAGQueryResponse,
  GovernanceStatus,
  CandidateMatch,
  DisciplineType,
  EvidenceItem,
} from '../types/nexus';
import {
  mockProject,
  initialActivities,
  initialEvents,
  initialAuditLogs,
  mockInstitutionalMemory,
} from './mockData';

// Simulated in-memory persistent store for mock frontend session
class NexusMockApiClient {
  private project: ProjectInfo = { ...mockProject };
  private activities: ScheduleActivity[] = [...initialActivities];
  private events: ExecutionEvent[] = [...initialEvents];
  private auditLogs: AuditLogRecord[] = [...initialAuditLogs];
  private memoryRecords: InstitutionalMemoryRecord[] = [...mockInstitutionalMemory];

  private delay(ms = 350): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getProject(): Promise<ProjectInfo> {
    await this.delay(150);
    return { ...this.project };
  }

  async getActivities(filterDiscipline?: DisciplineType): Promise<ScheduleActivity[]> {
    await this.delay(200);
    if (!filterDiscipline || filterDiscipline === ('ALL' as any)) {
      return [...this.activities];
    }
    return this.activities.filter((a) => a.discipline === filterDiscipline);
  }

  async getEvents(): Promise<ExecutionEvent[]> {
    await this.delay(200);
    return [...this.events];
  }

  async getPendingReviews(): Promise<ExecutionEvent[]> {
    await this.delay(150);
    return this.events.filter((e) => e.governanceStatus === 'PENDING_REVIEW');
  }

  /**
   * Simulates the AI Extraction & Schedule Linking Pipeline:
   * 1. Speech/Text NLP parsing into constrained schema (explicit null for unknown values)
   * 2. Semantic matching via pgvector against L5/L6 activities
   * 3. Calculating multi-signal confidence scores (Semantic, Location, Discipline, Schedule Window)
   */
  async simulateAIExtraction(
    rawInput: string,
    inputMode: 'voice' | 'text' | 'document' = 'voice',
    evidenceList: EvidenceItem[] = []
  ): Promise<ExecutionEvent> {
    await this.delay(700); // simulate fast cloud inference

    const lower = rawInput.toLowerCase();
    const eventNum = `EV-${Math.floor(10500 + Math.random() * 500)}`;

    // Constrained extraction logic mirroring LLM prompt
    let eventType: ExecutionEvent['eventType'] = 'in_progress';
    let activityDesc = 'General site work reported';
    let location: string | null = null;
    let startTime: string | null = null;
    let endTime: string | null = null;
    let status: ExecutionEvent['status'] = 'in_progress';
    let blocker: string | null = null;
    let expectedResumption: string | null = null;
    let quantity: number | null = null;
    let unit: string | null = null;
    let matchingConfidence = 0.85;

    // Detect completion
    if (lower.includes('finish') || lower.includes('complete') || lower.includes('done')) {
      eventType = 'completed';
      status = 'completed';
      if (lower.includes('3 pm') || lower.includes('15:00')) {
        endTime = '15:00';
      } else {
        endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    // Detect interruption / blocker
    if (
      lower.includes('stop') ||
      lower.includes('failed') ||
      lower.includes('breakdown') ||
      lower.includes('halt') ||
      lower.includes('delay')
    ) {
      eventType = 'interrupted';
      status = 'interrupted';
      if (lower.includes('batching plant')) {
        blocker = 'Batching plant mechanical failure';
      } else if (lower.includes('rain') || lower.includes('weather')) {
        blocker = 'Inclement monsoon weather / localized flooding';
      } else if (lower.includes('permit') || lower.includes('ptw')) {
        blocker = 'Hot work gas clearance permit pending';
      } else {
        blocker = 'Equipment downtime / supply dependency';
      }

      if (lower.includes('tomorrow')) {
        expectedResumption = 'Tomorrow 08:00 AM';
      }
    }

    // Detect location & activity context
    if (lower.includes('line 24') || lower.includes('spool') || lower.includes('pipe')) {
      activityDesc = 'Pipe spool erection & flange bolting';
      location = 'Line 24 / Block B';
      quantity = 12;
      unit = 'spools';
      matchingConfidence = 0.96;
    } else if (lower.includes('block c') || lower.includes('concrete') || lower.includes('pouring')) {
      activityDesc = 'Compressor foundation concrete pouring';
      location = 'Block C';
      quantity = 26;
      unit = 'm³';
      matchingConfidence = 0.93;
    } else if (lower.includes('p-14') || lower.includes('pump') || lower.includes('alignment')) {
      activityDesc = 'Crude booster pump dial alignment';
      location = 'Pump Station 2';
      quantity = 1;
      unit = 'shaft';
      matchingConfidence = 0.98;
    } else if (lower.includes('radiograph') || lower.includes('ndt') || lower.includes('tie-in')) {
      activityDesc = 'Line 24 tie-in radiographic testing';
      location = 'Line 24';
      quantity = 4;
      unit = 'joints';
      matchingConfidence = 0.91;
    }

    // Find best candidate matches from activities
    const candidateMatches: CandidateMatch[] = this.activities
      .map((act) => {
        let semanticScore = 0.35;
        if (location && act.location.includes(location)) semanticScore += 0.3;
        if (lower.includes(act.discipline.toLowerCase())) semanticScore += 0.2;
        if (activityDesc && act.name.toLowerCase().includes(activityDesc.slice(0, 8).toLowerCase())) {
          semanticScore += 0.35;
        }

        const cappedSemantic = Math.min(0.99, semanticScore);
        const locScore = location && act.location.includes(location) ? 0.97 : 0.4;
        const discScore = act.discipline === 'Piping' && lower.includes('pipe') ? 0.99 : 0.75;
        const winScore = 0.92;
        const eqScore = act.equipmentTag && lower.includes(act.equipmentTag.toLowerCase()) ? 0.95 : 0.6;

        const overall = (cappedSemantic * 0.4 + locScore * 0.2 + discScore * 0.2 + winScore * 0.1 + eqScore * 0.1);

        return {
          activityId: act.id,
          wbsCode: act.wbsCode,
          activityName: act.name,
          discipline: act.discipline,
          location: act.location,
          equipmentTag: act.equipmentTag,
          overallConfidence: Math.round(overall * 100) / 100,
          scoreBreakdown: {
            semantic: Math.round(cappedSemantic * 100) / 100,
            location: locScore,
            discipline: discScore,
            scheduleWindow: winScore,
            equipmentMatch: eqScore,
          },
          rationale: `Matched ${act.discipline} domain at ${act.location} with high semantic correlation to '${activityDesc}'.`,
        };
      })
      .sort((a, b) => b.overallConfidence - a.overallConfidence)
      .slice(0, 3);

    const topCandidate = candidateMatches[0];

    const newEvent: ExecutionEvent = {
      id: `ev-${Date.now()}`,
      eventNumber: eventNum,
      reporterId: 'SUP-017',
      reporterName: 'Supervisor R. Bora',
      reporterRole: 'Lead Field Supervisor',
      rawInput,
      inputMode,
      createdAt: new Date().toISOString(),

      eventType,
      activityDescription: activityDesc,
      candidateLocation: location,
      startTime,
      endTime,
      status,
      quantity,
      unit,
      blocker,
      expectedResumption,
      evidenceReferences: evidenceList.map((e) => e.fileName),
      notes: 'Captured via NEXUS Mobile Field Interface.',

      matchingConfidence: topCandidate ? topCandidate.overallConfidence : matchingConfidence,
      evidenceConfidence: evidenceList.length > 0 ? 0.92 : 0.45,
      selectedActivityId: topCandidate ? topCandidate.activityId : null,
      governanceStatus: 'PENDING_REVIEW',

      candidateMatches,
      evidenceList,
    };

    this.events.unshift(newEvent);

    // Record audit event for extraction
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'SYS-NLP',
      actorName: 'NEXUS Hybrid Matcher',
      actorRole: 'System Extraction',
      action: 'INGEST_FIELD_EVENT',
      targetEntity: 'ExecutionEvent',
      entityId: newEvent.id,
      beforeState: null,
      afterState: {
        rawInput,
        matchedActivity: topCandidate?.wbsCode || 'UNASSIGNED',
        confidence: topCandidate?.overallConfidence || 0,
      },
      rationale: 'Natural language supervisor report parsed and linked to candidate L5/L6 activities.',
      evidenceHash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
    });

    return newEvent;
  }

  /**
   * Governance Action: Approve, Correct, Reject, or Request Clarification
   * Strict adherence to Design Blueprint Section 7 & 8:
   * "Approved event becomes versioned project actual; controlled schedule state transitions updated."
   */
  async submitGovernanceDecision(
    eventId: string,
    decision: GovernanceStatus,
    targetActivityId: string,
    plannerNotes: string,
    correctedFields?: Partial<ExecutionEvent>
  ): Promise<{ success: boolean; event: ExecutionEvent }> {
    await this.delay(300);

    const eventIndex = this.events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) throw new Error('Event not found');

    const event = this.events[eventIndex];
    const prevStatus = event.governanceStatus;
    const prevActivityId = event.selectedActivityId;

    // Apply updates
    event.governanceStatus = decision;
    event.selectedActivityId = targetActivityId;
    event.plannerReviewNotes = plannerNotes;
    event.reviewedBy = 'P. Sharma (Lead Project Planner)';
    event.reviewedAt = new Date().toISOString();

    if (correctedFields) {
      Object.assign(event, correctedFields);
    }

    // If APPROVED, update authoritative schedule activity
    const activityIndex = this.activities.findIndex((a) => a.id === targetActivityId);
    let actBeforeState = null;
    let actAfterState = null;

    if (activityIndex !== -1 && decision === 'APPROVED') {
      const act = this.activities[activityIndex];
      actBeforeState = { ...act };

      if (event.eventType === 'completed') {
        act.status = 'COMPLETED';
        act.progressPct = 100;
        act.actualEnd = new Date().toISOString().split('T')[0];
        act.actualDurationDays = act.baselineDurationDays;
        act.varianceDays = 0;
      } else if (event.eventType === 'interrupted') {
        act.status = 'HALTED';
        act.varianceDays = (act.varianceDays || 0) + 1;
      } else if (event.eventType === 'started' || event.eventType === 'in_progress') {
        act.status = 'IN_PROGRESS';
        act.actualStart = act.actualStart || new Date().toISOString().split('T')[0];
        act.progressPct = Math.min(95, act.progressPct + 25);
      }

      if (event.quantity && act.plannedQuantity) {
        act.installedQuantity = Math.min(act.plannedQuantity, (act.installedQuantity || 0) + event.quantity);
      }

      actAfterState = { ...act };
    }

    // Add immutable Audit Log Record
    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'PLN-003',
      actorName: 'P. Sharma',
      actorRole: 'Senior Project Planner',
      action: `GOVERNANCE_${decision}`,
      targetEntity: 'ExecutionEvent',
      entityId: event.eventNumber,
      beforeState: { governanceStatus: prevStatus, selectedActivityId: prevActivityId },
      afterState: {
        governanceStatus: decision,
        selectedActivityId: targetActivityId,
        scheduleUpdated: decision === 'APPROVED',
        activityState: actAfterState,
      },
      rationale: plannerNotes || `Planner performed governance action: ${decision}`,
      evidenceHash: `sha256:${Math.random().toString(36).substring(2, 15)}`,
    });

    return { success: true, event };
  }

  async searchInstitutionalMemory(query: string): Promise<RAGQueryResponse> {
    await this.delay(500);

    const q = query.toLowerCase();
    const matches = this.memoryRecords.filter((rec) => {
      const combined = `${rec.title} ${rec.summary} ${rec.rootCause} ${rec.resolution} ${rec.discipline}`.toLowerCase();
      return q.split(' ').some((word) => word.length > 3 && combined.includes(word));
    });

    const citations = matches.length > 0 ? matches : this.memoryRecords.slice(0, 2);

    let answer = '';
    if (q.includes('pipe') || q.includes('spool') || q.includes('flange')) {
      answer = `Based on 2 verified historical actual records from DNPL Phase 1 (OIL-DNPL-01) and Barauni Feeder (OIL-BFP-03):
- Prior pipe spool erection delays averaged 4 to 6 calendar days.
- Primary Root Cause: Discrepancies in fastener Mill Test Certificates (ASTM A193 B7 bolts) and downstream tie-in NDT radiographic backlog under monsoon restrictions.
- Recommended Mitigating Action: Pre-quarantine inspection at the central spool yard, and deploying Phased Array Ultrasonic Testing (PAUT) in lieu of darkroom gamma radiography to prevent daytime exclusion halts.`;
    } else if (q.includes('concrete') || q.includes('batching') || q.includes('pour')) {
      answer = `Historical records show batching plant interruptions occurred in Compressor Station 3 (OIL-CS-02):
- Root Cause: Aggregate moisture probe drift following torrential rainfall, leading to slump test failure at chute.
- Grounded Mitigation: Rapid cold-joint retarder application, shelter installation over coarse aggregate bins, and two-hour moisture burn-off verification cycles.`;
    } else {
      answer = `Retrieved ${citations.length} validated institutional memory records relevant to your query.
Historical patterns indicate that early detection of field equipment discrepancies and mandatory evidence cross-referencing reduced schedule variance by an average of 3.4 days across Oil India Limited installations.`;
    }

    return {
      query,
      answer,
      groundedFactsCount: citations.length,
      retrievedCitations: citations,
    };
  }

  async getAuditLogs(): Promise<AuditLogRecord[]> {
    await this.delay(150);
    return [...this.auditLogs];
  }
}

export const apiClient = new NexusMockApiClient();
