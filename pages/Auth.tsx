
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, ArrowRight, User, ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

interface AuthProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        
        // Navigation will happen via onAuthStateChange in App.tsx
      } else if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name for the lattice identity.');

        const { data, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            data: { name: name.trim() }
          }
        });
        
        if (authError) throw authError;
        
        if (data.session) {
          // Success
        } else {
          setError("Account created. Please sign in.");
          setMode('login');
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Lattice Auth Error:', err);
      let displayMsg = err.message;
      if (err.message === 'Failed to fetch') {
        displayMsg = "Auth Server Unreachable. Please check your internet or Supabase configuration.";
      }
      setError(displayMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-zinc-950 transition-colors duration-500">
      {/* Visual Branding Side */}
      <div className="hidden lg:flex w-[55%] bg-zinc-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 grayscale contrast-125 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover" 
            alt="Fashion Grid" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/90 via-zinc-950/60 to-transparent" />
        <div className="relative z-10 w-full max-w-2xl text-center">
          <Logo size="xl" light className="mx-auto mb-10" />
          <h1 className="text-8xl font-black text-white tracking-tighter mb-6">SVELTECH</h1>
          <p className="text-indigo-400 font-black uppercase tracking-[0.6em] text-xs">Digital Style DNA Synchronized</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 md:p-16 lg:p-24 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-12">
          <div className="text-center lg:text-left space-y-3">
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
              {mode === 'login' ? 'Sync Vault' : 'Initialize'}
            </h2>
            <p className="text-gray-400 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest">
              {mode === 'login' ? 'Access your digital wardrobe.' : 'Create a new identity in the lattice.'}
            </p>
          </div>

          {error && (
            <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl flex items-start gap-4">
              <ShieldAlert className="text-rose-500 flex-shrink-0" size={20} />
              <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600 ml-1">Identity Name</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-700" size={18} />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-zinc-900 border-2 border-transparent rounded-[1.8rem] focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 dark:text-white"
                    placeholder="E.g. Alexander M."
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-700" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-zinc-900 border-2 border-transparent rounded-[1.8rem] focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 dark:text-white"
                  placeholder="vault@sveltech.io"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-zinc-700" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-16 pr-16 py-5 bg-gray-50 dark:bg-zinc-900 border-2 border-transparent rounded-[1.8rem] focus:border-indigo-600 outline-none transition-all font-bold text-gray-800 dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-70 group"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  {mode === 'login' ? 'Synchronize' : 'Initialize'}
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-gray-400 dark:text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em] hover:text-indigo-600 transition-all py-4 px-8 rounded-full border border-gray-50 dark:border-zinc-900"
            >
              {mode === 'login' ? "New Here? Initialize Identity" : "Member? Sync Vault"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
