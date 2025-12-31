
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Closet from './pages/Closet';
import Generator from './pages/Generator';
import Community from './pages/Community';
import Profile from './pages/Profile';
import LandingPage from './pages/Landing';
import OnboardingCarousel from './components/OnboardingCarousel';
import Navbar from './components/Navbar';
import VoiceAssistant from './components/VoiceAssistant';
import Logo from './components/Logo';
import { UserProfile } from './types';
import { Loader2, LogOut, AlertCircle } from 'lucide-react';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isInitialMount = useRef(true);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const fetchProfile = useCallback(async (authUser: any) => {
    const userId = authUser.id;
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingProfile) {
        setProfile(existingProfile as UserProfile);
      } else {
        const metadata = authUser.user_metadata || {};
        const newProfile = {
          id: userId,
          name: metadata.name || authUser.email?.split('@')[0] || 'Member',
          email: authUser.email || '',
          has_completed_onboarding: false,
          measurements: {},
          preferences: []
        };
        
        const { data: created, error: createError } = await supabase.from('users').insert(newProfile).select().single();
        if (createError) throw createError;
        if (created) setProfile(created as UserProfile);
      }
    } catch (err: any) {
      console.warn("Lattice profile sync warning:", err.message);
      setError("Database sync limited. Using local cache.");
      // Ensure we don't block the UI if the users table doesn't exist
      setProfile({
        id: userId,
        name: authUser.email?.split('@')[0] || 'Member',
        email: authUser.email || '',
        has_completed_onboarding: true, // Bypass onboarding for local fallback
        measurements: {},
        preferences: []
      } as UserProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Lattice initialization timed out. Forcing UI render.");
        setLoading(false);
      }
    }, 8000);

    const init = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setLoading(false);
      }
    };

    if (isInitialMount.current) {
      init();
      isInitialMount.current = false;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile, loading]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
  setShowLogoutModal(false);
  setLoading(true);

  await supabase.auth.signOut();

  navigate('/auth', { replace: true });
};


  const handleOnboardingComplete = async (formData: any) => {
    if (!profile) return;

    const updates = {
      ...formData,
      has_completed_onboarding: true
    };

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
    } catch (e: any) {
      setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
    }
  };

  const showOnboarding = profile !== null && profile.has_completed_onboarding === false;

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
      <div className="relative mb-10">
        <Logo size="xl" className="text-indigo-600 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
           <Loader2 className="animate-spin text-indigo-400/30" size={120} strokeWidth={1} />
        </div>
      </div>
      <div className="space-y-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 dark:text-zinc-600 animate-pulse">Synchronizing Style Lattice</p>
        {error && <p className="text-rose-500 text-[9px] font-bold uppercase tracking-widest">{error}</p>}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen font-sans bg-gray-50/50 dark:bg-zinc-950 transition-colors duration-300">
      {user && profile ? (
        <div className="flex min-h-screen overflow-hidden">
          <Navbar onLogout={handleLogoutClick} profile={profile} isDark={isDarkMode} onToggleTheme={toggleTheme} />
          <main className="flex-grow p-4 md:p-8 md:pl-72 pt-20 md:pt-8 min-h-screen overflow-y-auto">
            <div className="container mx-auto max-w-7xl">
              <Routes>
                <Route path="/" element={<Dashboard profile={profile} />} />
                <Route path="/closet" element={<Closet profile={profile} />} />
                <Route path="/generator" element={<Generator profile={profile} />} />
                <Route path="/community" element={<Community profile={profile} />} />
                <Route path="/profile" element={<Profile profile={profile} onUpdate={setProfile} onLogout={handleLogoutClick} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>
          <VoiceAssistant profile={profile} />
        </div>
      ) : (
        <Routes>
          {/* <Route path="/" element={<LandingPage />} /> */}
          <Route path="/auth" element={<AuthPage onAuthSuccess={() => {}} />} />
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl" onClick={() => setShowLogoutModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[3.5rem] p-10 text-center space-y-8 animate-in zoom-in duration-300">
              <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase">Terminate?</h3>
              <div className="flex flex-col gap-3">
                <button onClick={confirmLogout} className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest">Log Out</button>
                <button onClick={() => setShowLogoutModal(false)} className="w-full py-5 bg-gray-50 dark:bg-zinc-800 text-gray-400 rounded-3xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
              </div>
          </div>
        </div>
      )}

      {showOnboarding && profile && (
        <OnboardingCarousel 
          profile={profile} 
          onComplete={handleOnboardingComplete}
          onClose={() => {}} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
