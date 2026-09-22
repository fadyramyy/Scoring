import {
  Profile,
  Class,
  TeacherClassMembership,
  Student,
  ClassSession,
  Attendance,
  ScoreEvent,
} from '../types';

const STORAGE_KEY = 'classroom_scoring_mock_db_v2';
const CHANNEL_NAME = 'classroom_scoring_channel';

// Initial Seed Data
const INITIAL_CLASSES: Class[] = [
  { id: 'class-samuel', name: 'Samuel Class', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'class-elijah', name: 'Elijah Class', active: true, created_at: '2026-01-01T00:00:00Z' },
];

const INITIAL_PROFILES: Profile[] = [
  { id: 'teacher-1', email: 'mr.a@samuel.church', name: 'Mr. Andrew', password: 'password123', created_at: '2026-01-01T00:00:00Z' },
  { id: 'teacher-2', email: 'mr.b@samuel.church', name: 'Mr. Benjamin', password: 'password123', created_at: '2026-01-01T00:00:00Z' },
  { id: 'teacher-3', email: 'mr.c@elijah.church', name: 'Mr. Caleb', password: 'password123', created_at: '2026-01-01T00:00:00Z' },
  { id: 'teacher-4', email: 'mr.d@elijah.church', name: 'Mr. David', password: 'password123', created_at: '2026-01-01T00:00:00Z' },
];

const INITIAL_MEMBERSHIPS: TeacherClassMembership[] = [
  { id: 'm-1', teacher_id: 'teacher-1', class_id: 'class-samuel' },
  { id: 'm-2', teacher_id: 'teacher-2', class_id: 'class-samuel' },
  { id: 'm-3', teacher_id: 'teacher-3', class_id: 'class-elijah' },
  { id: 'm-4', teacher_id: 'teacher-4', class_id: 'class-elijah' },
];

const INITIAL_STUDENTS: Student[] = [
  // Samuel Class
  { id: 'stu-jason', class_id: 'class-samuel', name: 'Jason', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-kiro', class_id: 'class-samuel', name: 'Kiro', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-mina', class_id: 'class-samuel', name: 'Mina', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-mark', class_id: 'class-samuel', name: 'Mark', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-john', class_id: 'class-samuel', name: 'John', active: true, created_at: '2026-01-01T00:00:00Z' },
  // Elijah Class
  { id: 'stu-david', class_id: 'class-elijah', name: 'David', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-daniel', class_id: 'class-elijah', name: 'Daniel', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-sarah', class_id: 'class-elijah', name: 'Sarah', active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'stu-hannah', class_id: 'class-elijah', name: 'Hannah', active: true, created_at: '2026-01-01T00:00:00Z' },
];

interface MockDataStore {
  classes: Class[];
  profiles: Profile[];
  memberships: TeacherClassMembership[];
  students: Student[];
  sessions: ClassSession[];
  attendance: Attendance[];
  scoreEvents: ScoreEvent[];
}

