-- Supabase Schema for Classroom Scoring & Attendance System

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Teacher Class Memberships Table
CREATE TABLE IF NOT EXISTS public.teacher_class_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_teacher_class UNIQUE (teacher_id, class_id)
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Class Sessions Table
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ended_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_session_per_class 
ON public.class_sessions (class_id) 
WHERE status = 'active';

-- 6. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent')) NOT NULL,
  arrived_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_session_student UNIQUE (session_id, student_id)
);

-- 7. Score Events Table
CREATE TABLE IF NOT EXISTS public.score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  points INT NOT NULL CONSTRAINT check_points_range CHECK (points BETWEEN -50 AND 50),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Hardened RLS Helper Function
CREATE OR REPLACE FUNCTION public.has_class_access(class_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teacher_class_memberships
    WHERE teacher_id = auth.uid() AND class_id = class_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_class_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_events ENABLE ROW LEVEL SECURITY;

-- Explicit RLS Policies

-- PROFILES
DROP POLICY IF EXISTS "Users can select own profile or co-teachers" ON public.profiles;
CREATE POLICY "Users can select own profile or co-teachers"
ON public.profiles FOR SELECT USING (
  id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.teacher_class_memberships m
    WHERE m.teacher_id = public.profiles.id AND public.has_class_access(m.class_id)
  )
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (id = auth.uid());

-- CLASSES
DROP POLICY IF EXISTS "Teachers can view assigned classes" ON public.classes;
CREATE POLICY "Teachers can view assigned classes"
ON public.classes FOR SELECT USING (public.has_class_access(id));

DROP POLICY IF EXISTS "Authenticated users can create classes" ON public.classes;
CREATE POLICY "Authenticated users can create classes"
ON public.classes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Teachers can update assigned classes" ON public.classes;
CREATE POLICY "Teachers can update assigned classes"
ON public.classes FOR UPDATE USING (public.has_class_access(id));

-- TEACHER CLASS MEMBERSHIPS
DROP POLICY IF EXISTS "Teachers can view memberships for assigned classes" ON public.teacher_class_memberships;
CREATE POLICY "Teachers can view memberships for assigned classes"
ON public.teacher_class_memberships FOR SELECT USING (
  public.has_class_access(class_id) OR teacher_id = auth.uid()
);

DROP POLICY IF EXISTS "Teachers can insert own memberships" ON public.teacher_class_memberships;
CREATE POLICY "Teachers can insert own memberships"
ON public.teacher_class_memberships FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- STUDENTS
DROP POLICY IF EXISTS "Teachers can view students in assigned classes" ON public.students;
CREATE POLICY "Teachers can view students in assigned classes"
ON public.students FOR SELECT USING (public.has_class_access(class_id));

DROP POLICY IF EXISTS "Teachers can insert students in assigned classes" ON public.students;
CREATE POLICY "Teachers can insert students in assigned classes"
ON public.students FOR INSERT WITH CHECK (public.has_class_access(class_id));

DROP POLICY IF EXISTS "Teachers can update students in assigned classes" ON public.students;
CREATE POLICY "Teachers can update students in assigned classes"
ON public.students FOR UPDATE USING (public.has_class_access(class_id));

-- CLASS SESSIONS
DROP POLICY IF EXISTS "Teachers can view class sessions in assigned classes" ON public.class_sessions;
CREATE POLICY "Teachers can view class sessions in assigned classes"
ON public.class_sessions FOR SELECT USING (public.has_class_access(class_id));

DROP POLICY IF EXISTS "Teachers can insert class sessions in assigned classes" ON public.class_sessions;
CREATE POLICY "Teachers can insert class sessions in assigned classes"
ON public.class_sessions FOR INSERT WITH CHECK (public.has_class_access(class_id));

DROP POLICY IF EXISTS "Teachers can update class sessions in assigned classes" ON public.class_sessions;
CREATE POLICY "Teachers can update class sessions in assigned classes"
ON public.class_sessions FOR UPDATE USING (public.has_class_access(class_id));

-- ATTENDANCE
DROP POLICY IF EXISTS "Teachers can view attendance in assigned classes" ON public.attendance;
CREATE POLICY "Teachers can view attendance in assigned classes"
ON public.attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.class_sessions cs
    WHERE cs.id = public.attendance.session_id AND public.has_class_access(cs.class_id)
  )
);

