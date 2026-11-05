import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Badge } from '../components/shadcn/badge';
import { Card, CardContent } from '../components/shadcn/card';
import { buttonVariants } from '../components/shadcn/button';
import { cn } from '../lib/utils';
import {
  ArrowDownRight,
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  FileBadge,
  History,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: "Jama'at Certify — Certificate Management for Jama'at Events",
  description:
    'Create events, verify Member IDs, and issue print-ready certificates across Atfal, Khuddam, Ansarullah, Lajna and Nasra.',
};

const auxiliaries = ['Atfal', 'Khuddam', 'Ansarullah', 'Lajna', 'Nasra'];

const stats = [
  { value: '05', label: 'auxiliaries', note: 'one shared workspace' },
  { value: 'A4', label: 'print format', note: 'landscape-ready output' },
  { value: '01', label: 'clear workflow', note: 'create, verify, issue' },
];

const features = [
  {
    icon: CalendarDays,
    title: 'Events with the right structure',
    text: 'Set dates, venues and themes, then organize by Mulk, District, Ilaqa, Dila or Jamaat.',
    style: 'feature-sage lg:col-span-7',
  },
  {
    icon: BadgeCheck,
    title: 'Member IDs checked at the source',
    text: 'Verify against central records and spot valid, missing, invalid or duplicate entries.',
    style: 'feature-forest lg:col-span-5',
  },
  {
    icon: Award,
    title: 'A certificate studio that respects your identity',
    text: 'Give each auxiliary its own colors, marks, signatures and polished A4 landscape templates.',
    style: 'feature-gold lg:col-span-5',
  },
  {
    icon: Printer,
    title: 'Issue a full event in a few steps',
    text: 'Assign certificate types, generate unique numbers and print crisp certificates in bulk.',
    style: 'feature-plain lg:col-span-7',
  },
  {
    icon: History,
    title: 'A clear history of every action',
    text: 'Review logins, verification, generation and revocation with the admin and timestamp.',
    style: 'feature-plain lg:col-span-6',
  },
  {
    icon: ShieldCheck,
    title: 'Access shaped around each role',
    text: 'Super Admins see all auxiliaries. General Admins stay within their assigned Majlis.',
    style: 'feature-sage lg:col-span-6',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create the event',
    text: 'Choose an auxiliary, set the venue and dates, and make the event yours.',
  },
  {
    number: '02',
    title: 'Verify participants',
    text: 'Add Member IDs and check each participant against central records.',
  },
  {
    number: '03',
    title: 'Issue and print',
    text: 'Select a template, generate certificate numbers, then print in A4 landscape.',
  },
];

