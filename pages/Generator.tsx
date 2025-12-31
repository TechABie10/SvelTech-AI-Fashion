
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { generateOutfitSuggestion } from '../geminiService';
import { 
  Mic, 
  Send, 
  Shirt, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Loader2,
  Play,
  AlertCircle,
  Info
} from 'lucide-react';
import { UserProfile, ClothingItem } from '../types';

interface GeneratorProps {
  profile: UserProfile;
}

const Generator: React.FC<GeneratorProps> = ({ profile }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [usingFallbackVoice, setUsingFallbackVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWardrobe();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const fetchWardrobe = async () => {
    const { data } = await supabase.from('wardrobe').select().order('created_at', { ascending: false });
    setClosetItems(data || []);
  };

  const speakWithBrowser = (text: string) => {
    setUsingFallbackVoice(true);
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const speakRecommendation = async (text: string) => {
    if (!voiceEnabled) return;
    setIsSpeaking(true);
    setUsingFallbackVoice(false);
    window.speechSynthesis.cancel();
    speakWithBrowser(text);
  };

  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim()) return;
    setLoading(true);
    if (audioRef.current) audioRef.current.pause();
    window.speechSynthesis.cancel();
    
    try {
      const result = await generateOutfitSuggestion(prompt, closetItems, profile, suggestion?.recommendation);
      setSuggestion(result);
      if (voiceEnabled && result.recommendation) {
        speakRecommendation(result.recommendation);
      }
    } catch (e) {
      console.error(e);
      alert('Stylist is busy. Try again!');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const startVoiceCapture = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleGenerate(transcript);
    };
    recognition.start();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="text-center relative">
        <div className="absolute right-0 top-0 flex flex-col items-end gap-2">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${voiceEnabled ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500'}`}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </button>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <Sparkles className={`text-indigo-600 dark:text-indigo-400 ${isSpeaking ? 'animate-pulse scale-110' : ''}`} />
          AI Stylist
        </h1>
        <p className="text-gray-500 dark:text-zinc-500 mt-2">Personalized style advice, narrated for you.</p>
      </header>

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-2xl dark:shadow-none overflow-hidden flex flex-col min-h-[600px] transition-colors duration-300">
        <div className="flex-grow p-6 space-y-8 overflow-y-auto custom-scrollbar">
          {!suggestion && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 py-20">
               <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-400 dark:text-zinc-600">
                 <MessageSquare size={32} />
               </div>
               <p className="max-w-xs text-sm font-medium text-gray-700 dark:text-zinc-400">Try asking "I have a wedding this weekend, what should I wear from my closet?"</p>
             </div>
          )}

          {suggestion && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg transition-all ${isSpeaking ? 'bg-rose-500 animate-bounce' : 'bg-indigo-600'}`}>
                  {isSpeaking ? <Volume2 size={24} /> : <Sparkles size={24} />}
                </div>
                <div className="flex-grow space-y-4">
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl rounded-tl-none p-6 text-indigo-900 dark:text-indigo-100 leading-relaxed shadow-sm relative group border dark:border-indigo-900/50">
                    <p className="font-medium">{suggestion.recommendation}</p>
                    <button 
                      onClick={() => speakRecommendation(suggestion.recommendation)}
                      className="absolute -right-2 -bottom-2 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-md text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      title="Replay Audio"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </div>

                  {suggestion.selectedItemIds.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {suggestion.selectedItemIds.map((id: string) => {
                        const item = closetItems.find(i => i.id === id);
                        if (!item) return null;
                        return (
                          <div key={id} className="group relative aspect-square bg-white dark:bg-zinc-800 rounded-3xl border-2 border-transparent hover:border-indigo-600 dark:hover:border-indigo-400 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                            <img src={item.image_url} alt="wardrobe item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-3 left-3 px-2 py-1 bg-indigo-600/90 dark:bg-indigo-500/90 backdrop-blur-sm text-[8px] font-black text-white rounded-lg uppercase tracking-widest">{item.category}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {suggestion.needsInternetSearch && (
                    <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center">
                            <RefreshCw size={20} className="text-amber-600 dark:text-amber-400" />
                         </div>
                         <p className="text-sm font-bold">
                           Some essentials are missing from your closet.
                         </p>
                      </div>
                      <button 
                        onClick={() => handleGenerate(`Search trending ${suggestion.searchKeywords?.join(', ')} for this outfit`)}
                        className="w-full py-3 bg-amber-600 dark:bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 dark:hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg dark:shadow-none"
                      >
                        <ExternalLink size={16} />
                        Source from Web
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-zinc-800 rounded-2xl flex-shrink-0" />
              <div className="flex-grow space-y-4">
                <div className="w-full h-20 bg-gray-50 dark:bg-zinc-800 rounded-3xl rounded-tl-none" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-square bg-gray-50 dark:bg-zinc-800 rounded-3xl" />
                  <div className="aspect-square bg-gray-50 dark:bg-zinc-800 rounded-3xl" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800 transition-colors duration-300">
          <div className="relative flex items-center gap-3">
            <button 
              onClick={startVoiceCapture}
              disabled={loading}
              className={`p-4 rounded-2xl transition-all shadow-lg ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-600 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
            >
              <Mic size={24} />
            </button>
            <input 
              type="text" 
              placeholder="Ask your stylist anything..." 
              className="flex-grow px-6 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-inner focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-900 outline-none font-bold text-gray-700 dark:text-zinc-200 transition-colors"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate(input)}
            />
            <button 
              onClick={() => handleGenerate(input)}
              disabled={loading || !input.trim()}
              className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl dark:shadow-none shadow-indigo-100 transition-all active:scale-95"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;
