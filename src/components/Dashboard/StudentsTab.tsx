import React, { useState, useEffect, useRef } from 'react';
import { Class, Student } from '../../types';
import { dataService } from '../../lib/dataService';
import { ImportExcelModal } from './ImportExcelModal';
import { UserPlus, Edit2, Check, X, FileSpreadsheet, Camera, User } from 'lucide-react';

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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const StudentsTab: React.FC<StudentsTabProps> = ({ currentClass }) => {
  const [studentRows, setStudentRows] = useState<StudentWithStats[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAvatar, setNewStudentAvatar] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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
      await dataService.createStudent(currentClass.id, newStudentName.trim(), newStudentAvatar);
      setNewStudentName('');
      setNewStudentAvatar(null);
      await refreshStudents();
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        if (isEdit) {
          setEditAvatar(compressed);
        } else {
          setNewStudentAvatar(compressed);
        }
      } catch (err) {
        console.error('Image compression failed', err);
      }
    }
  };

  const handleBatchImport = async (names: string[]) => {
    for (const name of names) {
      await dataService.createStudent(currentClass.id, name);
    }
    await refreshStudents();
  };

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditAvatar(student.avatar_url || null);
  };

  const handleSaveEdit = async (studentId: string) => {
    if (editName.trim()) {
      await dataService.updateStudent(studentId, editName.trim(), editAvatar);
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
      {/* ADD STUDENT & EXCEL IMPORT ACTION BAR */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 card-shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleAddStudent} className="flex-1 flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => handleAvatarFileChange(e, false)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-[#F6F2FF] border-2 border-indigo-100 flex items-center justify-center text-indigo-500 hover:text-indigo-900 transition-colors shrink-0 overflow-hidden cursor-pointer"
            title="Upload Student Photo"
          >
            {newStudentAvatar ? (
              <img src={newStudentAvatar} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>

          <input
            type="text"
            required
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            placeholder="Student Name (e.g. Jason)"
            className="flex-1 px-4 py-3 bg-[#F6F2FF] border-2 border-indigo-100 rounded-2xl text-indigo-950 placeholder-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all tactile-btn cursor-pointer shadow-md shadow-indigo-500/20 whitespace-nowrap"
          >
            + Add Student
          </button>
        </form>

        <div className="h-8 w-[2px] bg-indigo-100 hidden md:block" />

        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-extrabold rounded-2xl text-sm transition-all tactile-btn cursor-pointer shadow-md shadow-amber-400/30 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <FileSpreadsheet className="w-4 h-4" /> Import Excel List (Arabic ➔ English)
        </button>
      </div>

      {/* ROSTER TABLE */}
      <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 card-shadow overflow-hidden">
        <h3 className="text-lg font-extrabold text-indigo-950 mb-4">Class Roster</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-indigo-950">
            <thead className="bg-[#F6F2FF] text-xs uppercase font-extrabold text-indigo-600 border-b-2 border-indigo-100">
              <tr>
                <th className="py-3.5 px-4">Photo</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Classes Attended</th>
                <th className="py-3.5 px-4">Attendance %</th>
                <th className="py-3.5 px-4">Total Points</th>
                <th className="py-3.5 px-4">Avg Points</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {studentRows.map(({ student, classesAttended, totalSessionsHeld, attendancePct, totalPoints, avgPointsPerClass }) => {
                const isEditing = editingId === student.id;

                return (
                  <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="file"
                            ref={editFileInputRef}
                            accept="image/*"
                            onChange={(e) => handleAvatarFileChange(e, true)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-amber-400 flex items-center justify-center overflow-hidden cursor-pointer"
                          >
                            {editAvatar ? (
                              <img src={editAvatar} alt="Edit avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-4 h-4 text-indigo-600" />
                            )}
                          </button>
                        </div>
                      ) : student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold text-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-indigo-950">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 bg-white border-2 border-amber-400 rounded-xl text-indigo-950 text-sm font-bold"
                          />
                          <button
                            onClick={() => handleSaveEdit(student.id)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer"
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
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-500">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-indigo-900">
                      {`${classesAttended} / ${totalSessionsHeld}`}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-emerald-600">
                      {`${attendancePct.toFixed(1)}%`}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-amber-500">
                      {totalPoints} ⭐
                    </td>

                    <td className="py-3.5 px-4 font-bold text-indigo-900">
                      {avgPointsPerClass.toFixed(1)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEdit(student)}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors cursor-pointer"
                            title="Edit Name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleActive(student)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                            student.active
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
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

      {showImportModal && (
        <ImportExcelModal
          onImportStudents={handleBatchImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
};
