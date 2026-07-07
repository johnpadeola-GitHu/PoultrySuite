-- Migration 0002: Login rate-limiting
-- Adds failed-attempt tracking to the users table so authSignIn can lock
-- an account temporarily after repeated failures, instead of allowing
-- unlimited password-guessing attempts.

ALTER TABLE users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