DROP POLICY IF EXISTS "Teachers can insert attendance in assigned classes" ON public.attendance;
CREATE POLICY "Teachers can insert attendance in assigned classes"
ON public.attendance FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_sessions cs
    WHERE cs.id = public.attendance.session_id AND public.has_class_access(cs.class_id)
  )
);

DROP POLICY IF EXISTS "Teachers can update attendance in assigned classes" ON public.attendance;
CREATE POLICY "Teachers can update attendance in assigned classes"
ON public.attendance FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.class_sessions cs
    WHERE cs.id = public.attendance.session_id AND public.has_class_access(cs.class_id)
  )
);

-- SCORE EVENTS
DROP POLICY IF EXISTS "Teachers can view score events in assigned classes" ON public.score_events;
CREATE POLICY "Teachers can view score events in assigned classes"
ON public.score_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.class_sessions cs
    WHERE cs.id = public.score_events.session_id AND public.has_class_access(cs.class_id)
  )
);

DROP POLICY IF EXISTS "Teachers can insert score events in assigned classes" ON public.score_events;
CREATE POLICY "Teachers can insert score events in assigned classes"
ON public.score_events FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_sessions cs
    WHERE cs.id = public.score_events.session_id AND public.has_class_access(cs.class_id)
  )
);

-- ATOMIC SESSION MANAGEMENT RPCs

-- 1. Start New Session (Completes old, marks auto-absent with arrived_at = NULL, starts new)
CREATE OR REPLACE FUNCTION public.start_new_session(
  p_class_id UUID,
  p_present_student_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_old_session_id UUID;
  v_new_session_id UUID;
BEGIN
  IF NOT public.has_class_access(p_class_id) THEN
    RAISE EXCEPTION 'Access denied for class %', p_class_id;
  END IF;

  -- 1. Complete existing active session for this class if any
  SELECT id INTO v_old_session_id
  FROM public.class_sessions
  WHERE class_id = p_class_id AND status = 'active'
  LIMIT 1;

  IF v_old_session_id IS NOT NULL THEN
    UPDATE public.class_sessions
    SET status = 'completed', ended_at = now()
    WHERE id = v_old_session_id;

    -- Finalize auto-absent for un-marked active students with explicit arrived_at = NULL
    INSERT INTO public.attendance (session_id, student_id, status, arrived_at)
    SELECT v_old_session_id, s.id, 'absent', NULL
    FROM public.students s
    WHERE s.class_id = p_class_id AND s.active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.attendance a
        WHERE a.session_id = v_old_session_id AND a.student_id = s.id
      );
  END IF;

  -- 2. Insert new active session
  INSERT INTO public.class_sessions (class_id, date, started_at, status)
  VALUES (p_class_id, CURRENT_DATE, now(), 'active')
  RETURNING id INTO v_new_session_id;

  -- 3. Insert present attendance records for selected students
  IF array_length(p_present_student_ids, 1) > 0 THEN
    INSERT INTO public.attendance (session_id, student_id, status, arrived_at)
    SELECT v_new_session_id, unnest(p_present_student_ids), 'present', now();
  END IF;

  RETURN v_new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. End Class Session (Completes session, marks auto-absent with arrived_at = NULL)
CREATE OR REPLACE FUNCTION public.end_class_session(
  p_session_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_class_id UUID;
BEGIN
  SELECT class_id INTO v_class_id
  FROM public.class_sessions
  WHERE id = p_session_id;

  IF v_class_id IS NULL OR NOT public.has_class_access(v_class_id) THEN
    RAISE EXCEPTION 'Access denied or session not found';
  END IF;

  UPDATE public.class_sessions
  SET status = 'completed', ended_at = now()
  WHERE id = p_session_id;

  -- Insert auto-absent records with explicit NULL arrived_at
  INSERT INTO public.attendance (session_id, student_id, status, arrived_at)
  SELECT p_session_id, s.id, 'absent', NULL
  FROM public.students s
  WHERE s.class_id = v_class_id AND s.active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.attendance a
      WHERE a.session_id = p_session_id AND a.student_id = s.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Trigger for Auth User Signup -> Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
