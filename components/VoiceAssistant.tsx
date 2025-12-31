
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, X, Volume2, Wand2, Sparkles, Loader2 } from 'lucide-react';
import { processVoiceAssistantIntent } from '../geminiService';
import { textToSpeech } from '../elevenLabsService';
import { supabase } from '../supabaseClient';
import { UserProfile, ClothingItem } from '../types';

interface VoiceAssistantProps {
  profile: UserProfile;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'IDLE' | 'PREMIUM' | 'STANDARD' | 'ERROR'>('IDLE');
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const fetchWardrobe = useCallback(async () => {
    try {
      const { data } = await supabase.from('wardrobe').select().eq('user_id', profile.id);
      if (data) setClosetItems(data);
    } catch (e) {
      console.warn('Failed to fetch wardrobe for voice context');
    }
  }, [profile.id]);

  useEffect(() => {
    if (isOpen) fetchWardrobe();
  }, [isOpen, fetchWardrobe]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceStatus('IDLE');
  }, []);

  const startListening = useCallback(() => {
    if (!isOpen) return;
    stopSpeaking();
    
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setAiMessage('Listening...');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLastTranscript(transcript);
      setIsListening(false);
      processIntent(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      if (isOpen) setTimeout(startListening, 3000);
    };

    recognition.start();
  }, [isOpen, stopSpeaking]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(startListening, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, startListening]);

  const processIntent = async (text: string) => {
    setIsProcessing(true);
    setAiMessage('Consulting Vault...');
    
    try {
      const result = await processVoiceAssistantIntent(text, closetItems, profile);
      setAiMessage(result.message);

      if (result.action === 'navigate' && result.path) {
        setTimeout(() => navigate(result.path), 2000);
      }

      await speakResponse(result.message);
    } catch (error: any) {
      setAiMessage("Style error! Try again?");
      if (isOpen) setTimeout(startListening, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakWithBrowser = (text: string) => {
    setVoiceStatus('STANDARD');
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isOpen) setTimeout(startListening, 600);
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakResponse = async (text: string) => {
    setIsSpeaking(true);
    try {
      const audioUrl = await textToSpeech(text);
      setVoiceStatus('PREMIUM');
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        if (isOpen) setTimeout(startListening, 600);
      };
      audio.onerror = () => speakWithBrowser(text);
      await audio.play();
    } catch (e) {
      speakWithBrowser(text);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-500 ${voiceStatus === 'PREMIUM' ? 'bg-indigo-600 scale-110 shadow-lg shadow-indigo-100' : 'bg-gray-400'}`}>
                <Wand2 size={20} className="text-white relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-900">Svel AI</span>
                <span className={`text-[8px] font-black uppercase tracking-widest leading-none ${voiceStatus === 'PREMIUM' ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {voiceStatus === 'PREMIUM' ? 'Stylist Online' : 'Standard Voice'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-rose-50 rounded-xl text-gray-300 hover:text-rose-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="min-h-[160px] flex flex-col justify-center text-center space-y-6">
            <div className="px-1">
              <p className={`text-base font-bold leading-relaxed transition-all duration-500 ${isSpeaking ? 'text-indigo-600 scale-105' : 'text-gray-700'}`}>
                {aiMessage || "What's in your closet today?"}
              </p>
            </div>
            
            <div className="flex justify-center h-10">
              {isSpeaking ? (
                <div className="flex items-end gap-1.5 pb-2">
                  {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                    <div key={i} className={`w-1 bg-indigo-600 rounded-full animate-bounce`} style={{ height: `${h * 6}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : isListening ? (
                <Mic size={32} className="text-rose-500 animate-pulse" />
              ) : isProcessing ? (
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" />
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2.5 h-2.5 bg-indigo-200 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              ) : (
                <div className="text-[10px] font-black text-gray-200 uppercase tracking-[0.4em]">Standby</div>
              )}
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group relative overflow-hidden ${
          isOpen ? 'bg-white text-indigo-600 border border-gray-100' : 'bg-indigo-600 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : (
          <div className="relative">
            <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center ring-4 ring-gray-50 animate-bounce">
               <Volume2 size={12} className="text-white" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;
