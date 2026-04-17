'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { hr } from 'date-fns/locale';
import {
  ArrowLeft, UserPlus, UserCheck, UserX, Clock, Pill,
  Heart, MessageSquare, Loader2, Shield, Stethoscope,
  Calendar, AlertCircle, Users
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const AVATAR_COLORS = [
  'bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500',
  'bg-emerald-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-orange-500',
];

function pickColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SIDE_LABELS: Record<string, string> = { LEFT: 'Lijeva', RIGHT: 'Desna', BILATERAL: 'Obostrana' };

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: me } = useAuthStore();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/friends/user/${userId}`);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    setActionLoading(true);
    try {
      await api.post('/friends/request', { userId });
      setProfile((p: any) => ({ ...p, friendshipStatus: 'pending_sent' }));
    } catch {} finally { setActionLoading(false); }
  };

  const acceptRequest = async () => {
    if (!profile?.friendshipId) return;
    setActionLoading(true);
    try {
      await api.post(`/friends/${profile.friendshipId}/accept`);
      setProfile((p: any) => ({ ...p, friendshipStatus: 'friends' }));
    } catch {} finally { setActionLoading(false); }
  };

  const removeFriend = async () => {
    if (!profile?.friendshipId) return;
    setActionLoading(true);
    try {
      await api.delete(`/friends/${profile.friendshipId}`);
      setProfile((p: any) => ({ ...p, friendshipStatus: 'none', friendshipId: null }));
    } catch {} finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Natrag
        </button>
        <div className="card text-center py-12">
          <p className="text-neutral-500">Korisnik nije pronađen</p>
        </div>
      </div>
    );
  }

  const p = profile.profile; // Patient profile
  const isMe = me?.id === userId;

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="btn-ghost mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Natrag
      </button>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          {profile.image ? (
            <img src={profile.image} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${pickColor(profile.name || '')}`}>
              {profile.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900">{profile.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Član od {format(new Date(profile.createdAt), 'MMMM yyyy.', { locale: hr })}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1"><MessageSquare size={14} /> {profile._count?.posts || 0} objava</span>
              <span className="flex items-center gap-1"><MessageSquare size={14} /> {profile._count?.forumTopics || 0} tema</span>
              {profile.mutualFriends > 0 && !isMe && (
                <span className="flex items-center gap-1"><Users size={14} /> {profile.mutualFriends} zajedničkih prijatelja</span>
              )}
            </div>

            {/* Friend action */}
            {!isMe && (
              <div className="mt-4">
                {profile.friendshipStatus === 'none' && (
                  <button onClick={sendRequest} disabled={actionLoading} className="btn-primary text-sm">
                    <UserPlus className="w-4 h-4 mr-2" /> Dodaj prijatelja
                  </button>
                )}
                {profile.friendshipStatus === 'pending_sent' && (
                  <button disabled className="btn-secondary text-sm opacity-70">
                    <Clock className="w-4 h-4 mr-2" /> Zahtjev poslan
                  </button>
                )}
                {profile.friendshipStatus === 'pending_received' && (
                  <div className="flex gap-2">
                    <button onClick={acceptRequest} disabled={actionLoading} className="btn-primary text-sm">
                      <UserCheck className="w-4 h-4 mr-2" /> Prihvati
                    </button>
                    <button onClick={removeFriend} disabled={actionLoading} className="btn-ghost text-sm text-danger">
                      <UserX className="w-4 h-4 mr-2" /> Odbij
                    </button>
                  </div>
                )}
                {profile.friendshipStatus === 'friends' && (
                  <div className="flex items-center gap-3">
                    <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                      <UserCheck size={14} /> Prijatelji
                    </span>
                    <button onClick={removeFriend} disabled={actionLoading} className="btn-ghost text-xs text-neutral-400 hover:text-danger">
                      Ukloni
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Medical info */}
        <div className="space-y-6">
          {/* Diagnosis */}
          {p && (
            <div className="card">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Stethoscope size={20} className="text-primary-500" /> Dijagnoza
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Tip</span>
                  <span className="text-sm font-medium text-neutral-800">
                    {p.moyamoyaType === 'DISEASE' ? 'Moyamoya bolest' : p.moyamoyaType === 'SYNDROME' ? 'Moyamoya sindrom' : '-'}
                  </span>
                </div>
                {p.suzukiStage && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Suzuki stadij</span>
                    <span className="text-sm font-medium text-neutral-800">Stadij {p.suzukiStage}</span>
                  </div>
                )}
                {p.affectedSide && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Zahvaćena strana</span>
                    <span className="text-sm font-medium text-neutral-800">{SIDE_LABELS[p.affectedSide] || p.affectedSide}</span>
                  </div>
                )}
                {p.diagnosisDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Datum dijagnoze</span>
                    <span className="text-sm font-medium text-neutral-800">
                      {format(new Date(p.diagnosisDate), 'd.M.yyyy.')}
                    </span>
                  </div>
                )}
                {p.allergies && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Alergije</span>
                    <span className="text-sm font-medium text-neutral-800">{p.allergies}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Surgery */}
          {p?.hadSurgery && (
            <div className="card">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-purple-500" /> Operacija
              </h2>
              <div className="space-y-3">
                {p.surgeryType && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Tip operacije</span>
                    <span className="text-sm font-medium text-neutral-800">{p.surgeryType}</span>
                  </div>
                )}
                {p.affectedSide === 'BILATERAL' ? (
                  <>
                    {p.surgeryDateLeft && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Lijeva strana</span>
                        <span className="text-sm font-medium text-neutral-800">{format(new Date(p.surgeryDateLeft), 'd.M.yyyy.')}</span>
                      </div>
                    )}
                    {p.surgeryDateRight && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Desna strana</span>
                        <span className="text-sm font-medium text-neutral-800">{format(new Date(p.surgeryDateRight), 'd.M.yyyy.')}</span>
                      </div>
                    )}
                  </>
                ) : p.surgeryDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Datum operacije</span>
                    <span className="text-sm font-medium text-neutral-800">{format(new Date(p.surgeryDate), 'd.M.yyyy.')}</span>
                  </div>
                )}
                {p.hospitalName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Bolnica</span>
                    <span className="text-sm font-medium text-neutral-800">{p.hospitalName}</span>
                  </div>
                )}
                {p.neurologistName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Neurolog</span>
                    <span className="text-sm font-medium text-neutral-800">{p.neurologistName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!p?.hadSurgery && p && (
            <div className="card">
              <h2 className="text-lg font-bold text-neutral-900 mb-2 flex items-center gap-2">
                <Shield size={20} className="text-purple-500" /> Operacija
              </h2>
              <p className="text-sm text-neutral-500">Nije imao/la operaciju</p>
            </div>
          )}
        </div>

        {/* Right column: Medications + Posts */}
        <div className="space-y-6">
          {/* Medications */}
          {profile.medications && profile.medications.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Pill size={20} className="text-blue-500" /> Lijekovi ({profile.medications.length})
              </h2>
              <div className="space-y-3">
                {profile.medications.map((med: any) => (
                  <div key={med.id} className="bg-neutral-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-800">{med.name}</span>
                      <span className="text-sm text-neutral-500">{med.dosage}{med.unit}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      <span>{med.frequency}</span>
                      {med.timesOfDay?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {med.timesOfDay.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent posts */}
          {profile.posts && profile.posts.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-teal-500" /> Nedavne objave
              </h2>
              <div className="space-y-3">
                {profile.posts.map((post: any) => (
                  <div key={post.id} className="bg-neutral-50 rounded-xl p-3">
                    <p className="text-sm text-neutral-700 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: hr })}</span>
                      <span className="flex items-center gap-1"><Heart size={12} /> {post._count?.likes || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {post._count?.comments || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {(!profile.medications || profile.medications.length === 0) && (!profile.posts || profile.posts.length === 0) && (
            <div className="card text-center py-8">
              <p className="text-neutral-400 text-sm">Korisnik još nema javnih informacija.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
