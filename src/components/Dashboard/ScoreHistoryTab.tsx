import React, { useState, useEffect } from 'react';
import { Class, Student, ClassSession, Attendance, ScoreEvent } from '../../types';
import { dataService } from '../../lib/dataService';
import { History } from 'lucide-react';

interface ScoreHistoryTabProps {
  currentClass: Class;
}

export const ScoreHistoryTab: React.FC<ScoreHistoryTabProps> = ({ currentClass }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [completedSessions, setCompletedSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);

  const loadData = async () => {
    const stus = await dataService.getStudents(currentClass.id, true);
    const sess = await dataService.getSessions(currentClass.id);
    const completed = sess.filter((s) => s.status === 'completed');
    const atts = await dataService.getAttendanceForClass(currentClass.id);
    const events = await dataService.getScoreEventsForClass(currentClass.id);

    setStudents(stus);
    setCompletedSessions(completed);
    setAttendanceRecords(atts);
    setScoreEvents(events);
  };

  useEffect(() => {
    loadData();
  }, [currentClass.id]);

  const getStudentSessionScore = (sessionId: string, studentId: string): number => {
    const rawSum = scoreEvents
      .filter((se) => se.session_id === sessionId && se.student_id === studentId)
      .reduce((sum, se) => sum + se.points, 0);
    return Math.max(0, rawSum);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500" /> Historical Session Scores
        </h3>

        {completedSessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No completed class sessions recorded yet. Historical weekly scores will populate here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-xs font-bold text-slate-400 uppercase border-b border-slate-700">
                  <th className="py-3 px-4 sticky left-0 bg-slate-800 border-r border-slate-700 min-w-[140px]">
                    Student Name
                  </th>
                  {completedSessions.map((sess) => (
                    <th key={sess.id} className="py-3 px-4 text-center min-w-[100px]">
                      {new Date(sess.started_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center bg-slate-800/50 min-w-[110px]">
                    Total Points
                  </th>
                  <th className="py-3 px-4 text-center bg-slate-800/50 min-w-[110px]">
                    Avg / Class
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map((student) => {
                  const studentEvents = scoreEvents.filter((se) => se.student_id === student.id);
                  const totalPoints = studentEvents.reduce((sum, se) => sum + se.points, 0);

                  const studentAtts = attendanceRecords.filter((a) => a.student_id === student.id);
                  const classesAttended = studentAtts.filter(
                    (a) =>
                      a.status === 'present' &&
                      completedSessions.some((cs) => cs.id === a.session_id)
                  ).length;

                  const avgPointsPerClass = classesAttended > 0 ? totalPoints / classesAttended : 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white sticky left-0 bg-slate-900 border-r border-slate-800">
                        {student.name}
                      </td>

                      {completedSessions.map((sess) => {
                        const sessionScore = getStudentSessionScore(sess.id, student.id);
                        const attendance = attendanceRecords.find(
                          (a) => a.session_id === sess.id && a.student_id === student.id
                        );

                        const wasPresent = attendance && attendance.status === 'present';

                        return (
                          <td key={sess.id} className="py-3.5 px-4 text-center">
                            {wasPresent ? (
                              <span className="font-extrabold text-amber-400">
                                {sessionScore}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs italic">Absent</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-4 text-center font-black text-amber-400 bg-slate-800/20">
                        {totalPoints}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-200 bg-slate-800/20">
                        {avgPointsPerClass.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
