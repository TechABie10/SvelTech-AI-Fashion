
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingItem, UserProfile } from '../types';
import { getTrendingFashion, generateDailyStyleReport, getLiveTrendPulse, getDetailedTrendPulse } from '../geminiService';
import { supabase } from '../supabaseClient';
import { 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Share2, 
  Info, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  MessageSquare, 
  Zap, 
  Loader2, 
  BarChart3, 
  Globe2, 
  MapPin,
  ArrowUpRight,
  Bookmark,
  Filter as FilterIcon
} from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
}

interface DashboardCache {
  timestamp: number;
  reportSlides: any[];
  liveTrend: any;
  trending_for_you: TrendingItem[];
  trending_trends: TrendingItem[];
}

const FIVE_HOURS = 5 * 60 * 60 * 1000;

const Dashboard: React.FC<DashboardProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportSlides, setReportSlides] = useState<any[]>([]);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'for_you' | 'trends'>('for_you');
  
  const [liveTrend, setLiveTrend] = useState<any>(null);
  const [liveTrendLoading, setLiveTrendLoading] = useState(true);
  const [isPulseFeedOpen, setIsPulseFeedOpen] = useState(false);
  const [pulseFeedData, setPulseFeedData] = useState<any[]>([]);
  const [pulseLoading, setPulseLoading] = useState(false);

  const getCacheKey = useCallback(() => `sveltech_db_cache_${profile.id}`, [profile.id]);

  const saveToCache = useCallback((data: Partial<DashboardCache>) => {
    const key = getCacheKey();
    const existing = localStorage.getItem(key);
    const cache: DashboardCache = existing 
      ? JSON.parse(existing) 
      : { timestamp: Date.now(), reportSlides: [], liveTrend: null, trending_for_you: [], trending_trends: [] };
    
    const updated = { ...cache, ...data, timestamp: data.timestamp || cache.timestamp };
    localStorage.setItem(key, JSON.stringify(updated));
  }, [getCacheKey]);

  const fetchAllData = useCallback(async (force = false) => {
    setLoading(true);
    setReportLoading(true);
    setLiveTrendLoading(true);

    try {
      const { data: closetItems } = await supabase.from('wardrobe').select('*').eq('user_id', profile.id);
      
      const [slides, pulse, trendingForYou, trendingTrends] = await Promise.all([
        generateDailyStyleReport(profile, closetItems || []),
        getLiveTrendPulse(),
        getTrendingFashion(profile.preferences?.length > 0 ? profile.preferences : ['Modern', 'Casual', 'High-end fashion']),
        getTrendingFashion(['Trending Fashion 2025', 'Streetwear Trends', 'Viral Aesthetic'])
      ]);

      setReportSlides(slides);
      setLiveTrend(pulse);
      
      const newTrending = activeTab === 'for_you' ? trendingForYou : trendingTrends;
      setTrending(newTrending);

      saveToCache({
        timestamp: Date.now(),
        reportSlides: slides,
        liveTrend: pulse,
        trending_for_you: trendingForYou,
        trending_trends: trendingTrends
      });
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setReportLoading(false);
      setLiveTrendLoading(false);
    }
  }, [profile, activeTab, saveToCache]);

  useEffect(() => {
    const key = getCacheKey();
    const cachedData = localStorage.getItem(key);
    
    if (cachedData) {
      const parsed: DashboardCache = JSON.parse(cachedData);
      const isFresh = (Date.now() - parsed.timestamp) < FIVE_HOURS;

      if (isFresh) {
        // Use cached data
        setReportSlides(parsed.reportSlides);
        setLiveTrend(parsed.liveTrend);
        setTrending(activeTab === 'for_you' ? parsed.trending_for_you : parsed.trending_trends);
        setLoading(false);
        setReportLoading(false);
        setLiveTrendLoading(false);
      } else {
        // Stale cache, refresh
        fetchAllData();
      }
    } else {
      // No cache, fresh login or new user
      fetchAllData();
    }
  }, [profile.id, getCacheKey]); // Only depend on user ID to avoid tab-switch refreshes

  // Handle tab switching without full re-fetch if cache exists
  useEffect(() => {
    const key = getCacheKey();
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      const parsed: DashboardCache = JSON.parse(cachedData);
      setTrending(activeTab === 'for_you' ? parsed.trending_for_you : parsed.trending_trends);
    }
  }, [activeTab, getCacheKey]);

  const handleManualRefresh = () => {
    fetchAllData(true);
  };

  const openPulseFeed = async () => {
    setIsPulseFeedOpen(true);
    setPulseLoading(true);
    try {
      const data = await getDetailedTrendPulse();
      setPulseFeedData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setPulseLoading(false);
    }
  };

  const handleViewDetails = (url: string) => {
    if (!url) return;
    const safeUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  };

  const nextReport = () => setCurrentReportIndex((prev) => (prev + 1) % reportSlides.length);
  const prevReport = () => setCurrentReportIndex((prev) => (prev - 1 + reportSlides.length) % reportSlides.length);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
            Welcome, <span className="text-indigo-600 dark:text-indigo-400">{profile.name?.split(' ')[0] || 'Visionary'}</span>
          </h1>
          <p className="text-gray-400 dark:text-zinc-500 font-medium text-lg">Your aesthetic genome is updating in real-time.</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden bg-gray-100 dark:bg-zinc-800 shadow-lg">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="pr-4">
            <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight leading-none">+2.4k</p>
            <p className="text-[8px] font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest mt-1">Live Pioneers</p>
          </div>
        </div>
      </header>

      {/* Hero Showcase Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[500px]">
        {/* Main AI Narrative Slide */}
        <div className="lg:col-span-8 h-[400px] lg:h-full rounded-[3rem] bg-zinc-900 relative overflow-hidden group">
          {reportLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-white/20" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Synthesizing Narrative...</p>
            </div>
          ) : reportSlides.length > 0 ? (
            <>
              <div className="absolute inset-0">
                <img 
                  src={reportSlides[currentReportIndex].image} 
                  className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-105" 
                  alt="Daily Insight"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent" />
              </div>
              <div className="relative h-full p-8 lg:p-12 flex flex-col justify-between z-10 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                    <Sparkles size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Daily Synthesis</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={prevReport} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl transition-all active:scale-95"><ChevronLeft size={20}/></button>
                    <button onClick={nextReport} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl transition-all active:scale-95"><ChevronRight size={20}/></button>
                  </div>
                </div>
                
                <div className="max-w-2xl animate-in slide-in-from-left duration-700">
                  <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-4 leading-none">
                    {reportSlides[currentReportIndex].title}
                  </h2>
                  <p className="text-zinc-300 text-base lg:text-xl font-medium leading-relaxed mb-6 lg:mb-8">
                    {reportSlides[currentReportIndex].description}
                  </p>
                  <button 
                    onClick={() => navigate('/generator')}
                    className="px-10 py-5 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-indigo-600 hover:text-white transition-all shadow-2xl shadow-black/50"
                  >
                    Generate Look <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
              
              <div className="absolute bottom-12 right-12 hidden lg:flex flex-col gap-2">
                {reportSlides.map((_, i) => (
                  <div key={i} className={`w-1 transition-all duration-700 rounded-full ${i === currentReportIndex ? 'h-10 bg-indigo-500' : 'h-2 bg-white/20'}`} />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Live Trend Status Card */}
        <div 
          onClick={openPulseFeed}
          className="lg:col-span-4 rounded-[3rem] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-8 lg:p-10 flex flex-col justify-between group cursor-pointer hover:shadow-2xl hover:shadow-indigo-50 dark:hover:shadow-none transition-all relative overflow-hidden"
        >
          {liveTrendLoading ? (
             <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                <BarChart3 className="animate-pulse text-indigo-100 dark:text-zinc-800" size={64} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 dark:text-zinc-700">Scanning Localized Grids...</p>
             </div>
          ) : liveTrend ? (
            <>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Live Pulse Insight</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {liveTrend.trendName}
                </h3>
                <p className="mt-6 text-gray-400 dark:text-zinc-500 font-medium leading-relaxed">{liveTrend.description}</p>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex -space-x-6 group-hover:-space-x-4 transition-all duration-700">
                  {liveTrend.images?.map((img: string, i: number) => (
                    <div key={i} className="w-24 h-36 lg:w-28 lg:h-40 rounded-[2rem] overflow-hidden border-8 border-white dark:border-zinc-800 shadow-2xl transform transition-transform group-hover:rotate-6 group-hover:scale-110" style={{ zIndex: 10 - i }}>
                      <img src={img} alt="trend" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-zinc-800">
                  <div>
                    <span className="text-xs font-black text-gray-900 dark:text-zinc-300 uppercase tracking-widest">Velocity</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 w-24 lg:w-32 bg-gray-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${liveTrend.volume}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{liveTrend.volume}%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            </>
          ) : null}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-100 dark:border-zinc-900 pb-6">
          <div className="flex gap-10">
            {['for_you', 'trends'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`text-2xl font-black tracking-tighter relative transition-all uppercase px-1 ${activeTab === tab ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-zinc-700 hover:text-gray-500 dark:hover:text-zinc-500'}`}
              >
                {tab.replace('_', ' ')}
                {activeTab === tab && <div className="absolute -bottom-7 left-0 right-0 h-1.5 bg-indigo-600 rounded-full animate-in zoom-in" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
              <FilterIcon size={14} /> Filter Grids
            </button>
            <button 
              onClick={handleManualRefresh}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
            >
              <Sparkles size={14} className={(loading || reportLoading || liveTrendLoading) ? 'animate-spin' : ''} />
              {(loading || reportLoading || liveTrendLoading) ? 'Synthesizing...' : 'Refresh Radar'}
            </button>
          </div>
        </div>

        {(loading) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="space-y-6">
                <div className="aspect-[3/4.5] rounded-[3.5rem] bg-indigo-50/20 dark:bg-zinc-900 animate-pulse border border-indigo-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-4">
                   <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-indigo-200 dark:text-zinc-700">
                     <Loader2 className="animate-spin" size={24} />
                   </div>
                   <span className="text-[10px] font-black text-indigo-400/50 uppercase tracking-widest">Weaving Fabric...</span>
                </div>
                <div className="space-y-2 px-4">
                  <div className="h-6 w-3/4 bg-gray-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                  <div className="h-4 w-1/4 bg-gray-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {trending.map((item, idx) => (
              <div key={item.id} className="group flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="aspect-[3/4.5] relative rounded-[3.5rem] overflow-hidden bg-white dark:bg-zinc-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] group-hover:shadow-[0_50px_100px_-20px_rgba(79,70,229,0.15)] dark:group-hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] group-hover:-translate-y-4 transition-all duration-700 border border-gray-100 dark:border-zinc-800">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800`; }}
                  />
                  
                  {/* Glass Header */}
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-[-10px] group-hover:translate-y-0">
                    <div className="px-4 py-2 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 shadow-xl flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-gray-900 dark:text-white tracking-widest">{item.matchScore}% SYNC</span>
                    </div>
                    <button className="p-3 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/10 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-xl">
                       <Bookmark size={18} />
                    </button>
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-8">
                    <div className="space-y-4 translate-y-10 group-hover:translate-y-0 transition-transform duration-700">
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewDetails(item.link)}
                            className="flex-grow py-4 bg-white text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-2xl"
                          >
                            Acquire Look
                          </button>
                          <button className="p-4 bg-white/20 backdrop-blur text-white rounded-2xl hover:bg-rose-500 transition-all border border-white/20">
                            <Heart size={20} />
                          </button>
                       </div>
                       <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                          <p className="text-[10px] font-bold text-zinc-300 leading-relaxed uppercase tracking-tight">{item.matchReason}</p>
                       </div>
                    </div>
                  </div>
                  
                  {/* AI Origin Badge */}
                 
                </div>

                <div className="mt-8 px-4 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{item.store}</p>
                    <span className="text-sm font-black text-gray-900 dark:text-zinc-100">{item.price}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Aesthetic Pulse Feed (Side Panel Style) */}
      {isPulseFeedOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end transition-opacity duration-300">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => setIsPulseFeedOpen(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-950 h-full shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-500 border-l dark:border-zinc-800">
            <header className="p-8 lg:p-10 border-b border-gray-50 dark:border-zinc-900 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20 transition-colors">
              <div>
                <h3 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Trend Radar</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 mt-2">Real-time Global Sync</p>
              </div>
              <button onClick={() => setIsPulseFeedOpen(false)} className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </header>

            <div className="flex-grow overflow-y-auto p-6 lg:p-10 space-y-12 custom-scrollbar">
              {pulseLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 py-20">
                  <Loader2 className="animate-spin text-indigo-200 dark:text-zinc-800" size={64} />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-300 dark:text-zinc-700">Synchronizing Global Nodes...</p>
                </div>
              ) : pulseFeedData.length > 0 ? (
                pulseFeedData.map((pulse, idx) => (
                  <div key={idx} className="group animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-14 h-14 rounded-3xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-2xl shadow-indigo-100 dark:shadow-none flex-shrink-0">
                         {idx + 1}
                      </div>
                      <div className="flex-grow space-y-6">
                        <div className="flex items-center justify-between">
                           <div>
                             <h4 className="font-black text-gray-900 dark:text-white text-2xl lg:text-3xl tracking-tighter uppercase">{pulse.hashtag}</h4>
                             <div className="flex flex-wrap items-center gap-3 mt-1">
                                <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${pulse.scope === 'Global' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                  {pulse.scope === 'Global' ? <Globe2 size={10} /> : <MapPin size={10} />}
                                  {pulse.scope}
                                </div>
                                <span className="text-[10px] font-black text-gray-300 dark:text-zinc-600 uppercase tracking-widest">{pulse.context}</span>
                             </div>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{pulse.velocity}%</p>
                              <p className="text-[8px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest">Growth</p>
                           </div>
                        </div>
                        
                        <div className="aspect-[16/10] rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xl relative transition-colors">
                           <img src={pulse.image} alt="trend" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-8 flex flex-col justify-end">
                              <p className="text-white font-medium text-lg leading-relaxed italic">"{pulse.insight}"</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-400 dark:text-zinc-600 font-black uppercase tracking-widest text-[10px]">Lattice offline. Reconnect required.</div>
              )}
            </div>
            
            <div className="p-8 lg:p-10 border-t border-gray-50 dark:border-zinc-900 bg-white dark:bg-zinc-950 z-20 transition-colors">
               <button 
                onClick={() => setIsPulseFeedOpen(false)}
                className="w-full py-6 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl dark:shadow-none shadow-zinc-200 active:scale-95 transition-all"
               >
                 Close Sync
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
