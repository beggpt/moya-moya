'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Bell, UserPlus, UserCheck, MessageSquare, MessageCircle,
  Heart, Pill, X, CheckCheck
} from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  read: boolean;
  createdAt: string;
};

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function iconFor(type: string) {
  switch (type) {
    case 'FRIEND_REQUEST':
      return { Icon: UserPlus, color: 'text-blue-500 bg-blue-50' };
    case 'FRIEND_ACCEPTED':
      return { Icon: UserCheck, color: 'text-green-500 bg-green-50' };
    case 'TOPIC_REPLY':
      return { Icon: MessageSquare, color: 'text-purple-500 bg-purple-50' };
    case 'POST_COMMENT':
      return { Icon: MessageCircle, color: 'text-neutral-600 bg-neutral-100' };
    case 'POST_LIKE':
      return { Icon: Heart, color: 'text-red-500 bg-red-50' };
    case 'MED_REMINDER':
      return { Icon: Pill, color: 'text-primary-600 bg-primary-50' };
    default:
      return { Icon: Bell, color: 'text-neutral-600 bg-neutral-100' };
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      try {
        await api.post(`/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error(e);
      }
    }

    let data: any = null;
    try {
      if (n.data) data = JSON.parse(n.data);
    } catch {
      data = null;
    }

    if (n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPTED') {
      const userId = data?.userId || data?.requesterId;
      if (userId) router.push(`/user/${userId}`);
      else router.push('/friends');
    } else if (n.type === 'TOPIC_REPLY') {
      const topicId = data?.topicId;
      if (topicId) router.push(`/forum/${topicId}`);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => n.id !== id);
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-800">Notifications</h1>
          {unreadCount > 0 && (
            <span className="badge bg-primary-100 text-primary-700">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost flex items-center gap-2">
            <CheckCheck size={18} />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="card text-center text-neutral-500">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell size={48} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500">No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const { Icon, color } = iconFor(n.type);
            return (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={`card cursor-pointer hover:shadow-md transition-shadow flex items-start gap-3 ${
                  !n.read ? 'bg-primary-50 border-primary-100' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-800 truncate">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mt-0.5">{n.body}</p>
                  <p className="text-xs text-neutral-400 mt-1">{relativeTime(n.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => deleteNotif(e, n.id)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-danger shrink-0"
                  aria-label="Delete notification"
                >
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
