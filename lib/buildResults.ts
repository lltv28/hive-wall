// lib/buildResults.ts
import { UserAnswers, DMessage } from './types';

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
    if (pain) { pains.push(pain); break; }
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

export function buildResultsMessages(answers: UserAnswers): { messages: DMessage[]; config: ResultsConfig } {
  const config = buildResultsFromAnswers(answers);

  const messages: DMessage[] = [
    { id: 'result-hero', sender: 'ai', resultComponent: 'hero', waitForInput: true },
    { id: 'result-profile', sender: 'ai', resultComponent: 'profile', waitForInput: true },
    { id: 'result-video', sender: 'ai', resultComponent: 'video', waitForInput: true },
    { id: 'result-rec', sender: 'ai', resultComponent: 'recommendation', waitForInput: true },
    { id: 'result-plan', sender: 'ai', resultComponent: 'actionPlan', waitForInput: true },
    { id: 'result-cta1', sender: 'ai', resultComponent: 'cta', waitForInput: true },
    { id: 'result-testimonial', sender: 'ai', resultComponent: 'testimonial', waitForInput: true },
    { id: 'result-process', sender: 'ai', resultComponent: 'process', waitForInput: true },
    { id: 'result-demos', sender: 'ai', resultComponent: 'demos', waitForInput: true },
    { id: 'result-faq', sender: 'ai', resultComponent: 'faq', waitForInput: true },
    { id: 'result-social', sender: 'ai', resultComponent: 'socialProof', waitForInput: true },
    { id: 'result-cta2', sender: 'ai', resultComponent: 'cta', waitForInput: true },
  ];

  return { messages, config };
}
