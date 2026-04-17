'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  Send,
  ArrowLeft,
  Plus,
  Users,
  MessageCircle,
  X,
  Check,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Participant {
  id: string | number;
  name: string;
  image?: string | null;
}

interface LastMessage {
  content: string;
  user: Participant;
  createdAt: string;
}

interface Conversation {
  id: string | number;
  isGroup: boolean;
  title?: string | null;
  otherParticipants: Participant[];
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string | number;
  content: string;
  user: Participant;
  createdAt: string;
}

interface ConversationDetail {
  id: string | number;
  isGroup: boolean;
  title?: string | null;
  participants: Participant[];
  otherParticipants?: Participant[];
}

interface Friend {
  id: string | number;
  name: string;
  image?: string | null;
}

function getInitial(name: string) {
  return (name || '?').charAt(0).toUpperCase();
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
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function Avatar({
  name,
  image,
  size = 'md',
}: {
  name: string;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  } as const;
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${getAvatarColor(name)}`}
    >
      {getInitial(name)}
    </div>
  );
}

function GroupAvatar({ participants }: { participants: Participant[] }) {
  const a = participants[0];
  const b = participants[1];
  return (
    <div className="relative w-10 h-10 shrink-0">
      {a && (
        <div className="absolute top-0 left-0">
          <Avatar name={a.name} image={a.image} size="sm" />
        </div>
      )}
      {b && (
        <div className="absolute bottom-0 right-0 ring-2 ring-white rounded-full">
          <Avatar name={b.name} image={b.image} size="sm" />
        </div>
      )}
      {!a && (
        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
          <Users size={18} className="text-neutral-500" />
        </div>
      )}
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateSep(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const myId = user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [conversationDetail, setConversationDetail] =
    useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true); // mobile toggle

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupUserIds, setGroupUserIds] = useState<(string | number)[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (id: string | number, silent = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const res = await api.get(`/messages/conversations/${id}/messages?page=1`);
        setConversationDetail(res.data.conversation);
        setMessages(res.data.messages || []);
      } catch {
        /* ignore */
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    []
  );

  const markRead = useCallback(async (id: string | number) => {
    try {
      await api.post(`/messages/conversations/${id}/read`);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      );
    } catch {
      /* ignore */
    }
  }, []);

  const selectConversation = useCallback(
    async (id: string | number) => {
      setSelectedId(id);
      setShowList(false);
      await loadMessages(id);
      markRead(id);
    },
    [loadMessages, markRead]
  );

  // initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // handle ?user= query param
  useEffect(() => {
    const userId = searchParams.get('user');
    if (!userId) return;
    (async () => {
      try {
        const res = await api.post('/messages/conversations/direct', { userId });
        const id = res.data.id;
        await fetchConversations();
        await selectConversation(id);
        // clear the query param
        router.replace('/messages');
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // poll messages every 5s when chat open
  useEffect(() => {
    if (!selectedId) return;
    pollRef.current = setInterval(() => {
      loadMessages(selectedId, true);
      fetchConversations();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedId, loadMessages, fetchConversations]);

  // auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !selectedId || sending) return;
    setSending(true);
    try {
      const res = await api.post(
        `/messages/conversations/${selectedId}/messages`,
        { content }
      );
      setMessages((prev) => [...prev, res.data]);
      setInput('');
      fetchConversations();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openGroupModal = async () => {
    setShowGroupModal(true);
    setGroupTitle('');
    setGroupUserIds([]);
    try {
      const res = await api.get('/friends');
      setFriends(res.data);
    } catch {
      /* ignore */
    }
  };

  const toggleGroupUser = (id: string | number) => {
    setGroupUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createGroup = async () => {
    if (!groupTitle.trim() || groupUserIds.length === 0) return;
    setCreatingGroup(true);
    try {
      const res = await api.post('/messages/conversations/group', {
        title: groupTitle.trim(),
        userIds: groupUserIds,
      });
      setShowGroupModal(false);
      await fetchConversations();
      await selectConversation(res.data.id);
    } catch {
      /* ignore */
    } finally {
      setCreatingGroup(false);
    }
  };

  const currentConv =
    conversations.find((c) => c.id === selectedId) || null;

  const displayName = (c: Conversation | null) => {
    if (!c) return '';
    if (c.isGroup) return c.title || 'Group';
    return c.otherParticipants[0]?.name || 'Unknown';
  };

  const detailDisplayName = () => {
    if (!conversationDetail) return displayName(currentConv);
    if (conversationDetail.isGroup)
      return conversationDetail.title || 'Group';
    const others =
      conversationDetail.otherParticipants ||
      conversationDetail.participants?.filter(
        (p) => String(p.id) !== String(myId)
      );
    return others?.[0]?.name || 'Unknown';
  };

  return (
    <div className="max-w-6xl -mx-4 md:mx-0">
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] bg-white rounded-none md:rounded-2xl border border-neutral-200 overflow-hidden">
        {/* Conversation list */}
        <div
          className={`${
            showList ? 'flex' : 'hidden'
          } md:flex flex-col w-full md:w-80 md:shrink-0 border-r border-neutral-200`}
        >
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
            <button
              onClick={openGroupModal}
              className="btn-ghost text-sm flex items-center gap-1.5"
            >
              <Plus size={16} />
              New group
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-6 text-center text-neutral-500 text-sm">
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle
                  size={40}
                  className="mx-auto text-neutral-300 mb-3"
                />
                <p className="text-neutral-500 text-sm">No conversations yet.</p>
                <p className="text-neutral-400 text-xs mt-1">
                  Start a chat from your friends list.
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === selectedId;
                const last = c.lastMessage;
                const prefix =
                  last && String(last.user.id) === String(myId) ? 'You: ' : '';
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${
                      isActive ? 'bg-primary-50 hover:bg-primary-50' : ''
                    }`}
                  >
                    {c.isGroup ? (
                      <GroupAvatar participants={c.otherParticipants} />
                    ) : (
                      <Avatar
                        name={c.otherParticipants[0]?.name || '?'}
                        image={c.otherParticipants[0]?.image}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm text-neutral-900 truncate">
                          {displayName(c)}
                        </h3>
                        <span className="text-[11px] text-neutral-400 shrink-0">
                          {formatDistanceToNowStrict(new Date(c.updatedAt), {
                            addSuffix: false,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-neutral-500 truncate">
                          {last ? `${prefix}${last.content}` : 'No messages yet'}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className={`${
            !showList ? 'flex' : 'hidden'
          } md:flex flex-col flex-1 min-w-0`}
        >
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageCircle
                  size={56}
                  className="mx-auto text-neutral-300 mb-4"
                />
                <p className="text-neutral-600 font-medium">
                  Select a conversation
                </p>
                <p className="text-neutral-400 text-sm mt-1">
                  Or start a new group chat.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-neutral-200 flex items-center gap-3">
                <button
                  onClick={() => setShowList(true)}
                  className="md:hidden p-1 text-neutral-600 hover:text-neutral-900"
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                {conversationDetail?.isGroup ? (
                  <>
                    <GroupAvatar
                      participants={(
                        conversationDetail.participants || []
                      ).filter((p) => String(p.id) !== String(myId))}
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-neutral-900 truncate">
                        {detailDisplayName()}
                      </h2>
                      <p className="text-xs text-neutral-500">
                        {conversationDetail.participants?.length || 0} members
                      </p>
                    </div>
                  </>
                ) : (
                  (() => {
                    const other =
                      conversationDetail?.participants?.find(
                        (p) => String(p.id) !== String(myId)
                      ) ||
                      currentConv?.otherParticipants[0];
                    const name = other?.name || 'Unknown';
                    return (
                      <>
                        <Link href={other ? `/user/${other.id}` : '#'}>
                          <Avatar
                            name={name}
                            image={other?.image}
                          />
                        </Link>
                        <Link
                          href={other ? `/user/${other.id}` : '#'}
                          className="flex-1 min-w-0"
                        >
                          <h2 className="font-semibold text-neutral-900 truncate hover:text-primary-600">
                            {name}
                          </h2>
                        </Link>
                      </>
                    );
                  })()
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                {loadingMessages ? (
                  <div className="text-center text-neutral-500 text-sm py-8">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-neutral-400 text-sm py-8">
                    No messages yet. Say hi!
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const mine = String(m.user.id) === String(myId);
                    const prev = messages[i - 1];
                    const curDate = new Date(m.createdAt);
                    const showDateSep =
                      !prev ||
                      !sameDay(new Date(prev.createdAt), curDate);
                    const showAuthor =
                      !mine &&
                      (!prev ||
                        String(prev.user.id) !== String(m.user.id) ||
                        showDateSep);
                    return (
                      <div key={m.id}>
                        {showDateSep && (
                          <div className="flex justify-center my-3">
                            <span className="text-[11px] text-neutral-500 bg-white border border-neutral-200 rounded-full px-3 py-1">
                              {formatDateSep(curDate)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${
                              mine ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            {!mine && showAuthor ? (
                              <Avatar
                                name={m.user.name}
                                image={m.user.image}
                                size="sm"
                              />
                            ) : (
                              !mine && <div className="w-8 shrink-0" />
                            )}
                            <div className="min-w-0">
                              {showAuthor && (
                                <div className="text-xs text-neutral-500 mb-0.5 ml-1">
                                  {m.user.name}
                                </div>
                              )}
                              <div
                                className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                                  mine
                                    ? 'bg-primary-500 text-white rounded-br-sm'
                                    : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-sm'
                                }`}
                              >
                                {m.content}
                              </div>
                              <div
                                className={`text-[10px] text-neutral-400 mt-1 ${
                                  mine ? 'text-right mr-1' : 'ml-1'
                                }`}
                              >
                                {formatTime(curDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-neutral-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type a message..."
                    className="input resize-none flex-1 max-h-32"
                    style={{ minHeight: '2.5rem' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Group Modal */}
      {showGroupModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowGroupModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">
                New group chat
              </h2>
              <button
                onClick={() => setShowGroupModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Group name
                </label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g. Suzuki stage 3 support"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Add friends
                  {groupUserIds.length > 0 && (
                    <span className="text-primary-600 ml-2">
                      ({groupUserIds.length} selected)
                    </span>
                  )}
                </label>
                {friends.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-4 text-center">
                    No friends yet. Add some first.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto border border-neutral-200 rounded-xl p-1">
                    {friends.map((f) => {
                      const selected = groupUserIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => toggleGroupUser(f.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-neutral-50 ${
                            selected ? 'bg-primary-50' : ''
                          }`}
                        >
                          <Avatar
                            name={f.name}
                            image={f.image}
                            size="sm"
                          />
                          <span className="flex-1 text-sm font-medium text-neutral-900 truncate">
                            {f.name}
                          </span>
                          {selected && (
                            <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-neutral-200 flex justify-end gap-2">
              <button
                onClick={() => setShowGroupModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={
                  !groupTitle.trim() ||
                  groupUserIds.length === 0 ||
                  creatingGroup
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingGroup ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading...</div>}>
      <MessagesPageInner />
    </Suspense>
  );
}
