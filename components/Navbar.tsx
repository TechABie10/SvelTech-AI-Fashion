
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shirt, Wand2, Users, User, Bell, Heart, MessageSquare, UserPlus, LogOut, X, Trash2, ChevronRight, Sun, Moon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Notification, UserProfile } from '../types';
import Logo from './Logo';

interface NavbarProps {
  profile: UserProfile;
  onLogout?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ profile, onLogout, isDark, onToggleTheme }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    const subscription = supabase
      .channel('notifications_tray')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${profile.id}` 
      }, 
        payload => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public', 
        table: 'notifications'
      }, 
        payload => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [profile.id]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (data) {
      const unique = data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setNotifications(unique);
    }
  };

  const markAsRead = async () => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch(e) {}
  };

  const dismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch(e) {}
  };

  const clearAllNotifications = async () => {
    if (!confirm("Permanently clear all notifications?")) return;
    try {
      await supabase.from('notifications').delete().eq('user_id', profile.id);
      setNotifications([]);
    } catch(e) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch(type) {
      case 'like': return <Heart size={14} className="text-rose-500" />;
      case 'comment': return <MessageSquare size={14} className="text-blue-500" />;
      case 'follow': return <UserPlus size={14} className="text-emerald-500" />;
      default: return <Bell size={14} className="text-gray-500 dark:text-zinc-400" />;
    }
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/closet', icon: <Shirt size={20} />, label: 'Closet' },
    { to: '/generator', icon: <Wand2 size={20} />, label: 'Stylist' },
    { to: '/community', icon: <Users size={20} />, label: 'Feed' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <>
      {/* Sidebar - Desktop */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-64 p-6 z-40 bg-white dark:bg-zinc-950 border-r border-gray-100 dark:border-zinc-800 flex-col justify-between shadow-[20px_0_60px_-15px_rgba(0,0,0,0.02)] transition-colors duration-300">
        <div className="space-y-10">
          <NavLink to="/" className="flex items-center gap-4 px-2">
            <Logo size="md" className="text-indigo-600" />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">SvelTech</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mt-1">AI Fashion</span>
            </div>
          </NavLink>

          <div className="space-y-2">
            <p className="px-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-zinc-600 mb-4">Lattice Menu</p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => 
                  `flex items-center justify-between group px-4 py-4 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none' 
                      : 'text-gray-500 dark:text-zinc-500 hover:bg-indigo-50 dark:hover:bg-zinc-900 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span className="transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                </div>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            ))}
          </div>

          <div className="pt-6 border-t border-gray-50 dark:border-zinc-900 space-y-4">
             <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-zinc-600">Updates</p>
                <button 
                  onClick={onToggleTheme}
                  className="p-2 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 rounded-xl hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>
             </div>
             <button 
              onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markAsRead(); }}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${showNotifications ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
            >
              <div className="flex items-center gap-3">
                <Bell size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Activity</span>
              </div>
              {unreadCount > 0 && (
                <span className="w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <NavLink 
            to="/profile" 
            className="flex items-center gap-3 p-3 rounded-[2rem] bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-indigo-600 overflow-hidden border border-gray-100 dark:border-zinc-700 shadow-sm transition-transform group-hover:scale-105">
              {profile.profile_image ? <img src={profile.profile_image} className="w-full h-full object-cover" /> : <User size={24} />}
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">{profile.name}</p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest truncate">Style Member</p>
            </div>
          </NavLink>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-4 text-gray-400 dark:text-zinc-600 hover:text-rose-500 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} /> Terminate
          </button>
        </div>
      </nav>

      {/* Mobile Header - Top */}
      <nav className="md:hidden fixed top-0 left-0 right-0 h-16 glass-effect z-40 border-b border-gray-100 dark:border-zinc-800 px-4 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3">
          <Logo size="sm" className="text-indigo-600" />
          <span className="text-lg font-black tracking-tighter text-indigo-900 dark:text-indigo-100">SvelTech</span>
        </NavLink>
        <div className="flex items-center gap-2">
           <button 
            onClick={onToggleTheme}
            className="p-2 text-gray-400 dark:text-zinc-500"
           >
             {isDark ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           <button 
            onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markAsRead(); }}
            className="p-2 text-gray-400 dark:text-zinc-500 relative"
           >
             <Bell size={20} />
             {unreadCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />}
           </button>
           <NavLink to="/profile" className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700">
             {profile.profile_image ? <img src={profile.profile_image} className="w-full h-full object-cover" /> : <User className="m-1 text-gray-400" size={16} />}
           </NavLink>
        </div>
      </nav>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-effect z-40 rounded-[2rem] border border-gray-200 dark:border-zinc-800 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `p-3 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 dark:text-zinc-500'}`
            }
          >
            {item.icon}
          </NavLink>
        ))}
      </nav>

      {/* Notifications Overlay */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 md:left-64 flex md:items-start items-center justify-center md:justify-start p-4 bg-black/5 dark:bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowNotifications(false)} />
          <div className="relative w-full max-sm:max-w-xs bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-none overflow-hidden animate-in zoom-in duration-200">
            <header className="p-8 border-b border-gray-50 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/50">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight">System Updates</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600">Lattice Alerts</p>
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <button onClick={clearAllNotifications} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => setShowNotifications(false)} className="p-2 text-gray-300 dark:text-zinc-600 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
                  <X size={16} />
                </button>
              </div>
            </header>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <Bell size={48} className="mx-auto mb-4 text-gray-100 dark:text-zinc-800" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-300 dark:text-zinc-700 italic">No activity detected</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-6 flex gap-4 group relative border-b border-gray-50 dark:border-zinc-800 last:border-0 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors ${!n.read ? 'bg-indigo-50/10 dark:bg-indigo-900/10' : ''}`}>
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-zinc-700 shadow-sm">
                      {n.actor_avatar ? <img src={n.actor_avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-indigo-200 bg-indigo-50 dark:bg-zinc-900"><User size={24}/></div>}
                    </div>
                    <div className="flex-grow pt-1">
                       <p className="text-xs text-gray-700 dark:text-zinc-300 leading-normal">
                          <span className="font-black text-gray-900 dark:text-white">{n.actor_name}</span> 
                          {n.type === 'like' && ' appreciated your aesthetic.'}
                          {n.type === 'comment' && ' added a thought to your post.'}
                          {n.type === 'follow' && ' started tracking your style.'}
                          {n.type === 'reply' && ' responded to your message.'}
                       </p>
                       <div className="mt-2 flex items-center gap-2">
                          {getIcon(n.type)}
                          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                    </div>
                    <button 
                      onClick={(e) => dismissNotification(n.id, e)}
                      className="p-1 text-gray-200 dark:text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-gray-50/50 dark:bg-zinc-800/50 flex justify-center">
               <button onClick={() => setShowNotifications(false)} className="px-8 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
