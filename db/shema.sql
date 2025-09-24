-- Active: 1757967582982@@192.168.0.201@5432@mibase

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_user (
  id            bigserial PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name     text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
