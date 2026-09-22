import React, { useState } from 'react';
import { Class, Profile } from '../../types';
import { OverviewTab } from './OverviewTab';
import { StudentsTab } from './StudentsTab';
import { AttendanceTab } from './AttendanceTab';
import { ScoreHistoryTab } from './ScoreHistoryTab';
import { LayoutDashboard, Users, CalendarCheck, Award, Play } from 'lucide-react';

interface TeacherDashboardProps {
  currentClass: Class;
  teacher: Profile;
  onOpenStartSessionModal: () => void;
  onOpenLiveClassroom: () => void;
  hasActiveSession: boolean;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentClass,
  teacher,
  onOpenStartSessionModal,
  onOpenLiveClassroom,
  hasActiveSession,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'attendance' | 'scores'>(
    'overview'
  );

  return (
    <div className="space-y-6">
      {/* ACTION BANNER */}
      <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            {currentClass.name} Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-amber-300 mt-1">
            Logged in as <strong className="text-white">{teacher.name}</strong> ({teacher.email})
          </p>
        </div>

        {hasActiveSession ? (
          <button
            type="button"
            onClick={onOpenLiveClassroom}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer active:scale-95 animate-pulse"
          >
            <Play className="w-5 h-5 fill-slate-950" /> RESUME LIVE CLASSROOM
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenStartSessionModal}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" /> START NEW CLASS SESSION
          </button>
        )}
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Overview
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Users className="w-4 h-4" /> Students
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> Attendance
        </button>

        <button
          onClick={() => setActiveTab('scores')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'scores'
              ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Award className="w-4 h-4" /> Score History
        </button>
      </div>

      {/* TAB CONTENT */}
      <div>
        {activeTab === 'overview' && <OverviewTab currentClass={currentClass} />}
        {activeTab === 'students' && <StudentsTab currentClass={currentClass} />}
        {activeTab === 'attendance' && <AttendanceTab currentClass={currentClass} />}
        {activeTab === 'scores' && <ScoreHistoryTab currentClass={currentClass} />}
      </div>
    </div>
  );
};
