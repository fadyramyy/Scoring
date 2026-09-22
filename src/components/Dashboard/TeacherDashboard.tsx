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
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            {currentClass.name} Dashboard
          </h2>
          <p className="text-xs sm:text-sm font-medium text-indigo-200 mt-1">
            Teacher: <strong className="text-white">{teacher.name}</strong> ({teacher.email})
          </p>
        </div>

        {hasActiveSession ? (
          <button
            type="button"
            onClick={onOpenLiveClassroom}
            className="px-6 py-4 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-extrabold rounded-2xl shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2.5 text-base transition-all tactile-btn cursor-pointer animate-pulse shrink-0 relative z-10"
          >
            <Play className="w-5 h-5 fill-indigo-950" /> RESUME LIVE CLASSROOM
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenStartSessionModal}
            className="px-6 py-4 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-extrabold rounded-2xl shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2.5 text-base transition-all tactile-btn cursor-pointer shrink-0 relative z-10"
          >
            <Play className="w-5 h-5 fill-indigo-950" /> START NEW CLASS SESSION
          </button>
        )}
      </div>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex border-b-2 border-indigo-100 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-white text-indigo-600 border-t-4 border-indigo-600 shadow-sm'
              : 'text-indigo-900/60 hover:text-indigo-950 hover:bg-white/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Overview
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-white text-indigo-600 border-t-4 border-indigo-600 shadow-sm'
              : 'text-indigo-900/60 hover:text-indigo-950 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4" /> Students
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-white text-indigo-600 border-t-4 border-indigo-600 shadow-sm'
              : 'text-indigo-900/60 hover:text-indigo-950 hover:bg-white/60'
          }`}
        >
          <CalendarCheck className="w-4 h-4" /> Attendance
        </button>

        <button
          onClick={() => setActiveTab('scores')}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm rounded-t-2xl transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'scores'
              ? 'bg-white text-indigo-600 border-t-4 border-indigo-600 shadow-sm'
              : 'text-indigo-900/60 hover:text-indigo-950 hover:bg-white/60'
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
