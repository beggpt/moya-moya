'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, UserCheck, UserX, Users, MessageCircle, Trash2 } from 'lucide-react';
import api from '@/lib/api';

type Tab = 'friends' | 'requests' | 'search';
type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

interface Friend {
  id: number;
  name: string;
  moyamoyaType: 'disease' | 'syndrome';
  suzukiStage: number;
  diagnosisDate: string;
}

interface FriendRequest {
  id: number;
  name: string;
}

interface SearchUser {
  id: number;
  name: string;
  moyamoyaType: 'disease' | 'syndrome';
  suzukiStage: number;
  diagnosisDate: string;
  friendshipStatus: FriendshipStatus;
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-teal-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({ name }: { name: string }) {
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(name)}`}>
      {getInitial(name)}
    </div>
  );
}

function MoyamoyaBadge({ type }: { type: 'disease' | 'syndrome' }) {
  return (
    <span className={`badge text-xs ${type === 'disease' ? 'bg-teal-50 text-teal-700' : 'bg-purple-50 text-purple-700'}`}>
      {type === 'disease' ? 'Disease' : 'Syndrome'}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/friends');
      setFriends(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/friends/requests');
      setRequests(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'friends') fetchFriends();
    if (tab === 'requests') fetchRequests();
  }, [tab, fetchFriends, fetchRequests]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const res = await api.get(`/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      await api.post('/friends/request', { userId });
      setSearchResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'pending_sent' as FriendshipStatus } : u))
      );
    } catch {
      /* ignore */
    }
  };

  const acceptRequest = async (id: number) => {
    try {
      await api.post(`/friends/${id}/accept`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    }
  };

  const rejectRequest = async (id: number) => {
    try {
      await api.delete(`/friends/${id}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    }
  };

  const removeFriend = async (id: number) => {
    try {
      await api.delete(`/friends/${id}`);
      setFriends((prev) => prev.filter((f) => f.id !== id));
    } catch {
      /* ignore */
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'friends', label: 'Friends', icon: <Users size={18} /> },
    { key: 'requests', label: 'Requests', icon: <UserPlus size={18} /> },
    { key: 'search', label: 'Search', icon: <Search size={18} /> },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Friends</h1>
        <p className="text-neutral-500 mt-1">Connect with other moyamoya patients, share experiences, and offer support.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'requests' && requests.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends Tab */}
      {tab === 'friends' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-neutral-500">Loading...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500">You don't have any friends yet.</p>
              <p className="text-neutral-400 text-sm mt-1">Search for users and send a friend request.</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className="card flex items-center gap-4">
                <Avatar name={friend.name} />
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{friend.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <MoyamoyaBadge type={friend.moyamoyaType} />
                    <span className="text-xs text-neutral-500">Suzuki stage {friend.suzukiStage}</span>
                    <span className="text-xs text-neutral-400">|</span>
                    <span className="text-xs text-neutral-500">Diagnosis: {formatDate(friend.diagnosisDate)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost text-sm flex items-center gap-1.5">
                    <MessageCircle size={16} />
                    Message
                  </button>
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="btn-danger text-sm flex items-center gap-1.5"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-neutral-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus size={48} className="mx-auto text-neutral-300 mb-4" />
              <p className="text-neutral-500">No friend requests.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="card flex items-center gap-4">
                <Avatar name={req.name} />
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{req.name}</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">Wants to connect with you</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="btn-primary text-sm flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600"
                  >
                    <UserCheck size={16} />
                    Accept
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    className="btn-danger text-sm flex items-center gap-1.5"
                  >
                    <UserX size={16} />
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div>
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search users by name..."
                className="input pl-10"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary flex items-center gap-2">
              <Search size={18} />
              Search
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-neutral-500">Searching...</div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500">No results for &quot;{searchQuery}&quot;</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-neutral-300 mb-4" />
                <p className="text-neutral-500">Enter a user's name to search.</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div key={user.id} className="card flex items-center gap-4">
                  <Avatar name={user.name} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">{user.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MoyamoyaBadge type={user.moyamoyaType} />
                      <span className="text-xs text-neutral-500">Suzuki stage {user.suzukiStage}</span>
                      <span className="text-xs text-neutral-400">|</span>
                      <span className="text-xs text-neutral-500">Diagnosis: {formatDate(user.diagnosisDate)}</span>
                    </div>
                  </div>
                  <div>
                    {user.friendshipStatus === 'none' && (
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        className="btn-primary text-sm flex items-center gap-1.5"
                      >
                        <UserPlus size={16} />
                        Add friend
                      </button>
                    )}
                    {user.friendshipStatus === 'pending_sent' && (
                      <button disabled className="btn-ghost text-sm flex items-center gap-1.5 opacity-60 cursor-default">
                        <UserCheck size={16} />
                        Request sent
                      </button>
                    )}
                    {user.friendshipStatus === 'pending_received' && (
                      <button
                        onClick={() => acceptRequest(user.id)}
                        className="btn-primary text-sm flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600"
                      >
                        <UserCheck size={16} />
                        Accept
                      </button>
                    )}
                    {user.friendshipStatus === 'friends' && (
                      <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                        <UserCheck size={16} />
                        Friends
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
