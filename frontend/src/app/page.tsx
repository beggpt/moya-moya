'use client';

import Link from 'next/link';
import { Activity, Shield, Pill, Heart, Brain, Users, FileText, Bell } from 'lucide-react';

const features = [
  { icon: Activity, title: 'Symptom tracking', desc: 'Quickly log TIA, headaches and other symptoms with a single tap' },
  { icon: Pill, title: 'Medication management', desc: 'Reminders for aspirin and other medications, adherence tracking' },
  { icon: Heart, title: 'Blood pressure', desc: 'Daily measurements with trends and out-of-range alerts' },
  { icon: Shield, title: 'Emergency Card', desc: 'Digital ID card with diagnosis, medications and emergency contacts' },
  { icon: Brain, title: 'Cognitive tests', desc: 'Mini-tests to track reaction time, memory and cognitive function' },
  { icon: Users, title: 'Caregivers', desc: 'Connect family or caregivers to monitor your condition and receive alerts' },
  { icon: FileText, title: 'Doctor reports', desc: 'Automatically generated PDF reports for appointments' },
  { icon: Bell, title: 'SOS alert', desc: 'One tap to send location and notify emergency contacts' },
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
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/register" className="btn-primary">Sign up</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            The first app for moyamoya patients
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-6 text-balance">
            Track your health.<br />Stay one step ahead.
          </h1>
          <p className="text-lg text-neutral-600 max-w-prose mx-auto mb-10">
            MoyaMoya Companion helps you track symptoms, medications, blood pressure and cognitive function
            - all in one place, designed for patients with moyamoya disease.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Get started for free
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-4">
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-neutral-900 mb-4">
            Everything you need in one place
          </h2>
          <p className="text-center text-neutral-600 mb-12 max-w-prose mx-auto">
            Designed according to guidelines for moyamoya patients, with a focus on accessibility and simplicity.
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
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-primary-100 mb-8">
              Registration is free. Start tracking your health today.
            </p>
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-lg">
              Create account
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
            This app does not replace medical advice. Always consult your neurologist.
          </p>
        </div>
      </footer>
    </div>
  );
}
