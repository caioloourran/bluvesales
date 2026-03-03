-- Add avatar column to users table for profile photo upload
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
