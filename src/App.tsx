import React, { useState, useEffect } from 'react';
import { Profile, Class, ClassSession, Student } from './types';
import { mockDb } from './lib/mockDatabase';
import { isDemoMode, supabase } from './lib/supabase';
import { dataService } from './lib/dataService';
import { LoginModal } from './components/Auth/LoginModal';
import { StartSessionModal } from './components/Classroom/StartSessionModal';
import { LiveClassroom } from './components/Classroom/LiveClassroom';
import { TeacherDashboard } from './components/Dashboard/TeacherDashboard';
import { AcceptanceTestSimulator } from './components/Simulator/AcceptanceTestSimulator';
import {
  LogOut,
  ChevronDown,
  Monitor,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentTeacher, setCurrentTeacher] = useState<Profile | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [activeStudentsInClass, setActiveStudentsInClass] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<'dashboard' | 'live'>('dashboard');

  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Restore authenticated session on mount (Supabase Auth)
  useEffect(() => {
    if (!isDemoMode && supabase) {
      dataService.getCurrentSessionProfile().then((profile) => {
        if (profile) setCurrentTeacher(profile);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await dataService.getCurrentSessionProfile();
          setCurrentTeacher(profile);
        } else {
          setCurrentTeacher(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Load teacher classes and active session whenever currentTeacher or selectedClass changes
  const refreshState = async () => {
    if (!currentTeacher) return;

    const classes = await dataService.getTeacherClasses(currentTeacher.id);
    setTeacherClasses(classes);

    let activeCls = selectedClass;
    if (!activeCls || !classes.some((c) => c.id === activeCls?.id)) {
      if (classes.length > 0) {
        activeCls = classes[0];
        setSelectedClass(classes[0]);
      } else {
        setSelectedClass(null);
        setActiveSession(null);
        setActiveStudentsInClass([]);
        return;
      }
    }

    if (activeCls) {
      const active = await dataService.getActiveSession(activeCls.id);
      setActiveSession(active);

      const stus = await dataService.getStudents(activeCls.id, false);
      setActiveStudentsInClass(stus);
    }
  };

  const fetchActiveSession = async (classId: string) => {
    const active = await dataService.getActiveSession(classId);
    setActiveSession(active);
    const stus = await dataService.getStudents(classId, false);
    setActiveStudentsInClass(stus);
  };

  useEffect(() => {
    refreshState();
    if (isDemoMode) {
      return mockDb.subscribe(() => {
        refreshState();
      });
    }
  }, [currentTeacher?.id, selectedClass?.id]);

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
    fetchActiveSession(cls.id);
  };

  const handleStartSession = async (presentStudentIds: string[]) => {
    if (!selectedClass) return;

    const sessionId = await dataService.startNewSession(selectedClass.id, presentStudentIds);
    await fetchActiveSession(selectedClass.id);
    setViewMode('live');
    setShowStartModal(false);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    await dataService.endClassSession(activeSession.id);
    setActiveSession(null);
    setViewMode('dashboard');
  };

  const handleSignOut = async () => {
    await dataService.signOut();
    setCurrentTeacher(null);
    setSelectedClass(null);
    setActiveSession(null);
    setActiveStudentsInClass([]);
  };

  if (!currentTeacher) {
    return <LoginModal onLogin={(t) => setCurrentTeacher(t)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* GLOBAL APPLICATION TOP HEADER BAR */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 text-lg">
              ⭐
            </div>
            <span className="font-extrabold text-white text-lg font-display hidden sm:inline">
              Classroom Scoring
            </span>
          </div>

          {/* CLASS SELECTOR DROPDOWN */}
          {teacherClasses.length > 0 && selectedClass && (
            <div className="relative inline-block text-left">
              <select
                value={selectedClass.id}
                onChange={(e) => {
                  const match = teacherClasses.find((c) => c.id === e.target.value);
                  if (match) handleClassSelect(match);
                }}
                className="bg-slate-800 border border-slate-700 hover:border-amber-500 text-amber-300 font-bold text-xs sm:text-sm rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none cursor-pointer transition-colors"
              >
                {teacherClasses.map((cls) => (
                  <option key={cls.id} value={cls.id} className="bg-slate-900 text-white">
                    🏫 {cls.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}
        </div>

        {/* TOP RIGHT VIEW SWITCHER & USER INFO */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isDemoMode && (
            <button
              onClick={() => setShowSimulator(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Run automated prompt acceptance test verification"
            >
              <ShieldCheck className="w-4 h-4" /> Acceptance Tester
            </button>
          )}

          {activeSession && (
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'dashboard'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </button>

              <button
                onClick={() => setViewMode('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'live'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Live Screen
              </button>
            </div>
          )}

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN VIEW SWITCHER */}
      <div className="flex-1">
        {!selectedClass ? (
          <div className="text-center py-20 text-slate-400">
            No class assigned to your teacher account.
          </div>
        ) : viewMode === 'live' && activeSession ? (
          <LiveClassroom
            currentClass={selectedClass}
            activeSession={activeSession}
            teacherId={currentTeacher.id}
            onEndSession={handleEndSession}
          />
        ) : (
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
            <TeacherDashboard
              currentClass={selectedClass}
              teacher={currentTeacher}
              onOpenStartSessionModal={() => setShowStartModal(true)}
              onOpenLiveClassroom={() => setViewMode('live')}
              hasActiveSession={!!activeSession}
            />
          </main>
        )}
      </div>

      {/* MODALS */}
      {showStartModal && selectedClass && (
        <StartSessionModal
          className={selectedClass.name}
          students={activeStudentsInClass}
          activeSession={activeSession}
          onStartSession={handleStartSession}
          onClose={() => setShowStartModal(false)}
        />
      )}

      {showSimulator && (
        <AcceptanceTestSimulator
          onClose={() => setShowSimulator(false)}
          onRefreshParentState={refreshState}
        />
      )}
    </div>
  );
};
