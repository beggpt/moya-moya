'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Newspaper, RefreshCw, ExternalLink } from 'lucide-react';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  tags?: string[];
};

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/news');
      const items: NewsItem[] = Array.isArray(res.data) ? res.data : [];
      setNews(items);
      return items;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.post('/news/refresh');
      if (Array.isArray(res.data?.news)) {
        setNews(res.data.news);
      } else {
        await load();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const items = await load();
      setLoading(false);
      if (items.length === 0) {
        refresh();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Daily Moyamoya News</h1>
          <p className="text-neutral-500 text-sm mt-1">Latest research from PubMed</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="card text-center text-neutral-500">Loading...</div>
      ) : news.length === 0 ? (
        <div className="card text-center py-12">
          <Newspaper size={48} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">No news yet — click Refresh to fetch latest papers</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {news.map((item) => (
            <li key={item.id} className="card hover:shadow-md transition-shadow">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h2>
                  <ExternalLink size={18} className="text-neutral-400 group-hover:text-primary-600 shrink-0 mt-1" />
                </div>
                {item.summary && (
                  <p className="text-sm text-neutral-600 mt-2 line-clamp-3">{item.summary}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                  <span className="badge bg-primary-50 text-primary-700">{item.source}</span>
                  <span>{relativeTime(item.publishedAt)}</span>
                  <span className="text-neutral-400">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map((t) => (
                      <span key={t} className="badge bg-neutral-100 text-neutral-600 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
