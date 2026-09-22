import React, { useState, useEffect } from 'react';
import { Class, Student, ClassSession, Attendance, ScoreEvent } from '../../types';
import { dataService } from '../../lib/dataService';
import { Star, History } from 'lucide-react';

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
      <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 card-shadow">
        <h3 className="text-lg font-extrabold text-indigo-950 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" /> Historical Session Scores
        </h3>

        {completedSessions.length === 0 ? (
          <div className="text-center py-8 text-indigo-400 font-semibold text-sm">
            No completed class sessions recorded yet. Historical weekly scores will populate here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-indigo-950 border-collapse">
              <thead>
                <tr className="bg-[#F6F2FF] text-xs font-extrabold text-indigo-600 uppercase border-b-2 border-indigo-100">
                  <th className="py-3.5 px-4 sticky left-0 bg-[#F6F2FF] border-r-2 border-indigo-100 min-w-[140px]">
                    Student Name
                  </th>
                  {completedSessions.map((sess) => (
                    <th key={sess.id} className="py-3.5 px-4 text-center min-w-[100px]">
                      {new Date(sess.started_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center bg-amber-50/50 min-w-[110px]">
                    Total Points
                  </th>
                  <th className="py-3.5 px-4 text-center bg-indigo-50/50 min-w-[110px]">
                    Avg / Class
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
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
                    <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-indigo-950 sticky left-0 bg-white border-r-2 border-indigo-50">
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
                              <span className="font-extrabold text-amber-500">
                                {sessionScore} ⭐
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic font-semibold">Absent</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-4 text-center font-extrabold text-amber-500 bg-amber-50/30">
                        {totalPoints} ⭐
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-indigo-900 bg-indigo-50/30">
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
