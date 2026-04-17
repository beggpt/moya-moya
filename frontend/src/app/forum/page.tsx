'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Plus, MessageSquare, Pin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type ForumCategory =
  | 'GENERAL'
  | 'SYMPTOMS'
  | 'TREATMENT'
  | 'SURGERY'
  | 'LIFESTYLE'
  | 'MENTAL_HEALTH'
  | 'CAREGIVERS'
  | 'RESEARCH';

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

const CATEGORY_TABS: { label: string; value: ForumCategory | '' }[] = [
  { label: 'Sve', value: '' },
  { label: 'Opcenito', value: 'GENERAL' },
  { label: 'Simptomi', value: 'SYMPTOMS' },
  { label: 'Lijecenje', value: 'TREATMENT' },
  { label: 'Operacija', value: 'SURGERY' },
  { label: 'Zivotni stil', value: 'LIFESTYLE' },
  { label: 'Mentalno zdravlje', value: 'MENTAL_HEALTH' },
  { label: 'Skrbnici', value: 'CAREGIVERS' },
  { label: 'Istrazivanje', value: 'RESEARCH' },
];

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

const ITEMS_PER_PAGE = 15;

export default function ForumPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<ForumCategory | ''>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New topic form
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<ForumCategory>('GENERAL');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTopics();
  }, [page, category]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: ITEMS_PER_PAGE };
      if (category) params.category = category;
      const { data } = await api.get('/forum/topics', { params });
      setTopics(data.topics);
      setTotal(data.total);
    } catch (error) {
      console.error('Greska pri ucitavanju tema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;
    setSaving(true);
    try {
      await api.post('/forum/topics', {
        title: formTitle,
        content: formContent,
        category: formCategory,
      });
      setShowModal(false);
      setFormTitle('');
      setFormContent('');
      setFormCategory('GENERAL');
      setPage(1);
      loadTopics();
    } catch (error) {
      console.error('Greska pri kreiranju teme:', error);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Forum zajednice</h1>
          <p className="text-neutral-500">
            {total} {total === 1 ? 'tema' : 'tema'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Nova tema
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => {
              setCategory(tab.value as ForumCategory | '');
              setPage(1);
            }}
            className={`badge cursor-pointer transition-colors ${
              category === tab.value
                ? 'bg-primary-100 text-primary-800'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Topic list */}
      <div className="space-y-3">
        {loading ? (
          <div className="card text-center py-12">
            <p className="text-neutral-500">Ucitavanje...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-4">Nema tema u ovoj kategoriji</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-5 h-5 mr-2" /> Zapocni prvu temu
            </button>
          </div>
        ) : (
          topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => router.push(`/forum/${topic.id}`)}
              className="card w-full text-left hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm shrink-0">
                {topic.user.image ? (
                  <img
                    src={topic.user.image}
                    alt={topic.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  topic.user.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {topic.pinned && (
                    <Pin className="w-4 h-4 text-primary-500 shrink-0" />
                  )}
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {topic.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                  <Link href={`/user/${topic.user.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary-600">{topic.user.name}</Link>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(new Date(topic.createdAt), {
                      addSuffix: true,
                      locale: hr,
                    })}
                  </span>
                  <span
                    className={`badge text-xs ${CATEGORY_COLORS[topic.category]}`}
                  >
                    {CATEGORY_LABELS[topic.category]}
                  </span>
                </div>
              </div>

              {/* Comment count */}
              <div className="flex items-center gap-1 text-neutral-400 shrink-0">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{topic._count.comments}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Prethodna
          </button>
          <span className="px-4 py-2 text-sm text-neutral-600">
            Stranica {page} od {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-ghost"
          >
            Sljedeca <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* New Topic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">Nova tema</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-5">
              <div>
                <label htmlFor="topic-title" className="label">
                  Naslov
                </label>
                <input
                  id="topic-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input"
                  placeholder="Naslov teme..."
                  required
                />
              </div>

              <div>
                <label htmlFor="topic-category" className="label">
                  Kategorija
                </label>
                <select
                  id="topic-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ForumCategory)}
                  className="input"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="topic-content" className="label">
                  Sadrzaj
                </label>
                <textarea
                  id="topic-content"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="input min-h-[140px]"
                  rows={5}
                  placeholder="Napisi svoju temu..."
                  required
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Objavljivanje...' : 'Objavi temu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
