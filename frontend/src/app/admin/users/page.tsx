'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Search, Download, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (userId: string) => {
    try {
      const { data } = await api.get(`/admin/users/${userId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-${userId}-export.csv`;
      a.click();
    } catch (error) {
      console.error(error);
    }
  };

  const roleLabels: Record<string, string> = { ADMIN: 'Admin', PATIENT: 'Pacijent', CAREGIVER: 'Skrbnik' };
  const roleBadgeClass: Record<string, string> = {
    ADMIN: 'badge bg-purple-100 text-purple-700',
    PATIENT: 'badge bg-primary-100 text-primary-700',
    CAREGIVER: 'badge bg-blue-100 text-blue-700',
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Korisnici</h1>
          <p className="text-neutral-500">{total} ukupno</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Pretraži ime ili email..."
            className="input pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Sve uloge</option>
          <option value="PATIENT">Pacijenti</option>
          <option value="CAREGIVER">Skrbnici</option>
          <option value="ADMIN">Admini</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left text-xs font-medium text-neutral-500 p-4">Korisnik</th>
              <th className="text-left text-xs font-medium text-neutral-500 p-4">Uloga</th>
              <th className="text-left text-xs font-medium text-neutral-500 p-4">Stadij</th>
              <th className="text-left text-xs font-medium text-neutral-500 p-4">Simptomi</th>
              <th className="text-left text-xs font-medium text-neutral-500 p-4">Zadnja aktivnost</th>
              <th className="text-right text-xs font-medium text-neutral-500 p-4">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Učitavanje...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Nema korisnika</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-neutral-800">{u.name || '-'}</p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={roleBadgeClass[u.role] || 'badge'}>{roleLabels[u.role]}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-neutral-700">
                      {u.profile?.suzukiStage ? `Stadij ${u.profile.suzukiStage}` : '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-neutral-700">{u._count?.symptoms || 0}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-neutral-500">
                      {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'd.M.yyyy', { locale: hr }) : 'Nikad'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleExport(u.id)}
                        className="btn-ghost p-2"
                        title="Izvezi CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="btn-ghost p-2"
                        title="Detalji"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">
            Prethodna
          </button>
          <span className="px-4 py-2 text-sm text-neutral-600">Stranica {page} od {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-ghost">
            Sljedeća
          </button>
        </div>
      )}
    </div>
  );
}
