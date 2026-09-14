# NEXUS — Solution Document
### Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management: Real-Time Actual Progress Tracking (Planning-to-Execution Bridge)
**Smart India Hackathon 2026 — Problem Statement SIH26122 (Oil India Limited)**

---

## 1. Executive Summary

NEXUS is a field-to-schedule execution intelligence layer for infrastructure project management. It converts unstructured field inputs — voice reports, text updates, daily reports, spreadsheets, PDFs, and photographic evidence — into structured Execution Events, links these events to planned L5/L6 schedule activities using a hybrid AI-and-deterministic-rules approach, and applies governance controls to produce verified, auditable actuals.

The system is deliberately not a generic project dashboard, and it does not grant an AI model unrestricted authority over project state. Probabilistic components (LLMs, embeddings) are confined to interpretation and retrieval; all authoritative state changes, calculations, and permissions are governed by deterministic software (PostgreSQL and a rules engine). This division is the central design decision underlying the solution and is treated as non-negotiable throughout this document.

---

## 2. Problem Statement

### 2.1 Official Problem Statement

**SIH26122 — Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management: Real-Time Actual Progress Tracking (Planning-to-Execution Bridge).**
Sponsoring organization: Oil India Limited. Theme: Smart Automation. Category: Software.

### 2.2 Problem Definition

Infrastructure projects generate information continuously, but that information arrives in unstructured and heterogeneous forms — site diaries, photographs, spreadsheets, PDFs, voice messages, and free-text reports. Planned work, by contrast, is represented at a structured L5/L6 activity level (e.g., in Primavera or MS Project baselines). The core difficulty is not the absence of project-management software; it is the persistent gap between messy field reality and structured schedule representation. Someone must continually interpret field information, determine which planned activity it corresponds to, reconcile it against the schedule, and judge whether the resulting update is trustworthy. This manual reconciliation step is the bottleneck.

**Problem statement, single sentence:**
> Infrastructure project teams need a faster and more reliable way to transform fragmented field information into traceable, schedule-linked actual execution data, so that deviations and blockers become visible early enough for management to act.

### 2.3 Core Pain Points

- Field terminology is unstructured and inconsistent, while schedules use fixed L5/L6 nomenclature.
- Manual reconciliation between field reports and schedule activities delays visibility of true project status.
- Progress claims frequently lack a clear evidence or provenance chain.
- Ambiguous activity mapping can silently corrupt the recorded project state.
- Periodic, batch-style consolidation delays awareness of deviations and blockers.
- Historical execution knowledge remains scattered rather than becoming reusable institutional memory.

### 2.4 Requirements Explicitly Stated by the Problem Statement

| # | Requirement |
|---|---|
| 1 | Unified ingestion of voice, text updates, reports, spreadsheets, PDFs, and field evidence |
| 2 | AI-based extraction and L5/L6 activity matching |
| 3 | Evidence validation and provenance tracking |
| 4 | Generation of verified actuals and variance/risk evaluation |
| 5 | Creation of a searchable institutional project memory with decision support |

**Scope discipline:** what the problem statement explicitly requires is treated as distinct from what the team additionally proposes; the latter is presented as a design extension, not an official requirement, throughout this document.

---

## 3. Context and Supporting Evidence

| Observation | Basis |
|---|---|
| Unstructured, inconsistent field terminology creates reconciliation friction | Problem statement / project blueprint |
| Manual reconciliation between reports and L5/L6 schedules delays visibility | Problem statement / project blueprint |
| Progress claims often lack an identifiable evidence or provenance chain | Project blueprint |
| Ambiguous activity mapping can produce an incorrect project state | Project blueprint |

**Conclusion:** delayed, incorrectly mapped, or incomplete field information forces project management to act on a delayed or uncertain representation of ground reality. This is treated as the central operational risk the solution addresses.

---

## 4. Existing Solutions and Competitive Gap

| Approach | Focus | Limitation |
|---|---|---|
| Manual consolidation into legacy PMIS | Maintaining existing project records | Creates a bottleneck; requires heavy planner effort to match field reports to schedule activities |
| Generic dashboards | Visualizing already-structured data | Does not parse unstructured field input; not an execution-intelligence layer |

**Confirmed gap:** no identified existing solution combines (a) natural-language field capture, (b) semantic L5/L6 schedule matching, and (c) deterministic, rule-based governance of project state in a single pipeline. Existing tools either require manual reconciliation or lack a defensible mechanism for evidence and provenance tracking, which creates conditions for undetected progress-data manipulation.

