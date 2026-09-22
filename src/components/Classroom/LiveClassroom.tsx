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
  Search,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScoreAnimationOverlay } from './ScoreAnimation';
import { AddLateStudentModal } from './AddLateStudentModal';
import { CustomScoreModal } from './CustomScoreModal';
import { RewardWheelModal } from './RewardWheelModal';

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
  const [showWheelModal, setShowWheelModal] = useState<boolean>(false);
  const [customScoreStudent, setCustomScoreStudent] = useState<Student | null>(null);
  const [bubbles, setBubbles] = useState<ScoreAnimationBubble[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredPresentStudents = presentStudents.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Compute net score for each student in THIS session (allows negative display)
  const getStudentScore = (studentId: string): number => {
    return scoreEvents
      .filter((se) => se.student_id === studentId)
      .reduce((acc, se) => acc + se.points, 0);
  };

  const getGridColsClass = (count: number) => {
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl';
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-6xl';
    if (count <= 16) return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 max-w-7xl';
    return 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 max-w-full';
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
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-indigo-100">
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

        {/* SEARCH BAR & CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {presentStudents.length > 0 && (
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-950 font-bold placeholder-indigo-300 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowWheelModal(true)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-extrabold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/30 tactile-btn cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-indigo-950" />
            <span>REWARD WHEEL 🎡</span>
          </button>

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
        ) : filteredPresentStudents.length === 0 ? (
          <div className="text-center py-12 text-indigo-400 font-bold">
            No students found matching "{searchQuery}".
          </div>
        ) : (
          <div className={`w-full mx-auto grid ${getGridColsClass(filteredPresentStudents.length)} gap-4 sm:gap-6`}>
            {filteredPresentStudents.map((student) => {
              const score = getStudentScore(student.id);
              const studentBubbles = bubbles.filter((b) => b.studentId === student.id);
              const studentScoreEvents = scoreEvents.filter((se) => se.student_id === student.id);
              const hasEvents = studentScoreEvents.length > 0;

              return (
                <div
                  key={student.id}
                  className="bg-white border-2 border-indigo-100/90 hover:border-amber-400 rounded-3xl p-4 sm:p-5 flex flex-col justify-between items-center text-center relative overflow-hidden transition-all card-shadow card-hover-shadow group"
                >
                  {/* Floating Animation Bubble Overlay */}
                  <ScoreAnimationOverlay bubbles={studentBubbles} />

                  {/* Student Photo Avatar or Initial */}
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-amber-300 shadow-sm mb-1.5 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-100 border-4 border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-xl mb-1.5 group-hover:scale-105 transition-transform">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Student Name */}
                  <div className="w-full mb-1">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-950 tracking-tight truncate">
                      {student.name}
                    </h2>
                  </div>

                  {/* Score Display with Golden Star Icon & Negative Score Support */}
                  <div className="my-1 relative flex flex-col items-center justify-center">
                    <div
                      className={`flex items-center justify-center gap-1 text-4xl sm:text-5xl font-extrabold score-number-glow tracking-tight transition-transform duration-200 group-hover:scale-105 ${
                        score < 0 ? 'text-rose-500' : 'text-amber-500'
                      }`}
                    >
                      <Star className={`w-8 h-8 sm:w-10 sm:h-10 fill-amber-400 text-amber-500 drop-shadow-sm ${score < 0 ? 'opacity-40' : ''}`} />
                      <span>{score}</span>
                    </div>
                    <div className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-400 mt-0.5">
                      SESSION SCORE
                    </div>
                  </div>

                  {/* Score Controls */}
                  <div className="w-full mt-3 pt-3 border-t-2 border-indigo-50 space-y-2">
                    {/* Primary Buttons: -5 -1 +1 +5 */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, -5)}
                        className="py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-500 text-rose-600 active:text-white border border-rose-200 font-extrabold rounded-xl text-xs transition-all tactile-btn cursor-pointer"
                        title="Deduct 5 points"
                      >
                        −5
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, -1)}
                        className="py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-500 text-rose-600 active:text-white border border-rose-200 font-extrabold rounded-xl text-xs transition-all tactile-btn cursor-pointer flex items-center justify-center"
                        title="Deduct 1 point"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, 1)}
                        className="py-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-500 text-amber-700 active:text-white border border-amber-200 font-extrabold rounded-xl text-xs transition-all tactile-btn cursor-pointer flex items-center justify-center"
                        title="Add 1 point"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModifyScore(student.id, 5)}
                        className="py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-500 text-emerald-700 active:text-white border border-emerald-200 font-extrabold rounded-xl text-xs transition-all tactile-btn cursor-pointer"
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
                        className="flex-1 py-1 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" /> Custom
                      </button>

                      {hasEvents && (
                        <button
                          type="button"
                          onClick={() => handleUndoScore(student.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Undo last score adjustment for this student"
                        >
                          <Undo2 className="w-3 h-3" /> Undo
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

      {showWheelModal && (
        <RewardWheelModal
          classId={currentClass.id}
          className={currentClass.name}
          onClose={() => setShowWheelModal(false)}
        />
      )}
    </div>
  );
};
