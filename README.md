## Prototype usage

This project is the NEXUS prototype in `Nexus`. The app is built as a full UI with a backend API, and the main entry flow is defined in `App.tsx` and `FieldCaptureScreen.tsx`.

### 1) Start the backend
The backend is a FastAPI app started from `main.py`. It exposes endpoints like health, events, matches, reviews, risk, and memory.

Use:

```bash
cd d:\Coding\Current-working\Nexus\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The frontend expects the API at http://localhost:8000/api by default, as shown in `apiClient.ts`.

### 2) Start the frontend
The front-end is a Vite React app. The scripts are in `package.json`:

```bash
cd d:\Coding\Current-working\Nexus
npm install
npm run dev
```

This uses Vite and runs on port 3000 per the script in `package.json`.

### 3) Use the app
Once both are running:

- Open the frontend in the browser at http://localhost:3000
- Switch between Supervisor and Planner roles from the top header
- Use the field capture screen to:
  - enter voice, text, or document-based progress updates
  - attach evidence
  - submit a site report
- Route events to Planner Review
- Review schedule updates, risk alerts, memory records, and audit trail
- The app is designed to simulate a construction progress pipeline: capture → extract → match → review → verify

The UI includes the key modules:
- Field Capture
- Planner Review
- Schedule Tracking
- Risk Alerts
- Institutional Memory
- Audit Trail

Those screens are wired in `App.tsx`.

---

## Tech stack used

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide icons
- Motion/animation library

Evidence:
- `package.json`
- `App.tsx`

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- pgvector

### AI / intelligence layer
- AI extraction and matching capabilities are included via Gemini/OpenAI/Anthropic/VoyageAI libraries
- The app is deliberately using a hybrid pattern: AI helps interpret field input, but deterministic logic governs project state and approvals

### Supporting data tooling
- Pandas, OpenPyXL, PDF parsing, Pillow, NumPy
- Used for document ingestion and structured data handling

> In short: this prototype is a React frontend with a FastAPI backend, backed by PostgreSQL/pgvector and AI-powered extraction/matching, designed to simulate a real field-to-schedule governance workflow for infrastructure projects.