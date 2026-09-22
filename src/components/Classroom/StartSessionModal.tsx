import React, { useState } from 'react';
import { Student, ClassSession } from '../../types';
import { CheckSquare, Square, Play, Users, AlertCircle } from 'lucide-react';
import { StaleSessionConfirmModal } from './StaleSessionConfirmModal';

interface StartSessionModalProps {
  className: string;
  students: Student[];
  activeSession: ClassSession | null;
  onStartSession: (presentStudentIds: string[]) => void;
  onClose: () => void;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  className,
  students,
  activeSession,
  onStartSession,
  onClose,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(students.map((s) => s.id))
  );
  const [showConfirmStale, setShowConfirmStale] = useState(false);

  const toggleStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const handleStartClick = () => {
    if (activeSession) {
      setShowConfirmStale(true);
    } else {
      onStartSession(Array.from(selectedIds));
    }
  };

  const handleConfirmedStale = () => {
    setShowConfirmStale(false);
    onStartSession(Array.from(selectedIds));
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                {className}
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-500" /> WHO IS HERE TODAY?
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No active students found in this class. Please add students from the Teacher Dashboard first.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 px-1 text-xs text-slate-400 font-semibold">
                <span>Select children currently present:</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  {selectedIds.size === students.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 mb-6">
                {students.map((student) => {
                  const isChecked = selectedIds.has(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-sm'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold text-base text-slate-100">
                        {student.name}
                      </span>
                      <div className="text-amber-400">
                        {isChecked ? (
                          <CheckSquare className="w-6 h-6 fill-amber-500/20" />
                        ) : (
                          <Square className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs mb-6 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <span>
                  Every student will start this new class session at <strong>0 points</strong>. Children arriving late can be added anytime after class starts.
                </span>
              </div>

              <button
                type="button"
                onClick={handleStartClick}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer active:scale-[0.99]"
              >
                <Play className="w-5 h-5 fill-slate-950" /> START CLASS SESSION
              </button>
            </>
          )}
        </div>
      </div>

      {showConfirmStale && activeSession && (
        <StaleSessionConfirmModal
          staleSession={activeSession}
          className={className}
          onConfirm={handleConfirmedStale}
          onCancel={() => setShowConfirmStale(false)}
        />
      )}
    </>
  );
};
