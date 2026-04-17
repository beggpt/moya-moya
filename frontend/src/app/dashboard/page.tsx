'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  Plus, MessageSquare, Pin, Heart, Send, Loader2,
  Pill, Activity, Users, ChevronRight, X
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// ── Types ──

type ForumCategory = 'GENERAL' | 'SYMPTOMS' | 'TREATMENT' | 'SURGERY' | 'LIFESTYLE' | 'MENTAL_HEALTH' | 'CAREGIVERS' | 'RESEARCH';

interface Topic {
  id: string;
  title: string;
  content: string;
  category: ForumCategory;
  pinned: boolean;
  createdAt: string;
  user: { id: string; name: string; image?: string };
  _count: { comments: number };
}

interface Post {
  id: string;
  content: string;
  user: { id: string; name: string; image?: string | null };
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

interface PostComment {
  id: string;
  content: string;
  user: { id: string; name: string; image?: string | null };
  createdAt: string;
}

// ── Constants ──

const CATEGORY_LABELS: Record<ForumCategory, string> = {
  GENERAL: 'General', SYMPTOMS: 'Symptoms', TREATMENT: 'Treatment',
  SURGERY: 'Surgery', LIFESTYLE: 'Lifestyle', MENTAL_HEALTH: 'Mental health',
  CAREGIVERS: 'Caregivers', RESEARCH: 'Research',
};

const CATEGORY_COLORS: Record<ForumCategory, string> = {
  GENERAL: 'bg-neutral-100 text-neutral-700', SYMPTOMS: 'bg-red-100 text-red-700',
  TREATMENT: 'bg-blue-100 text-blue-700', SURGERY: 'bg-purple-100 text-purple-700',
  LIFESTYLE: 'bg-green-100 text-green-700', MENTAL_HEALTH: 'bg-amber-100 text-amber-700',
  CAREGIVERS: 'bg-pink-100 text-pink-700', RESEARCH: 'bg-cyan-100 text-cyan-700',
};

const CATEGORY_TABS: { label: string; value: ForumCategory | '' }[] = [
  { label: 'All', value: '' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Symptoms', value: 'SYMPTOMS' },
  { label: 'Treatment', value: 'TREATMENT' },
  { label: 'Surgery', value: 'SURGERY' },
  { label: 'Lifestyle', value: 'LIFESTYLE' },
  { label: 'Mental', value: 'MENTAL_HEALTH' },
  { label: 'Caregivers', value: 'CAREGIVERS' },
  { label: 'Research', value: 'RESEARCH' },
];

const AVATAR_COLORS = [
  'bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500',
  'bg-emerald-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-orange-500',
];

function pickColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Components ──

function Avatar({ user, size = 'md' }: { user: { name: string; image?: string | null }; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (user.image) return <img src={user.image} alt={user.name} className={`${dim} rounded-full object-cover`} />;
  return (
    <div className={`${dim} rounded-full flex items-center justify-center text-white font-semibold ${pickColor(user.name)}`}>
      {user.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/posts/${postId}/comments`).then((r) => setComments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [postId]);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text.trim() });
      setComments((prev) => [...prev, res.data]);
      setText('');
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="border-t border-neutral-200 pt-3 mt-3 space-y-3">
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400 mx-auto" /> : comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <Avatar user={c.user} size="sm" />
          <div className="flex-1 bg-neutral-100 rounded-xl px-3 py-2">
            <Link href={`/user/${c.user.id}`} className="text-xs font-semibold text-neutral-800 hover:text-primary-600">{c.user.name}</Link>
            <p className="text-sm text-neutral-700">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input className="input flex-1 text-sm" placeholder="Write a comment..." value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        />
        <button onClick={submit} disabled={!text.trim() || submitting} className="btn-primary p-2 rounded-lg disabled:opacity-40">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <Avatar user={post.user} />
        <div className="flex-1 min-w-0">
          <Link href={`/user/${post.user.id}`} className="text-sm font-semibold text-neutral-800 hover:text-primary-600">{post.user.name}</Link>
          <p className="text-xs text-neutral-500">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: enUS })}</p>
        </div>
      </div>
      <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
      <div className="flex items-center gap-5 text-neutral-500 text-sm">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
          <Heart className={`w-5 h-5 ${post.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className={post.liked ? 'text-rose-500 font-medium' : ''}>{post.likesCount}</span>
        </button>
        <button onClick={() => setShowComments((v) => !v)} className="flex items-center gap-1.5 hover:text-primary-500 transition-colors">
          <MessageSquare className={`w-5 h-5 ${showComments ? 'text-primary-500' : ''}`} />
          <span className={showComments ? 'text-primary-500 font-medium' : ''}>{post.commentsCount}</span>
        </button>
      </div>
      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
}

// ── Right Sidebar ──

function RightSidebar() {
  const { user } = useAuthStore();
  const [meds, setMeds] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [symptomsCount, setSymptomsCount] = useState(0);

  useEffect(() => {
    api.get('/medications?active=true').then((r) => setMeds(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/friends').then((r) => setFriends(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/symptoms?limit=1').then((r) => setSymptomsCount(r.data?.total || 0)).catch(() => {});
  }, []);

  const markTaken = async (medId: string) => {
    try {
      await api.post(`/medications/${medId}/taken`);
      setMeds((prev) => prev.map((m) => m.id === medId ? { ...m, _takenToday: true } : m));
    } catch {}
  };

  return (
    <aside className="space-y-4">
      {/* My health card */}
      <div className="card">
        <h3 className="text-sm font-bold text-neutral-800 mb-3">My health</h3>
        <div className="space-y-3">
          <Link href="/medications" className="flex items-center justify-between text-sm hover:bg-neutral-50 -mx-2 px-2 py-1 rounded-lg">
            <span className="flex items-center gap-2 text-neutral-600"><Pill size={16} /> Medications</span>
            <span className="badge bg-primary-50 text-primary-700">{meds.length}</span>
          </Link>
          <Link href="/symptoms" className="flex items-center justify-between text-sm hover:bg-neutral-50 -mx-2 px-2 py-1 rounded-lg">
            <span className="flex items-center gap-2 text-neutral-600"><Activity size={16} /> Symptoms</span>
            <span className="badge">{symptomsCount}</span>
          </Link>
          <Link href="/friends" className="flex items-center justify-between text-sm hover:bg-neutral-50 -mx-2 px-2 py-1 rounded-lg">
            <span className="flex items-center gap-2 text-neutral-600"><Users size={16} /> Friends</span>
            <span className="badge">{friends.length}</span>
          </Link>
        </div>
      </div>

      {/* Today's meds */}
      {meds.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-neutral-800 mb-3">Today's medications</h3>
          <div className="space-y-2">
            {meds.slice(0, 5).map((med) => (
              <div key={med.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{med.name}</p>
                  <p className="text-xs text-neutral-500">{med.dosage}{med.unit} · {med.frequency}</p>
                </div>
                {med._takenToday ? (
                  <span className="text-xs text-green-600 font-medium">Taken ✓</span>
                ) : (
                  <button onClick={() => markTaken(med.id)} className="text-xs text-primary-600 font-medium hover:text-primary-700">
                    Take ✓
                  </button>
                )}
              </div>
            ))}
            {meds.length > 5 && (
              <Link href="/medications" className="text-xs text-primary-600 flex items-center gap-1">
                See all <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Friends preview */}
      {friends.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-neutral-800 mb-3">Friends</h3>
          <div className="space-y-2">
            {friends.slice(0, 4).map((f: any) => (
              <Link key={f.id} href={`/user/${f.id}`} className="flex items-center gap-2 hover:bg-neutral-50 -mx-2 px-2 py-1 rounded-lg">
                <Avatar user={f} size="sm" />
                <span className="text-sm text-neutral-700 truncate">{f.name}</span>
              </Link>
            ))}
            {friends.length > 4 && (
              <Link href="/friends" className="text-xs text-primary-600 flex items-center gap-1">
                All friends <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Main Page ──

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'forum' | 'objave'>('forum');
  const [category, setCategory] = useState<ForumCategory | ''>('');

  // Forum state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsTotal, setTopicsTotal] = useState(0);
  const [topicsPage, setTopicsPage] = useState(1);
  const [topicsLoading, setTopicsLoading] = useState(true);

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);

  // Composer
  const [newPostContent, setNewPostContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  // New topic modal
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [topicCategory, setTopicCategory] = useState<ForumCategory>('GENERAL');
  const [topicSaving, setTopicSaving] = useState(false);

  // Load forum topics
  useEffect(() => {
    if (tab !== 'forum') return;
    setTopicsLoading(true);
    const params: any = { page: topicsPage, limit: 15 };
    if (category) params.category = category;
    api.get('/forum/topics', { params })
      .then((r) => { setTopics(r.data.topics); setTopicsTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setTopicsLoading(false));
  }, [tab, topicsPage, category]);

  // Load posts
  useEffect(() => {
    if (tab !== 'objave') return;
    setPostsLoading(true);
    api.get(`/posts/feed?page=${postsPage}`)
      .then((r) => { setPosts((prev) => postsPage === 1 ? r.data.posts : [...prev, ...r.data.posts]); setPostsTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, [tab, postsPage]);

  const handlePublishPost = async () => {
    if (!newPostContent.trim() || publishing) return;
    setPublishing(true);
    try {
      const res = await api.post('/posts', { content: newPostContent.trim() });
      setPosts((prev) => [res.data, ...prev]);
      setPostsTotal((t) => t + 1);
      setNewPostContent('');
    } catch {} finally { setPublishing(false); }
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 } : p));
    try { await api.post(`/posts/${postId}/like`); } catch {
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 } : p));
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicContent.trim()) return;
    setTopicSaving(true);
    try {
      await api.post('/forum/topics', { title: topicTitle, content: topicContent, category: topicCategory });
      setShowTopicModal(false);
      setTopicTitle(''); setTopicContent(''); setTopicCategory('GENERAL');
      setTopicsPage(1);
      // Re-fetch
      const params: any = { page: 1, limit: 15 };
      if (category) params.category = category;
      const r = await api.get('/forum/topics', { params });
      setTopics(r.data.topics); setTopicsTotal(r.data.total);
    } catch {} finally { setTopicSaving(false); }
  };

  const topicsTotalPages = Math.ceil(topicsTotal / 15);

  return (
    <div className="max-w-6xl">
      <div className="flex gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 truncate">
                {user?.name ? `Hi, ${user.name.split(' ')[0]}!` : 'Home'}
              </h1>
              <p className="text-neutral-500 text-xs md:text-sm truncate">
                {format(new Date(), 'EEEE, MMMM d, yyyy', { locale: enUS })}
              </p>
            </div>
            <button onClick={() => setShowTopicModal(true)} className="btn-primary shrink-0 px-3 md:px-6">
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">New topic</span>
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 mb-4 border-b border-neutral-200">
            <button
              onClick={() => setTab('forum')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'forum' ? 'border-primary-500 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Forum
            </button>
            <button
              onClick={() => setTab('objave')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'objave' ? 'border-primary-500 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Posts
            </button>
          </div>

          {/* Forum tab */}
          {tab === 'forum' && (
            <>
              {/* Category filter */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {CATEGORY_TABS.map((t) => (
                  <button key={t.value || 'all'} onClick={() => { setCategory(t.value as ForumCategory | ''); setTopicsPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      category === t.value ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Topics */}
              <div className="space-y-2">
                {topicsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                ) : topics.length === 0 ? (
                  <div className="card text-center py-12">
                    <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 mb-4">No topics in this category</p>
                    <button onClick={() => setShowTopicModal(true)} className="btn-primary">
                      <Plus className="w-5 h-5 mr-2" /> Start the first topic
                    </button>
                  </div>
                ) : (
                  topics.map((topic) => (
                    <div key={topic.id} onClick={() => router.push(`/forum/${topic.id}`)}
                      className="card hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4"
                    >
                      <Link href={`/user/${topic.user.id}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <Avatar user={topic.user} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {topic.pinned && <Pin className="w-4 h-4 text-primary-500 shrink-0" />}
                          <h3 className="font-semibold text-neutral-900">{topic.title}</h3>
                        </div>
                        <p className="text-sm text-neutral-600 line-clamp-2 mb-2">{topic.content}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                          <Link href={`/user/${topic.user.id}`} onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary-600 font-medium">{topic.user.name}</Link>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true, locale: enUS })}</span>
                          <span className={`badge text-xs ${CATEGORY_COLORS[topic.category]}`}>
                            {CATEGORY_LABELS[topic.category]}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-neutral-400 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{topic._count.comments}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {topicsTotalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button onClick={() => setTopicsPage((p) => Math.max(1, p - 1))} disabled={topicsPage === 1} className="btn-ghost text-sm">
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-neutral-600">
                    {topicsPage} / {topicsTotalPages}
                  </span>
                  <button onClick={() => setTopicsPage((p) => Math.min(topicsTotalPages, p + 1))} disabled={topicsPage >= topicsTotalPages} className="btn-ghost text-sm">
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Posts tab */}
          {tab === 'objave' && (
            <div className="space-y-4">
              {/* Composer */}
              <div className="card">
                <div className="flex items-start gap-3">
                  {user && <Avatar user={{ name: user.name || '', image: (user as any).image }} />}
                  <div className="flex-1">
                    <textarea className="input w-full resize-none text-sm" rows={3} placeholder="What's new?"
                      value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <button onClick={handlePublishPost} disabled={!newPostContent.trim() || publishing}
                        className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-40">
                        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {postsLoading && postsPage === 1 ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : posts.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-neutral-500 text-sm">No posts yet. Be the first!</p>
                </div>
              ) : (
                posts.map((post) => <PostCard key={post.id} post={post} onLike={handleLike} />)
              )}

              {posts.length < postsTotal && (
                <div className="flex justify-center pt-2 pb-6">
                  <button onClick={() => setPostsPage((p) => p + 1)} disabled={postsLoading}
                    className="btn-secondary px-6 py-2 text-sm font-medium">
                    {postsLoading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</span> : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <RightSidebar />
        </div>
      </div>

      {/* New Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">New topic</h2>
              <button onClick={() => setShowTopicModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="space-y-5">
              <div>
                <label className="label">Title</label>
                <input type="text" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} className="input" placeholder="Topic title..." required />
              </div>
              <div>
                <label className="label">Category</label>
                <select value={topicCategory} onChange={(e) => setTopicCategory(e.target.value as ForumCategory)} className="input">
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Content</label>
                <textarea value={topicContent} onChange={(e) => setTopicContent(e.target.value)} className="input min-h-[140px]" rows={5} placeholder="Write your topic..." required />
              </div>
              <button type="submit" disabled={topicSaving} className="btn-primary w-full">
                {topicSaving ? 'Publishing...' : 'Publish topic'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
