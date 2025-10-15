-- Add section column to students table for grade sections like "10-A"
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS section text;

-- Add comment for clarity
COMMENT ON COLUMN public.students.section IS 'Section within grade (e.g., A, B, C for Grade 10-A, 10-B, etc.)';