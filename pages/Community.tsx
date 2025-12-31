
import React, { useState, useEffect } from 'react';
import { supabase, uploadToCloudinary } from '../supabaseClient';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  UserPlus, 
  Send, 
  CornerDownRight, 
  X, 
  User, 
  Check, 
  Loader2,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { CommunityPost, UserProfile, Comment as CommentType } from '../types';

interface CommunityProps {
  profile: UserProfile;
}

const Community: React.FC<CommunityProps> = ({ profile }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [activePostComments, setActivePostComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommentType[]>>({});
  
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isCommentPosting, setIsCommentPosting] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; name: string } | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [newPost, setNewPost] = useState<{ caption: string; file: File | null }>({ caption: '', file: null });

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchPosts(), fetchUserLikes(), fetchFollowing()]);
      setLoading(false);
    };
    init();

    const channel = supabase
      .channel('community_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
        const updatedPost = payload.new as CommunityPost;
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, likes: updatedPost.likes, comments_count: updatedPost.comments_count } : p));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        const newPostData = payload.new as CommunityPost;
        setPosts(prev => {
          if (prev.some(p => p.id === newPostData.id)) return prev;
          return [newPostData, ...prev];
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
        const newComment = payload.new as CommentType;
        setComments(prev => {
          const postComments = prev[newComment.post_id] || [];
          if (postComments.some(c => c.id === newComment.id)) return prev;
          return { ...prev, [newComment.post_id]: [...postComments, newComment] };
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (payload) => {
        const deletedId = payload.old.id;
        setComments(prev => {
          const next: Record<string, CommentType[]> = {};
          Object.keys(prev).forEach(postId => {
            next[postId] = prev[postId].filter(c => c.id !== deletedId);
          });
          return next;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase.from('posts').select().order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (e: any) { console.error('Fetch posts error:', e.message); }
  };

  const fetchUserLikes = async () => {
    try {
      const { data } = await supabase.from('likes').select('post_id').eq('user_id', profile.id);
      if (data) setUserLikes(new Set(data.map(l => l.post_id)));
    } catch (e) { console.warn('Likes table might be missing'); }
  };

  const fetchFollowing = async () => {
    try {
      const { data } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
      if (data) setFollowingIds(new Set(data.map(f => f.following_id)));
    } catch (e) { console.warn('Follows table might be missing'); }
  };

  const createNotification = async (recipientId: string, type: string, postId?: string, commentId?: string) => {
    if (!recipientId || recipientId === profile.id) return;
    try {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .match({ 
          user_id: recipientId, 
          actor_id: profile.id, 
          type, 
          post_id: postId || null,
          comment_id: commentId || null,
          read: false 
        })
        .maybeSingle();

      if (existing) return;

      await supabase.from('notifications').insert({
        user_id: recipientId,
        actor_id: profile.id,
        actor_name: profile.name,
        actor_avatar: profile.profile_image,
        type,
        post_id: postId,
        comment_id: commentId
      });
    } catch (e) {}
  };

  const removeNotification = async (recipientId: string, type: string, postId?: string) => {
    if (!recipientId || recipientId === profile.id) return;
    try {
      await supabase.from('notifications').delete().match({
        user_id: recipientId,
        actor_id: profile.id,
        type,
        post_id: postId
      });
    } catch (e) {}
  };

  const handleLike = async (post: CommunityPost) => {
    const isLiked = userLikes.has(post.id);
    
    // OPTIMISTIC UI
    setUserLikes(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(post.id); else next.add(post.id);
      return next;
    });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 } : p));

    try {
      if (isLiked) {
        await supabase.from('likes').delete().match({ user_id: profile.id, post_id: post.id });
        await supabase.rpc('decrement_likes_count', { target_post_id: post.id });
        removeNotification(post.user_id, 'like', post.id);
      } else {
        await supabase.from('likes').insert({ user_id: profile.id, post_id: post.id });
        await supabase.rpc('increment_likes_count', { target_post_id: post.id });
        createNotification(post.user_id, 'like', post.id);
      }
    } catch (e: any) {
      setUserLikes(prev => {
        const next = new Set(prev);
        if (isLiked) next.add(post.id); else next.delete(post.id);
        return next;
      });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1 } : p));
    }
  };

  const handleComment = async (post: CommunityPost) => {
    const input = commentInputs[post.id]?.trim();
    if (!input || isCommentPosting[post.id]) return;

    setIsCommentPosting(prev => ({ ...prev, [post.id]: true }));
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments_count: p.comments_count + 1 } : p));

    const isReply = replyingTo?.postId === post.id;
    const payload = {
      post_id: post.id,
      user_id: profile.id,
      user_name: profile.name,
      user_avatar: profile.profile_image,
      content: input,
      parent_id: isReply ? replyingTo.commentId : null
    };

    try {
      const { data, error } = await supabase.from('comments').insert(payload).select().single();
      if (error) throw error;

      await supabase.rpc('increment_comments_count', { target_post_id: post.id });
      
      if (isReply) {
        const parent = (comments[post.id] || []).find(c => c.id === replyingTo.commentId);
        if (parent) createNotification(parent.user_id, 'reply', post.id, data.id);
      } else {
        createNotification(post.user_id, 'comment', post.id, data.id);
      }
      
      setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
      setReplyingTo(null);
    } catch (e: any) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments_count: p.comments_count - 1 } : p));
    } finally {
      setIsCommentPosting(prev => ({ ...prev, [post.id]: false }));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Permanently delete this comment?")) return;
    
    setComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
    }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count - 1 } : p));

    try {
      await supabase.from('comments').delete().eq('id', commentId);
      await supabase.rpc('decrement_comments_count', { target_post_id: postId });
    } catch (e) {
      fetchComments(postId);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (targetUserId === profile.id) return;
    const isFollowing = followingIds.has(targetUserId);
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().match({ follower_id: profile.id, following_id: targetUserId });
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        await supabase.from('follows').insert({ follower_id: profile.id, following_id: targetUserId });
        setFollowingIds(prev => new Set(prev).add(targetUserId));
        createNotification(targetUserId, 'follow');
      }
    } catch (e: any) {
      console.error('Follow failed:', e.message);
    }
  };

  const fetchComments = async (postId: string) => {
    if (activePostComments === postId) {
      setActivePostComments(null);
      setReplyingTo(null);
      return;
    }
    setActivePostComments(postId);
    setReplyingTo(null); 
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (e: any) {
      console.error('Fetch comments error:', e.message);
    }
  };

  const handleShare = async (post: CommunityPost) => {
    try {
      const url = `${window.location.origin}/#/community?post=${post.id}`;
      if (navigator.share) {
        await navigator.share({ title: 'SvelTech Style', url });
      } else {
        await navigator.clipboard.writeText(url);
        setSharing(post.id);
        setTimeout(() => setSharing(null), 2000);
      }
    } catch (e) { console.error('Share failed'); }
  };

  const handleCreatePost = async () => {
    if (!newPost.file || isCreatingPost) return;
    setIsCreatingPost(true);
    try {
      const url = await uploadToCloudinary(newPost.file);
      await supabase.from('posts').insert({
        user_id: profile.id,
        user_name: profile.name,
        user_avatar: profile.profile_image,
        image_url: url,
        caption: newPost.caption
      });
      setShowUpload(false);
      setNewPost({ caption: '', file: null });
    } catch (e: any) {
      alert(`Upload Failed: ${e.message}`);
    } finally {
      setIsCreatingPost(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing Community Feed</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Style Feed</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Global Inspiration Hub</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          <Plus size={18} />
          Publish Look
        </button>
      </header>

      {showUpload && (
        <div className="mx-4 p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-indigo-200 animate-in slide-in-from-top-4 duration-300 shadow-2xl shadow-indigo-50">
          <div className="flex flex-col items-center justify-center border-b border-gray-50 pb-6 mb-6">
             {newPost.file ? (
                <div className="w-full h-48 rounded-3xl overflow-hidden relative group">
                   <img src={URL.createObjectURL(newPost.file)} className="w-full h-full object-cover" />
                   <button onClick={() => setNewPost({...newPost, file: null})} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full"><X size={16}/></button>
                </div>
             ) : (
                <label className="w-full h-48 flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50 rounded-3xl hover:bg-indigo-50 transition-colors group">
                   <ImageIcon size={32} className="text-gray-300 group-hover:text-indigo-400" />
                   <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-indigo-600">Choose Outfit Photo</span>
                   <input type="file" accept="image/*" className="hidden" onChange={e => setNewPost({...newPost, file: e.target.files?.[0] || null})} />
                </label>
             )}
          </div>
          <textarea 
            placeholder="Tell us about this aesthetic..."
            className="w-full p-6 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6 font-medium text-gray-700 text-sm"
            rows={3}
            value={newPost.caption}
            onChange={e => setNewPost({...newPost, caption: e.target.value})}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowUpload(false)} className="px-6 py-2 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600">Cancel</button>
            <button 
              onClick={handleCreatePost} 
              disabled={!newPost.file || isCreatingPost}
              className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
            >
              {isCreatingPost && <Loader2 size={16} className="animate-spin" />}
              Publish
            </button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {posts.map((post) => {
          const postComments = comments[post.id] || [];
          const topLevelComments = postComments.filter(c => !c.parent_id);
          const replies = postComments.filter(c => c.parent_id);

          return (
            <div key={post.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 mx-4">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 overflow-hidden ring-4 ring-indigo-50 shadow-inner group-hover:ring-indigo-100 transition-all">
                    {post.user_avatar ? <img src={post.user_avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-indigo-200"><User size={20}/></div>}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm tracking-tight">{post.user_name}</h3>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Fashion Pioneer</p>
                  </div>
                </div>
                {post.user_id !== profile.id && (
                  <button 
                    onClick={() => handleFollow(post.user_id)} 
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      followingIds.has(post.user_id) 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                    }`}
                  >
                    {followingIds.has(post.user_id) ? <Check size={14} /> : <UserPlus size={14} />}
                  </button>
                )}
              </div>

              <div className="aspect-square bg-gray-50 overflow-hidden relative cursor-pointer" onDoubleClick={() => handleLike(post)}>
                 <img src={post.image_url} alt="outfit" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                 <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ${userLikes.has(post.id) ? 'scale-150 opacity-0' : 'scale-0 opacity-0'}`}>
                    <Heart size={80} className="fill-rose-500 text-rose-500" />
                 </div>
              </div>

              <div className="p-8">
                <div className="flex items-center gap-8 mb-6">
                  <button onClick={() => handleLike(post)} className="flex items-center gap-2 group/btn">
                    <Heart size={26} className={`transition-all duration-300 ${userLikes.has(post.id) ? 'fill-rose-500 text-rose-500 scale-125' : 'text-gray-300 group-hover/btn:text-rose-400'}`} />
                    <span className={`text-sm font-black ${userLikes.has(post.id) ? 'text-rose-500' : 'text-gray-400'}`}>{post.likes}</span>
                  </button>
                  <button onClick={() => fetchComments(post.id)} className="flex items-center gap-2 group/btn">
                    <MessageCircle size={26} className={`transition-all duration-300 ${activePostComments === post.id ? 'text-indigo-600' : 'text-gray-300 group-hover/btn:text-indigo-400'}`} />
                    <span className={`text-sm font-black ${activePostComments === post.id ? 'text-indigo-600' : 'text-gray-400'}`}>{post.comments_count}</span>
                  </button>
                  <button onClick={() => handleShare(post)} className="ml-auto text-gray-300 hover:text-indigo-600 transition-colors flex items-center gap-2 relative">
                    {sharing === post.id ? <Check size={26} className="text-emerald-500" /> : <Share2 size={26} />}
                  </button>
                </div>

                <p className="text-gray-600 text-sm font-medium leading-relaxed">
                  <span className="font-black text-gray-900 mr-2">{post.user_name}</span>
                  {post.caption}
                </p>

                {activePostComments === post.id && (
                  <div className="mt-8 pt-8 border-t border-gray-50 space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {topLevelComments.length === 0 ? (
                        <p className="text-center text-gray-300 text-[10px] font-black uppercase py-4 tracking-widest italic">No commentary yet</p>
                      ) : (
                        topLevelComments.map((comment) => (
                          <div key={comment.id} className="space-y-4">
                            <div className="flex gap-3 animate-in fade-in">
                               <div className="w-8 h-8 rounded-xl bg-indigo-50 flex-shrink-0 overflow-hidden border border-white shadow-sm">
                                 {comment.user_avatar ? <img src={comment.user_avatar} className="w-full h-full object-cover" /> : <User size={16} className="m-2 text-indigo-200"/>}
                               </div>
                               <div className="flex-grow group/msg">
                                  <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 relative">
                                     <div className="flex justify-between items-start mb-1 gap-2">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black uppercase text-gray-900 truncate">{comment.user_name}</span>
                                          <span className="text-[8px] font-bold text-gray-300">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        {comment.user_id === profile.id && (
                                          <button 
                                            onClick={() => handleDeleteComment(post.id, comment.id)}
                                            className="text-gray-300 hover:text-rose-500 transition-colors p-1"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        )}
                                     </div>
                                     <p className="text-xs text-gray-600 font-medium leading-normal whitespace-pre-wrap">{comment.content}</p>
                                     <button 
                                        onClick={() => setReplyingTo({ postId: post.id, commentId: comment.id, name: comment.user_name })}
                                        className="absolute -bottom-6 right-0 text-[8px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 hover:text-indigo-600"
                                     >
                                        <CornerDownRight size={10} /> Reply
                                     </button>
                                  </div>
                               </div>
                            </div>
                            
                            {replies.filter(r => r.parent_id === comment.id).map(reply => (
                              <div key={reply.id} className="ml-10 border-l-2 border-indigo-50 pl-4 animate-in fade-in slide-in-from-left-2">
                                <div className="flex gap-3 group/reply">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-50 overflow-hidden flex-shrink-0">
                                     {reply.user_avatar ? <img src={reply.user_avatar} className="w-full h-full object-cover" /> : <User size={12} className="m-1.5 text-indigo-200"/>}
                                  </div>
                                  <div className="bg-indigo-50/30 rounded-2xl rounded-tl-none p-3 flex-grow relative">
                                     <div className="flex justify-between items-start mb-1 gap-2">
                                        <span className="text-[9px] font-black uppercase text-indigo-600 truncate">{reply.user_name}</span>
                                        {reply.user_id === profile.id && (
                                          <button 
                                            onClick={() => handleDeleteComment(post.id, reply.id)}
                                            className="text-indigo-200 hover:text-rose-500 transition-colors p-1"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        )}
                                     </div>
                                     <p className="text-[11px] text-gray-600 font-medium leading-normal whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="relative mt-8">
                      {replyingTo?.postId === post.id && (
                        <div className="mb-2 flex items-center justify-between bg-indigo-600 text-white px-4 py-2 rounded-xl border border-indigo-700 animate-in slide-in-from-bottom-2 duration-300">
                          <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                             <CornerDownRight size={12} /> Replying to {replyingTo.name}
                          </span>
                          <button onClick={() => setReplyingTo(null)} className="text-white/70 hover:text-white"><X size={14}/></button>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white overflow-hidden shadow-lg shadow-indigo-100">
                           {profile.profile_image ? <img src={profile.profile_image} className="w-full h-full object-cover" /> : <User size={20} />}
                         </div>
                         <div className="flex-grow relative">
                            <textarea 
                              placeholder={replyingTo?.postId === post.id ? `Your reply...` : "Share a thought..."}
                              className={`w-full pl-6 pr-14 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-gray-700 transition-all shadow-inner resize-none overflow-hidden overflow-y-auto`}
                              style={{ height: commentInputs[post.id] ? `${Math.min(120, (commentInputs[post.id].split('\n').length * 20) + 24)}px` : '44px' }}
                              value={commentInputs[post.id] || ''}
                              disabled={isCommentPosting[post.id]}
                              onChange={(e) => {
                                 setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleComment(post);
                                }
                              }}
                            />
                            <button 
                              onClick={() => handleComment(post)}
                              disabled={!commentInputs[post.id]?.trim() || isCommentPosting[post.id]}
                              className="absolute right-2 bottom-1.5 p-2.5 text-indigo-600 hover:text-indigo-800 disabled:opacity-30 transition-all"
                            >
                              {isCommentPosting[post.id] ? <Loader2 size={16} className="animate-spin" /> : <Send size={18} />}
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Community;
