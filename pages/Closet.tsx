
import React, { useState, useEffect } from 'react';
import { supabase, uploadToCloudinary } from '../supabaseClient';
import { analyzeClothingImage } from '../geminiService';
import { Plus, Upload, Search, Filter, Tag, Trash2, Camera, Shirt } from 'lucide-react';
import { ClothingItem, UserProfile } from '../types';

interface ClosetProps {
  profile: UserProfile;
}

const Closet: React.FC<ClosetProps> = ({ profile }) => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('wardrobe').select().order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Detect dynamic MIME type
      const mimeType = file.type || 'image/jpeg';
      
      // 2. Convert to base64 for Gemini analysis
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      // 3. Gemini Analysis with dynamic MIME type
      const analysis = await analyzeClothingImage(base64, mimeType);

      // 4. Real Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // 5. Save to Supabase using 'wardrobe' table
      const newItem = {
        user_id: profile.id,
        image_url: imageUrl,
        category: analysis.category.toLowerCase(),
        tags: analysis.tags,
        created_at: new Date().toISOString()
      };

      const { data: savedItem, error } = await supabase.from('wardrobe').insert(newItem).select().single();
      if (error) throw error;
      
      setItems([savedItem as ClothingItem, ...items]);
    } catch (err) {
      console.error(err);
      alert('Failed to upload item. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.category === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Your Virtual Closet</h1>
          <p className="text-gray-500 dark:text-zinc-500">{items.length} items digitized</p>
        </div>
        
        <label className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white" /> : <Camera size={20} />}
          {uploading ? 'Analyzing Architecture...' : 'Add Item'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search your wardrobe..." 
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm dark:text-white transition-colors"
          />
        </div>
        <div className="flex gap-2 p-1 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-x-auto max-w-full">
          {['all', 'top', 'bottom', 'shoes', 'accessory'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${filter === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-square rounded-3xl bg-gray-200 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all overflow-hidden">
              <div className="aspect-square overflow-hidden bg-gray-50 dark:bg-zinc-800">
                <img src={item.image_url} alt="clothes" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold rounded uppercase tracking-tighter">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest">{item.category}</span>
                   <button 
                    onClick={async () => {
                      if (confirm('Delete this item?')) {
                        await supabase.from('wardrobe').delete().eq('id', item.id);
                        setItems(items.filter(i => i.id !== item.id));
                      }
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors"
                   >
                    <Trash2 size={14}/>
                   </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full text-gray-300 dark:text-zinc-700 mb-4">
                <Shirt size={40} />
              </div>
              <p className="text-gray-500 dark:text-zinc-500 font-medium">No items found in your {filter === 'all' ? 'wardrobe' : filter} yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Closet;
