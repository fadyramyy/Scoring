import React, { useState } from 'react';
import { Student, ClassSession } from '../../types';
import { CheckSquare, Square, Play, Users, AlertCircle } from 'lucide-react';
import { StaleSessionConfirmModal } from './StaleSessionConfirmModal';
import { CosmicRocketEmblem } from '../Brand/CosmicEmblem';

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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4 selection:bg-amber-400">
        <div className="w-full max-w-lg bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl p-6 sm:p-8 card-shadow relative">
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-indigo-100">
            <div className="flex items-center gap-3">
              <CosmicRocketEmblem className="w-10 h-10" />
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                  {className}
                </div>
                <h2 className="text-2xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
                  WHO IS HERE TODAY?
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-indigo-400 hover:text-indigo-950 p-2 rounded-2xl hover:bg-white font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8 text-indigo-500 font-semibold text-sm">
              No active students found in this class. Please add students from the Teacher Dashboard first.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 px-1 text-xs text-indigo-500 font-extrabold">
                <span>Select children currently present:</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-indigo-600 hover:underline cursor-pointer"
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
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-white border-indigo-500 text-indigo-950 shadow-sm'
                          : 'bg-[#F6F2FF] border-indigo-100/80 text-indigo-400 hover:bg-white/60'
                      }`}
                    >
                      <span className="font-extrabold text-base">
                        {student.name}
                      </span>
                      <div className="text-indigo-600">
                        {isChecked ? (
                          <CheckSquare className="w-6 h-6 fill-indigo-100 text-indigo-600" />
                        ) : (
                          <Square className="w-6 h-6 text-indigo-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-900 text-xs mb-6 flex items-start gap-2.5 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                <span>
                  Every student will start this new class session at <strong>0 points</strong>. Children arriving late can be added anytime after class starts.
                </span>
              </div>

              <button
                type="button"
                onClick={handleStartClick}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer tactile-btn"
              >
                <Play className="w-5 h-5 fill-white" /> START CLASS SESSION
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
