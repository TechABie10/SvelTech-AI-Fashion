
import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadToCloudinary } from '../supabaseClient';
import { UserProfile } from '../types';
import { Edit2, Camera, User as UserIcon, Users, UserCheck, LogOut, Loader2, Sparkles, AlertTriangle, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onUpdate, onLogout }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [counts, setCounts] = useState({ 
    followers: 0, 
    following: 0, 
    posts: 0, 
    wardrobe: 0 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfileStats();
  }, [profile.id]);

  const fetchProfileStats = async () => {
    try {
      const [followers, following, posts, wardrobe] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('wardrobe').select('*', { count: 'exact', head: true }).eq('user_id', profile.id)
      ]);

      setCounts({
        followers: followers.count || 0,
        following: following.count || 0,
        posts: posts.count || 0,
        wardrobe: wardrobe.count || 0
      });
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase.from('users').upsert(formData);
      if (error) throw error;
      onUpdate(formData);
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert("Failed to update profile.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, profile_image: url }));
      
      if (!editing) {
        const { error } = await supabase.from('users').update({ profile_image: url }).eq('id', profile.id);
        if (error) throw error;
        onUpdate({ ...profile, profile_image: url });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setImageUploading(false);
    }
  };

  const updateMeasurement = (key: string, val: any) => {
    setFormData({
      ...formData,
      measurements: { ...formData.measurements, [key]: val }
    });
  };

  // const handleDeleteAccount = async () => {
  //   setIsDeleting(true);
  //   try {
  //     // 1. Delete the public user record first
  //     const { error: deleteError } = await supabase
  //       .from('users')
  //       .delete()
  //       .eq('id', profile.id);

  //     if (deleteError) throw deleteError;

  //     // 2. Clear Auth Session
  //     await supabase.auth.signOut();
      
  //     // 3. Clear local storage and redirect
  //     localStorage.removeItem('theme');
      
  //   } catch (e: any) {
  //     console.error("Purge Error:", e);
  //     alert("Encountered an issue during identity wipe: " + e.message);
  //   } finally {
  //     setIsDeleting(false);
  //     setShowDeleteModal(false);
  //   }
  // };
const handleDeleteAccount = async () => {
  setIsDeleting(true);
  try {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: profile.id },
    });

    if (error) throw error;

    await supabase.auth.signOut();
    localStorage.removeItem('theme');

    navigate('/auth', { replace: true });
  } catch (e: any) {
    console.error('Purge Error:', e);
    alert('Account deletion failed: ' + e.message);
  } finally {
    setIsDeleting(false);
    setShowDeleteModal(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-zinc-800 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50" />
        
        <div className="absolute top-0 right-0 p-8 z-10">
          <button 
            onClick={() => editing ? handleSave() : setEditing(true)} 
            disabled={imageUploading}
            className={`px-6 py-3 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2 ${editing ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'}`}
          >
            {editing ? <Sparkles size={16} /> : <Edit2 size={16} />}
            {editing ? 'Confirm Changes' : 'Refine Identity'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 mb-12 relative z-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden ring-8 ring-indigo-50 dark:ring-zinc-800 bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center shadow-2xl transition-all duration-500">
              {imageUploading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
                  <Loader2 className="animate-spin text-indigo-600" />
                </div>
              )}
              {formData.profile_image ? (
                <img src={formData.profile_image} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={80} className="text-indigo-200 dark:text-zinc-700" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl border-4 border-white dark:border-zinc-900 shadow-lg"
            >
              <Camera size={20} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          
          <div className="text-center md:text-left space-y-4">
            <div>
              {editing ? (
                <input 
                  type="text" 
                  className="text-4xl font-black text-gray-900 dark:text-white border-b-4 border-indigo-600 outline-none w-full bg-transparent py-1"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              ) : (
                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{profile.name}</h1>
              )}
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">Style Member</span>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{counts.followers}</p>
                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest">Followers</p>
              </div>
              <div className="w-px h-8 bg-gray-100 dark:bg-zinc-800" />
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{counts.wardrobe}</p>
                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest">Vault Items</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <UserCheck size={14} className="text-indigo-400" />
              Calibration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Height', key: 'height', unit: 'cm' },
                { label: 'Weight', key: 'weight', unit: 'kg' },
                { label: 'Chest', key: 'chest', unit: 'cm' },
                { label: 'Waist', key: 'waist', unit: 'cm' },
                { label: 'Foot', key: 'foot_size', unit: 'EU' },
                { label: 'Age', key: 'age', unit: 'yrs' },
              ].map(field => (
                <div key={field.key} className="p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-3xl flex flex-col border border-gray-100 dark:border-zinc-800">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-black uppercase tracking-widest mb-1">{field.label}</span>
                  {editing ? (
                    <input 
                      type="number" 
                      className="bg-transparent font-black text-indigo-600 dark:text-indigo-400 outline-none text-xl"
                      value={(formData.measurements as any)[field.key] || ''}
                      onChange={e => updateMeasurement(field.key, e.target.value)}
                    />
                  ) : (
                    <span className="text-2xl font-black text-gray-800 dark:text-zinc-200 tracking-tight">
                      {(profile.measurements as any)[field.key] || '--'} 
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <Users size={14} className="text-indigo-400" />
              Preferences
            </h3>
            <div className="flex flex-wrap gap-3">
              {(editing ? formData.preferences : profile.preferences)?.map(style => (
                <span key={style} className="px-5 py-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100/50">
                  {style}
                  {editing && (
                    <button onClick={() => setFormData({...formData, preferences: formData.preferences.filter(s => s !== style)})} className="ml-2 text-rose-500 font-black">×</button>
                  )}
                </span>
              ))}
            </div>
            <div className="pt-8 border-t border-gray-50 dark:border-zinc-800">
               <button onClick={onLogout} className="w-full py-4 bg-gray-50 dark:bg-zinc-800 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-gray-100 dark:border-zinc-700">
                 <LogOut size={16} /> Terminate Session
               </button>
            </div>
          </section>
        </div>
      </div>

      <section className="bg-rose-50/30 dark:bg-rose-950/10 rounded-[2.5rem] p-8 md:p-12 border border-rose-100/50 dark:border-rose-900/20">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
               <h3 className="text-2xl font-black text-rose-600 dark:text-rose-500 tracking-tighter uppercase flex items-center gap-2 justify-center md:justify-start">
                 <AlertTriangle size={24} /> Danger Zone
               </h3>
               <p className="text-rose-400/80 dark:text-rose-900/40 font-bold text-xs uppercase tracking-widest max-w-sm">
                 Permanently purge your identity and credentials. This is irreversible.
               </p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-10 py-5 bg-rose-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-xl"
            >
              Wipe Account
            </button>
         </div>
      </section>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900 rounded-[3rem] p-10 text-center space-y-6 animate-in zoom-in duration-300 shadow-2xl">
             <div className="flex justify-center">
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center">
                   <AlertTriangle size={40} />
                </div>
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Scorched Earth</h2>
                <p className="text-gray-400 dark:text-zinc-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                  Permanently delete everything?
                </p>
             </div>
             <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-100 dark:shadow-none"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  Execute Wipe
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 rounded-2xl font-black uppercase text-xs tracking-widest">
                  Cancel
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
