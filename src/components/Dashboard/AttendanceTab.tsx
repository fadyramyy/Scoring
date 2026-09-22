import React, { useState, useEffect } from 'react';
import { Class, Student, ClassSession, Attendance } from '../../types';
import { dataService } from '../../lib/dataService';
import { Check, X, Calendar } from 'lucide-react';

interface AttendanceTabProps {
  currentClass: Class;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ currentClass }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const stus = await dataService.getStudents(currentClass.id, true);
      const sess = await dataService.getSessions(currentClass.id);
      const completedSess = sess.filter((s) => s.status === 'completed');
      const atts = await dataService.getAttendanceForClass(currentClass.id);

      setStudents(stus);
      setSessions(completedSess);
      setAttendanceRecords(atts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentClass.id]);

  return (
    <div className="space-y-6">
      {/* ATTENDANCE MATRIX GRID */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" /> Attendance Matrix Grid
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No completed class sessions recorded yet. Complete a weekly session to view attendance history.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-xs font-bold text-slate-400 uppercase border-b border-slate-700">
                  <th className="py-3 px-4 sticky left-0 bg-slate-800 border-r border-slate-700 min-w-[140px]">
                    Student Name
                  </th>
                  {sessions.map((sess) => (
                    <th key={sess.id} className="py-3 px-4 text-center min-w-[100px]">
                      {new Date(sess.started_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center bg-slate-800/50 min-w-[120px]">
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map((student) => {
                  const studentAtts = attendanceRecords.filter((a) => a.student_id === student.id);
                  const classesAttended = studentAtts.filter(
                    (a) =>
                      a.status === 'present' &&
                      sessions.some((cs) => cs.id === a.session_id)
                  ).length;

                  const totalSessionsHeld = sessions.filter(
                    (cs) => new Date(cs.created_at) >= new Date(student.created_at)
                  ).length;

                  const attendancePct =
                    totalSessionsHeld > 0 ? (classesAttended / totalSessionsHeld) * 100 : 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white sticky left-0 bg-slate-900 border-r border-slate-800">
                        {student.name}
                        {!student.active && (
                          <span className="ml-2 text-[10px] text-slate-500 font-normal">(Inactive)</span>
                        )}
                      </td>

                      {sessions.map((sess) => {
                        const att = attendanceRecords.find(
                          (a) => a.session_id === sess.id && a.student_id === student.id
                        );

                        const isPresent = att && att.status === 'present';
                        const isAbsent = att && att.status === 'absent';

                        return (
                          <td key={sess.id} className="py-3.5 px-4 text-center">
                            {isPresent ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                <Check className="w-4 h-4" />
                              </span>
                            ) : isAbsent ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                                <X className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="text-slate-600 font-bold">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400 bg-slate-800/20">
                        {`${attendancePct.toFixed(1)}%`}
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
