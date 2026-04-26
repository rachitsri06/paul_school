-- Run this in the Supabase Dashboard -> SQL Editor

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS sr_no text,
ADD COLUMN IF NOT EXISTS admission_no text,
ADD COLUMN IF NOT EXISTS section text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS mother_mobile text,
ADD COLUMN IF NOT EXISTS religion text,
ADD COLUMN IF NOT EXISTS transport_stop text,
ADD COLUMN IF NOT EXISTS remarks text;
