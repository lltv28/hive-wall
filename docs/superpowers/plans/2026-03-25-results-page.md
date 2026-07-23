# Results Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the post-quiz action plan with a single-page personalized results report that drives strategy call bookings.

**Architecture:** A pure function (`buildResultsFromAnswers`) transforms quiz answers into a `ResultsConfig` object. `ResultsPage` receives this config and renders 9 sections (hero, profile, pain, recommendation, CTA, testimonial, process, social proof, CTA). Each section is its own component. The `App.tsx` state machine changes from `'onboarding' | 'action-plan'` to `'onboarding' | 'results'`.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-25-results-page-design.md`

---

## File Structure

### New files
- `lib/buildResults.ts` — `ResultsConfig` type, lookup tables, `buildResultsFromAnswers()` function
- `components/results/ResultsPage.tsx` — top-level results orchestrator
- `components/results/ResultsHero.tsx` — dark gradient hero with score, headline, pill
- `components/results/SectionCard.tsx` — shared card wrapper (white bg, border, label)
- `components/results/ProfileCard.tsx` — profile tags + summary
- `components/results/PainCard.tsx` — pain headline + bullet list
- `components/results/RecommendationCard.tsx` — product match + feature tiles
- `components/results/CtaBlock.tsx` — green gradient CTA button + sub-text
- `components/results/TestimonialCard.tsx` — avatar + quote + attribution
- `components/results/ProcessCard.tsx` — 3-step numbered process
- `components/results/SocialProofStrip.tsx` — avatar stack + stat text

### Modified files
- `components/App.tsx` — change state type, swap `PlanFlow` for `ResultsPage`, update demo controls
- `app/globals.css` — add `animate-count-up` and stagger animation classes

---

### Task 1: Answer-to-Results Mapping Function

**Files:**
- Create: `lib/buildResults.ts`

This is the data layer — pure logic, no React. Contains the `ResultsConfig` type, all static lookup tables for mapping quiz answer values to display content, and the `buildResultsFromAnswers()` function.

- [ ] **Step 1: Create `lib/buildResults.ts` with types and lookup tables**

```typescript
// lib/buildResults.ts
import { UserAnswers } from './types';

export type ResultsConfig = {
  score: number;
  headline: string;
  description: string;
  recommendation: {
    name: string;
    icon: string;
    description: string;
    features: { value: string; label: string }[];
  };
  profileTags: string[];
  painPoints: string[];
  testimonial: {
    quote: string;
    name: string;
    detail: string;
  };
  ctaUrl: string;
};

const CTA_URL = '#book-strategy-call';

// --- Lookup tables ---

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  coach: 'Coach / Consultant',
  service: 'Service Provider',
  agency: 'Agency Owner',
  course: 'Course Creator',
  other: 'Business Owner',
};

const REVENUE_LABELS: Record<string, string> = {
  'under-100k': 'Under $100K',
  '100k-300k': '$100K - $300K',
  '300k-1m': '$300K - $1M',
  '1m-5m': '$1M - $5M',
  '5m-plus': '$5M+',
};

const BOTTLENECK_LABELS: Record<string, string> = {
  selling: 'Sales-heavy',
  delivering: 'Delivery-focused',
  content: 'Content-driven',
  admin: 'Operations-heavy',
};

const ASSET_LABELS: Record<string, string> = {
  training: 'Has training materials',
  books: 'Has books / PDFs',
  courses: 'Has online courses',
  coaching: 'Runs group coaching',
  recordings: 'Has recorded calls',
  'expertise-only': 'Deep expertise',
};

const VACATION_PAIN: Record<string, string> = {
  'runs-fine': 'Your systems work but revenue growth still depends on your personal involvement',
  'slows-down': 'Your business slows significantly when you step away',
  'grinds-to-halt': 'Revenue depends entirely on you being present every day',
};

const BOTTLENECK_PAIN: Record<string, string> = {
  selling: 'Most of your time goes to sales calls instead of growing the business',
  delivering: 'You spend the majority of your time delivering for clients, not scaling',
  content: 'Content creation consumes your time with no leverage',
  admin: 'Administrative overhead is eating into your revenue-generating hours',
};