---

## 5. Proposed Solution

### 5.1 Positioning Statement

> NEXUS is an intelligent field-to-schedule execution layer that converts unstructured field input into verified L5/L6 schedule updates for infrastructure project teams, using a hybrid AI-and-deterministic-rules approach, resolving the bottleneck of manual data reconciliation.

### 5.2 Design Rationale — Hybrid Intelligence Architecture

| Design Decision | Hybrid Intelligence Architecture |
|---|---|
| Reason | An AI model must not have unrestricted authority to rewrite authoritative project truth |
| Alternative considered | A pure LLM-driven project-management engine |
| Reason for rejection | Generative models are probabilistic and prone to hallucination; they cannot reliably enforce dependencies, permissions, or audit history |

This decision governs every subsequent architectural choice in the document: LLM/NLP components are used exclusively for interpretation and semantic retrieval; PostgreSQL and a deterministic rules engine govern state, calculations, and permissions.

### 5.3 End-to-End Solution Pipeline

1. **Capture** — voice, text, reports, spreadsheets, PDFs, and evidence enter the system from authenticated field supervisors.
2. **Pre-process** — speech-to-text, document parsing, OCR (where required), and metadata validation.
3. **Understand** — LLM/NLP extraction of activities, dates, status, blockers, quantities, and context.
4. **Normalize** — construction terminology and synonyms are converted into controlled vocabulary.
5. **Retrieve** — PostgreSQL with pgvector identifies plausible L5/L6 schedule candidates.
6. **Match** — semantic similarity is combined with structured context (ID, location, discipline, equipment, schedule window).
7. **Trust** — evidence, provenance, and mapping confidence are attached to the proposed event.
8. **Govern** — policy determines whether to accept, queue for planner review, correct, reject, or request clarification.
9. **Verify** — approved events become versioned, traceable actual execution records.
10. **Update** — controlled schedule/project state is moved toward near-real-time consistency.
11. **Analyze** — planned-vs-actual variance, blockers, and early-warning rules are evaluated.
12. **Remember** — validated execution history becomes searchable institutional project memory.
13. **Retrieve (RAG)** — historical and operational questions are answered using validated project knowledge.

---

## 6. System Architecture

### 6.1 High-Level Architecture

- **Input:** voice/text, documents, and evidence from authenticated supervisors.
- **Ingestion:** FastAPI endpoints, speech-to-text, document parsing, OCR.
- **Processing:** LLM/NLP extraction into constrained Execution Events, followed by terminology normalization.
- **Intelligence:** candidate retrieval and hybrid matching via PostgreSQL + pgvector.
- **Decision:** a trust layer (evidence and mapping confidence) and a governance layer (role-based access control, planner review).
- **Output:** verified actuals, schedule variance analytics, PMIS updates, and institutional project memory accessible via retrieval-augmented generation (RAG).

### 6.2 Core Data Model

| Entity | Purpose |
|---|---|
| Project | Top-level scope and ownership |
| Schedule / Version | Planned baseline and its version/effective state |
| Activity | L5/L6 planned work unit with dates, location, discipline, and dependencies |
| Execution Event | Structured representation of what happened in the field |
| Evidence | Source material and provenance reference supporting an event |
| Match Decision | Candidate activities, scores, selected activity, and rationale |
| Validation | Approve/correct/reject action and reviewer history |
| Audit Record | Actor, timestamp, and before/after state of material changes |
| Risk / Alert | Rule or signal requiring management attention |
| Memory Record | Validated historical execution knowledge available for retrieval |

**Traceability chain:** dashboard insight → risk/variance signal → verified actual → validation decision → match decision → extracted event → original field input → evidence.

### 6.3 Module A — Low-Friction Field Capture

- **Function:** allows supervisors to report activity start, progress, interruption, or completion without navigating rigid forms.
- **Input:** natural voice or text (e.g., "We finished erecting the pipe spools on Line 24 around 3 PM today.").
- **Processing:** speech-to-text followed by LLM/NLP extraction into a constrained JSON schema.
- **Output:** a structured Execution Event (activity description, location, event type, actual time, reporter identity, and input source).

A single report can encode multiple facts — for example, a start time, an interruption, a stated blocker, and an expected resumption date — all captured in one structured event rather than requiring separate form entries.

**Design constraint:** the conversational/voice interface is a field-facing entry point into NEXUS, not the identity of the system itself. The intelligence and governance layer behind the interaction is what constitutes NEXUS.

