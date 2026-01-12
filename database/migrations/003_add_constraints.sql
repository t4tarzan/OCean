-- Migration 003: Add Foreign Key Constraints
-- Run date: 2026-01-11

-- Note: Most constraints are already defined in schema.sql
-- This migration adds any additional constraints for data integrity

-- Add check constraints
ALTER TABLE platform_users 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE prd_phases
ADD CONSTRAINT check_phase_number_range
CHECK (phase_number BETWEEN 1 AND 10);

ALTER TABLE prd_weeks
ADD CONSTRAINT check_week_number_positive
CHECK (week_number > 0);

-- Add unique constraints
ALTER TABLE platform_users
ADD CONSTRAINT unique_email UNIQUE (email);

-- Record this migration
INSERT INTO schema_migrations (version, description) 
VALUES ('003', 'Add data integrity constraints')
ON CONFLICT (version) DO NOTHING;
