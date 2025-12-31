
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Info, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const VerifyEmailPage: React.FC = () => {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const email = localStorage.getItem('sveltech_temp_email') || 'your email';
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setResendSuccess(false);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResendSuccess(true);
      setCountdown(60); // Wait 60 seconds before allowing another resend
    } catch (err: any) {
      console.error('Resend error:', err.message);
      alert('Could not resend: ' + err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3.5rem] p-10 md:p-14 text-center shadow-[0_40px_100px_-20px_rgba(79,70,229,0.2)] animate-in zoom-in duration-500 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-50 rounded-full -ml-12 -mb-12 opacity-30" />
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-indigo-100 relative">
            <Mail size={44} className={resending ? 'animate-bounce' : ''} />
            {resendSuccess && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white animate-in zoom-in">
                <CheckCircle2 size={16} />
              </div>
            )}
          </div>
          
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Confirm Identity</h1>
          <p className="text-gray-500 font-medium mb-12 text-sm leading-relaxed">
            A digital access link has been dispatched to:<br />
            <span className="text-indigo-600 font-black text-base">{email}</span>
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className={`w-full py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                resendSuccess 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50'
              }`}
            >
              {resending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : resendSuccess ? (
                <CheckCircle2 size={18} />
              ) : (
                <RefreshCw size={18} />
              )}
              {resending ? 'Resending Link...' : resendSuccess ? 'Link Re-sent!' : countdown > 0 ? `Wait ${countdown}s` : 'Resend Verification Link'}
            </button>

            <Link 
              to="/auth" 
              className="w-full py-5 bg-gray-50 text-gray-400 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
              Back to Initialization
              <ArrowRight size={18} />
            </Link>
          </div>
          
          <div className="mt-12 p-6 bg-indigo-50/50 rounded-3xl text-left border border-indigo-100/50 space-y-3">
            <div className="flex gap-3">
              <Info size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Why isn't it arriving?</h4>
            </div>
            <ul className="text-[10px] text-gray-400 font-bold uppercase tracking-tight space-y-2 list-disc pl-4 leading-relaxed">
              <li>Check your <span className="text-indigo-600">Spam or Junk</span> folder.</li>
              <li>Wait up to 5 minutes for the global sync.</li>
              <li>Supabase default email limits may have been reached.</li>
            </ul>
            <div className="pt-2">
              <p className="text-[9px] text-gray-300 font-medium leading-relaxed italic border-t border-indigo-100 pt-3">
                Pro Tip: If you are the owner, disable "Confirm Email" in your Supabase Auth settings to bypass this step entirely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
