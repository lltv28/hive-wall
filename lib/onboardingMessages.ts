import { DMessage } from './types';

/**
 * Kodara AI Product Readiness Quiz — delivered as a conversational chat.
 * 13 questions + 3 callouts + 3 fit scores + results trigger.
 *
 * Messages with `waitForInput: true` pause the flow for user input.
 * Messages with `fitScore` or `callout` render as rich cards.
 * Messages with `multiSelect: true` show multi-select chips + Next button.
 * The final message has `triggersPhaseChange: true`.
 */

// ---------------------------------------------------------------------------
// Step 1 — Business Type
// ---------------------------------------------------------------------------
export const step1BusinessType: DMessage[] = [
  {
    id: 'welcome-1',
    sender: 'ai',
    content:
      "Hey! I'm Kodara AI. I help coaches, consultants, and service providers build AI products that generate revenue on autopilot. Let me assess your AI product readiness — it takes about 2 minutes.",
  },
  {
    id: 'q1',
    sender: 'ai',
    content: 'Which best describes your business?',
    subtitle: 'Different business models benefit from different AI product strategies',
    chips: [
      { label: 'Coach / Consultant', value: 'coach', emoji: '🎯', description: '1-on-1 or group advisory' },
      { label: 'Service Provider', value: 'service', emoji: '🏥', description: 'Doctor, lawyer, accountant, etc.' },
      { label: 'Agency Owner', value: 'agency', emoji: '🚀', description: 'Marketing, design, or dev agency' },
      { label: 'Course Creator', value: 'course', emoji: '📚', description: 'Online courses & digital products' },
      { label: 'Other', value: 'other', emoji: '✨', description: 'Something else entirely' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 2 — Revenue Range
// ---------------------------------------------------------------------------
export const step2Revenue: DMessage[] = [
  {
    id: 'q2',
    sender: 'ai',
    content: "What's your current annual revenue?",
    subtitle: 'This helps us understand what AI product price point makes sense for your market',
    chips: [
      { label: 'Under $100K', value: 'under-100k', emoji: '🌱', description: 'Early stage or side hustle' },
      { label: '$100K - $300K', value: '100k-300k', emoji: '📈', description: 'Growing and gaining traction' },
      { label: '$300K - $1M', value: '300k-1m', emoji: '🔥', description: 'Scaling fast' },
      { label: '$1M - $5M', value: '1m-5m', emoji: '⭐', description: 'Established and profitable' },
      { label: '$5M+', value: '5m-plus', emoji: '💎', description: 'Enterprise-level operation' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 3 — The Vacation Test
// ---------------------------------------------------------------------------
export const step3VacationTest: DMessage[] = [
  {
    id: 'q3',
    sender: 'ai',
    content: 'What would happen to your business if you took a 2-week vacation?',
    subtitle: "This reveals how dependent your business is on YOU — the #1 growth ceiling we see",
    chips: [
      { label: 'It runs fine without me', value: 'runs-fine', emoji: '☀️', description: 'Systems handle everything' },
      { label: 'Things would slow down', value: 'slows-down', emoji: '⚠️', description: 'Team manages, but barely' },
      { label: 'Everything grinds to a halt', value: 'grinds-to-halt', emoji: '🚨', description: 'The business IS you' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Callout #1 — Social Proof
// ---------------------------------------------------------------------------
export const callout1: DMessage[] = [
  {
    id: 'inter-1',
    sender: 'ai',
    callout: {
      headline: "You're not alone.",
      body: "87% of experts we've surveyed say their business would slow or stop without them. Kodara has helped hundreds of business owners solve this with AI products.",
      stat: '87%',
    },
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 4 — Time Bottleneck
// ---------------------------------------------------------------------------
export const step4TimeBottleneck: DMessage[] = [
  {
    id: 'q4',
    sender: 'ai',
    content: 'Where does most of your working time go?',
    subtitle: "We'll use this to identify which AI product would free up the most revenue-generating hours",
    chips: [
      { label: 'Selling new leads', value: 'selling', emoji: '💰', description: 'Calls, proposals, follow-ups' },
      { label: 'Delivering for clients', value: 'delivering', emoji: '🛠️', description: 'Doing the actual work' },
      { label: 'Creating content', value: 'content', emoji: '✏️', description: 'Marketing, social, emails' },
      { label: 'Admin & operations', value: 'admin', emoji: '📋', description: 'Hiring, systems, overhead' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 5 — Existing Assets
// ---------------------------------------------------------------------------
export const step5Assets: DMessage[] = [
  {
    id: 'q5',
    sender: 'ai',
    content: 'What have you already created around your knowledge?',
    subtitle: 'Your existing IP is the raw material for your AI product — the more you have, the faster we can build',
    chips: [
      { label: 'Training materials / SOPs', value: 'training', emoji: '📄', description: 'Documented processes' },
      { label: 'Books or PDFs', value: 'books', emoji: '📖', description: 'Written expertise' },
      { label: 'Online courses', value: 'courses', emoji: '🎓', description: 'Video or digital programs' },
      { label: 'Group coaching', value: 'coaching', emoji: '👥', description: 'Live group sessions' },
      { label: 'Recorded calls', value: 'recordings', emoji: '🎙️', description: 'Workshops or meetings' },
      { label: 'Deep expertise only', value: 'expertise-only', emoji: '🧠', description: 'No content yet, just knowledge' },
    ],
    multiSelect: true,
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Fit Score #1 — 45%
// ---------------------------------------------------------------------------
export const fitScore1: DMessage[] = [
  {
    id: 'fit-1',
    sender: 'ai',
    fitScore: {
      percentage: 45,
      message: 'Your business has strong potential for an AI product. Let\'s keep going to increase your score.',
      cta: "Let's increase the fit!",
    },
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 6 — Failed Scaling Attempts
// ---------------------------------------------------------------------------
export const step6ScalingAttempts: DMessage[] = [
  {
    id: 'q6',
    sender: 'ai',
    content: 'Which of these have you tried to scale your business?',
    subtitle: 'Most business owners have tried 2-3 of these before discovering AI products',
    chips: [
      { label: 'Hired employees', value: 'hired', emoji: '👥', description: 'Built an internal team' },
      { label: 'Outsourced to agency', value: 'agency', emoji: '🏢', description: 'Delegated to external help' },
      { label: 'Built a course', value: 'course', emoji: '📚', description: 'Created digital products' },
      { label: 'Tried AI tools', value: 'ai-tools', emoji: '🤖', description: 'ChatGPT, automations, etc.' },
      { label: 'Group coaching', value: 'group', emoji: '🗣️', description: 'Leveraged 1-to-many' },
      { label: 'Still looking', value: 'looking', emoji: '🔍', description: "Haven't found the right fit" },
    ],
    multiSelect: true,
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 7 — Current AI Usage
// ---------------------------------------------------------------------------
export const step7AIUsage: DMessage[] = [
  {
    id: 'q7',
    sender: 'ai',
    content: 'How are you using AI currently in your business?',
    subtitle: "You don't need any AI experience — our team builds everything for you",
    chips: [
      { label: 'Not at all yet', value: 'none', emoji: '👋', description: 'Starting from zero' },
      { label: 'Small tasks', value: 'small-tasks', emoji: '🧩', description: 'Occasional use, basic stuff' },
      { label: 'Use it regularly', value: 'regular', emoji: '💻', description: 'Integrated into workflow' },
      { label: 'All-in on AI', value: 'all-in', emoji: '🚀', description: 'AI-first business' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Callout #2 — Education / Desire Creation
// ---------------------------------------------------------------------------
export const callout2: DMessage[] = [
  {
    id: 'inter-2',
    sender: 'ai',
    callout: {
      headline: 'Did you know?',
      body: "Alex Hormozi made $105M in 72 hours — a huge component was his AI product. Coaches and consultants are now selling AI products for $300-$3,000/mo that deliver their expertise automatically, 24/7.",
      stat: '$105M',
    },
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 8 — Self-Selection Into Use Case
// ---------------------------------------------------------------------------
export const step8UseCase: DMessage[] = [
  {
    id: 'q8',
    sender: 'ai',
    content: 'Which of these AI product examples sounds most like what would work for YOUR business?',
    subtitle: "These are real AI products we've built for clients",
    chips: [
      { label: 'AI Salesperson', value: 'salesperson', emoji: '💰', description: 'Pre-sell clients automatically' },
      { label: 'AI Service Delivery', value: 'delivery', emoji: '🛠️', description: 'Serve clients without you' },
      { label: 'AI Operations Tool', value: 'operations', emoji: '⚙️', description: 'Outperform entire teams' },
      { label: 'Not sure yet', value: 'unsure', emoji: '🤔', description: 'Show me more options' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Fit Score #2 — 72%
// ---------------------------------------------------------------------------
export const fitScore2: DMessage[] = [
  {
    id: 'fit-2',
    sender: 'ai',
    fitScore: {
      percentage: 72,
      message: "Based on your business type and goals, you're a strong fit for an AI product.",
      cta: 'Almost there!',
    },
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 9 — The Magic Question
// ---------------------------------------------------------------------------
export const step9MagicQuestion: DMessage[] = [
  {
    id: 'q9',
    sender: 'ai',
    content: 'If AI could magically take ONE thing off your plate right now, what would be the highest value?',
    subtitle: 'This will determine the core function of your AI product',
    chips: [
      { label: 'Sell without sales calls', value: 'sell', emoji: '💰', description: 'Close deals on autopilot' },
      { label: 'Deliver without doing the work', value: 'deliver', emoji: '🛠️', description: 'AI handles fulfillment' },
      { label: 'Reach leads without content', value: 'reach', emoji: '📣', description: 'Attract without the grind' },
      { label: 'Onboard without hand-holding', value: 'onboard', emoji: '👋', description: 'Automate client setup' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 10 — Sales Process
// ---------------------------------------------------------------------------
export const step10SalesProcess: DMessage[] = [
  {
    id: 'q10',
    sender: 'ai',
    content: 'What does your current sales process look like?',
    subtitle: "We'll design your AI product to plug into or replace parts of this",
    chips: [
      { label: '1-on-1 sales calls', value: 'calls', emoji: '📞', description: 'Personal consultations' },
      { label: '1-to-many presentations', value: 'webinar', emoji: '🎬', description: 'Webinars, live events' },
      { label: 'In-person consultation', value: 'in-person', emoji: '🤝', description: 'Face-to-face meetings' },
      { label: 'Self-serve online', value: 'self-serve', emoji: '🛒', description: 'They buy without talking to you' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 11 — Sales Complexity
// ---------------------------------------------------------------------------
export const step11Complexity: DMessage[] = [
  {
    id: 'q11',
    sender: 'ai',
    content: 'How many touch points does it usually take to close a new client?',
    subtitle: 'The more touch points required, the more revenue an AI product can unlock for you',
    chips: [
      { label: 'Just 1 touch point', value: 'one', emoji: '⚡', description: 'Quick, simple close' },
      { label: '2-3 conversations', value: 'few', emoji: '💬', description: 'Some nurturing needed' },
      { label: 'Many touch points', value: 'many', emoji: '🔔', description: 'Long sales cycle' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Fit Score #3 — 91%
// ---------------------------------------------------------------------------
export const fitScore3: DMessage[] = [
  {
    id: 'fit-3',
    sender: 'ai',
    fitScore: {
      percentage: 91,
      message: 'Your business profile is almost complete. A few more questions to finalize your personalized plan.',
      cta: "Let's make it 100%!",
    },
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 12 — Vision
// ---------------------------------------------------------------------------
export const step12Vision: DMessage[] = [
  {
    id: 'q12',
    sender: 'ai',
    content: 'Which of these best describes your vision for the next few years?',
    subtitle: 'Your vision determines how we architect your AI product strategy',
    chips: [
      { label: 'Grow without adding headcount', value: 'grow-efficient', emoji: '📈', description: 'Lean, efficient scaling' },
      { label: 'Less time, same revenue', value: 'less-time', emoji: '🏖️', description: 'Work less, earn the same' },
      { label: 'Build an empire', value: 'empire', emoji: '👑', description: 'Scale as big as possible' },
      { label: 'Business runs without me', value: 'without-me', emoji: '🌌', description: 'True freedom' },
    ],
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Step 13 — The Identity Close
// ---------------------------------------------------------------------------
export const step13IdentityClose: DMessage[] = [
  {
    id: 'q13',
    sender: 'ai',
    content: 'If your AI product was working, what would change for you?',
    subtitle: 'Select all that apply',
    chips: [
      { label: 'Stop trading time for money', value: 'time-for-money', emoji: '⏰', description: 'Break the hourly trap' },
      { label: 'Scale past 7 figures', value: 'scale', emoji: '📈', description: 'Grow without a big team' },
      { label: 'Unlimited clients', value: 'unlimited', emoji: '🌟', description: 'No capacity ceiling' },
      { label: 'Sells while I sleep', value: 'sells-while-sleep', emoji: '🌙', description: 'Revenue on autopilot' },
      { label: "Business doesn't depend on me", value: 'not-depend', emoji: '🔓', description: 'True independence' },
      { label: 'More strategy, less delivery', value: 'strategy', emoji: '🧠', description: 'CEO mindset, not worker' },
    ],
    multiSelect: true,
    waitForInput: true,
  },
];

// ---------------------------------------------------------------------------
// Final — Trigger phase change to results
// ---------------------------------------------------------------------------
export const stepFinal: DMessage[] = [
  {
    id: 'final',
    sender: 'ai',
    fitScore: {
      percentage: 97,
      message: "Your AI Product Readiness assessment is complete. Here's your personalized report.",
      cta: 'See My Results',
    },
    triggersPhaseChange: true,
  },
];

// ---------------------------------------------------------------------------
// All steps in order
// ---------------------------------------------------------------------------
export const onboardingSteps: DMessage[][] = [
  step1BusinessType,
  step2Revenue,
  step3VacationTest,
  callout1,
  step4TimeBottleneck,
  step5Assets,
  fitScore1,
  step6ScalingAttempts,
  step7AIUsage,
  callout2,
  step8UseCase,
  fitScore2,
  step9MagicQuestion,
  step10SalesProcess,
  step11Complexity,
  fitScore3,
  step12Vision,
  step13IdentityClose,
  stepFinal,
];
