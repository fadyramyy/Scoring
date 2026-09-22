import React, { useState } from 'react';
import { Profile } from '../../types';
import { isDemoMode } from '../../lib/supabase';
import { mockDb } from '../../lib/mockDatabase';
import { dataService } from '../../lib/dataService';
import { CosmicRocketEmblem, TeacherAstronautAvatar } from '../Brand/CosmicEmblem';
import { Lock, Mail, Sparkles } from 'lucide-react';

interface LoginModalProps {
  onLogin: (teacher: Profile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const teacher = await dataService.signIn(email, password);
      onLogin(teacher);
    } catch (err: any) {
      setError(err.message || 'Invalid teacher email address or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (teacherId: string) => {
    const demoProfiles = mockDb.getProfiles();
    const teacher = demoProfiles.find((p) => p.id === teacherId);
    if (teacher) {
      onLogin(teacher);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4 selection:bg-amber-400">
      <div className="w-full max-w-md bg-[#F6F2FF] border-2 border-indigo-100 rounded-3xl p-6 sm:p-8 card-shadow relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center p-2 mb-2 bg-white rounded-3xl shadow-sm border border-indigo-100">
            <CosmicRocketEmblem className="w-14 h-14" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight">
            Cosmic Adventure
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-indigo-600 uppercase tracking-widest mt-1">
            Classroom Scoring & Rewards
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
              Teacher Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-indigo-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.org"
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-950 placeholder-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-indigo-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-950 placeholder-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-500/25 transition-all tactile-btn cursor-pointer mt-2"
          >
            {loading ? 'Launching Session...' : 'Sign In to Teacher Portal'}
          </button>
        </form>

        {/* Demo Accounts strictly for Demo mode */}
        {isDemoMode && (
          <div className="mt-6 pt-5 border-t border-indigo-100/80">
            <div className="flex items-center gap-1.5 justify-center text-xs font-bold text-indigo-600 mb-3 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Demo Teacher Accounts
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('teacher-1')}
                className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-2xl text-left transition-colors cursor-pointer group shadow-sm"
              >
                <TeacherAstronautAvatar className="w-8 h-8" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">Mr. Andrew</div>
                  <div className="text-[10px] font-semibold text-indigo-500">Samuel Class</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('teacher-3')}
                className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-2xl text-left transition-colors cursor-pointer group shadow-sm"
              >
                <TeacherAstronautAvatar className="w-8 h-8" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">Mr. Caleb</div>
                  <div className="text-[10px] font-semibold text-indigo-500">Elijah Class</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
