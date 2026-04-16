'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone } from 'lucide-react';
import api from '@/lib/api';

export default function SOSButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showConfirm && countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    if (showConfirm && countdown === 0) {
      triggerSOS();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showConfirm, countdown]);

  const triggerSOS = async () => {
    setSending(true);
    try {
      let location: { latitude?: number; longitude?: number; address?: string } = {};
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        }).catch(() => null);
        if (pos) {
          location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        }
      }
      await api.post('/emergency/sos', location);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setShowConfirm(false);
        setCountdown(3);
      }, 5000);
    } catch (error) {
      console.error('SOS error:', error);
    } finally {
      setSending(false);
    }
  };

  const cancel = () => {
    setShowConfirm(false);
    setCountdown(3);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-danger/95 z-50 flex flex-col items-center justify-center text-white p-8">
        <div className="text-6xl mb-6">✓</div>
        <h2 className="text-2xl font-bold mb-4">SOS poslan</h2>
        <p className="text-lg text-center opacity-90">
          Vaši kontakti su obaviješteni. Ostanite mirni.
        </p>
        <p className="mt-6 text-lg font-semibold">Hitna pomoć: 194</p>
        <a href="tel:194" className="mt-4 btn-primary bg-white text-danger text-lg px-8">
          <Phone className="w-5 h-5 mr-2" /> Pozovi 194
        </a>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-danger rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl font-bold">{countdown}</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">Slanje SOS upozorenja</h2>
          <p className="text-neutral-600 mb-6">
            {sending ? 'Šalje se...' : 'Vaši kontakti će biti obaviješteni za lokaciju i stanje.'}
          </p>
          <button
            onClick={cancel}
            className="btn-secondary w-full text-lg"
            disabled={sending}
          >
            Odustani
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="sos-button"
      aria-label="SOS - hitna pomoć"
      title="SOS - pošalji upozorenje hitnim kontaktima"
    >
      SOS
    </button>
  );
}
