-- Add user_id to students table to isolate data per teacher
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing students to belong to the first teacher (for migration)
UPDATE public.students 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Update RLS policies for students to filter by user_id
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students" ON public.students;

CREATE POLICY "Users can view their own students"
ON public.students FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can insert students" ON public.students;
CREATE POLICY "Users can insert their own students"
ON public.students FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can update students" ON public.students;
CREATE POLICY "Users can update their own students"
ON public.students FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can delete students" ON public.students;
CREATE POLICY "Users can delete their own students"
ON public.students FOR DELETE
USING (auth.uid() = user_id);

-- Update RLS policies for attendance to filter by student's user_id
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view attendance" ON public.attendance;

CREATE POLICY "Users can view attendance for their students"
ON public.attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = attendance.student_id 
    AND students.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can insert attendance" ON public.attendance;
CREATE POLICY "Users can insert attendance for their students"
ON public.attendance FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = attendance.student_id 
    AND students.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can update attendance" ON public.attendance;
CREATE POLICY "Users can update attendance for their students"
ON public.attendance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = attendance.student_id 
    AND students.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers can delete attendance" ON public.attendance;
CREATE POLICY "Users can delete attendance for their students"
ON public.attendance FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = attendance.student_id 
    AND students.user_id = auth.uid()
  )
);

-- Update storage policies to be user-specific
DROP POLICY IF EXISTS "Public can view student photos" ON storage.objects;

CREATE POLICY "Users can view their student photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their student photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their student photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their student photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);