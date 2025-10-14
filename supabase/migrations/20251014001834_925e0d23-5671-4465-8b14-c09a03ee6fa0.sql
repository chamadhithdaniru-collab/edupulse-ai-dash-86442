-- Fix search_path for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for update_attendance_percentage function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;