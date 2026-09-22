import React, { useState } from 'react';
import { Profile } from '../../types';
import { isDemoMode } from '../../lib/supabase';
import { mockDb } from '../../lib/mockDatabase';
import { dataService } from '../../lib/dataService';
import { Lock, Mail, Sparkles, School } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold mb-3 shadow-lg shadow-amber-500/20">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sunday School Classroom
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sign in to start your weekly scoring & attendance session
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Teacher Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@church.org"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            {loading ? 'Signing In...' : 'Sign In to Teacher Portal'}
          </button>
        </form>

        {/* Demo Quick-Switch Buttons GATED Strictly to Mock/Demo Mode */}
        {isDemoMode && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 justify-center text-xs font-semibold text-amber-400 mb-3 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Demo Accounts (Click to Login)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('teacher-1')}
                className="flex items-center gap-2 p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mr. Andrew</div>
                  <div className="text-[10px] text-slate-400">Samuel Class</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('teacher-3')}
                className="flex items-center gap-2 p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mr. Caleb</div>
                  <div className="text-[10px] text-slate-400">Elijah Class</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