class MockDatabase {
  private store: MockDataStore;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.store = this.loadStore();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'DB_CHANGE') {
          this.store = this.loadStore();
          this.notifyListeners();
        }
      };
    }
  }

  private loadStore(): MockDataStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to parse mock store from localStorage', e);
    }
    const initial: MockDataStore = {
      classes: INITIAL_CLASSES,
      profiles: INITIAL_PROFILES,
      memberships: INITIAL_MEMBERSHIPS,
      students: INITIAL_STUDENTS,
      sessions: [],
      attendance: [],
      scoreEvents: [],
    };
    this.saveStore(initial, false);
    return initial;
  }

  private saveStore(store: MockDataStore, broadcast = true) {
    this.store = store;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.notifyListeners();
    if (broadcast && this.channel) {
      this.channel.postMessage({ type: 'DB_CHANGE', timestamp: Date.now() });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefaultSeed() {
    const initial: MockDataStore = {
      classes: INITIAL_CLASSES,
      profiles: INITIAL_PROFILES,
      memberships: INITIAL_MEMBERSHIPS,
      students: INITIAL_STUDENTS,
      sessions: [],
      attendance: [],
      scoreEvents: [],
    };
    this.saveStore(initial);
  }

  // --- Auth & Memberships ---
  public getProfiles(): Profile[] {
    return this.store.profiles;
  }

  public getTeacherClasses(teacherId: string): Class[] {
    const classIds = this.store.memberships
      .filter((m) => m.teacher_id === teacherId)
      .map((m) => m.class_id);
    return this.store.classes.filter((c) => classIds.includes(c.id) && c.active);
  }

  // --- Students ---
  public getStudents(classId: string, includeInactive = false): Student[] {
    return this.store.students.filter(
      (s) => s.class_id === classId && (includeInactive || s.active)
    );
  }

  public createStudent(classId: string, name: string): Student {
    const newStudent: Student = {
      id: 'stu-' + Math.random().toString(36).substring(2, 9),
      class_id: classId,
      name: name.trim(),
      active: true,
      created_at: new Date().toISOString(),
    };
    const store = { ...this.store, students: [...this.store.students, newStudent] };
    this.saveStore(store);
    return newStudent;
  }

  public updateStudentName(studentId: string, newName: string) {
    const students = this.store.students.map((s) =>
      s.id === studentId ? { ...s, name: newName.trim() } : s
    );
    this.saveStore({ ...this.store, students });
  }

  public toggleStudentActive(studentId: string) {
    const students = this.store.students.map((s) =>
      s.id === studentId ? { ...s, active: !s.active } : s
    );
    this.saveStore({ ...this.store, students });
  }

  // --- Session Management ---
  public getActiveSession(classId: string): ClassSession | null {
    return (
      this.store.sessions.find(
        (s) => s.class_id === classId && s.status === 'active'
      ) || null
    );
  }

  public getSessions(classId: string): ClassSession[] {
    return this.store.sessions
      .filter((s) => s.class_id === classId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }

  /**
   * Atomic RPC simulation: start_new_session
   */
  public startNewSession(classId: string, presentStudentIds: string[]): ClassSession {
    let sessions = [...this.store.sessions];
    let attendance = [...this.store.attendance];
    const nowIso = new Date().toISOString();

    // 1. Complete existing active session for this class if any
    const existingActive = sessions.find((s) => s.class_id === classId && s.status === 'active');
    if (existingActive) {
      sessions = sessions.map((s) =>
        s.id === existingActive.id ? { ...s, status: 'completed', ended_at: nowIso } : s
      );

      // Finalize auto-absent for un-marked active students with explicit arrived_at = null
      const activeStudents = this.store.students.filter((st) => st.class_id === classId && st.active);
      for (const student of activeStudents) {
        const hasAtt = attendance.some(
          (a) => a.session_id === existingActive.id && a.student_id === student.id
        );
        if (!hasAtt) {
          attendance.push({
            id: 'att-' + Math.random().toString(36).substring(2, 9),
            session_id: existingActive.id,
            student_id: student.id,
            status: 'absent',
            arrived_at: null,
            created_at: nowIso,
          });
        }
      }
    }

    // 2. Insert new active session
    const newSession: ClassSession = {
      id: 'sess-' + Math.random().toString(36).substring(2, 9),
      class_id: classId,
      date: new Date().toISOString().split('T')[0],
      started_at: nowIso,
      ended_at: null,
      status: 'active',
      created_at: nowIso,
    };
    sessions.push(newSession);

    // 3. Insert present attendance records for selected students
    for (const studentId of presentStudentIds) {
      attendance.push({
        id: 'att-' + Math.random().toString(36).substring(2, 9),
        session_id: newSession.id,
        student_id: studentId,
        status: 'present',
        arrived_at: nowIso,
        created_at: nowIso,
      });
    }

    this.saveStore({ ...this.store, sessions, attendance });
    return newSession;
  }

  /**
   * Atomic RPC simulation: end_class_session
   */
  public endClassSession(sessionId: string) {
    const session = this.store.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const nowIso = new Date().toISOString();
    const sessions = this.store.sessions.map((s) =>
      s.id === sessionId ? { ...s, status: 'completed' as const, ended_at: nowIso } : s
    );

    const attendance = [...this.store.attendance];
    const activeStudents = this.store.students.filter(
      (st) => st.class_id === session.class_id && st.active
    );

    for (const student of activeStudents) {
      const hasAtt = attendance.some(
        (a) => a.session_id === sessionId && a.student_id === student.id
      );
      if (!hasAtt) {
        attendance.push({
          id: 'att-' + Math.random().toString(36).substring(2, 9),
          session_id: sessionId,
          student_id: student.id,
          status: 'absent',
          arrived_at: null,
          created_at: nowIso,
        });
      }
    }

    this.saveStore({ ...this.store, sessions, attendance });
  }

  // --- Attendance ---
  public getSessionAttendance(sessionId: string): Attendance[] {
    return this.store.attendance.filter((a) => a.session_id === sessionId);
  }

  public markStudentPresent(sessionId: string, studentId: string): Attendance {
    const nowIso = new Date().toISOString();
    const existingIndex = this.store.attendance.findIndex(
      (a) => a.session_id === sessionId && a.student_id === studentId
    );

    let attendance = [...this.store.attendance];
    let record: Attendance;

    if (existingIndex >= 0) {
      record = {
        ...attendance[existingIndex],
        status: 'present',
        arrived_at: attendance[existingIndex].arrived_at || nowIso,
      };
      attendance[existingIndex] = record;
    } else {
      record = {
        id: 'att-' + Math.random().toString(36).substring(2, 9),
        session_id: sessionId,
        student_id: studentId,
        status: 'present',
        arrived_at: nowIso,
        created_at: nowIso,
      };
      attendance.push(record);
    }

    this.saveStore({ ...this.store, attendance });
    return record;
  }

  // --- Scoring & Events ---
  public getSessionScoreEvents(sessionId: string): ScoreEvent[] {
    return this.store.scoreEvents.filter((se) => se.session_id === sessionId);
  }

  public addScoreEvent(
    sessionId: string,
    studentId: string,
    teacherId: string | null,
    points: number
  ): ScoreEvent {
    // DB Constraint check
    if (points < -50 || points > 50) {
      throw new Error('Score points must be between -50 and 50');
    }
    const newEvent: ScoreEvent = {
      id: 'score-' + Math.random().toString(36).substring(2, 9),
      session_id: sessionId,
      student_id: studentId,
      teacher_id: teacherId,
      points: points,
      created_at: new Date().toISOString(),
    };

    this.saveStore({
      ...this.store,
      scoreEvents: [...this.store.scoreEvents, newEvent],
    });
    return newEvent;
  }

  /**
   * Per-student Undo: Inserts inverse score event of student's latest score event
   */
  public undoLastStudentScoreEvent(
    sessionId: string,
    studentId: string,
    teacherId: string | null
  ): ScoreEvent | null {
    const studentEvents = this.store.scoreEvents
      .filter((se) => se.session_id === sessionId && se.student_id === studentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (studentEvents.length === 0) return null;

    const latest = studentEvents[0];
    const inversePoints = -latest.points;

    return this.addScoreEvent(sessionId, studentId, teacherId, inversePoints);
  }

  /**
   * Display Score Computation: Math.max(0, SUM(points))
   */
  public getStudentSessionScore(sessionId: string, studentId: string): number {
    const rawSum = this.store.scoreEvents
      .filter((se) => se.session_id === sessionId && se.student_id === studentId)
      .reduce((sum, se) => sum + se.points, 0);
    return Math.max(0, rawSum);
  }

  // --- Statistics & Dashboard Queries ---
  public getStudentStats(studentId: string) {
    const student = this.store.students.find((s) => s.id === studentId);
    if (!student) return null;

    const completedSessions = this.store.sessions.filter(
      (s) => s.class_id === student.class_id && s.status === 'completed'
    );

    const studentAttendance = this.store.attendance.filter(
      (a) => a.student_id === studentId
    );

    const classesAttended = studentAttendance.filter(
      (a) =>
        a.status === 'present' &&
        completedSessions.some((cs) => cs.id === a.session_id)
    ).length;

    const totalSessionsHeld = completedSessions.filter(
      (cs) => new Date(cs.created_at) >= new Date(student.created_at)
    ).length;

    const attendancePct =
      totalSessionsHeld > 0 ? (classesAttended / totalSessionsHeld) * 100 : 0;

    const totalPoints = this.store.scoreEvents
      .filter((se) => se.student_id === studentId)
      .reduce((sum, se) => sum + se.points, 0);

    const avgPointsPerClass =
      classesAttended > 0 ? totalPoints / classesAttended : 0;

    return {
      classesAttended,
      totalSessionsHeld,
      attendancePct,
      totalPoints,
      avgPointsPerClass,
    };
  }

  public getClassOverviewStats(classId: string) {
    const activeStudents = this.getStudents(classId, false);
    const completedSessions = this.store.sessions.filter(
      (s) => s.class_id === classId && s.status === 'completed'
    );

    const totalStudentsCount = activeStudents.length;
    const classesHeldCount = completedSessions.length;

    // OverviewTab Class Avg Attendance % (Pooled)
    let totalPresentRecords = 0;
    const totalPossibleSlots = totalStudentsCount * classesHeldCount;

    if (totalPossibleSlots > 0) {
      const activeStudentIds = new Set(activeStudents.map((s) => s.id));
      const completedSessionIds = new Set(completedSessions.map((s) => s.id));

      totalPresentRecords = this.store.attendance.filter(
        (a) =>
          a.status === 'present' &&
          activeStudentIds.has(a.student_id) &&
          completedSessionIds.has(a.session_id)
      ).length;
    }

    const pooledAvgAttendancePct =
      totalPossibleSlots > 0 ? (totalPresentRecords / totalPossibleSlots) * 100 : 0;

    const totalHistoricalPoints = this.store.scoreEvents
      .filter((se) => {
        const student = this.store.students.find((s) => s.id === se.student_id);
        return student && student.class_id === classId;
      })
      .reduce((sum, se) => sum + se.points, 0);

    return {
      totalStudentsCount,
      classesHeldCount,
      pooledAvgAttendancePct,
      totalHistoricalPoints,
    };
  }
}

export const mockDb = new MockDatabase();
