'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Lozinka mora imati najmanje 8 znakova');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setAuth(data.user, data.token);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Greška pri registraciji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 mt-4">Kreirajte račun</h1>
          <p className="text-neutral-600 mt-2">Počnite pratiti svoje zdravlje danas</p>
        </div>

        <div className="card">
          <button className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors min-h-[48px] text-sm font-medium text-neutral-700">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Registriraj se s Google računom
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-500">ili</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <div>
              <label htmlFor="name" className="label">Ime i prezime</label>
              <input
                id="name" type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                className="input" placeholder="Ana Horvat" required autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="vas@email.com" required autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Lozinka</label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12" placeholder="Min. 8 znakova" required autoComplete="new-password"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                  aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Minimalno 8 znakova</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Registracija...' : 'Registriraj se'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-600 mt-6">
          Već imate račun?{' '}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Prijavite se
          </Link>
        </p>
      </div>
    </div>
  );
}
