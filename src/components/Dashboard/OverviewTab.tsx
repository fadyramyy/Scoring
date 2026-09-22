import React, { useState, useEffect } from 'react';
import { Class } from '../../types';
import { dataService } from '../../lib/dataService';
import { mockDb } from '../../lib/mockDatabase';
import { isDemoMode } from '../../lib/supabase';
import { Users, Calendar, Percent, Award, Star } from 'lucide-react';

interface OverviewTabProps {
  currentClass: Class;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ currentClass }) => {
  const [stats, setStats] = useState({
    totalStudentsCount: 0,
    classesHeldCount: 0,
    pooledAvgAttendancePct: 0,
    totalHistoricalPoints: 0,
  });

  const loadStats = async () => {
    if (isDemoMode) {
      setStats(mockDb.getClassOverviewStats(currentClass.id));
      return;
    }

    const activeStudents = await dataService.getStudents(currentClass.id, false);
    const sessions = await dataService.getSessions(currentClass.id);
    const completedSessions = sessions.filter((s) => s.status === 'completed');
    const allAttendance = await dataService.getAttendanceForClass(currentClass.id);
    const allScoreEvents = await dataService.getScoreEventsForClass(currentClass.id);

    const totalStudentsCount = activeStudents.length;
    const classesHeldCount = completedSessions.length;

    let totalPresentRecords = 0;
    const totalPossibleSlots = totalStudentsCount * classesHeldCount;

    if (totalPossibleSlots > 0) {
      const activeStudentIds = new Set(activeStudents.map((s) => s.id));
      const completedSessionIds = new Set(completedSessions.map((s) => s.id));

      totalPresentRecords = allAttendance.filter(
        (a) =>
          a.status === 'present' &&
          activeStudentIds.has(a.student_id) &&
          completedSessionIds.has(a.session_id)
      ).length;
    }

    const pooledAvgAttendancePct =
      totalPossibleSlots > 0 ? (totalPresentRecords / totalPossibleSlots) * 100 : 0;

    const totalHistoricalPoints = allScoreEvents.reduce((sum, se) => sum + se.points, 0);

    setStats({
      totalStudentsCount,
      classesHeldCount,
      pooledAvgAttendancePct,
      totalHistoricalPoints,
    });
  };

  useEffect(() => {
    loadStats();
  }, [currentClass.id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Active Students */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
              Active Students
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-indigo-950 font-display">
            {stats.totalStudentsCount}
          </div>
          <p className="text-xs font-semibold text-indigo-500 mt-1">Enrolled in {currentClass.name}</p>
        </div>

        {/* Classes Held */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
              Classes Held
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-indigo-950 font-display">
            {stats.classesHeldCount}
          </div>
          <p className="text-xs font-semibold text-indigo-500 mt-1">Completed weekly sessions</p>
        </div>

        {/* Average Attendance % */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
              Avg Attendance Rate
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-emerald-600 font-display">
            {stats.pooledAvgAttendancePct.toFixed(1)}%
          </div>
          <p className="text-xs font-semibold text-indigo-500 mt-1">Pooled active student average</p>
        </div>

        {/* Total Points This Year */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
              Total Points This Year
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-500">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-amber-500 font-display flex items-center gap-1">
            <span>{stats.totalHistoricalPoints}</span>
            <span className="text-2xl text-amber-400">⭐</span>
          </div>
          <p className="text-xs font-semibold text-indigo-500 mt-1">Accumulated across all sessions</p>
        </div>
      </div>
    </div>
  );
};