### 6.4 Module B — L5/L6 Schedule Linking

- **Function:** matches field language to the structured project schedule.
- **Input:** a structured Execution Event.
- **Processing:** semantic similarity (via embeddings) combined with structured disambiguation context — activity ID, location, discipline, equipment, and schedule window.
- **Output:** a ranked list of candidate L5/L6 activities with confidence scores.

| Signal | Example | Purpose |
|---|---|---|
| Activity ID | A-124 | Strong exact match when present |
| Activity name | Pipe spool erection | Semantic/lexical similarity |
| Location | Line 24 / Block B | Disambiguates similar activities |
| Discipline | Civil, piping, static/rotating equipment, electrical, instrumentation, HSE | Narrows candidate set |
| Equipment/tag | Pump P-14 | Additional disambiguating context |
| Schedule window | Planned dates | Temporal plausibility check |
| Dependencies | Predecessor activity state | Project-context consistency check |
| Embedding similarity | Meaning-level match | Handles wording variation and synonyms |

The six-discipline list above is drawn directly from the problem statement's own description of how L5/L6 activities cascade from macro milestones and are executed and reported on in parallel across disciplines.

---

## 7. Core Technology and Algorithmic Pipeline

### 7.1 Matching Pipeline

```
INPUT (Execution Event)
        ↓
   NORMALIZE
        ↓
RETRIEVE CANDIDATES (pgvector)
        ↓
SEMANTIC SIMILARITY + STRUCTURED CONTEXT
        ↓
   RANK & CONFIDENCE SCORE
        ↓
REVIEW / ACCEPT (Governance Gate)
```

### 7.2 Division of Responsibility — AI vs. Deterministic Software

| Function | AI / LLM | Deterministic Software |
|---|---|---|
| Understand field language | Primary | Validates output |
| Extract activity, date, status, blocker | Primary | Schema/type checks |
| Normalize synonyms | Primary, with domain vocabulary | Controlled-value validation |
| Find candidate activities | Embeddings / semantic retrieval | Filters by project scope |
| Rank candidate activities | Semantic score | Structured scoring rules |
| Calculate planned-vs-actual variance | — | Yes |
| Dependency/threshold logic | — | Yes |
| Permissions and approval | — | Yes |
| Audit history | — | Yes |
| RAG answer synthesis | Yes, after retrieval | Retrieval and data-access controls |

### 7.3 Constrained Extraction Schema

The LLM is prompted to return a controlled schema rather than free text, for example: `event_type`, `activity_description`, `candidate_location`, `start_time`, `end_time`, `status`, `quantity`, `blocker`, `evidence_reference`, `notes`. Any field the model cannot confidently populate is returned as explicitly null rather than inferred or guessed — this is a deliberate constraint to prevent silent fabrication of project facts.

**Model selection criteria** are extraction accuracy on representative construction-language examples, reliability of structured output, multilingual performance (if required), latency suitable for field reporting, cost at expected event volume, privacy/deployment constraints, context-length requirements, and predictable failure behavior. Model size is not selected first; the extraction and matching benchmark is defined first, and candidate models are evaluated against it.

---

## 8. Technical Challenges and Mitigations

### 8.1 Evidence and the "Wrong Image" Problem

**Problem:** a user can submit a different, outdated, or manipulated image, or a photograph of visually similar infrastructure. Computer vision cannot reliably prove that an image is genuine, current, or representative of a specific completion percentage.

**Position:** NEXUS does not claim to perfectly authenticate photographic evidence via computer vision. The system instead implements an **evidence-provenance model**, in which a photograph is one signal among several rather than the sole basis for a progress claim.

| Signal | Useful For | Limitation |
|---|---|---|
| Authenticated uploader identity | Attribution of submission | Does not prove truth of content |
| Capture/submission timestamp | Temporal consistency | Submission time may differ from capture time |
| Location metadata (if available) | Site consistency | May be missing or manipulated |
| Project/site selection | Scope association | Does not prove physical location |
| Computer vision classification | Visible-work consistency | Similar infrastructure can appear alike |
| Report-to-image correlation | Cross-checking description against evidence | Coordinated false inputs remain possible |
| Sequence of prior/subsequent evidence | Consistency over time | Consistency does not constitute proof |
| Human validation | Escalation for ambiguous or high-impact cases | Adds reviewer effort |

