INSERT INTO companies (name, email, password_hash)
VALUES ('Test Company', 'test@local.dev', 'no_auth_seed_do_not_use')
ON CONFLICT (email) DO NOTHING;