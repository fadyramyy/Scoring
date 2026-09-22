import React, { useState, useEffect } from 'react';
import { Profile, Class, ClassSession, Student } from './types';
import { mockDb } from './lib/mockDatabase';
import { isDemoMode, supabase } from './lib/supabase';
import { dataService } from './lib/dataService';
import { CosmicRocketEmblem } from './components/Brand/CosmicEmblem';
import { LoginModal } from './components/Auth/LoginModal';
import { StartSessionModal } from './components/Classroom/StartSessionModal';
import { LiveClassroom } from './components/Classroom/LiveClassroom';
import { TeacherDashboard } from './components/Dashboard/TeacherDashboard';
import {
  LogOut,
  ChevronDown,
  Monitor,
  LayoutDashboard,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentTeacher, setCurrentTeacher] = useState<Profile | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [activeStudentsInClass, setActiveStudentsInClass] = useState<Student[]>([]);
  const [viewMode, setViewMode] = useState<'dashboard' | 'live'>('dashboard');

  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [joinClassName, setJoinClassName] = useState('');
  const [assigningClass, setAssigningClass] = useState(false);

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
    <div className="min-h-screen bg-[#FCF8FF] text-indigo-950 flex flex-col font-sans">
      {/* GLOBAL APPLICATION TOP HEADER BAR */}
      <header className="bg-white/90 border-b-2 border-indigo-100 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between card-shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <CosmicRocketEmblem className="w-9 h-9" />
            <span className="font-extrabold text-indigo-950 text-xl font-display hidden sm:inline tracking-tight">
              Light Quest
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
                className="bg-[#F6F2FF] border-2 border-indigo-100 hover:border-indigo-400 text-indigo-900 font-extrabold text-xs sm:text-sm rounded-2xl px-3.5 py-2 pr-8 appearance-none focus:outline-none cursor-pointer transition-colors"
              >
                {teacherClasses.map((cls) => (
                  <option key={cls.id} value={cls.id} className="bg-white text-indigo-950 font-bold">
                    🏫 {cls.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-indigo-500 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          )}
        </div>

        {/* TOP RIGHT VIEW SWITCHER & USER INFO */}
        <div className="flex items-center gap-2 sm:gap-4">
          {activeSession && (
            <div className="flex items-center bg-[#F6F2FF] p-1 rounded-2xl border-2 border-indigo-100">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-600 hover:text-indigo-950'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </button>

              <button
                onClick={() => setViewMode('live')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'live'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-600 hover:text-indigo-950'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Live Screen
              </button>
            </div>
          )}

          <div className="h-6 w-[2px] bg-indigo-100 hidden sm:block" />

          <button
            onClick={handleSignOut}
            className="p-2 text-indigo-400 hover:text-rose-600 rounded-2xl hover:bg-indigo-50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN VIEW SWITCHER */}
      <div className="flex-1">
        {!selectedClass ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl text-center card-shadow selection:bg-amber-400">
            <div className="w-14 h-14 bg-white rounded-3xl border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
              🏫
            </div>
            <h2 className="text-2xl font-extrabold text-indigo-950 mb-2">No Class Linked Yet</h2>
            <p className="text-xs sm:text-sm font-semibold text-indigo-600 mb-6 leading-relaxed">
              Enter your class name below to join your team's class or create a new one.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!joinClassName.trim() || !currentTeacher) return;
                setAssigningClass(true);
                try {
                  await dataService.assignClassToTeacher(currentTeacher.id, joinClassName.trim());
                  await refreshState();
                } catch (err: any) {
                  alert(err.message || 'Failed to assign class.');
                } finally {
                  setAssigningClass(false);
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                required
                value={joinClassName}
                onChange={(e) => setJoinClassName(e.target.value)}
                placeholder="e.g. Samuel Class"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-950 font-bold placeholder-indigo-300 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
              />
              <button
                type="submit"
                disabled={assigningClass}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all tactile-btn cursor-pointer"
              >
                {assigningClass ? 'Linking Class...' : 'Join / Create Class'}
              </button>
            </form>
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
    </div>
  );
};