**Policy:** photographs are treated as evidence, not unquestionable truth. Missing, inconsistent, or weak evidence is explicitly flagged rather than silently treated as verified. Evidence confidence is recorded separately from activity-mapping confidence. Ambiguous or high-impact updates require human review before they affect authoritative project state.

### 8.2 LLM Hallucination

**Problem:** a generative model may hallucinate project facts, dates, or states.

**Mitigation:** the LLM proposes structured facts within a constrained schema; deterministic rules in PostgreSQL govern all state changes. Unrestricted writes from the model to authoritative project state are architecturally blocked.

**Residual limitation:** extraction accuracy remains dependent on the quality and specificity of the field input.

### 8.3 Mismatched Field Language

**Problem:** supervisors use synonyms, abbreviations, or site-specific terms not present in the baseline schedule vocabulary.

**Mitigation:** hybrid semantic matching (embeddings) combined with hard structural constraints (location, discipline, equipment) rather than exact keyword matching alone.

**Residual limitation:** reports that are genuinely vague or incomplete still require manual clarification; no matching approach eliminates the need for human input in ambiguous cases.

---

## 9. Governance, Audit, and Anti-Corruption Posture

A mapping confidence score (e.g., 0.96) indicates the system's confidence in its own interpretation given available signals — it does not certify that the underlying real-world claim is 96% true. Evidence completeness and mapping confidence are recorded and displayed as separate quantities.

| Confidence Case | System Behavior |
|---|---|
| High confidence, low risk | Controlled automatic or proposed update per project policy; evidence and audit trail preserved |
| Medium confidence or material ambiguity | Routed for mandatory planner review before any authoritative schedule change |
| Low confidence or missing critical information | No schedule update applied; clarification or stronger evidence requested |

**Anti-corruption design principle:** every material project-progress claim is attributable, evidence-linked, confidence-aware, approval-aware, and auditable.

| Control | Governance Value |
|---|---|
| Authenticated identity | Ties a material update to a specific user/role |
| Evidence linkage | Provides a traceable source reference for each progress claim |
| Timestamping | Preserves the history of submission and processing |
| Confidence scoring | Surfaces system uncertainty instead of hiding it |
| Planner approval | Enables review of ambiguous or high-impact updates prior to state change |
| Role-based access control | Restricts approval/correction authority to authorized roles |
| Versioned history | Preserves prior states; corrections do not overwrite history |
| Exception alerts | Surfaces repeated or inconsistent patterns for review |
| Evidence completeness flags | Makes missing support visible rather than defaulting to "verified" |

**What the system can claim:** improved transparency and traceability of progress information; reduced opportunity for silent progress-data manipulation; easier identification of unsupported or inconsistent updates; an auditable chain from field report to schedule state.

**What the system does not claim:** elimination of corruption; proof that a specific individual committed misconduct; perfect photographic authentication; replacement of legal, procurement, audit, or investigative institutions.

---

## 10. Unique Selling Points

| USP | Existing Approach | NEXUS Approach |
|---|---|---|
| Hybrid intelligence governance | Pure manual entry, or unconstrained AI chat interfaces | AI proposes structured facts via constrained schemas; deterministic software governs permissions, calculations, and project truth |
| Semantic L5/L6 schedule linking | Manual mapping or exact keyword matching | Vector embedding similarity combined with exact ID, location, equipment, and dependency rules |
| Evidence-provenance pipeline | Photographs stored without structured context | Evidence linked directly to execution events; evidence confidence tracked separately from mapping confidence; missing support explicitly flagged |
| Traceable institutional memory | Scattered historical reports | Validated execution history converted into a searchable semantic index answerable via traceable RAG queries |

---

## 11. Impact and Benefits

| Current Problem | NEXUS Change | Resulting Impact |
|---|---|---|
| Manual reconciliation | Automated extraction and matching | Reduced repetitive planner effort |
| Inconsistent field language | Normalization into structured events | More consistent project data |
| Unclear schedule linkage | Hybrid L5/L6 matching | Stronger plan-to-reality connection |
| Weak provenance | Evidence, identity, and audit linkage | Higher traceability |
| Delayed visibility | Near-real-time event processing | Earlier awareness of deviations |
| Silent corrections | Versioned audit trail | Greater accountability |
| High reporting friction | Voice/text capture | Easier field participation |
| Scattered history | Project memory with RAG retrieval | Reusable institutional knowledge |

**Stakeholder-specific benefits:**
- **Site supervisors:** lower reporting friction through conversational voice/text capture.
- **Planners:** automated extraction and matching accelerate verification.
- **Management:** faster intervention through near-real-time event processing.
- **Institutional/government stakeholders:** higher transparency, stronger audit trails, and reusable institutional knowledge from previously scattered historical records.

