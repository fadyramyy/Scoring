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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mb-4 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-center text-white mb-2">
          Active Class Session in Progress
        </h2>

        <p className="text-slate-300 text-sm text-center mb-4 leading-relaxed">
          <strong className="text-amber-400">{className}</strong> has an open session started on:
        </p>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 mb-4 flex items-center gap-2 justify-center text-xs font-semibold text-slate-200">
          <Clock className="w-4 h-4 text-amber-400" />
          {sessionDateFormatted}
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs mb-6">
          ⚠️ Starting a new class session will <strong>auto-complete</strong> the current session. Any student not yet marked present will be finalized as <strong>ABSENT</strong>.
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Finalize & Start New
          </button>
        </div>
      </div>
    </div>
  );
};
