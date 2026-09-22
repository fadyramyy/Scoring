export interface Profile {
  id: string;
  email: string;
  name: string;
  password?: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface TeacherClassMembership {
  id: string;
  teacher_id: string;
  class_id: string;
  created_at?: string;
}

export interface Student {
  id: string;
  class_id: string;
  name: string;
  avatar_url?: string | null;
  active: boolean;
  created_at: string;
}

export type SessionStatus = 'active' | 'completed';

export interface ClassSession {
  id: string;
  class_id: string;
  date: string;
  started_at: string;
  ended_at?: string | null;
  status: SessionStatus;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'absent';

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  arrived_at?: string | null;
  created_at: string;
}

export interface ScoreEvent {
  id: string;
  session_id: string;
  student_id: string;
  teacher_id?: string | null;
  points: number;
  created_at: string;
}

// UI helper interfaces
export interface LiveStudentScore {
  student: Student;
  sessionScore: number;
  attendance: Attendance;
  lastEvent?: ScoreEvent | null;
}

export interface ScoreAnimationBubble {
  id: string;
  studentId: string;
  points: number;
  label: string;
}