---

## 12. Feasibility and Viability

### 12.1 Technical Feasibility
- Python, FastAPI, and Next.js/React form a practical, rapid foundation for a hackathon-scale prototype.
- PostgreSQL with pgvector supports semantic retrieval without the operational overhead of a separate vector database.
- Constrained LLM extraction is feasible using current-generation APIs.
- Legacy CSV/XLSX and PDF data can be ingested using established Python tooling (Pandas, OpenPyXL, PDF/OCR parsers).
- Core variance and governance logic can remain fully deterministic; machine-learning-based pattern modeling is optional.

### 12.2 Operational Feasibility
- Supervisors report naturally via voice/text rather than rigid forms.
- Existing schedules are imported rather than recreated.
- Human validation provides a controlled, incremental adoption path.
- Deployment can begin on a single project before scaling to multiple sites or an enterprise.

### 12.3 Economic and Adoption Viability
- **Target customers:** infrastructure construction firms, project management offices, and government infrastructure bodies.
- **Deployment model:** modular, beginning with CSV/XLSX compatibility and expanding via APIs; B2B licensing per project, site, or enterprise.
- **Value proposition:** replacing slow, manual reporting reconciliation with near-real-time, auditable schedule intelligence, using data organizations already generate.
- Financial and time savings should be measured empirically during deployment rather than asserted in advance.

---

## 13. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Incorrect L5/L6 activity match | Medium | High | Hybrid matching, confidence scoring, mandatory planner review for ambiguous inputs |
| LLM hallucination | Medium | High | Constrained schema extraction, deterministic validation, no unrestricted writes |
| Legacy PMIS integration difficulty | High | Medium | CSV/XLSX compatibility first; API-based integration as a later phase |
| Incorrect or outdated photo evidence | Medium | Medium | Evidence-provenance checks (metadata, context) and explicit flags for missing evidence |
| Insufficient historical data for ML-based signals | Low–Medium | Low | Begin with deterministic rules; introduce learned models as data volume grows |
| Unauthorized state change | Low | High | Authentication, role-based access control, controlled state transitions, full audit logging |

**Highest-priority risk:** an LLM hallucinating execution states, or incorrectly matching an activity, in a way that corrupts the schedule. This is mitigated through constrained extraction schemas (explicit nulls for unknown data), a strict separation between mapping confidence and asserted real-world truth, and a mandatory planner-review gate for any medium-confidence or materially ambiguous update prior to an authoritative state change.

---

## 14. Anticipated Evaluation Questions

**Q1. Does this system eliminate corruption?**
No. It reduces the opportunity for silent manipulation by ensuring every material progress claim is attributable, evidence-linked, confidence-aware, and auditable through versioned history.

**Q2. What happens if the AI extracts the wrong activity from a supervisor's report?**
The system computes a mapping confidence score. Ambiguous or medium-confidence mappings are not automatically applied to the schedule; they are queued for manual planner review.

**Q3. How is a submitted photograph verified as real or accurate?**
The system does not rely on computer vision alone. An evidence-provenance model checks uploader identity, metadata, location, and consistency signals, and explicitly flags weak evidence for human validation.

**Q4. Why not use a large language model to manage the entire project state?**
LLMs are probabilistic and prone to hallucination. They are used strictly for interpretation and retrieval; deterministic software (PostgreSQL, rule-based logic) governs authoritative state, calculations, and permissions.

**Q5. How does the system integrate with existing PMIS software?**
The architecture is modular. It initially imports and exports project data via CSV/XLSX using established Python tooling, with FastAPI endpoints available for deeper integration as required.

**Q6. What does "institutional memory" mean in this context?**
Approved actuals are indexed into a pgvector semantic store. This allows managers to pose natural-language questions (for example, about recurring delay causes) and receive answers grounded in traceable, validated historical facts rather than generic model output.

---

