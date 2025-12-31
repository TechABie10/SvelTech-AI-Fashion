
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Globe2, Zap, Sparkles, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { 
      id: 0,
      icon: <Zap size={20} />, 
      title: "Rapid Digitization", 
      desc: "Upload a single photo. Our AI identifies category, material, and aesthetic intent instantly.",
      image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&q=80&w=800"
    },
    { 
      id: 1,
      icon: <Globe2 size={20} />, 
      title: "Trend Pulse", 
      desc: "Synchronize with global street-style velocity. Never be behind the cultural curve.",
      image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=800"
    },
    { 
      id: 2,
      icon: <ShieldCheck size={20} />, 
      title: "Privacy Locked", 
      desc: "Your style data is yours. Encrypted within the lattice, accessible only by you.",
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] md:w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[80px] md:blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[70%] md:w-[40%] h-[40%] bg-rose-50 rounded-full blur-[70px] md:blur-[100px] opacity-40" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 md:gap-4">
          <Logo size="md" className="text-indigo-600" />
          <span className="text-xl md:text-2xl font-black tracking-tighter text-gray-900 uppercase">SvelTech</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-8 md:pt-12 lg:pt-20 pb-20 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-gray-900 tracking-tighter leading-[0.9] md:leading-[0.85]">
              Evolve Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 animate-gradient-x">Aesthetic.</span>
            </h1>

            <p className="max-w-lg text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
              The first AI-driven fashion engine designed to decode your style DNA, digitize your vault, and synchronize your look with global trends in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 pt-4 md:pt-6">
              <button 
                onClick={() => navigate('/auth')}
                className="group relative w-full sm:w-auto px-10 md:px-12 py-5 md:py-6 bg-zinc-950 text-white rounded-2xl md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-xs tracking-[0.3em] md:tracking-[0.4em] shadow-2xl shadow-zinc-200 hover:scale-105 active:scale-95 transition-all overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Get Started <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
              
              <div className="flex items-center gap-4 px-5 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl bg-gray-50 border border-gray-100 w-full sm:w-auto justify-center sm:justify-start">
                <div className="flex -space-x-2 md:-space-x-3">
                  {[10, 11, 12].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i}`} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                  <span className="text-gray-900 block mb-1">2.4K+ SYNCED</span>
                  STYLE PIONEERS
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative animate-in fade-in zoom-in duration-1000 delay-300 mt-8 lg:mt-0">
            <div className="relative aspect-[4/5] md:aspect-[4/5] lg:aspect-[4/5] rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] group">
              <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200" 
                className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110" 
                alt="High Fashion"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              <div className="absolute top-6 md:top-10 right-6 md:right-10 p-4 md:p-6 bg-white/20 backdrop-blur-2xl rounded-2xl md:rounded-[2.5rem] border border-white/30 animate-bounce shadow-2xl">
                <Sparkles className="text-white w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 p-6 md:p-8 bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] border border-white/50 shadow-2xl max-w-[180px] md:max-w-[240px]">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-emerald-600">Sync Active</span>
                </div>
                <p className="text-[10px] md:text-xs font-black text-gray-900 tracking-tight leading-tight uppercase">
                  "Lattice suggests monochromatic layering for 18°C"
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Section with Fixed Stunning Visuals */}
      <section className="bg-white py-12 md:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="group relative h-[320px] md:h-[380px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-lg transition-all duration-700 hover:-translate-y-3 hover:shadow-[0_40px_80px_-15px_rgba(79,70,229,0.15)] bg-gray-50"
            >
              {/* Image Container */}
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={f.image} 
                  alt={f.title} 
                  className={`w-full h-full object-cover grayscale transition-all duration-[2000ms] group-hover:scale-110 group-hover:grayscale-0`} 
                />
                {/* Cinematic Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/10 via-zinc-900/40 to-zinc-950/90" />
                <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>

              {/* Card Content */}
              <div className="relative h-full p-8 flex flex-col justify-between z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-2xl text-white rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-500">
                    {f.icon}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                    {f.title}
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                    {f.desc}
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-indigo-400 font-black text-[9px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                    Explore DNA <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Teaser */}
      <footer className="py-12 md:py-20 text-center space-y-6 md:space-y-8 px-6">
         <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-gray-300">Designed for the avant-garde</p>
         <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-gray-300 font-black uppercase text-[9px] md:text-[10px] tracking-widest">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Digital Vault</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">AI Stylist</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Style Lattice</span>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
