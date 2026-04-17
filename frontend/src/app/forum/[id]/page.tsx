'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Reply,
  Pin,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type ForumCategory =
  | 'GENERAL'
  | 'SYMPTOMS'
  | 'TREATMENT'
  | 'SURGERY'
  | 'LIFESTYLE'
  | 'MENTAL_HEALTH'
  | 'CAREGIVERS'
  | 'RESEARCH';

interface TopicUser {
  id: string;
  name: string;
  image?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: TopicUser;
  parentId: string | null;
  replies?: Comment[];
}

interface Topic {
  id: string;
  title: string;
  content: string;
  category: ForumCategory;
  pinned: boolean;
  createdAt: string;
  user: TopicUser;
  comments: Comment[];
  _count: { comments: number };
}

const CATEGORY_LABELS: Record<ForumCategory, string> = {
  GENERAL: 'Opcenito',
  SYMPTOMS: 'Simptomi',
  TREATMENT: 'Lijecenje',
  SURGERY: 'Operacija',
  LIFESTYLE: 'Zivotni stil',
  MENTAL_HEALTH: 'Mentalno zdravlje',
  CAREGIVERS: 'Skrbnici',
  RESEARCH: 'Istrazivanje',
};

const CATEGORY_COLORS: Record<ForumCategory, string> = {
  GENERAL: 'bg-neutral-100 text-neutral-700',
  SYMPTOMS: 'bg-red-100 text-red-700',
  TREATMENT: 'bg-blue-100 text-blue-700',
  SURGERY: 'bg-purple-100 text-purple-700',
  LIFESTYLE: 'bg-green-100 text-green-700',
  MENTAL_HEALTH: 'bg-amber-100 text-amber-700',
  CAREGIVERS: 'bg-pink-100 text-pink-700',
  RESEARCH: 'bg-cyan-100 text-cyan-700',
};

function UserAvatar({ user, size = 'md' }: { user: TopicUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold shrink-0`}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  replyingTo,
  isNested = false,
}: {
  comment: Comment;
  onReply: (id: string) => void;
  replyingTo: string | null;
  isNested?: boolean;
}) {
  return (
    <div className={isNested ? 'ml-12 mt-3' : ''}>
      <div className="flex items-start gap-3">
        <UserAvatar user={comment.user} size={isNested ? 'sm' : 'md'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/user/${comment.user.id}`} className="font-medium text-neutral-800 text-sm hover:text-primary-600">
              {comment.user.name}
            </Link>
            <span className="text-xs text-neutral-400">
              {format(new Date(comment.createdAt), 'd.M.yyyy HH:mm', {
                locale: hr,
              })}
            </span>
          </div>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">
            {comment.content}
          </p>
          {!isNested && (
            <button
              onClick={() => onReply(comment.id)}
              className={`flex items-center gap-1 text-xs mt-2 transition-colors ${
                replyingTo === comment.id
                  ? 'text-primary-600 font-medium'
                  : 'text-neutral-400 hover:text-primary-500'
              }`}
            >
              <Reply className="w-3 h-3" /> Odgovori
            </button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies &&
        comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            onReply={onReply}
            replyingTo={replyingTo}
            isNested
          />
        ))}
    </div>
  );
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/forum/topics/${topicId}`);
      setTopic(data);
    } catch (error) {
      console.error('Greska pri ucitavanju teme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/forum/topics/${topicId}/comments`, {
        content: commentText,
        parentId: replyingTo || undefined,
      });
      setCommentText('');
      setReplyingTo(null);
      loadTopic();
    } catch (error) {
      console.error('Greska pri slanju komentara:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  // Organize comments into threaded structure
  const organizeComments = (comments: Comment[]): Comment[] => {
    const topLevel: Comment[] = [];
    const repliesMap: Record<string, Comment[]> = {};

    for (const c of comments) {
      if (c.parentId) {
        if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
        repliesMap[c.parentId].push(c);
      } else {
        topLevel.push(c);
      }
    }

    return topLevel.map((c) => ({
      ...c,
      replies: repliesMap[c.id] || [],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => router.push('/forum')} className="btn-ghost mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Nazad na forum
        </button>
        <div className="card text-center py-12">
          <p className="text-neutral-500">Tema nije pronadena</p>
        </div>
      </div>
    );
  }

  const threadedComments = organizeComments(topic.comments);
  const replyingToComment = replyingTo
    ? topic.comments.find((c) => c.id === replyingTo)
    : null;

  return (
    <div className="max-w-3xl">
      {/* Back button */}
      <button onClick={() => router.push('/forum')} className="btn-ghost mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Nazad na forum
      </button>

      {/* Topic header */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <UserAvatar user={topic.user} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {topic.pinned && <Pin className="w-4 h-4 text-primary-500" />}
              <h1 className="text-xl font-bold text-neutral-900">{topic.title}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4 flex-wrap">
              <Link href={`/user/${topic.user.id}`} className="font-medium text-neutral-700 hover:text-primary-600">
                {topic.user.name}
              </Link>
              <span>·</span>
              <span>
                {format(new Date(topic.createdAt), 'd. MMMM yyyy. u HH:mm', {
                  locale: hr,
                })}
              </span>
              <span
                className={`badge text-xs ${CATEGORY_COLORS[topic.category]}`}
              >
                {CATEGORY_LABELS[topic.category]}
              </span>
            </div>
            <div className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {topic.content}
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-neutral-500" />
          <h2 className="font-semibold text-neutral-800">
            Komentari ({topic._count.comments})
          </h2>
        </div>

        {threadedComments.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-neutral-400 text-sm">
              Budi prvi koji ce komentirati
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {threadedComments.map((comment) => (
              <div key={comment.id} className="card">
                <CommentItem
                  comment={comment}
                  onReply={handleReply}
                  replyingTo={replyingTo}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply input */}
      <div className="card sticky bottom-4">
        {replyingToComment && (
          <div className="flex items-center justify-between bg-primary-50 rounded-xl px-3 py-2 mb-3 text-sm">
            <span className="text-primary-700">
              Odgovaras na komentar korisnika{' '}
              <span className="font-medium">{replyingToComment.user.name}</span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-primary-500 hover:text-primary-700 p-1"
            >
              &times;
            </button>
          </div>
        )}
        <form onSubmit={handleSubmitComment} className="flex items-end gap-3">
          {user && <UserAvatar user={user as TopicUser} size="md" />}
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="input min-h-[48px] resize-none"
              rows={2}
              placeholder={
                replyingTo ? 'Napisi odgovor...' : 'Napisi komentar...'
              }
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="btn-primary shrink-0 p-3"
            aria-label="Posalji"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
