'use client';

import Link from 'next/link';
import { Activity, Shield, Pill, Heart, Brain, Users, FileText, Bell } from 'lucide-react';

const features = [
  { icon: Activity, title: 'Praćenje simptoma', desc: 'Brzo logirajte TIA, glavobolje i druge simptome jednim dodirom' },
  { icon: Pill, title: 'Upravljanje lijekovima', desc: 'Podsjetnici za aspirin i druge lijekove, praćenje adherencije' },
  { icon: Heart, title: 'Krvni tlak', desc: 'Dnevno mjerenje s trendovima i upozorenjima izvan ciljanih vrijednosti' },
  { icon: Shield, title: 'Hitna kartica', desc: 'Digitalna ID kartica s dijagnozom, lijekovima i kontaktima za hitne službe' },
  { icon: Brain, title: 'Kognitivni testovi', desc: 'Mini-testovi za praćenje reakcijskog vremena, pamćenja i kognitivnih funkcija' },
  { icon: Users, title: 'Skrbnici', desc: 'Povežite obitelj ili skrbnike da prate vaše stanje i primaju obavijesti' },
  { icon: FileText, title: 'Izvještaji za liječnika', desc: 'Automatski generirani PDF izvještaji za preglede' },
  { icon: Bell, title: 'SOS upozorenje', desc: 'Jedan dodir za slanje lokacije i obavijesti hitnim kontaktima' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-semibold text-lg text-neutral-800">MoyaMoya Companion</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost">Prijava</Link>
            <Link href="/register" className="btn-primary">Registracija</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            Prva aplikacija za moyamoya pacijente
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-6 text-balance">
            Pratite svoje zdravlje.<br />Budite korak ispred.
          </h1>
          <p className="text-lg text-neutral-600 max-w-prose mx-auto mb-10">
            MoyaMoya Companion pomaže vam pratiti simptome, lijekove, krvni tlak i kognitivne funkcije
            - sve na jednom mjestu, dizajnirano za pacijente s moyamoya bolešću.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Započni besplatno
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-4">
              Saznaj više
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-neutral-900 mb-4">
            Sve što trebate na jednom mjestu
          </h2>
          <p className="text-center text-neutral-600 mb-12 max-w-prose mx-auto">
            Dizajnirano prema smjernicama za moyamoya pacijente, s fokusom na pristupačnost i jednostavnost.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-neutral-800 mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card bg-primary-500 text-white p-12 border-none">
            <h2 className="text-2xl font-bold mb-4">Spremni za početak?</h2>
            <p className="text-primary-100 mb-8">
              Registracija je besplatna. Počnite pratiti svoje zdravlje danas.
            </p>
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-lg">
              Kreiraj račun
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-sm text-neutral-600">MoyaMoya Companion</span>
          </div>
          <p className="text-xs text-neutral-500">
            Ova aplikacija ne zamjenjuje liječnički savjet. Uvijek se posavjetujte s neurologom.
          </p>
        </div>
      </footer>
    </div>
  );
}
