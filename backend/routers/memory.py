"""
NEXUS - Module 9: Institutional Memory & RAG Service Router
Endpoints:
  POST /api/memory/search (and /memory/query)
  GET /api/memory/records
  POST /api/memory/ingest
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import MemoryRecord, Project
from matching.embeddings import embed_query, embed_text, cosine_similarity
from utils.serializers import serialize_memory
from config import settings
import logging

logger = logging.getLogger("nexus.memory")

router = APIRouter(tags=["Module 9: Institutional Memory & RAG Service"])

class MemorySearchRequest(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    project_id: int = Field(default=1)
    top_k: int = Field(default=3)


class IngestMemoryRequest(BaseModel):
    title: str
    discipline: str
    project_code: str = "OIL-DNPL-01"
    project_id: Optional[int] = None
    date: str
    summary: str
    root_cause: str
    resolution: str
    source_event_ref: str
    matched_keywords: List[str] = Field(default_factory=list)


def _synthesize_answer_with_llm(query: str, citations: List[Dict[str, Any]]) -> str:
    """Generate a grounded answer from retrieved memory records using configured LLM. Falls back to canned response."""
    context_blocks = []
    for c in citations:
        context_blocks.append(
            f"[Memory Record ID={c.get('id')}, Discipline={c.get('discipline')}, Date={c.get('date')}]\n"
            f"Title: {c.get('title')}\n"
            f"Summary: {c.get('summary')}\n"
            f"Root Cause: {c.get('rootCause')}\n"
            f"Resolution: {c.get('resolution')}\n"
            f"Source Event: {c.get('sourceEventRef')}"
        )
    context_text = "\n\n---\n\n".join(context_blocks)

    prompt = (
        "You are a project memory assistant for NEXUS (Neura l Engine for eXecution Understanding & Schedule Synchronization). "
        "Your role is to answer the user's operational question using ONLY the institutional memory records provided below. "
        "Do not hallucinate or invent facts. If the records do not contain sufficient information to answer the question, "
        "state explicitly that the institutional memory does not contain relevant historical data, and suggest what type of evidence would be needed.\n\n"
        f"Question: {query}\n\n"
        f"Historical Memory Records:\n{context_text}\n\n"
        "Your answer (max 4 paragraphs, cite source record IDs for each claim):"
    )

    try:
        if settings.ANTHROPIC_API_KEY and settings.PRIMARY_LLM_PROVIDER == "anthropic":
            import anthropic
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            resp = client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )
            return "".join(b.text for b in resp.content if b.type == "text").strip()

        elif settings.OPENAI_API_KEY and settings.PRIMARY_LLM_PROVIDER == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            resp = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=600,
            )
            return resp.choices[0].message.content.strip()

        elif settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            resp = model.generate_content(prompt)
            return resp.text.strip()
    except Exception as e:
        logger.warning(f"LLM RAG synthesis failed: {e}. Falling back to keyword-based synthesis.")

    if citations:
        top = citations[0]
        return (
            f"Based on {len(citations)} validated institutional memory record(s) from the Duliajan-Numaligarh installation:\n"
            f"- Memory ID {top.get('id')}: {top.get('summary')}\n"
            f"- Root Cause: {top.get('rootCause')}\n"
            f"- Resolution: {top.get('resolution')}\n"
            f"- Source Event: {top.get('sourceEventRef')}\n"
            "Note: This is a keyword-based synthesis. Configure an LLM API key for grounded natural-language synthesis."
        )
    return "The institutional memory does not contain relevant historical data to answer this question. Please submit more verified execution events to build the memory index."


@router.post("/memory/search")
@router.post("/memory/query")
def search_institutional_memory(req: MemorySearchRequest, db: Session = Depends(get_db)):
    """
    RAG Service over validated institutional memory.
    Retrieves grounded historical lessons, delays, and root cause mitigations.
    Uses LLM-based answer synthesis grounded in retrieved memory records.
    """
    q = req.query or req.question or ""
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query or question is required")

    records = db.query(MemoryRecord).filter(MemoryRecord.project_id == req.project_id).all()
    q_lower = q.lower()
    q_embedding = embed_query(q)

    scored_records = []
    for r in records:
        text_corp = f"{r.title} {r.summary} {r.root_cause} {r.resolution} {r.discipline}".lower()
        keyword_hits = sum(1 for w in q_lower.split() if len(w) > 3 and w in text_corp)

        sem_score = 0.5
        if r.embedding and isinstance(r.embedding, list):
            sem_score = cosine_similarity(q_embedding, r.embedding)

        keyword_score = min(keyword_hits, 3) * 0.15
        recency_score = min(1.0, r.relevance_score) * 0.10 if r.relevance_score else 0.10
        total_score = round(min(0.99, sem_score * 0.6 + keyword_score + recency_score), 4)

        scored_records.append((total_score, r))

    scored_records.sort(key=lambda x: x[0], reverse=True)
    top_records = [r for _, r in scored_records[:req.top_k]]
    serialized_citations = [serialize_memory(r) for r in top_records]

    answer = _synthesize_answer_with_llm(q, serialized_citations)

    return {
        "query": q,
        "answer": answer,
        "groundedFactsCount": len(serialized_citations),
        "retrievedCitations": serialized_citations,
    }


@router.get("/memory/records")
def list_memory_records(project_id: int = Query(1), db: Session = Depends(get_db)):
    records = db.query(MemoryRecord).filter(MemoryRecord.project_id == project_id).all()
    return [serialize_memory(r) for r in records]


@router.post("/memory/ingest")
def ingest_memory_record(req: IngestMemoryRequest, db: Session = Depends(get_db)):
    project_id = req.project_id
    if project_id is None:
        proj = db.query(Project).filter(Project.code == req.project_code).first()
        project_id = proj.id if proj else settings.DEFAULT_PROJECT_ID

    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")

    text_for_embed = f"{req.title} {req.summary} {req.root_cause} {req.resolution}"
    record = MemoryRecord(
        project_id=project_id,
        title=req.title,
        discipline=req.discipline,
        project_code=req.project_code,
        date=req.date,
        summary=req.summary,
        root_cause=req.root_cause,
        resolution=req.resolution,
        source_event_ref=req.source_event_ref,
        matched_keywords=req.matched_keywords,
        relevance_score=0.95,
        embedding=embed_text(text_for_embed),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return serialize_memory(record)
