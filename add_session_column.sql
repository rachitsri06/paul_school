-- =============================================================
-- SESSION COLUMN MIGRATION
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ucdwxcrcjdmtipubxovz/sql/new
-- =============================================================

-- Add session column to all relevant tables
ALTER TABLE students ADD COLUMN IF NOT EXISTS session TEXT DEFAULT '2024-2025';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session TEXT DEFAULT '2024-2025';
ALTER TABLE grades ADD COLUMN IF NOT EXISTS session TEXT DEFAULT '2024-2025';
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS session TEXT DEFAULT '2024-2025';
ALTER TABLE homework ADD COLUMN IF NOT EXISTS session TEXT DEFAULT '2024-2025';

-- Update all existing records to have the default session
UPDATE students SET session = '2024-2025' WHERE session IS NULL;
UPDATE attendance SET session = '2024-2025' WHERE session IS NULL;
UPDATE grades SET session = '2024-2025' WHERE session IS NULL;
UPDATE fee_payments SET session = '2024-2025' WHERE session IS NULL;
UPDATE homework SET session = '2024-2025' WHERE session IS NULL;

-- Create indexes for fast session filtering
CREATE INDEX IF NOT EXISTS idx_students_session ON students(session);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session);
CREATE INDEX IF NOT EXISTS idx_grades_session ON grades(session);
CREATE INDEX IF NOT EXISTS idx_fee_payments_session ON fee_payments(session);
CREATE INDEX IF NOT EXISTS idx_homework_session ON homework(session);
