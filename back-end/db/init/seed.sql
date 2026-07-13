INSERT INTO companies (name, email, password_hash)
VALUES ('Test Company', 'test@local.dev', 'no_auth_seed_do_not_use')
ON CONFLICT (email) DO NOTHING;

INSERT INTO jobs (company_id, description, required_experience_years)
SELECT id, 'Position: Senior Backend Engineer (Node.js)
Location: Remote / Docker Container
Experience Required: 3 years

About the Role:
We are looking for a Backend Engineer to build robust services for our data platform. You will be responsible for scaling our data ingestion layers and optimizing data flows.

Core Responsibilities:
- Design and maintain highly scalable backend microservices using typescript.
- Optimize database performance and implement efficient caching strategies using redis.
- Package and deploy applications smoothly using docker containers.
- Work closely with our AI team to load machine learning models using the onnx runtime.

Required Skills and Technologies:
Candidates must have hands-on production experience with the following stack:
- Core Languages: javascript, typescript, and python
- Frameworks & Runtimes: nodejs, express
- Databases & Caching: postgresql, redis
- DevOps & Tooling: docker, git, zod', 3
FROM companies
WHERE email = 'test@local.dev'
ON CONFLICT DO NOTHING;