## 15. Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Next.js, React, Tailwind CSS | Supervisor interface, planner review workflows, dashboards |
| Backend | Python, FastAPI | API layer and processing orchestration |
| Data ingestion | Pandas, OpenPyXL, PDF parser, OCR | CSV/XLSX and legacy document ingestion |
| Speech | Speech-to-text engine | Voice-to-text conversion for field reporting |
| AI/ML | LLM/NLP, embeddings | Constrained extraction, normalization, semantic representation |
| Analytics (optional) | scikit-learn | Pattern/risk modeling once sufficient historical data exists |
| Database | PostgreSQL | Authoritative relational state: projects, schedules, events, approvals, audit records |
| Vector search | pgvector | Semantic retrieval for schedule matching and institutional memory |
| Governance logic | Rules engine + SQL | Variance calculation, thresholds, dependency checks, approval workflows |
| Visualization (charts) | Recharts, Plotly | Progress, variance, and blocker charts |
| Visualization (schedule view) | A dedicated Gantt library (e.g., dhtmlx-gantt or react-google-charts) | Planned-vs-actual schedule timeline |

**Note on visualization tooling:** Recharts and Plotly cover standard charts (bar, line, variance) but do not natively render Gantt views. The planned-vs-actual schedule timeline requires a dedicated Gantt component rather than being assembled from Recharts primitives — this distinction should be stated explicitly if asked how the schedule view is rendered.

**Technology discipline:** components such as blockchain, oversized LLMs, complex computer vision pipelines, or a dedicated vector database are deliberately excluded unless they satisfy a concrete, defensible requirement. Each stack element above is included because it fulfills a specific, stated function.

---

## 16. Team Role Mapping

| Role | Primary Responsibility |
|---|---|
| Frontend | Next.js/React interface for supervisors and planners |
| Backend | FastAPI infrastructure and Python orchestration |
| AI/ML | Prompt engineering, constrained LLM extraction, semantic matching |
| Data/Database | PostgreSQL schema design, pgvector integration, rules-engine logic |
| Presentation | Slide deck creation, pitch delivery, live demo coordination |

*Named assignments to be finalized by the team; role definitions above are stable regardless of individual assignment.*

**Identified skill gap:** hardware/IoT integration is out of current team scope. This is addressed by design, not treated as an unmet requirement — the solution relies on software-based evidence provenance rather than dedicated sensor hardware.

---

## 17. Scope Boundaries — What Is Not Being Built

The system explicitly does **not** claim to:
- Eliminate corruption entirely.
- Perfectly authenticate every photograph through computer vision.
- Grant an LLM unrestricted authority to write to authoritative project state.
- Replace legal, procurement, audit, or investigative institutions.
- Function as a generic, undifferentiated project dashboard.

---

## 18. Hackathon Demonstration Plan

| Step | What Is Demonstrated |
|---|---|
| 1 | Import an L5/L6 schedule with activity IDs, dates, locations, and dependencies |
| 2 | Supervisor submits a natural voice/text field update |
| 3 | System displays structured extraction: activity, time, location, status, blocker |
| 4 | Candidate L5/L6 matching with alternatives and confidence scores |
| 5 | Linked evidence (report/photo reference) and provenance information |
| 6 | Planner reviews and approves, corrects, or rejects an ambiguous mapping |
| 7 | Approved event is recorded as a verified actual |
| 8 | Schedule variance (planned vs. actual) updates accordingly |
| 9 | A blocker or delay generates a visible risk alert |
| 10 | Audit trail is inspected: who, when, what, why, and what changed |
| 11 | The verified event is added to institutional project memory |
| 12 | A manager submits a historical query answered via RAG over validated project data |

---

## 19. Basis and Sources

- Smart India Hackathon 2026, Problem Statement SIH26122, sponsored by Oil India Limited: *Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management.*
- NEXUS Master Concept & Technical Blueprint (team-authored technical document, derived from the Round 1 SIH presentation and subsequent internal design discussion).

---

## 20. Open Action Items Before Final Submission

- [ ] Verify all quantitative and factual claims prior to final submission.
- [ ] Validate technical feasibility of the constrained-extraction and matching pipeline against representative data.
- [ ] Test the critical path: capture → extraction → matching → governance → verified actual.
- [ ] Confirm claims made about competing/existing solutions.
- [ ] Finalize system architecture diagrams for the presentation.
- [ ] Finalize the unique selling points to be emphasized in the pitch.
- [ ] Prepare the primary live demonstration.
- [ ] Prepare a backup demonstration path in case of live-demo failure.
- [ ] Finalize responses to anticipated evaluator questions.
- [ ] Assign individual presentation and demo roles among team members.
- [ ] Finalize the technology stack for implementation.
- [ ] Decide explicitly what remains out of scope for the hackathon submission.

---

*This document consolidates the team's structured concept note with the fuller NEXUS technical blueprint into a single reference for presentation, prototype development, and evaluator Q&A preparation.*
