import React, { useState } from 'react';
import { Student } from '../../types';
import { UserPlus, UserCheck, PlusCircle } from 'lucide-react';

interface AddLateStudentModalProps {
  unmarkedStudents: Student[];
  onMarkArrival: (studentId: string) => void;
  onCreateAndMarkArrival: (newStudentName: string) => void;
  onClose: () => void;
}

export const AddLateStudentModal: React.FC<AddLateStudentModalProps> = ({
  unmarkedStudents,
  onMarkArrival,
  onCreateAndMarkArrival,
  onClose,
}) => {
  const [showNewRosterForm, setShowNewRosterForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim()) {
      onCreateAndMarkArrival(newStudentName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4 selection:bg-amber-400">
      <div className="w-full max-w-md bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl p-6 card-shadow relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-indigo-100">
          <h3 className="text-xl font-extrabold text-indigo-950 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" /> Mark Student Arrival
          </h3>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-950 p-1.5 rounded-xl hover:bg-white font-bold"
          >
            ✕
          </button>
        </div>

        {!showNewRosterForm ? (
          <>
            <p className="text-xs font-semibold text-indigo-600 mb-4">
              Select an absent student who just arrived, or add a new child to the roster.
            </p>

            {unmarkedStudents.length === 0 ? (
              <div className="p-4 bg-white border border-indigo-100 rounded-2xl text-center text-indigo-500 font-semibold text-sm mb-4">
                All roster students are currently marked present for this class session.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
                {unmarkedStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => onMarkArrival(student.id)}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-left transition-all cursor-pointer group shadow-sm"
                  >
                    <span className="font-extrabold text-indigo-950 group-hover:text-indigo-600">
                      {student.name}
                    </span>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Mark Present (0 pts)
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowNewRosterForm(true)}
              className="w-full py-3.5 bg-white hover:bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-indigo-600 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Add New Student to Roster
            </button>
          </>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-indigo-600">
              Enter the name of a new child joining the class roster:
            </p>

            <div>
              <input
                type="text"
                required
                autoFocus
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Child's Full Name (e.g. John)"
                className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-950 placeholder-indigo-300 font-bold focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewRosterForm(false)}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
              >
                Save & Mark Present
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
