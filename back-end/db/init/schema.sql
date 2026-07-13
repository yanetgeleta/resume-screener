-- Companies: signup identity
CREATE TABLE companies (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs: one posting per company, holds JD text + required experience
CREATE TABLE jobs (
    id                        SERIAL PRIMARY KEY,
    company_id                INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    description                TEXT NOT NULL,
    required_experience_years INTEGER NOT NULL DEFAULT 0 CHECK (required_experience_years >= 0),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resumes: deduped by content, one row per unique file ever uploaded
CREATE TABLE resumes (
    content_hash TEXT PRIMARY KEY,          -- SHA-256 of parsed full_text
    full_text    TEXT NOT NULL,
    parsed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications: join of job + resume, holds per-job scoring/profile
CREATE TABLE applications (
    id                SERIAL PRIMARY KEY,
    job_id            INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_hash       TEXT NOT NULL REFERENCES resumes(content_hash) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    extracted_skills  JSONB,
    llm_profile       JSONB,
    final_score       REAL,
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, resume_hash)
);

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_resume_hash ON applications(resume_hash);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);