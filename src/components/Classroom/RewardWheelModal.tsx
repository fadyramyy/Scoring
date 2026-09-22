import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Plus, Trash2, RotateCw, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RewardPrize } from '../../types';

interface RewardWheelModalProps {
  classId: string;
  className: string;
  onClose: () => void;
}

const DEFAULT_PRIZES: RewardPrize[] = [
  { id: '1', name: '🎁 Special Gift', color: '#6366F1' },
  { id: '2', name: '⭐ +10 Bonus Stars', color: '#F59E0B' },
  { id: '3', name: '🍿 Snack Treat', color: '#10B981' },
  { id: '4', name: '🎮 Pick Next Game', color: '#EC4899' },
  { id: '5', name: '🏆 Super Star Badge', color: '#8B5CF6' },
  { id: '6', name: '👑 Class Leader For Day', color: '#06B6D4' },
];

const PRESET_COLORS = [
  '#6366F1',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#3B82F6',
];

export const RewardWheelModal: React.FC<RewardWheelModalProps> = ({
  classId,
  className,
  onClose,
}) => {
  const [prizes, setPrizes] = useState<RewardPrize[]>(() => {
    try {
      const stored = localStorage.getItem(`reward_wheel_gifts_${classId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored reward wheel gifts', e);
    }
    return DEFAULT_PRIZES;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [winningPrize, setWinningPrize] = useState<RewardPrize | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Save prizes to localStorage whenever updated
  const savePrizes = (updated: RewardPrize[]) => {
    setPrizes(updated);
    try {
      localStorage.setItem(`reward_wheel_gifts_${classId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save reward wheel gifts', e);
    }
  };

  // Draw wheel on canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    if (prizes.length === 0) return;

    const sliceAngle = (2 * Math.PI) / prizes.length;

    prizes.forEach((prize, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw Slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color || PRESET_COLORS[index % PRESET_COLORS.length];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Draw Prize Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'extrabold 14px Quicksand, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(prize.name, radius - 20, 5);
      ctx.restore();
    });

    // Draw Outer Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#4338CA';
    ctx.stroke();

    // Draw Center Peg
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    ctx.fillStyle = '#4338CA';
    ctx.font = 'extrabold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', centerX, centerY);
  };

  useEffect(() => {
    drawWheel();
  }, [prizes]);

  // Handle Wheel Spin
  const spinWheel = () => {
    if (spinning || prizes.length < 2) return;

    setSpinning(true);
    setWinningPrize(null);

    // Pick a random prize index
    const prizeIndex = Math.floor(Math.random() * prizes.length);
    const sliceDeg = 360 / prizes.length;

    // Target angle points to top (270deg offset in canvas orientation)
    const targetSliceCenterDeg = prizeIndex * sliceDeg + sliceDeg / 2;
    const finalAngleOffset = 270 - targetSliceCenterDeg;
    
    // Add 5-8 full spins (1800-2880 degrees) for excitement
    const fullSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const targetTotalRotation = rotationAngle + fullSpins + (finalAngleOffset - (rotationAngle % 360));

    setRotationAngle(targetTotalRotation);

    setTimeout(() => {
      setSpinning(false);
      const winner = prizes[prizeIndex];
      setWinningPrize(winner);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#F59E0B', '#FBBF24', '#6366F1', '#10B981', '#EC4899'],
      });
    }, 4500);
  };

  const [selectedAddColor, setSelectedAddColor] = useState(PRESET_COLORS[0]);
  const [activeColorPickerId, setActiveColorPickerId] = useState<string | null>(null);

  // Add new gift prize
  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeName.trim()) return;

    const newPrize: RewardPrize = {
      id: Math.random().toString(),
      name: newPrizeName.trim(),
      color: selectedAddColor,
    };

    const nextColorIndex = (prizes.length + 1) % PRESET_COLORS.length;
    savePrizes([...prizes, newPrize]);
    setNewPrizeName('');
    setSelectedAddColor(PRESET_COLORS[nextColorIndex]);
  };

  // Change existing prize color
  const handleUpdatePrizeColor = (prizeId: string, newColor: string) => {
    savePrizes(prizes.map((p) => (p.id === prizeId ? { ...p, color: newColor } : p)));
    setActiveColorPickerId(null);
  };

  // Remove gift prize
  const handleRemovePrize = (id: string) => {
    if (prizes.length <= 2) {
      alert('You must keep at least 2 gifts on the wheel!');
      return;
    }
    savePrizes(prizes.filter((p) => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/60 backdrop-blur-md p-4 selection:bg-amber-400">
      <div className="w-full max-w-lg bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl p-6 card-shadow relative overflow-hidden flex flex-col items-center">
        {/* Background Accents */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-200/40 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="w-full flex items-center justify-between pb-4 mb-2 border-b-2 border-indigo-100 relative">
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-950 font-display">
              Classroom Reward Wheel
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-2xl border-2 transition-colors cursor-pointer ${
                isEditing
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
              }`}
              title={isEditing ? 'Back to Wheel' : 'Edit Gift List'}
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-indigo-400 hover:text-rose-600 rounded-2xl hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* EDIT PRIZES VIEW */}
        {isEditing ? (
          <div className="w-full space-y-4 my-2">
            <h3 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider">
              Configure Reward Gifts (Saved for {className})
            </h3>

            {/* Add Prize Form with Color Selector */}
            <form onSubmit={handleAddPrize} className="space-y-2 bg-white p-3 border border-indigo-100 rounded-2xl shadow-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPrizeName}
                  onChange={(e) => setNewPrizeName(e.target.value)}
                  placeholder="e.g. 🍿 Extra Snack"
                  className="flex-1 px-3.5 py-2 bg-[#F6F2FF] border-2 border-indigo-100 rounded-xl text-indigo-950 font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl flex items-center gap-1 transition-all tactile-btn cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {/* Color Swatches Selection for new gift */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mr-1">Slice Color:</span>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedAddColor(color)}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                      selectedAddColor === color ? 'scale-125 border-indigo-900 ring-2 ring-indigo-400' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </form>

            {/* List of Current Prizes */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {prizes.map((prize) => {
                const isPickerOpen = activeColorPickerId === prize.id;

                return (
                  <div
                    key={prize.id}
                    className="flex flex-col p-3 bg-white border border-indigo-100 rounded-2xl shadow-sm gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {/* Clickable color badge to open color picker */}
                        <button
                          type="button"
                          onClick={() => setActiveColorPickerId(isPickerOpen ? null : prize.id)}
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ring-1 ring-indigo-200"
                          style={{ backgroundColor: prize.color }}
                          title="Click to change color"
                        />
                        <span className="font-extrabold text-indigo-950 text-sm">{prize.name}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePrize(prize.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Remove Prize"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Popover Swatches Row when color picker is active */}
                    {isPickerOpen && (
                      <div className="flex items-center gap-2 p-2 bg-[#F6F2FF] rounded-xl border border-indigo-100 animate-fadeIn">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase">Change Color:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleUpdatePrizeColor(prize.id, c)}
                              className={`w-5 h-5 rounded-full border border-white cursor-pointer hover:scale-125 transition-transform ${
                                prize.color === c ? 'ring-2 ring-indigo-600 scale-110' : ''
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer mt-4"
            >
              Done Editing ➔ Spin Wheel!
            </button>
          </div>
        ) : (
          /* SPIN WHEEL VIEW */
          <div className="w-full flex flex-col items-center justify-center my-2">
            {/* Pointer Indicator at Top */}
            <div className="relative mb-[-12px] z-10">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-500 filter drop-shadow-md" />
            </div>

            {/* Canvas Wheel */}
            <div className="relative p-2 bg-white rounded-full border-4 border-indigo-200 shadow-xl overflow-hidden">
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="transition-transform duration-[4500ms] ease-out rounded-full"
                style={{ transform: `rotate(${rotationAngle}deg)` }}
              />
            </div>

            {/* Winner Announcement Banner */}
            {winningPrize && (
              <div className="mt-4 p-3.5 bg-amber-400 border-2 border-amber-500 rounded-2xl text-center shadow-lg animate-bounce w-full">
                <p className="text-xs uppercase font-black text-indigo-950 tracking-widest flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" /> YOU WON A PRIZE! <Sparkles className="w-4 h-4" />
                </p>
                <h3 className="text-2xl font-black text-indigo-950 tracking-tight mt-0.5">
                  {winningPrize.name}
                </h3>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex gap-3 mt-4">
              <button
                type="button"
                onClick={spinWheel}
                disabled={spinning}
                className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-indigo-950 font-black text-base rounded-2xl shadow-lg shadow-amber-400/30 transition-all tactile-btn cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
                <span>{spinning ? 'Spinning...' : 'SPIN THE WHEEL!'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