export default function LandingPage() {
  return (
    <main className="jcs-site min-h-dvh">
      <header className="jcs-nav sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="Jama'at Certify home" className="flex shrink-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white p-0.5">
              <Image src="/ahmadiyyah_logo.png" alt="" width={36} height={36} className="h-full w-full rounded-full object-contain" priority />
            </span>
            <span className="text-xs font-bold tracking-[0.16em] sm:text-sm">JAMA&apos;AT CERTIFY</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-[var(--jcs-muted)] md:flex">
            <a href="#features" className="transition-colors hover:text-[var(--jcs-ink)]">What it does</a>
            <a href="#workflow" className="transition-colors hover:text-[var(--jcs-ink)]">Workflow</a>
            <a href="#templates" className="transition-colors hover:text-[var(--jcs-ink)]">Certificates</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className={cn(buttonVariants.primary, 'min-h-10 px-4 text-xs sm:text-sm')}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="jcs-hero relative overflow-hidden">
        <div aria-hidden="true" className="jcs-hero-rule absolute inset-y-0 right-0 hidden w-[42%] lg:block" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-16 lg:py-20">
          <div className="relative z-10">
            <Badge className="jcs-hero-badge mb-6 gap-2 border-white/20 bg-white/5 text-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              For every Jama&apos;at auxiliary
            </Badge>
            <h1 className="max-w-[650px] text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-[#f5f3e9] sm:text-5xl lg:text-[62px]">
              Certificates for every Jama&apos;at event.
            </h1>
            <p className="jcs-hero-copy mt-6 max-w-[520px] text-base leading-7 sm:text-lg">
              Verify members, manage gatherings and issue polished certificates from one trusted workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#workflow" className={cn(buttonVariants.secondary, 'min-h-12 px-5')}>
                Explore the workflow <ArrowDownRight className="h-4 w-4" />
              </a>
              <a href="#templates" className="jcs-hero-secondary inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors">
                See certificate designs <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-12 grid max-w-[540px] grid-cols-3 divide-x divide-white/15 border-t border-white/15 pt-6">
              {stats.map((stat) => (
                <div key={stat.label} className="pr-3 first:pr-3 sm:pr-5">
                  <p className="text-2xl font-semibold tracking-tight text-[#edcf78] sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-white">{stat.label}</p>
                  <p className="mt-1 text-[10px] leading-snug text-emerald-100/65 sm:text-xs">{stat.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[680px] lg:ml-auto">
            <div className="jcs-certificate-frame relative overflow-hidden rounded-[18px] p-2 sm:p-3">
              <Image
                src="/certificate-design1.png"
                alt="Sample certificate prepared in Jama'at Certify"
                width={1200}
                height={850}
                className="relative z-10 h-auto w-full rounded-xl"
                priority
              />
            </div>
            <div className="jcs-issued-note absolute -bottom-5 left-4 z-20 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg sm:left-8">
              <span className="jcs-issued-icon flex h-9 w-9 items-center justify-center rounded-lg"><FileBadge className="h-4 w-4" /></span>
              <span>
                <span className="block text-xs font-semibold">Certificate issued</span>
                <span className="jcs-issued-meta mt-0.5 block text-[11px]">JCS-ATF-2025-0042 · Verified</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Auxiliaries supported" className="jcs-auxiliaries border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-5 py-5 sm:gap-3 sm:px-8">
          <span className="mr-2 text-xs font-semibold text-[var(--jcs-muted)]">One system for</span>
          {auxiliaries.map((name) => (
            <Badge key={name} className="jcs-aux-badge border px-3 py-1.5 text-xs">{name}</Badge>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.035em] text-[var(--jcs-ink)] sm:text-4xl">
            The details are handled, so the moment can matter.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--jcs-muted)]">
            From the first participant check to the final printed page, keep event records accurate and certificates consistent.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          {features.map((feature) => (
            <Card key={feature.title} className={cn('jcs-feature group min-h-[218px] overflow-hidden rounded-2xl border p-6 transition-transform duration-200 hover:-translate-y-1 sm:p-8', feature.style)}>
              <CardContent className="flex h-full flex-col p-0">
                <div className="flex items-start justify-between gap-4">
                  <span className="jcs-feature-icon flex h-11 w-11 items-center justify-center rounded-xl">
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <ArrowRight aria-hidden="true" className="jcs-feature-arrow mt-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
                <div className="mt-auto pt-8">
                  <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="jcs-feature-copy mt-2 max-w-[62ch] text-sm leading-6">{feature.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="workflow" className="jcs-workflow scroll-mt-24 border-y">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-sm font-semibold text-[var(--jcs-brand)]">A clear path from event to keepsake.</p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-0.035em] text-[var(--jcs-ink)] sm:text-4xl">
              Three steps. One dependable record.
            </h2>
          </div>
          <ol className="grid gap-0 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.number} className={cn('jcs-step relative border-t py-5 md:border-t-0 md:py-0 md:pl-6', index > 0 && 'md:border-l')}>
                <span className="text-sm font-semibold tracking-[0.1em] text-[var(--jcs-brand)]">{step.number}</span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--jcs-ink)]">{step.title}</h3>
                <p className="mt-2 pr-4 text-sm leading-6 text-[var(--jcs-muted)]">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="templates" className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.035em] text-[var(--jcs-ink)] sm:text-4xl">
            Official-looking designs, ready for A4 landscape printing.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--jcs-muted)]">
            Each auxiliary keeps its own identity, while event details, signatories and verification numbers stay consistent.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              ['10+ layouts', 'with seals, watermarks and distinctive frames'],
              ['Verified numbers', 'with revocation support'],
              ['Print ready', 'with exact-color A4 landscape output'],
            ].map(([title, text]) => (
              <li key={title} className="flex items-center gap-3 text-sm text-[var(--jcs-muted)]">
                <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--jcs-brand)]" />
                <span><strong className="font-semibold text-[var(--jcs-ink)]">{title}</strong> {text}</span>
              </li>
            ))}
          </ul>
          <Link href="/login" className={cn(buttonVariants.primary, 'mt-8 min-h-12 px-5')}>
            Open Certificate Studio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Card className="jcs-template-card overflow-hidden rounded-[20px] border p-2 sm:p-3">
          <CardContent className="p-0">
            <Image
              src="/certificate-design2.png"
              alt="A second certificate template design"
              width={1200}
              height={850}
              className="h-auto w-full rounded-xl"
            />
          </CardContent>
        </Card>
      </section>

      <section className="jcs-closing">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center md:py-16">
          <div>
            <h2 className="max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-3xl">
              Ready to make your next event easier to remember?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/75">
              Sign in with your Member ID to create an event and prepare its certificates.
            </p>
          </div>
          <Link href="/login" className={cn(buttonVariants.secondary, 'shrink-0 px-5')}>
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="jcs-footer border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-xs text-[var(--jcs-muted)] sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <Image src="/ahmadiyyah_logo.png" alt="" width={24} height={24} className="rounded-full" />
            <span className="font-semibold text-[var(--jcs-ink)]">Jama&apos;at Certify</span>
          </div>
          <span>© {new Date().getFullYear()} · Certificate management for Jama&apos;at events</span>
        </div>
      </footer>
    </main>
  );
}
