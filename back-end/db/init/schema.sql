-- Companies: signup identity
CREATE TABLE companies (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resumes: deduped by content, one row per unique file ever uploaded
CREATE TABLE resumes (
    content_hash TEXT PRIMARY KEY,          -- SHA-256 of raw file bytes
    full_text    TEXT NOT NULL,
    parsed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications: join of company + resume, holds per-company scoring/profile
CREATE TABLE applications (
    id                SERIAL PRIMARY KEY,
    company_id        INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    resume_hash       TEXT NOT NULL REFERENCES resumes(content_hash) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    extracted_skills  JSONB,                -- Phase 4: LLM skill extraction output
    llm_profile       JSONB,                -- Phase 4: Groq structured profile
    final_score       REAL,
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (company_id, resume_hash)        -- one application per resume per company
);

CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_resume_hash ON applications(resume_hash);