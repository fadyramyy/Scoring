import React, { useState, useEffect } from 'react';
import { Class, Student, Attendance, ScoreEvent, ClassSession } from '../../types';
import { dataService } from '../../lib/dataService';
import { UserPlus, Edit2, Check, X } from 'lucide-react';

interface StudentsTabProps {
  currentClass: Class;
}

interface StudentWithStats {
  student: Student;
  classesAttended: number;
  totalSessionsHeld: number;
  attendancePct: number;
  totalPoints: number;
  avgPointsPerClass: number;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ currentClass }) => {
  const [studentRows, setStudentRows] = useState<StudentWithStats[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshStudents = async () => {
    setLoading(true);
    try {
      const students = await dataService.getStudents(currentClass.id, true);
      const sessions = await dataService.getSessions(currentClass.id);
      const completedSessions = sessions.filter((s) => s.status === 'completed');
      const allAttendance = await dataService.getAttendanceForClass(currentClass.id);
      const allScoreEvents = await dataService.getScoreEventsForClass(currentClass.id);

      const rows: StudentWithStats[] = students.map((student) => {
        const studentAtt = allAttendance.filter((a) => a.student_id === student.id);
        const classesAttended = studentAtt.filter(
          (a) =>
            a.status === 'present' &&
            completedSessions.some((cs) => cs.id === a.session_id)
        ).length;

        const totalSessionsHeld = completedSessions.filter(
          (cs) => new Date(cs.created_at) >= new Date(student.created_at)
        ).length;

        const attendancePct =
          totalSessionsHeld > 0 ? (classesAttended / totalSessionsHeld) * 100 : 0;

        const totalPoints = allScoreEvents
          .filter((se) => se.student_id === student.id)
          .reduce((sum, se) => sum + se.points, 0);

        const avgPointsPerClass =
          classesAttended > 0 ? totalPoints / classesAttended : 0;

        return {
          student,
          classesAttended,
          totalSessionsHeld,
          attendancePct,
          totalPoints,
          avgPointsPerClass,
        };
      });

      setStudentRows(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStudents();
  }, [currentClass.id]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim()) {
      await dataService.createStudent(currentClass.id, newStudentName.trim());
      setNewStudentName('');
      await refreshStudents();
    }
  };

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
  };

  const handleSaveEdit = async (studentId: string) => {
    if (editName.trim()) {
      await dataService.updateStudentName(studentId, editName.trim());
      setEditingId(null);
      await refreshStudents();
    }
  };

  const handleToggleActive = async (student: Student) => {
    await dataService.toggleStudentActive(student.id, student.active);
    await refreshStudents();
  };

  return (
    <div className="space-y-6">
      {/* ADD STUDENT FORM */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-amber-500" /> Add New Student to Roster
        </h3>
        <form onSubmit={handleAddStudent} className="flex gap-3">
          <input
            type="text"
            required
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="Student Name (e.g. Jason)"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            + Add Student
          </button>
        </form>
      </div>

      {/* ROSTER TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4">Class Roster</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Classes Attended</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Total Points</th>
                <th className="py-3 px-4">Avg Points</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {studentRows.map(({ student, classesAttended, totalSessionsHeld, attendancePct, totalPoints, avgPointsPerClass }) => {
                const isEditing = editingId === student.id;

                return (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 bg-slate-800 border border-amber-500 rounded text-white text-sm"
                          />
                          <button
                            onClick={() => handleSaveEdit(student.id)}
                            className="p-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500 hover:text-slate-950"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 bg-slate-700 text-slate-400 rounded hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span>{student.name}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {student.active ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {`${classesAttended} / ${totalSessionsHeld}`}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {`${attendancePct.toFixed(1)}%`}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-amber-400">
                      {totalPoints}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {avgPointsPerClass.toFixed(1)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEdit(student)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                            title="Edit Name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleActive(student)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            student.active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                          title="Deactivating hides student from live scoring without deleting historical data"
                        >
                          {student.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
