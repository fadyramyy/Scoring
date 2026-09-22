import React, { useState } from 'react';
import { Profile } from '../../types';
import { dataService } from '../../lib/dataService';
import { CosmicRocketEmblem } from '../Brand/CosmicEmblem';
import { Lock, Mail, User, School } from 'lucide-react';

interface LoginModalProps {
  onLogin: (teacher: Profile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [className, setClassName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let teacher: Profile;
      if (isRegisterMode) {
        if (!name.trim() || !className.trim()) {
          throw new Error('Please enter your full name and class name.');
        }
        teacher = await dataService.signUp(email, password, name, className);
      } else {
        teacher = await dataService.signIn(email, password);
      }
      onLogin(teacher);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
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

        {/* Tab Switcher: Sign In vs Register */}
        <div className="flex bg-white p-1 rounded-2xl border border-indigo-100 mb-6 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              !isRegisterMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:text-indigo-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              isRegisterMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:text-indigo-900'
            }`}
          >
            Register Teacher
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-indigo-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mr. Andrew"
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-950 placeholder-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                />
              </div>
            </div>
          )}

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

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                Class Name
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-3.5 w-5 h-5 text-indigo-400" />
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Samuel Class"
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-indigo-950 placeholder-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-500/25 transition-all tactile-btn cursor-pointer mt-2"
          >
            {loading
              ? isRegisterMode
                ? 'Creating Account...'
                : 'Signing In...'
              : isRegisterMode
              ? 'Create Teacher Account'
              : 'Sign In to Teacher Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};
