-- Migration 001: Initial Schema
-- This migration creates the base schema for OCEAN platform
-- Run date: 2026-01-11

-- This file documents the initial schema creation
-- The actual schema is in ../schema.sql and has already been applied

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Record this migration
INSERT INTO schema_migrations (version, description) 
VALUES ('001', 'Initial schema creation')
ON CONFLICT (version) DO NOTHING;
