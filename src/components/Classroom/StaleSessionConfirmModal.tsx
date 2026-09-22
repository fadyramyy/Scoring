import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { ClassSession } from '../../types';

interface StaleSessionConfirmModalProps {
  staleSession: ClassSession;
  className: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StaleSessionConfirmModal: React.FC<StaleSessionConfirmModalProps> = ({
  staleSession,
  className,
  onConfirm,
  onCancel,
}) => {
  const sessionDateFormatted = new Date(staleSession.started_at).toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4 selection:bg-amber-400">
      <div className="w-full max-w-md bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl p-6 card-shadow relative">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mb-4 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-center text-indigo-950 mb-2">
          Active Class Session in Progress
        </h2>

        <p className="text-indigo-700 text-sm text-center mb-4 leading-relaxed font-semibold">
          <strong className="text-indigo-950">{className}</strong> has an open session started on:
        </p>

        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-3 mb-4 flex items-center gap-2 justify-center text-xs font-bold text-indigo-900 shadow-sm">
          <Clock className="w-4 h-4 text-amber-500" />
          {sessionDateFormatted}
        </div>

        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs mb-6 font-semibold">
          ⚠️ Starting a new class session will <strong>auto-complete</strong> the current session. Any student not yet marked present will be finalized as <strong>ABSENT</strong>.
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Finalize & Start New
          </button>
        </div>
      </div>
    </div>
  );
};