const SCALING_PAIN: Record<string, string> = {
  hired: 'Hiring employees added cost without solving the scalability problem',
  agency: 'Outsourcing to an agency didn\'t deliver the results you needed',
  course: 'Building a course helped but didn\'t fully replace your involvement',
  'ai-tools': 'AI tools gave you efficiency gains but not true automation',
  group: 'Group coaching helped but still requires your live presence',
  looking: 'You haven\'t found the right scaling solution yet',
};

type RecommendationData = {
  name: string;
  icon: string;
  description: string;
  features: { value: string; label: string }[];
};

const RECOMMENDATIONS: Record<string, RecommendationData> = {
  salesperson: {
    name: 'AI Salesperson',
    icon: '\uD83C\uDFAF',
    description: 'An AI-powered sales agent trained on your expertise, objection handling, and closing methodology. It pre-qualifies leads, handles objections, and moves prospects to booked calls \u2014 24/7, without you.',
    features: [
      { value: '24/7', label: 'Always selling' },
      { value: '14 days', label: 'To launch' },
      { value: 'DFY', label: 'We build it' },
    ],
  },
  delivery: {
    name: 'AI Service Delivery',
    icon: '\uD83D\uDEE0\uFE0F',
    description: 'An AI system that delivers your methodology to clients automatically. It guides them through your frameworks, answers questions using your expertise, and provides personalized recommendations \u2014 without you on every call.',
    features: [
      { value: '24/7', label: 'Always delivering' },
      { value: '14 days', label: 'To launch' },
      { value: 'DFY', label: 'We build it' },
    ],
  },
  operations: {
    name: 'AI Operations Tool',
    icon: '\u2699\uFE0F',
    description: 'An AI-powered operations system that handles the workflows consuming your team\'s time. It automates processes, manages tasks, and keeps everything running \u2014 outperforming manual effort at a fraction of the cost.',
    features: [
      { value: '24/7', label: 'Always running' },
      { value: '14 days', label: 'To launch' },
      { value: 'DFY', label: 'We build it' },
    ],
  },
};

// --- Builder function ---

