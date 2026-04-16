'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface PostUser {
  id: string;
  name: string;
  image?: string | null;
}

interface Comment {
  id: string;
  content: string;
  user: PostUser;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  user: PostUser;
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500',
  'bg-emerald-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-orange-500',
];

function pickColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'upravo';
  if (mins < 60) return `prije ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `prije ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `prije ${days}d`;
  const months = Math.floor(days / 30);
  return `prije ${months}mj`;
}

// ── Avatar ───────────────────────────────────────────────────────────

function Avatar({ user, size = 'md' }: { user: PostUser; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  const letter = user.name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className={`${dim} rounded-full flex items-center justify-center text-white font-semibold ${pickColor(user.name)}`}>
      {letter}
    </div>
  );
}

// ── Comment Section ──────────────────────────────────────────────────

function CommentsSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get(`/posts/${postId}/comments`)
      .then((res) => { if (!cancelled) setComments(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: trimmed });
      setComments((prev) => [...prev, res.data]);
      setText('');
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-neutral-200 pt-3 mt-3 space-y-3">
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        </div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <Avatar user={c.user} size="sm" />
            <div className="flex-1 bg-neutral-100 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-neutral-800">{c.user.name}</span>
              <p className="text-sm text-neutral-700">{c.content}</p>
            </div>
          </div>
        ))
      )}

      {/* New comment input */}
      <div className="flex items-center gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder="Napiši komentar..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        <button
          onClick={submit}
          disabled={!text.trim() || submitting}
          className="btn-primary p-2 rounded-lg disabled:opacity-40"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Post Card ────────────────────────────────────────────────────────

function PostCard({ post, onLikeToggle }: { post: Post; onLikeToggle: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar user={post.user} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-800 truncate">{post.user.name}</p>
          <p className="text-xs text-neutral-500">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap mb-4">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-5 text-neutral-500 text-sm">
        <button
          onClick={() => onLikeToggle(post.id)}
          className="flex items-center gap-1.5 hover:text-rose-500 transition-colors"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${post.liked ? 'fill-rose-500 text-rose-500' : ''}`}
          />
          <span className={post.liked ? 'text-rose-500 font-medium' : ''}>{post.likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 hover:text-primary-500 transition-colors"
        >
          <MessageCircle className={`w-5 h-5 ${showComments ? 'text-primary-500' : ''}`} />
          <span className={showComments ? 'text-primary-500 font-medium' : ''}>{post.commentsCount}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentsSection postId={post.id} />}
    </div>
  );
}

// ── Right Sidebar ────────────────────────────────────────────────────

function RightSidebar() {
  const [medsCount, setMedsCount] = useState<number | null>(null);
  const [bp, setBp] = useState<{ systolic: number; diastolic: number } | null>(null);

  useEffect(() => {
    api.get('/medications?active=true')
      .then((res) => setMedsCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => {});
    api.get('/bp/stats/summary?days=7')
      .then((res) => { if (res.data?.latest) setBp(res.data.latest); })
      .catch(() => {});
  }, []);

  return (
    <aside className="space-y-4">
      {/* Health summary */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-800 mb-3">Danas</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Lijekovi</span>
            <span className="badge">{medsCount ?? '-'} podsjetnika</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Zadnji tlak</span>
            <span className="font-medium text-neutral-800">
              {bp ? `${bp.systolic}/${bp.diastolic}` : '-- / --'}
            </span>
          </div>
        </div>
      </div>

      {/* Friends */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-800 mb-3">Prijatelji</h3>
        <p className="text-sm text-neutral-500">Uskoro dostupno</p>
      </div>
    </aside>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  const hasMore = posts.length < total;

  // ── Fetch feed ──

  const loadFeed = useCallback(async (pageNum: number, append = false) => {
    try {
      const res = await api.get(`/posts/feed?page=${pageNum}`);
      const data = res.data;
      setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
      setTotal(data.total);
      setPage(data.page);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadFeed(1).finally(() => setLoading(false));
  }, [loadFeed]);

  // ── Create post ──

  const handlePublish = async () => {
    const trimmed = newPostContent.trim();
    if (!trimmed || publishing) return;
    setPublishing(true);
    try {
      const res = await api.post('/posts', { content: trimmed });
      setPosts((prev) => [res.data, ...prev]);
      setTotal((t) => t + 1);
      setNewPostContent('');
    } catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  };

  // ── Like toggle ──

  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p,
      ),
    );
    try {
      await api.post(`/posts/${postId}/like`);
    } catch {
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: !p.liked,
                likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p,
        ),
      );
    }
  };

  // ── Load more ──

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadFeed(page + 1, true);
    setLoadingMore(false);
  };

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex gap-6">
        {/* Feed column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Composer */}
          <div className="card">
            <div className="flex items-start gap-3">
              {user && (
                <Avatar
                  user={{ id: user.id ?? '', name: user.name ?? '', image: (user as any).image }}
                />
              )}
              <div className="flex-1">
                <textarea
                  className="input w-full resize-none text-sm"
                  rows={3}
                  placeholder="Što ima novog?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handlePublish}
                    disabled={!newPostContent.trim() || publishing}
                    className="btn-primary px-5 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    {publishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Objavi'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-neutral-500 text-sm">Još nema objava. Budi prvi!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onLikeToggle={handleLike} />
            ))
          )}

          {/* Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary px-6 py-2 text-sm font-medium"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Učitavam...
                  </span>
                ) : (
                  'Učitaj više'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
