-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  index_number TEXT NOT NULL UNIQUE,
  grade TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'at_risk', 'inactive')) DEFAULT 'active',
  specialty TEXT,
  photo_url TEXT,
  attendance_percentage NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status INTEGER NOT NULL CHECK (status IN (0, 1)),
  absence_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Students policies (teachers can manage all students)
CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete students" ON public.students FOR DELETE USING (auth.uid() IS NOT NULL);

-- Attendance policies
CREATE POLICY "Authenticated users can view attendance" ON public.attendance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete attendance" ON public.attendance FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update attendance percentage
CREATE OR REPLACE FUNCTION public.update_attendance_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_days INTEGER;
  present_days INTEGER;
  new_percentage NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_days
  FROM public.attendance
  WHERE student_id = COALESCE(NEW.student_id, OLD.student_id);
  
  SELECT COUNT(*) INTO present_days
  FROM public.attendance
  WHERE student_id = COALESCE(NEW.student_id, OLD.student_id) AND status = 1;
  
  IF total_days > 0 THEN
    new_percentage := (present_days::NUMERIC / total_days::NUMERIC) * 100;
    UPDATE public.students
    SET attendance_percentage = new_percentage
    WHERE id = COALESCE(NEW.student_id, OLD.student_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for attendance changes
CREATE TRIGGER attendance_percentage_update
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_attendance_percentage();

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view student photos" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Authenticated users can upload student photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update student photos" ON storage.objects FOR UPDATE USING (bucket_id = 'student-photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete student photos" ON storage.objects FOR DELETE USING (bucket_id = 'student-photos' AND auth.uid() IS NOT NULL);