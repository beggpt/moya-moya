'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, X, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

interface Article {
  id: string;
  title: string;
  body: string;
  category: string;
  published: boolean;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'symptoms', label: 'Symptoms' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'research', label: 'Research' },
];

export default function AdminContentPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategory, setFormCategory] = useState('general');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const { data } = await api.get('/admin/content');
      setArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/content', {
        title: formTitle,
        body: formBody,
        category: formCategory,
        locale: 'en',
      });
      setShowModal(false);
      resetForm();
      loadArticles();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
    setFormCategory('general');
  };

  const categoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label || cat;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Content management</h1>
          <p className="text-neutral-500">{articles.length} articles</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Add article
        </button>
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No published articles</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-5 h-5 mr-2" /> Add first article
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-neutral-800">{article.title}</h3>
                    <span className="badge bg-neutral-100 text-neutral-600 text-xs">
                      {categoryLabel(article.category)}
                    </span>
                    {article.published ? (
                      <span className="badge bg-green-100 text-green-700 text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="badge bg-neutral-100 text-neutral-500 text-xs flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 line-clamp-2">{article.body}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await api.put(`/admin/content/${article.id}`, { published: !article.published });
                      loadArticles();
                    } catch (err) { console.error(err); }
                  }}
                  className={`btn-ghost text-xs shrink-0 ${article.published ? 'text-danger' : 'text-primary-600'}`}
                >
                  {article.published ? 'Hide' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Article Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">New article</h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="label">Title</label>
                <input
                  id="title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input"
                  placeholder="Enter article title..."
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="label">Category</label>
                <select
                  id="category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="input"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="body" className="label">Content</label>
                <textarea
                  id="body"
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="input min-h-[160px]"
                  rows={6}
                  placeholder="Enter article content..."
                  required
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : 'Save article'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
