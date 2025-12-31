/**
 * ElevenLabs API Integration Service
 * Converts stylist recommendations into high-quality digital speech.
 */

// Use Vite env variable for security, fallback to your hardcoded key if needed for dev
const ELEVENLABS_API_KEY: string = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'sk_f9b72a05ad1557eca8740b027eb757cbd96f13c474d0495b';
const INITIAL_ID = 'agent_6101kd44722eftmvah6gg25nm4x0';

/**
 * A prioritized list of fallback voice IDs known to be widely available.
 */
const FALLBACK_VOICES = [
  'pNInz6ov9K50u9CidVto', 
  'EXAVITQu4vr4xnSDxMaL', 
  'MF3mGyEYCl7XYW7LscS5', 
  '21m00Tcm4lpxqpxG29up'
];

let cachedVoiceId: string | null = null;
// REMOVED: isServiceBlocked variable so we don't permanently lock the app

/**
 * Resolves an Agent ID to a specific Voice ID for TTS usage.
 */
const resolveVoiceId = async (): Promise<string> => {
  if (cachedVoiceId) return cachedVoiceId;
  
  const id = INITIAL_ID;
  if (!id) return FALLBACK_VOICES[0];

  if (!id.startsWith('agent_')) {
    cachedVoiceId = id;
    return id;
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    });
    
    if (!response.ok) {
      cachedVoiceId = FALLBACK_VOICES[0]; 
      return cachedVoiceId;
    }

    const data = await response.json();
    const voiceId = 
      data.conversation_config?.tts?.voice_id || 
      data.conversation_config?.voice?.voice_id ||
      data.agent_config?.voice?.voice_id ||
      data.voice_id;
    
    cachedVoiceId = voiceId || FALLBACK_VOICES[0];
    return cachedVoiceId;
  } catch (e) {
    return FALLBACK_VOICES[0];
  }
};

/**
 * Main TTS function with automatic retry logic.
 * It no longer permanently blocks the service on error.
 */
export const textToSpeech = async (text: string, attempt: number = 0): Promise<string> => {
  if (!ELEVENLABS_API_KEY) throw new Error('MISSING_API_KEY');

  let currentVoiceId: string;
  if (attempt === 0) {
    currentVoiceId = await resolveVoiceId();
  } else {
    currentVoiceId = FALLBACK_VOICES[(attempt - 1) % FALLBACK_VOICES.length];
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${currentVoiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle "Unusual Activity" / Rate Limits
      if (errorData.detail?.status === 'detected_unusual_activity') {
        console.warn('ElevenLabs: Rate limit detected. Switching to System Voice for this utterance.');
        // We throw this specific error so the UI knows to use the browser backup
        throw new Error('SERVICE_RESTRICTED');
      }

      // Handle Voice Not Found errors by retrying with a fallback
      const isVoiceNotFound = 
        errorData.detail?.status === 'voice_not_found' || 
        JSON.stringify(errorData).toLowerCase().includes('not found');

      if (isVoiceNotFound && attempt <= FALLBACK_VOICES.length) {
        return textToSpeech(text, attempt + 1);
      }

      throw new Error(errorData.detail?.message || 'API_ERROR');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
    
  } catch (error: any) {
    // If we are restricted, pass the error up so the UI handles it
    if (error.message === 'SERVICE_RESTRICTED') throw error;
    
    // For other errors, try a fallback voice if we haven't exhausted them
    if (attempt <= FALLBACK_VOICES.length) return textToSpeech(text, attempt + 1);
    
    throw error;
  }
};
