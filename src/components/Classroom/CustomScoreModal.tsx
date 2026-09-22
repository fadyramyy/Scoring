import React, { useState } from 'react';
import { Sliders, Plus, Minus } from 'lucide-react';

interface CustomScoreModalProps {
  studentName: string;
  onSubmit: (points: number) => void;
  onClose: () => void;
}

export const CustomScoreModal: React.FC<CustomScoreModalProps> = ({
  studentName,
  onSubmit,
  onClose,
}) => {
  const [points, setPoints] = useState<number>(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (points >= -50 && points <= 50 && points !== 0) {
      onSubmit(points);
    }
  };

  const adjustPoints = (delta: number) => {
    setPoints((prev) => Math.min(50, Math.max(-50, prev + delta)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 mx-auto">
          <Sliders className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Custom Score</h3>
        <p className="text-xs text-slate-400 mb-6">
          Adjust points for <strong className="text-amber-400">{studentName}</strong> (-50 to +50)
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => adjustPoints(-5)}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xl flex items-center justify-center cursor-pointer transition-colors"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => adjustPoints(-1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="w-24 text-center">
              <input
                type="number"
                min="-50"
                max="50"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                className="w-full text-center text-3xl font-extrabold text-amber-400 bg-slate-800/80 border border-slate-700 rounded-2xl py-2 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => adjustPoints(1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-lg flex items-center justify-center cursor-pointer transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => adjustPoints(5)}
              className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xl flex items-center justify-center cursor-pointer transition-colors"
            >
              +5
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={points === 0}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Apply Points
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
