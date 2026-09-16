import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  FileBadge,
  History,
  Printer,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Jama'at Certify — Certificate Management for Jama'at Events",
  description:
    'Create events, verify Member IDs, and issue print-ready certificates across Atfal, Khuddam, Ansarullah, Lajna and Nasra.',
};

const AUXILIARIES = ['Atfal', 'Khuddam', 'Ansarullah', 'Lajna', 'Nasra'];

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Event management',
    text: 'Create Ijtemas, seminars and courses by Mulk, District, Ilaqa, Dila or Jamaat with dates, venue and theme.',
  },
  {
    icon: BadgeCheck,
    title: 'Member ID verification',
    text: 'Verify participants against the central Jamaat registry — Valid, Not Found, Invalid or Duplicate.',
  },
  {
    icon: Award,
    title: 'Certificate Studio',
    text: 'Design on-brand templates per auxiliary with colors, logos, signatures and A4 landscape print output.',
  },
  {
    icon: Printer,
    title: 'Bulk issue & print',
    text: 'Assign certificate types, generate numbers like JCS-ATF-2025-0042, and print crisp A4 certificates.',
  },
  {
    icon: History,
    title: 'Full audit trail',
    text: 'Every login, verification, generation and revocation is logged with admin, role and timestamp.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    text: 'Super Admins see all five auxiliaries; General Admins are scoped to their assigned Majlis.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Create an event',
    text: 'Set the auxiliary, org level, venue, dates and theme. Everything starts from an event.',
  },
  {
    step: '02',
    title: 'Verify participants',
    text: 'Import or add Member IDs and verify each member in one click against central records.',
  },
  {
    step: '03',
    title: 'Issue & print',
    text: 'Pick a template, assign certificate types, generate numbers and print A4 landscape certificates.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-emerald-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow">
              <Image
                src="/ahmadiyyah_logo.png"
                alt="Ahmadiyyah logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span className="text-xs font-bold tracking-[0.18em] text-white">
              JAMA&apos;AT CERTIFY
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-emerald-100/80 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#templates" className="transition-colors hover:text-white">
              Templates
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition-colors hover:bg-amber-400"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-[#0b2e23] to-slate-950 text-white">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/60 bg-emerald-700/40 px-3 py-1 text-xs font-semibold text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Atfal • Khuddam • Ansarullah • Lajna • Nasra</span>
            </div>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Certificates for every Jama&apos;at event, done right.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
              Jama&apos;at Certify is the central workspace to create events,
              verify Member IDs against central records, and issue beautiful
              print-ready certificates — with a full audit trail.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center">
              <div>
                <div className="text-xl font-bold sm:text-2xl">5</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-emerald-100/60">
                  Auxiliaries
                </div>
              </div>
              <div>
                <div className="text-xl font-bold sm:text-2xl">A4</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-emerald-100/60">
                  Print-ready
                </div>
              </div>
              <div>
                <div className="text-xl font-bold sm:text-2xl">100%</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-emerald-100/60">
                  Audited
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl">
              <Image
                src="/certificate-design1.png"
                alt="Sample Jama'at certificate design"
                width={1200}
                height={850}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-4 left-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg">
              <FileBadge className="h-4 w-4 text-emerald-700" />
              JCS-ATF-2025-0042 • Verified & issued
            </div>
          </div>
        </div>
      </section>

      {/* Auxiliaries */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-6 sm:px-6">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Built for all auxiliaries:
          </span>
          {AUXILIARIES.map((aux) => (
            <span
              key={aux}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
            >
              {aux}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          What you can do
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          One workspace from event creation to printed certificate
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          No spreadsheets, no manual name-typing on designs. Verify once, then
          generate consistent certificates with numbers, themes and signatures.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps to issued certificates
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200"
              >
                <div className="text-sm font-black tracking-widest text-emerald-600">
                  {s.step}
                </div>
                <h3 className="mt-2 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
            >
              Start with an event
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Certificate Studio
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Official-looking designs, ready for A4 landscape printing
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Each auxiliary gets its own identity — Atfal green, Khuddam
              emerald & gold, Lajna teal, Ansarullah navy, Nasra purple — with
              organization headers, themes, venues and signatories baked in.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                10+ prestige layouts with torus rings, seals and watermarks
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                Verification numbers and revocation support
              </li>
              <li className="flex items-center gap-2">
                <Printer className="h-4 w-4 shrink-0 text-emerald-600" />
                Exact-color A4 landscape print stylesheet included
              </li>
            </ul>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
              >
                Open Certificate Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <Image
              src="/certificate-design2.png"
              alt="Second sample certificate design"
              width={1200}
              height={850}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 p-8 text-white shadow-lg sm:p-10">
          <Award className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 text-amber-400/10" />
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            Start from the dashboard and issue your first certificate today.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-100/80">
            Sign in with your Member ID, create an Ijtema or seminar, verify
            participants and print — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-amber-400"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-0.5">
              <Image
                src="/ahmadiyyah_logo.png"
                alt="Ahmadiyyah logo"
                width={28}
                height={28}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="font-semibold text-slate-700">
              Jama&apos;at Certify
            </span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-800">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

