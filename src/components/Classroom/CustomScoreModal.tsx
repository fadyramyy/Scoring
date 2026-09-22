import React, { useState } from 'react';
import { Sliders, Plus, Minus, Star } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4 selection:bg-amber-400">
      <div className="w-full max-w-sm bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl p-6 card-shadow relative text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-500 mb-3 mx-auto">
          <Star className="w-6 h-6 fill-amber-400" />
        </div>

        <h3 className="text-xl font-extrabold text-indigo-950 mb-1">Custom Score</h3>
        <p className="text-xs font-semibold text-indigo-600 mb-6">
          Adjust points for <strong className="text-indigo-950">{studentName}</strong> (-50 to +50)
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => adjustPoints(-5)}
              className="w-12 h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-lg flex items-center justify-center cursor-pointer transition-colors border border-rose-200"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => adjustPoints(-1)}
              className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-base flex items-center justify-center cursor-pointer transition-colors border border-rose-200"
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
                className="w-full text-center text-3xl font-extrabold text-amber-500 bg-white border-2 border-indigo-100 rounded-2xl py-2 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => adjustPoints(1)}
              className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold text-base flex items-center justify-center cursor-pointer transition-colors border border-emerald-200"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => adjustPoints(5)}
              className="w-12 h-12 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold text-lg flex items-center justify-center cursor-pointer transition-colors border border-emerald-200"
            >
              +5
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={points === 0}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-sm transition-colors cursor-pointer shadow-md shadow-indigo-500/20"
            >
              Apply Points
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
