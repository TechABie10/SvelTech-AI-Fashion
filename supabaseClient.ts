
import { createClient } from '@supabase/supabase-js';

/**
 * Custom stylized logger for diagnostic debugging
 */
const latticeLog = (module: string, message: string, data?: any, isError: boolean = false) => {
  const color = isError ? '#ff4b4b' : '#10B981';
  console.log(
    `%c[Lattice ${module}]%c ${message}`,
    `color: white; background: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: bold;`,
    `color: ${color}; font-weight: medium;`,
    data || ''
  );
};

/**
 * Robust environment variable resolver with placeholder detection.
 */
const getSafeEnv = (key: string, fallback: string): string => {
  const env = (window as any).process?.env || {};
  const value = env[key];
  
  // Return fallback if value is missing or looks like a template placeholder
  if (!value || 
      value.trim() === '' || 
      value.includes('your-project') || 
      value.includes('your-anon') || 
      value.includes('YOUR_')) {
    return fallback;
  }
  return value;
};

/**
 * Public Fallback Credentials (Demo Project)
 */
const PUBLIC_DEMO_URL = 'https://ywwgtbzyescjmewvhzht.supabase.co';
const PUBLIC_DEMO_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3d2d0Ynp5ZXNjam1ld3Zoemh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjUwNjQsImV4cCI6MjA4MDEwMTA2NH0.slbnBokBNBIFjSjPfcW6GnCw6URhFwa1LPIHl4nhd18';

// Attempt to resolve from environment, else use public demo
const resolvedUrl = getSafeEnv('VITE_SUPABASE_URL', PUBLIC_DEMO_URL);
const resolvedKey = getSafeEnv('VITE_SUPABASE_ANON_KEY', PUBLIC_DEMO_KEY);

/**
 * Basic URL validation to avoid initializing with broken strings which causes fetch failures.
 */
const validateUrl = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

const finalUrl = validateUrl(resolvedUrl) ? resolvedUrl : PUBLIC_DEMO_URL;

// Diagnostic Log for Auth debugging
latticeLog('Config', `Initializing Supabase with endpoint: ${finalUrl}`);

// Initialize Supabase Client
export const supabase = createClient(finalUrl, resolvedKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Cloudinary Configuration with guaranteed fallbacks
 */
const CLOUDINARY_CLOUD_NAME = getSafeEnv('VITE_CLOUDINARY_CLOUD_NAME', 'dqvjbz1yx');
const CLOUDINARY_UPLOAD_PRESET = getSafeEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'svel_project');

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Includes defensive fetch handling to catch network errors gracefully.
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
    throw new Error('Cloudinary Cloud Name is not configured.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  latticeLog('Cloudinary', `Starting upload to: ${uploadUrl}`);

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // mode: 'cors' is default, but ensuring no custom headers conflict with Cloudinary CORS
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      latticeLog('Cloudinary', 'Server responded with error', errorData, true);
      throw new Error(`Cloudinary Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    latticeLog('Cloudinary', 'Upload successful', { url: data.secure_url });
    return data.secure_url;
  } catch (err: any) {
    latticeLog('Cloudinary', 'Critical network failure', { message: err.message, url: uploadUrl }, true);
    
    if (err.message === 'Failed to fetch') {
      throw new Error('Network Error: Could not reach Cloudinary servers. This may be due to a malformed URL, CORS issues, or your internet connection.');
    }
    throw err;
  }
};
