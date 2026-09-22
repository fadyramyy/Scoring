import React, { useState, useEffect } from 'react';
import {
  Class,
  ClassSession,
  Student,
  Attendance,
  ScoreEvent,
  ScoreAnimationBubble,
} from '../../types';
import { mockDb } from '../../lib/mockDatabase';
import { isDemoMode, supabase } from '../../lib/supabase';
import { CosmicRocketEmblem } from '../Brand/CosmicEmblem';
import {
  Plus,
  Minus,
  UserPlus,
  SquareCheck,
  Maximize2,
  Minimize2,
  Undo2,
  Sparkles,
  Sliders,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScoreAnimationOverlay } from './ScoreAnimation';
import { AddLateStudentModal } from './AddLateStudentModal';
import { CustomScoreModal } from './CustomScoreModal';

interface LiveClassroomProps {
  currentClass: Class;
  activeSession: ClassSession;
  teacherId: string;
  onEndSession: () => void;
}

export const LiveClassroom: React.FC<LiveClassroomProps> = ({
  currentClass,
  activeSession,
  teacherId,
  onEndSession,
}) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showAddLateModal, setShowAddLateModal] = useState<boolean>(false);
  const [customScoreStudent, setCustomScoreStudent] = useState<Student | null>(null);
  const [bubbles, setBubbles] = useState<ScoreAnimationBubble[]>([]);

  // Load state & subscribe to real-time updates
  const loadData = () => {
    if (isDemoMode) {
      setAllStudents(mockDb.getStudents(currentClass.id, false));
      setAttendanceRecords(mockDb.getSessionAttendance(activeSession.id));
      setScoreEvents(mockDb.getSessionScoreEvents(activeSession.id));
    } else if (supabase) {
      supabase
        .from('students')
        .select('*')
        .eq('class_id', currentClass.id)
        .eq('active', true)
        .then(({ data }) => data && setAllStudents(data));

      supabase
        .from('attendance')
        .select('*')
        .eq('session_id', activeSession.id)
        .then(({ data }) => data && setAttendanceRecords(data));

      supabase
        .from('score_events')
        .select('*')
        .eq('session_id', activeSession.id)
        .then(({ data }) => data && setScoreEvents(data));
    }
  };

  useEffect(() => {
    loadData();

    if (isDemoMode) {
      const unsubscribe = mockDb.subscribe(() => {
        loadData();
      });
      return unsubscribe;
    } else if (supabase) {
      const client = supabase;
      const channel = client
        .channel(`session_${activeSession.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'score_events',
            filter: `session_id=eq.${activeSession.id}`,
          },
          () => loadData()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance',
            filter: `session_id=eq.${activeSession.id}`,
          },
          () => loadData()
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [currentClass.id, activeSession.id]);

  // Determine present students for THIS session
  const presentStudentIds = new Set(
    attendanceRecords.filter((a) => a.status === 'present').map((a) => a.student_id)
  );

  const presentStudents = allStudents.filter((s) => presentStudentIds.has(s.id));
  const unmarkedStudents = allStudents.filter((s) => !presentStudentIds.has(s.id));

  // Compute 0-floored score for each student in THIS session
  const getStudentScore = (studentId: string): number => {
    const sum = scoreEvents
      .filter((se) => se.student_id === studentId)
      .reduce((acc, se) => acc + se.points, 0);
    return Math.max(0, sum);
  };

  // Score action handler
  const handleModifyScore = (studentId: string, points: number) => {
    // Add floating animation bubble
    const bubbleId = Math.random().toString();
    const label = points > 0 ? `+${points} ⭐` : `${points}`;
    setBubbles((prev) => [...prev, { id: bubbleId, studentId, points, label }]);

    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
    }, 1000);

    // Trigger confetti on big score gains (+5 or custom >= 5)
    if (points >= 5) {
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#F59E0B', '#FBBF24', '#6366F1', '#10B981'],
      });
    }

    if (isDemoMode) {
      mockDb.addScoreEvent(activeSession.id, studentId, teacherId, points);
    } else if (supabase) {
      supabase.from('score_events').insert({
        session_id: activeSession.id,
        student_id: studentId,
        teacher_id: teacherId,
        points: points,
      }).then(() => loadData());
    }
  };

  // Undo action handler (Per-student inverse score event)
  const handleUndoScore = (studentId: string) => {
    if (isDemoMode) {
      mockDb.undoLastStudentScoreEvent(activeSession.id, studentId, teacherId);
    } else if (supabase) {
      const studentEvents = scoreEvents
        .filter((se) => se.student_id === studentId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (studentEvents.length > 0) {
        const latest = studentEvents[0];
        const client = supabase;
        client.from('score_events').insert({
          session_id: activeSession.id,
          student_id: studentId,
          teacher_id: teacherId,
          points: -latest.points,
        }).then(() => loadData());
      }
    }
  };

  // Mark late arrival
  const handleMarkArrival = (studentId: string) => {
    if (isDemoMode) {
      mockDb.markStudentPresent(activeSession.id, studentId);
    } else if (supabase) {
      supabase.from('attendance').upsert({
        session_id: activeSession.id,
        student_id: studentId,
        status: 'present',
        arrived_at: new Date().toISOString(),
      }).then(() => loadData());
    }
    setShowAddLateModal(false);
  };

  // Create new roster student and mark arrival
  const handleCreateAndMarkArrival = (newStudentName: string) => {
    if (isDemoMode) {
      const newStu = mockDb.createStudent(currentClass.id, newStudentName);
      mockDb.markStudentPresent(activeSession.id, newStu.id);
    } else if (supabase) {
      const client = supabase;
      client
        .from('students')
        .insert({ class_id: currentClass.id, name: newStudentName, active: true })
        .select()
        .single()
        .then(({ data }) => {
          if (data) {
            client.from('attendance').insert({
              session_id: activeSession.id,
              student_id: data.id,
              status: 'present',
              arrived_at: new Date().toISOString(),
            }).then(() => loadData());
          }
        });
    }
    setShowAddLateModal(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF8FF] text-indigo-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* CLASSROOM HEADER BAR */}
      <header className="flex items-center justify-between pb-6 border-b-2 border-indigo-100">
        <div className="flex items-center gap-3.5">
          <div className="p-1 bg-white rounded-2xl shadow-sm border border-indigo-100">
            <CosmicRocketEmblem className="w-11 h-11" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-indigo-950 font-display">
              {currentClass.name.toUpperCase()}
            </h1>
            <p className="text-xs sm:text-sm font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Live Classroom Session
            </p>
          </div>
        </div>

        {/* TEACHER CONTROLS HEADER BAR */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowAddLateModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20 tactile-btn cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ADD STUDENT</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-2xl border-2 border-indigo-100 transition-colors cursor-pointer shadow-sm"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onEndSession}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 tactile-btn cursor-pointer"
          >
            <SquareCheck className="w-4 h-4" />
            <span>END CLASS</span>
          </button>
        </div>
      </header>

      {/* LIVE STUDENT GRID */}
      <main className="flex-1 py-8 flex items-center justify-center">
        {presentStudents.length === 0 ? (
          <div className="text-center py-16 px-8 max-w-md bg-white border-2 border-indigo-100 rounded-3xl card-shadow">
            <div className="text-5xl mb-3">🚀</div>
            <h3 className="text-2xl font-extrabold text-indigo-950 mb-2">No Students Marked Present</h3>
            <p className="text-indigo-600 text-sm font-semibold mb-6 leading-relaxed">
              Click <strong>+ ADD STUDENT</strong> above to mark present children as they arrive for today's class!
            </p>
            <button
              onClick={() => setShowAddLateModal(true)}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-500/20 tactile-btn cursor-pointer"
            >
              + Add Present Student
            </button>
          </div>
        ) : (
          <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {presentStudents.map((student) => {
              const score = getStudentScore(student.id);
              const studentBubbles = bubbles.filter((b) => b.studentId === student.id);
              const studentScoreEvents = scoreEvents.filter((se) => se.student_id === student.id);
              const hasEvents = studentScoreEvents.length > 0;

              return (
                <div
                  key={student.id}
                  className="bg-white border-2 border-indigo-100/90 hover:border-amber-400 rounded-3xl p-5 sm:p-6 flex flex-col justify-between items-center text-center relative overflow-hidden transition-all card-shadow card-hover-shadow group"
                >
                  {/* Floating Animation Bubble Overlay */}
                  <ScoreAnimationOverlay bubbles={studentBubbles} />

                  {/* Student Name */}
                  <div className="w-full mb-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight truncate">
                      {student.name}
                    </h2>
                  </div>

                  {/* Score Display with Golden Star Icon */}
                  <div className="my-2 relative flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1 text-5xl sm:text-6xl font-extrabold text-amber-500 score-number-glow tracking-tight transition-transform duration-200 group-hover:scale-105">
                      <Star className="w-10 h-10 sm:w-12 sm:h-12 fill-amber-400 text-amber-500 drop-shadow-sm" />
                      <span>{score}</span>
                    </div>
                    <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400 mt-1">
                      THIS CLASS SESSION
                    </div>
                  </div>

                  {/* Score Controls */}
                  <div className="w-full mt-4 pt-4 border-t-2 border-indigo-50 space-y-2">
                    {/* Primary Buttons: -5 -1 +1 +5 */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, -5)}
                        className="py-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-500 text-rose-600 active:text-white border border-rose-200 font-extrabold rounded-xl text-xs sm:text-sm transition-all tactile-btn cursor-pointer"
                        title="Deduct 5 points"
                      >
                        −5
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, -1)}
                        className="py-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-500 text-rose-600 active:text-white border border-rose-200 font-extrabold rounded-xl text-xs sm:text-sm transition-all tactile-btn cursor-pointer flex items-center justify-center"
                        title="Deduct 1 point"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, 1)}
                        className="py-2.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-500 text-amber-700 active:text-white border border-amber-200 font-extrabold rounded-xl text-xs sm:text-sm transition-all tactile-btn cursor-pointer flex items-center justify-center"
                        title="Add 1 point"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, 5)}
                        className="py-2.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-500 text-emerald-700 active:text-white border border-emerald-200 font-extrabold rounded-xl text-xs sm:text-sm transition-all tactile-btn cursor-pointer"
                        title="Add 5 points"
                      >
                        +5
                      </button>
                    </div>

                    {/* Secondary Actions: Custom & Undo */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setCustomScoreStudent(student)}
                        className="flex-1 py-1.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Custom
                      </button>

                      {hasEvents && (
                        <button
                          type="button"
                          onClick={() => handleUndoScore(student.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Undo last score adjustment for this student"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Undo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="pt-4 border-t-2 border-indigo-100 text-center text-xs font-bold text-indigo-400 flex items-center justify-between">
        <div>
          Classroom Session: <code className="text-indigo-700 font-semibold">{activeSession.id.slice(0, 8)}</code>
        </div>
        <div>
          Present: <strong className="text-amber-600 font-extrabold">{presentStudents.length}</strong> / {allStudents.length} Children
        </div>
      </footer>

      {/* MODALS */}
      {showAddLateModal && (
        <AddLateStudentModal
          unmarkedStudents={unmarkedStudents}
          onMarkArrival={handleMarkArrival}
          onCreateAndMarkArrival={handleCreateAndMarkArrival}
          onClose={() => setShowAddLateModal(false)}
        />
      )}

      {customScoreStudent && (
        <CustomScoreModal
          studentName={customScoreStudent.name}
          onSubmit={(pts) => {
            handleModifyScore(customScoreStudent.id, pts);
            setCustomScoreStudent(null);
          }}
          onClose={() => setCustomScoreStudent(null)}
        />
      )}
    </div>
  );
};
