
import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle2, Camera, User, Loader2 } from 'lucide-react';
import { uploadToCloudinary } from '../supabaseClient';

interface OnboardingCarouselProps {
  profile: any;
  onComplete: (data: any) => Promise<void>;
  onClose: () => void;
}

const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ profile, onComplete, onClose }) => {
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: profile.name || '',
    profile_image: profile.profile_image || '',
    sex: profile.sex || '',
    measurements: {
      age: profile.measurements?.age || '',
      height: profile.measurements?.height || '',
      weight: profile.measurements?.weight || '',
      chest: profile.measurements?.chest || '',
      waist: profile.measurements?.waist || '',
      foot_size: profile.measurements?.foot_size || '',
    },
    preferences: profile.preferences || []
  });

  const steps = [
    { title: 'Identity', description: 'Your digital style persona starts here.' },
    { title: 'Basics', description: 'Help us understand your silhouette.' },
    { title: 'Precision', description: 'Accurate data for the perfect fit.' },
    { title: 'Aesthetic', description: 'Select the vibes that resonate with you.' },
    { title: 'Vault Ready', description: 'Your AI stylist is now initialized.' }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setCompleting(true);
      try {
        await onComplete(formData);
      } finally {
        setCompleting(false);
      }
    }
  };

  const handleBack = () => step > 0 && setStep(step - 1);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, profile_image: url }));
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const toggleStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(style) 
        ? prev.preferences.filter((s: string) => s !== style)
        : [...prev.preferences, style]
    }));
  };

  const updateMeasurement = (key: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [key]: val }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-xl transition-all duration-700" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in duration-500 border border-white/40">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-[120px] -mr-40 -mt-40 opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50 rounded-full blur-[100px] -ml-32 -mb-32 opacity-40 pointer-events-none" />
        
        <div className="p-10 md:p-14 relative z-10">
          <header className="mb-14 text-center">
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-3">{steps[step].title}</h2>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest opacity-80">{steps[step].description}</p>
          </header>

          <div className="min-h-[380px] flex flex-col justify-center">
            {step === 0 && (
              <div className="space-y-12 flex flex-col items-center animate-in slide-in-from-bottom-6 duration-500">
                <div className="relative group">
                  <div className="w-48 h-48 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-200 border-8 border-white shadow-2xl overflow-hidden relative transition-all duration-500 group-hover:scale-105 group-hover:shadow-indigo-100">
                    {uploading && (
                      <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-md flex flex-col items-center justify-center z-20">
                        <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Uploading</span>
                      </div>
                    )}
                    {formData.profile_image ? (
                      <img src={formData.profile_image} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <User size={80} strokeWidth={1.5} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Digital Avatar</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 w-14 h-14 bg-indigo-600 text-white rounded-full border-4 border-white shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-all active:scale-95 group-hover:rotate-6"
                  >
                    <Camera size={24} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                <div className="w-full max-w-sm space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Identity Tag</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name..."
                    className="w-full px-8 py-6 rounded-3xl bg-gray-50 border-2 border-transparent focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-600 outline-none text-center text-xl font-black text-gray-800 transition-all shadow-inner"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Primary Fit Category</label>
                  <div className="flex gap-4">
                    {['male', 'female', 'other'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setFormData({...formData, sex: s as any})}
                        className={`flex-1 py-6 rounded-3xl border-2 transition-all capitalize font-black text-sm tracking-widest ${formData.sex === s ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-100 -translate-y-1' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-indigo-200'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Age Milestone</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 24"
                    className="w-full px-8 py-6 rounded-3xl bg-gray-50 border-2 border-transparent outline-none focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-600 font-black text-2xl transition-all shadow-inner"
                    value={formData.measurements.age}
                    onChange={e => updateMeasurement('age', e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-right-8 duration-500">
                {[
                  { label: 'Height (cm)', key: 'height' },
                  { label: 'Weight (kg)', key: 'weight' },
                  { label: 'Chest (cm)', key: 'chest' },
                  { label: 'Waist (cm)', key: 'waist' },
                ].map(m => (
                  <div key={m.key} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">{m.label}</label>
                    <input 
                      type="number" 
                      placeholder="--" 
                      className="w-full px-8 py-5 rounded-3xl bg-gray-50 border-2 border-transparent font-black text-gray-700 focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all shadow-inner text-lg" 
                      value={(formData.measurements as any)[m.key]} 
                      onChange={e => updateMeasurement(m.key, e.target.value)} 
                    />
                  </div>
                ))}
                <div className="col-span-2 space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 ml-2">Foot Size (EU Standard)</label>
                   <input 
                    type="number" 
                    placeholder="e.g. 42" 
                    className="w-full px-8 py-5 rounded-3xl bg-gray-50 border-2 border-transparent font-black text-gray-700 focus:bg-white focus:ring-8 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all shadow-inner text-lg" 
                    value={formData.measurements.foot_size} 
                    onChange={e => updateMeasurement('foot_size', e.target.value)} 
                   />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 animate-in fade-in duration-700">
                {['Minimalist', 'Streetwear', 'Formal', 'Vintage', 'Bohemian', 'Gothic', 'Preppy', 'Casual'].map(s => (
                  <button 
                    key={s}
                    onClick={() => toggleStyle(s)}
                    className={`py-6 px-4 rounded-3xl border-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${formData.preferences.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-100 -translate-y-2' : 'bg-white border-gray-50 text-gray-400 hover:border-indigo-100 hover:text-indigo-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-500">
                <div className="w-28 h-28 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-50 relative">
                   <CheckCircle2 size={56} className="relative z-10" />
                   <div className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] animate-ping opacity-20" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-3">Vault Initialized</h3>
                <p className="text-gray-400 font-bold text-center max-w-xs uppercase tracking-widest text-[10px] leading-relaxed">Your style DNA has been encoded into our global fashion lattice.</p>
              </div>
            )}
          </div>

          <div className="mt-20 flex justify-between items-center">
            <button 
              onClick={handleBack} 
              disabled={step === 0 || completing} 
              className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <ChevronLeft size={18} /> Previous
            </button>
            
            <div className="flex gap-3">
              {steps.map((_, i) => (
                <div key={i} className={`h-2.5 rounded-full transition-all duration-700 ${i === step ? 'w-10 bg-indigo-600' : 'w-2.5 bg-gray-100'}`} />
              ))}
            </div>

            <button 
              onClick={handleNext} 
              disabled={uploading || completing}
              className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {completing ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Finalizing...
                </>
              ) : (
                <>
                  {step === steps.length - 1 ? 'Enter Vault' : 'Continue'} <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