export function buildResultsFromAnswers(answers: UserAnswers): ResultsConfig {
  const get = (key: string) => answers[key] ?? '';
  const getMulti = (key: string) => (answers[key] ?? '').split(',').filter(Boolean);

  // Recommendation
  const useCaseAnswer = get('q-q8') || 'salesperson';
  const rec = RECOMMENDATIONS[useCaseAnswer] ?? RECOMMENDATIONS.salesperson;

  // Profile tags
  const businessType = BUSINESS_TYPE_LABELS[get('q-q1')] ?? 'Business Owner';
  const revenue = REVENUE_LABELS[get('q-q2')] ?? '';
  const bottleneck = BOTTLENECK_LABELS[get('q-q4')] ?? '';
  const assets = getMulti('q-q5');
  const topAsset = assets.length > 0 ? (ASSET_LABELS[assets[0]] ?? '') : '';
  const profileTags = [businessType, revenue, bottleneck, topAsset].filter(Boolean);

  // Pain points
  const pains: string[] = [];
  const vacationPain = VACATION_PAIN[get('q-q3')];
  if (vacationPain) pains.push(vacationPain);
  const bottleneckPain = BOTTLENECK_PAIN[get('q-q4')];
  if (bottleneckPain) pains.push(bottleneckPain);
  const scalingAnswers = getMulti('q-q6');
  for (const s of scalingAnswers) {
    const pain = SCALING_PAIN[s];
    if (pain) { pains.push(pain); break; } // Take first matching scaling pain
  }
  if (assets.includes('expertise-only')) {
    pains.push('Your knowledge is locked in your head, not working for you at scale');
  }

  return {
    score: 97,
    headline: `You're a near-perfect fit for an AI product.`,
    description: `Based on your profile as a ${businessType.toLowerCase()} at ${revenue || 'your revenue level'}, combined with your ${bottleneck.toLowerCase() || 'current'} workflow \u2014 your business is primed to generate revenue with AI on autopilot.`,
    recommendation: rec,
    profileTags,
    painPoints: pains.length > 0 ? pains : ['Your business has untapped potential for AI-powered automation'],
    testimonial: {
      quote: 'Within 3 weeks of launching my AI Salesperson, I stopped doing discovery calls entirely. It qualified 40+ leads in the first month and booked 12 strategy calls \u2014 all while I was on vacation.',
      name: 'Sarah M.',
      detail: 'Business Coach, $500K/yr',
    },
    ctaUrl: CTA_URL,
  };
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd ai-quiz-funnel-v1 && npx tsc --noEmit lib/buildResults.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/buildResults.ts
git commit -m "feat(results): add buildResultsFromAnswers mapping function"
```

---

### Task 2: Shared SectionCard + CtaBlock Components

**Files:**
- Create: `components/results/SectionCard.tsx`
- Create: `components/results/CtaBlock.tsx`

Shared primitives used by multiple section components.

- [ ] **Step 1: Create `components/results/SectionCard.tsx`**

```tsx
'use client';

interface SectionCardProps {
  label: string;
  icon: string;
  children: React.ReactNode;
}

export default function SectionCard({ label, icon, children }: SectionCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E5E5E8',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-2xs)',
          color: 'var(--alpha-brand-950)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 'var(--font-semibold)',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `components/results/CtaBlock.tsx`**

```tsx
'use client';

interface CtaBlockProps {
  href: string;
  text?: string;
  subtext?: string;
}

export default function CtaBlock({
  href,
  text = 'Book Your Strategy Call',
  subtext = 'Free 30-min call \u00B7 No obligation',
}: CtaBlockProps) {
  return (
    <div>
      <a
        href={href}
        className="block w-full text-center transition-all duration-200 hover:-translate-y-px"
        style={{
          background: 'var(--gradient-cta-active)',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          fontWeight: 'var(--font-semibold)',
          fontSize: 'var(--text-sm)',
          letterSpacing: '-0.2px',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(46,125,82,0.2)',
        }}
      >
        {text}
      </a>
      {subtext && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#A1A1AA',
            marginTop: '8px',
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/results/SectionCard.tsx components/results/CtaBlock.tsx
git commit -m "feat(results): add SectionCard and CtaBlock shared components"
```

---

### Task 3: ResultsHero Component

**Files:**
- Create: `components/results/ResultsHero.tsx`

The dark gradient hero with animated score, headline, description, and recommendation pill.

- [ ] **Step 1: Create `components/results/ResultsHero.tsx`**

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface ResultsHeroProps {
  score: number;
  headline: string;
  description: string;
  recommendation: {
    name: string;
    icon: string;
  };
}

export default function ResultsHero({ score, headline, description, recommendation }: ResultsHeroProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showPill, setShowPill] = useState(false);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setShowPill(true), 200);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score]);

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'linear-gradient(165deg, #1a3a2a 0%, #0f2619 100%)',
        color: 'white',
        padding: '40px 28px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-2xs)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          opacity: 0.4,
          marginBottom: '16px',
        }}
      >
        AI Product Readiness Score
      </div>

      <div
        style={{
          fontSize: '64px',
          fontWeight: 'var(--font-bold)',
          letterSpacing: '-3px',
          lineHeight: 1,
        }}
      >
        {displayScore}
        <span style={{ fontSize: '32px', opacity: 0.45 }}>%</span>
      </div>

      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          marginTop: '14px',
          opacity: 0.85,
          letterSpacing: '-0.3px',
        }}
      >
        {headline}
      </div>

      <div
        style={{
          fontSize: '13px',
          opacity: 0.4,
          marginTop: '8px',
          maxWidth: '320px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.55,
        }}
      >
        {description}
      </div>

      <div
        style={{
          marginTop: '22px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(58,155,104,0.18)',
          border: '1px solid rgba(58,155,104,0.28)',
          borderRadius: '10px',
          padding: '12px 20px',
          opacity: showPill ? 1 : 0,
          transform: showPill ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <span style={{ fontSize: '20px' }}>{recommendation.icon}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Recommended
          </div>
          <div style={{ fontSize: '15px', fontWeight: 'var(--font-semibold)', marginTop: '1px' }}>
            {recommendation.name}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/results/ResultsHero.tsx
git commit -m "feat(results): add ResultsHero with animated score count-up"
```

---

### Task 4: Content Section Components

**Files:**
- Create: `components/results/ProfileCard.tsx`
- Create: `components/results/PainCard.tsx`
- Create: `components/results/RecommendationCard.tsx`
- Create: `components/results/TestimonialCard.tsx`
- Create: `components/results/ProcessCard.tsx`
- Create: `components/results/SocialProofStrip.tsx`

All the section components that render below the hero.

- [ ] **Step 1: Create `components/results/ProfileCard.tsx`**

```tsx
'use client';

import SectionCard from './SectionCard';

interface ProfileCardProps {
  tags: string[];
  summary: string;
}

export default function ProfileCard({ tags, summary }: ProfileCardProps) {
  return (
    <SectionCard label="Your Profile" icon={'\uD83D\uDCCB'}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              background: '#F4F4F5',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 'var(--font-medium)',
              color: '#3F3F46',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: '#52525B', lineHeight: 'var(--leading-normal)' }}>
        {summary}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 2: Create `components/results/PainCard.tsx`**

```tsx
'use client';

import SectionCard from './SectionCard';

interface PainCardProps {
  painPoints: string[];
}

export default function PainCard({ painPoints }: PainCardProps) {
  return (
    <SectionCard label="What's Holding You Back" icon={'\u26A0\uFE0F'}>
      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          color: '#18181B',
          letterSpacing: '-0.3px',
          marginBottom: '10px',
        }}
      >
        Your business stops when you do.
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
        {painPoints.map((pain, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '13px',
              color: '#52525B',
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--red-600)',
                marginTop: '7px',
                opacity: 0.6,
              }}
            />
            {pain}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Create `components/results/RecommendationCard.tsx`**

```tsx
'use client';

import SectionCard from './SectionCard';

interface RecommendationCardProps {
  name: string;
  description: string;
  features: { value: string; label: string }[];
}

export default function RecommendationCard({ name, description, features }: RecommendationCardProps) {
  return (
    <SectionCard label="Your AI Product Match" icon={'\uD83C\uDFAF'}>
      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          color: '#18181B',
          letterSpacing: '-0.3px',
          marginBottom: '6px',
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: '#52525B', lineHeight: 'var(--leading-normal)' }}>
        {description}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        {features.map((f) => (
          <div
            key={f.value}
            style={{
              flex: 1,
              background: '#f8faf9',
              borderRadius: '8px',
              padding: '12px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--alpha-brand-950)' }}>
              {f.value}
            </div>
            <div style={{ fontSize: 'var(--text-2xs)', color: '#A1A1AA', marginTop: '2px' }}>
              {f.label}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 4: Create `components/results/TestimonialCard.tsx`**

```tsx
'use client';

import SectionCard from './SectionCard';

interface TestimonialCardProps {
  quote: string;
  name: string;
  detail: string;
}

export default function TestimonialCard({ quote, name, detail }: TestimonialCardProps) {
  return (
    <SectionCard label="Client Results" icon={'\u2B50'}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4d4d8, #a1a1aa)',
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
              color: '#52525B',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            &ldquo;{quote}&rdquo;
          </div>
          <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '6px' }}>
            {name} &mdash; {detail}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 5: Create `components/results/ProcessCard.tsx`**

```tsx
'use client';

import SectionCard from './SectionCard';

const STEPS = [
  {
    title: 'Strategy Call',
    description: 'We map your sales process and identify the highest-leverage AI product for your business.',
  },
  {
    title: 'We Build It',
    description: 'Our team builds your AI product end-to-end \u2014 trained on your content, voice, and methodology.',
  },
  {
    title: 'Launch & Scale',
    description: 'Go live in 14 days. We monitor performance and optimize for conversions.',
  },
];

export default function ProcessCard() {
  return (
    <SectionCard label="How Kodara Works" icon={'\uD83D\uDEE0\uFE0F'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#f0f7f3',
                color: 'var(--alpha-brand-950)',
                fontSize: '13px',
                fontWeight: 'var(--font-semibold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#18181B', marginBottom: '2px' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '12px', color: '#71717A', lineHeight: 1.5 }}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 6: Create `components/results/SocialProofStrip.tsx`**

```tsx
'use client';

const GRADIENTS = [
  'linear-gradient(135deg, #93c5a8, #5ea97a)',
  'linear-gradient(135deg, #a1a1aa, #71717a)',
  'linear-gradient(135deg, #d4d4d8, #a1a1aa)',
  'linear-gradient(135deg, #7ac4a0, #3a9b68)',
];

export default function SocialProofStrip() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
      <div style={{ display: 'flex' }}>
        {GRADIENTS.map((bg, i) => (
          <div
            key={i}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: bg,
              border: '2px solid #F6F6F7',
              marginLeft: i > 0 ? '-8px' : 0,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '12px', color: '#71717A' }}>
        <strong style={{ color: '#52525B' }}>500+</strong> coaches &amp; consultants have built AI products with Kodara
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add components/results/ProfileCard.tsx components/results/PainCard.tsx components/results/RecommendationCard.tsx components/results/TestimonialCard.tsx components/results/ProcessCard.tsx components/results/SocialProofStrip.tsx
git commit -m "feat(results): add all section components"
```

---

### Task 5: ResultsPage Orchestrator

**Files:**
- Create: `components/results/ResultsPage.tsx`

Receives `UserAnswers`, calls `buildResultsFromAnswers`, renders all sections in order with staggered fade-in animations.

- [ ] **Step 1: Create `components/results/ResultsPage.tsx`**

```tsx
'use client';

import { useMemo } from 'react';
import { UserAnswers } from '@/lib/types';
import { buildResultsFromAnswers } from '@/lib/buildResults';
import ResultsHero from './ResultsHero';
import ProfileCard from './ProfileCard';
import PainCard from './PainCard';
import RecommendationCard from './RecommendationCard';
import CtaBlock from './CtaBlock';
import TestimonialCard from './TestimonialCard';
import ProcessCard from './ProcessCard';
import SocialProofStrip from './SocialProofStrip';

interface ResultsPageProps {
  userAnswers: UserAnswers;
}

export default function ResultsPage({ userAnswers }: ResultsPageProps) {
  const config = useMemo(() => buildResultsFromAnswers(userAnswers), [userAnswers]);

  const sections = [
    <ProfileCard key="profile" tags={config.profileTags} summary={config.description} />,
    <PainCard key="pain" painPoints={config.painPoints} />,
    <RecommendationCard
      key="rec"
      name={config.recommendation.name}
      description={config.recommendation.description}
      features={config.recommendation.features}
    />,
    <CtaBlock key="cta1" href={config.ctaUrl} />,
    <TestimonialCard
      key="testimonial"
      quote={config.testimonial.quote}
      name={config.testimonial.name}
      detail={config.testimonial.detail}
    />,
    <ProcessCard key="process" />,
    <SocialProofStrip key="social" />,
    <CtaBlock key="cta2" href={config.ctaUrl} />,
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
      <ResultsHero
        score={config.score}
        headline={config.headline}
        description={config.description}
        recommendation={config.recommendation}
      />
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '640px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {sections.map((section, i) => (
          <div
            key={i}
            className="animate-fade-in-up"
            style={{ animationDelay: `${200 + i * 100}ms`, animationFillMode: 'both' }}
          >
            {section}
          </div>
        ))}
        <div style={{ height: '40px' }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/results/ResultsPage.tsx
git commit -m "feat(results): add ResultsPage orchestrator with staggered animations"
```

---

### Task 6: Wire Into App + Update Demo Controls

**Files:**
- Modify: `components/App.tsx`

Change `AppState` type, replace `PlanFlow` with `ResultsPage`, update demo control buttons.

- [ ] **Step 1: Update `components/App.tsx`**

Make these changes to `components/App.tsx`:

1. **Line 7:** Change import from `PlanFlow` to `ResultsPage`:
   ```tsx
   import ResultsPage from './results/ResultsPage';
   ```

2. **Line 9:** Change the `AppState` type:
   ```tsx
   type AppState = 'onboarding' | 'results';
   ```

3. **Lines 15-57 (`AppContent`):** Remove the `initialTasks` prop from the function signature and the `tasks` state. Replace the `action-plan` rendering block (lines 50-56) with:
   ```tsx
   // ---------- Phase 2: Results ----------
   return (
     <ResultsPage userAnswers={userAnswers} />
   );
   ```

4. **Line 90:** Change `'action-plan'` to `'results'`:
   ```tsx
   const handleOnboardingComplete = useCallback(() => setAppState('results'), []);
   ```

5. **Line 175:** Change the demo button state from `'action-plan'` to `'results'`:
   ```tsx
   onClick={() => { setAppState('results'); setKey(k => k + 1); }}
   ```

6. **Lines 178-180:** Update the demo button styling and label:
   ```tsx
   background: appState === 'results' ? 'var(--btn-primary)' : 'transparent',
   color: appState === 'results' ? '#fff' : 'rgba(26,26,26,0.48)',
   ```
   And change the button text from `Action Plan` to `Results`.

7. **Line 109:** Remove `const initialTasks = configToActionPlanTasks(config);` (no longer needed).

8. **Line 195:** Remove the `initialTasks` prop from `<AppContent>`.

9. **Lines 4-5:** Clean up unused imports — remove `ActionTask` from types import, remove `configToActionPlanTasks` from quiz-config import, remove `PlanFlow` import.

- [ ] **Step 2: Verify it builds**

Run: `cd ai-quiz-funnel-v1 && npm run build`
Expected: Build succeeds with no errors (warnings about unused files are OK)

- [ ] **Step 3: Commit**

```bash
git add components/App.tsx
git commit -m "feat(results): wire ResultsPage into App, replace action plan"
```

---

### Task 7: CSS Animation Support

**Files:**
- Modify: `app/globals.css`

The existing `animate-fade-in-up` class doesn't support `animation-delay` with `animation-fill-mode: both` cleanly. Verify it works with the staggered delays used in `ResultsPage`. If elements flash before their delay, add `opacity: 0` as initial state.

- [ ] **Step 1: Add stagger-ready fade-in-up variant to `app/globals.css`**

Add after the existing `.animate-fade-in-up` rule (around line 161):

```css
.animate-fade-in-up {
  animation: fade-in-up 300ms ease-out;
}
```

No changes needed — the existing `fade-in-up` keyframe starts from `opacity: 0`, and `ResultsPage` sets `animationFillMode: 'both'` which keeps `opacity: 0` during the delay. This should work as-is.

- [ ] **Step 2: Test visually**

Run: `cd ai-quiz-funnel-v1 && npm run dev`

Open http://localhost:3000 in a browser. Click through the quiz (or use the demo "Results" button) and verify:
1. Hero appears with score counting up from 0 to 97
2. Recommendation pill scales in after count finishes
3. Sections fade in one by one with staggered timing
4. Page scrolls within the phone frame
5. Both CTA buttons render with hover effects
6. Profile tags show answer-derived content (or defaults if using demo button with no answers)

- [ ] **Step 3: Commit if any CSS changes were needed**

```bash
git add app/globals.css
git commit -m "style(results): add CSS animation support for staggered sections"
```

---

### Task 8: Final Build Verification

- [ ] **Step 1: Full build check**

Run: `cd ai-quiz-funnel-v1 && npm run build`
Expected: Build completes successfully

- [ ] **Step 2: Lint check**

Run: `cd ai-quiz-funnel-v1 && npm run lint`
Expected: No errors (warnings are OK)

- [ ] **Step 3: Visual QA checklist**

Run the dev server and manually verify each section:
- [ ] Hero: dark gradient, centered score, headline, description, recommendation pill
- [ ] Profile: tags render as pills, summary text interpolates answers
- [ ] Pain: red-dot bullet list, items reflect quiz answers
- [ ] Recommendation: product name, description, 3 feature tiles
- [ ] CTA #1: green gradient button, sub-text
- [ ] Testimonial: avatar circle, quote, attribution
- [ ] Process: 3 numbered steps
- [ ] Social proof: avatar stack, stat text
- [ ] CTA #2: same as CTA #1
- [ ] Demo controls: "Quiz" and "Results" buttons work correctly
- [ ] Reset button resets to quiz state
- [ ] Responsive: works at 430px and full-width

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(results): final polish and fixes"
```
