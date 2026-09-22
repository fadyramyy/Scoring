import { supabase, isDemoMode } from './supabase';
import { mockDb } from './mockDatabase';
import {
  Profile,
  Class,
  Student,
  ClassSession,
  Attendance,
  ScoreEvent,
} from '../types';

export const dataService = {
  // --- Auth & Profiles ---
  async signIn(email: string, password: string): Promise<Profile> {
    if (isDemoMode) {
      const match = mockDb.getProfiles().find(
        (p) => p.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!match) throw new Error('Invalid teacher email address or password.');
      if (match.password && match.password !== password) {
        throw new Error('Invalid teacher email address or password.');
      }
      return match;
    }

    if (!supabase) throw new Error('Supabase client not initialized');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Authentication failed');
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!profile) {
      return {
        id: authData.user.id,
        email: authData.user.email || email,
        name: authData.user.user_metadata?.name || email.split('@')[0],
        created_at: authData.user.created_at || new Date().toISOString(),
      };
    }

    return profile as Profile;
  },

  async signUp(email: string, password: string, name: string, className: string): Promise<Profile> {
    if (isDemoMode) {
      const newProfile: Profile = {
        id: 'teacher-' + Math.random().toString(36).substring(2, 9),
        email: email.trim(),
        name: name.trim(),
        password: password,
        created_at: new Date().toISOString(),
      };
      const newClass: Class = {
        id: 'class-' + Math.random().toString(36).substring(2, 9),
        name: className.trim(),
        active: true,
        created_at: new Date().toISOString(),
      };
      mockDb.getProfiles().push(newProfile);
      mockDb['store'].classes.push(newClass);
      mockDb['store'].memberships.push({
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        teacher_id: newProfile.id,
        class_id: newClass.id,
      });
      mockDb['saveStore'](mockDb['store']);
      return newProfile;
    }

    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Registration failed');
    }

    // Ensure session active on client
    if (!authData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) {
        console.warn('Auto sign-in warning:', signInErr.message);
      }
    }

    const userId = authData.user.id;

    // 2. Call atomic register_teacher RPC
    const { data: rpcProfile, error: rpcError } = await supabase.rpc('register_teacher', {
      p_user_id: userId,
      p_email: email.trim(),
      p_name: name.trim(),
      p_class_name: className.trim(),
    });

    if (!rpcError && rpcProfile) {
      return rpcProfile as Profile;
    }

    if (rpcError) {
      console.warn('RPC register_teacher warning:', rpcError.message);
    }

    // Fallback: direct table operations
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const userProfile: Profile = profile || {
      id: userId,
      email: email.trim(),
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    if (!profile) {
      const { error: profError } = await supabase.from('profiles').upsert(userProfile);
      if (profError) {
        console.error('Profile upsert error:', profError);
      }
    }

    // Create or find Class
    const { data: existingClass } = await supabase
      .from('classes')
      .select('*')
      .ilike('name', className.trim())
      .maybeSingle();

    let targetClassId: string;
    if (existingClass) {
      targetClassId = existingClass.id;
    } else {
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({ name: className.trim(), active: true })
        .select()
        .single();

      if (classError || !newClass) {
        console.error('Class insert error:', classError);
        throw new Error(classError?.message || 'Failed to create class');
      }
      targetClassId = newClass.id;
    }

    // Link teacher membership
    const { error: memError } = await supabase.from('teacher_class_memberships').upsert({
      teacher_id: userId,
      class_id: targetClassId,
    });

    if (memError) {
      console.error('Membership insert error:', memError);
      throw new Error(memError.message || 'Failed to assign class to teacher');
    }

    return userProfile;
  },

  async signOut(): Promise<void> {
    if (!isDemoMode && supabase) {
      await supabase.auth.signOut();
    }
  },

  async assignClassToTeacher(teacherId: string, className: string): Promise<Class> {
    const trimmedName = className.trim();
    if (isDemoMode) {
      let cls = mockDb['store'].classes.find(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (!cls) {
        cls = {
          id: 'class-' + Math.random().toString(36).substring(2, 9),
          name: trimmedName,
          active: true,
          created_at: new Date().toISOString(),
        };
        mockDb['store'].classes.push(cls);
      }
      const existingMem = mockDb['store'].memberships.find(
        (m) => m.teacher_id === teacherId && m.class_id === cls.id
      );
      if (!existingMem) {
        mockDb['store'].memberships.push({
          id: 'm-' + Math.random().toString(36).substring(2, 9),
          teacher_id: teacherId,
          class_id: cls.id,
        });
      }
      mockDb['saveStore'](mockDb['store']);
      return cls;
    }

    if (!supabase) throw new Error('Supabase client not initialized');

    // Fetch teacher profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', teacherId)
      .maybeSingle();

    // Call atomic SECURITY DEFINER register_teacher RPC
    const { error: rpcErr } = await supabase.rpc('register_teacher', {
      p_user_id: teacherId,
      p_email: profile?.email || '',
      p_name: profile?.name || 'Teacher',
      p_class_name: trimmedName,
    });

    if (!rpcErr) {
      const classes = await this.getTeacherClasses(teacherId);
      const match = classes.find((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (match) return match;
    }

    if (rpcErr) {
      console.warn('register_teacher RPC error:', rpcErr.message);
    }

    // Direct table fallback
    const { data: existingClass } = await supabase
      .from('classes')
      .select('*')
      .ilike('name', trimmedName)
      .maybeSingle();

    let targetClassId: string;
    if (existingClass) {
      targetClassId = existingClass.id;
    } else {
      const { data: newClass, error: classErr } = await supabase
        .from('classes')
        .insert({ name: trimmedName, active: true })
        .select()
        .single();

      if (classErr || !newClass) {
        throw new Error(classErr?.message || 'Failed to create class');
      }
      targetClassId = newClass.id;
    }

    const { error: memErr } = await supabase.from('teacher_class_memberships').upsert({
      teacher_id: teacherId,
      class_id: targetClassId,
    });

    if (memErr) {
      throw new Error(memErr.message || 'Failed to assign class to teacher');
    }

    const { data: targetClass } = await supabase
      .from('classes')
      .select('*')
      .eq('id', targetClassId)
      .single();

    return targetClass as Class;
  },

  async getCurrentSessionProfile(): Promise<Profile | null> {
    if (isDemoMode) return null;
    if (!supabase) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return null;

    const user = sessionData.session.user;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) return profile as Profile;

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Teacher',
      created_at: user.created_at || new Date().toISOString(),
    };
  },

  // --- Classes ---
  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    if (isDemoMode) {
      return mockDb.getTeacherClasses(teacherId);
    }
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('teacher_class_memberships')
      .select('classes(*)')
      .eq('teacher_id', teacherId);

    if (error || !data) return [];

    return data
      .map((item: any) => item.classes as Class)
      .filter((c) => c && c.active);
  },

  // --- Students ---
  async getStudents(classId: string, includeInactive = false): Promise<Student[]> {
    if (isDemoMode) {
      return mockDb.getStudents(classId, includeInactive);
    }
    if (!supabase) return [];

    let query = supabase.from('students').select('*').eq('class_id', classId);
    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error || !data) return [];
    return data as Student[];
  },

  async createStudent(classId: string, name: string): Promise<Student> {
    if (isDemoMode) {
      return mockDb.createStudent(classId, name);
    }
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('students')
      .insert({
        class_id: classId,
        name: name.trim(),
        active: true,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to create student');
    return data as Student;
  },

  async updateStudentName(studentId: string, newName: string): Promise<void> {
    if (isDemoMode) {
      mockDb.updateStudentName(studentId, newName);
      return;
    }
    if (!supabase) return;

    await supabase
      .from('students')
      .update({ name: newName.trim() })
      .eq('id', studentId);
  },

  async toggleStudentActive(studentId: string, currentActive: boolean): Promise<void> {
    if (isDemoMode) {
      mockDb.toggleStudentActive(studentId);
      return;
    }
    if (!supabase) return;

    await supabase
      .from('students')
      .update({ active: !currentActive })
      .eq('id', studentId);
  },

  // --- Sessions ---
  async getActiveSession(classId: string): Promise<ClassSession | null> {
    if (isDemoMode) {
      return mockDb.getActiveSession(classId);
    }
    if (!supabase) return null;

    const { data } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('class_id', classId)
      .eq('status', 'active')
      .maybeSingle();

    return (data as ClassSession) || null;
  },

  async getSessions(classId: string): Promise<ClassSession[]> {
    if (isDemoMode) {
      return mockDb.getSessions(classId);
    }
    if (!supabase) return [];

    const { data } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('class_id', classId)
      .order('started_at', { ascending: false });

    return (data as ClassSession[]) || [];
  },

  async startNewSession(classId: string, presentStudentIds: string[]): Promise<string> {
    if (isDemoMode) {
      const sess = mockDb.startNewSession(classId, presentStudentIds);
      return sess.id;
    }
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase.rpc('start_new_session', {
      p_class_id: classId,
      p_present_student_ids: presentStudentIds,
    });

    if (error) throw new Error(error.message);
    return data as string;
  },

  async endClassSession(sessionId: string): Promise<void> {
    if (isDemoMode) {
      mockDb.endClassSession(sessionId);
      return;
    }
    if (!supabase) throw new Error('Supabase client not initialized');

    const { error } = await supabase.rpc('end_class_session', {
      p_session_id: sessionId,
    });

    if (error) throw new Error(error.message);
  },

  // --- Attendance ---
  async getSessionAttendance(sessionId: string): Promise<Attendance[]> {
    if (isDemoMode) {
      return mockDb.getSessionAttendance(sessionId);
    }
    if (!supabase) return [];

    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId);

    return (data as Attendance[]) || [];
  },

  async getAttendanceForClass(classId: string): Promise<Attendance[]> {
    if (isDemoMode) {
      return mockDb['store'].attendance;
    }
    if (!supabase) return [];

    const { data } = await supabase
      .from('attendance')
      .select('*, class_sessions!inner(class_id)')
      .eq('class_sessions.class_id', classId);

    return (data as Attendance[]) || [];
  },

  async markStudentPresent(sessionId: string, studentId: string): Promise<void> {
    if (isDemoMode) {
      mockDb.markStudentPresent(sessionId, studentId);
      return;
    }
    if (!supabase) return;

    await supabase.from('attendance').upsert(
      {
        session_id: sessionId,
        student_id: studentId,
        status: 'present',
        arrived_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,student_id' }
    );
  },

  // --- Scoring ---
  async getSessionScoreEvents(sessionId: string): Promise<ScoreEvent[]> {
    if (isDemoMode) {
      return mockDb.getSessionScoreEvents(sessionId);
    }
    if (!supabase) return [];

    const { data } = await supabase
      .from('score_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    return (data as ScoreEvent[]) || [];
  },

  async getScoreEventsForClass(classId: string): Promise<ScoreEvent[]> {
    if (isDemoMode) {
      return mockDb['store'].scoreEvents;
    }
    if (!supabase) return [];

    const { data } = await supabase
      .from('score_events')
      .select('*, class_sessions!inner(class_id)')
      .eq('class_sessions.class_id', classId);

    return (data as ScoreEvent[]) || [];
  },

  async addScoreEvent(
    sessionId: string,
    studentId: string,
    teacherId: string | null,
    points: number
  ): Promise<ScoreEvent> {
    if (points < -50 || points > 50) {
      throw new Error('Score points must be between -50 and 50');
    }

    if (isDemoMode) {
      return mockDb.addScoreEvent(sessionId, studentId, teacherId, points);
    }
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
      .from('score_events')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        teacher_id: teacherId,
        points: points,
      })
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to add score event');
    return data as ScoreEvent;
  },

  async undoLastStudentScoreEvent(
    sessionId: string,
    studentId: string,
    teacherId: string | null
  ): Promise<ScoreEvent | null> {
    if (isDemoMode) {
      return mockDb.undoLastStudentScoreEvent(sessionId, studentId, teacherId);
    }
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data: events } = await supabase
      .from('score_events')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!events || events.length === 0) return null;

    const latest = events[0] as ScoreEvent;
    return this.addScoreEvent(sessionId, studentId, teacherId, -latest.points);
  },
};
