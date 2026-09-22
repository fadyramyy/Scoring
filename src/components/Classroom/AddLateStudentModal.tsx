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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" /> Mark Student Arrival
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {!showNewRosterForm ? (
          <>
            <p className="text-xs text-slate-400 mb-4">
              Select an absent student who just arrived, or add a new child to the roster.
            </p>

            {unmarkedStudents.length === 0 ? (
              <div className="p-4 bg-slate-800/60 rounded-2xl text-center text-slate-400 text-sm mb-4">
                All roster students are currently marked present for this class session.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
                {unmarkedStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => onMarkArrival(student.id)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-800/60 hover:bg-amber-500/20 border border-slate-700/60 hover:border-amber-500/50 rounded-2xl text-left transition-all cursor-pointer group"
                  >
                    <span className="font-bold text-slate-100 group-hover:text-amber-300">
                      {student.name}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Mark Present (0 pts)
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowNewRosterForm(true)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-amber-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add New Student to Roster
            </button>
          </>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <p className="text-xs text-slate-400">
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
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewRosterForm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
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
