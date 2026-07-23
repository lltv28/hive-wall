import { ActionTask, DMessage } from './types';

// ---------------------------------------------------------------------------
// Guided-flow messages for Task 2: Define Your Audience
// ---------------------------------------------------------------------------
const defineAudienceMessages: DMessage[] = [
  {
    id: 'audience-1',
    sender: 'ai',
    content:
      "Great choice — nailing your audience is the single most important thing you can do before running ads. Let me walk you through it.",
  },
  {
    id: 'audience-2',
    sender: 'ai',
    video: {
      src: '/teaching-video.mp4',
      title: 'Targeting 101: Finding Your Ideal Customer',
      duration: '2:15',
    },
  },
  {
    id: 'audience-3',
    sender: 'ai',
    content:
      "Think about the people who already buy from you — who are they? Describe your best customer in a sentence or two.",
    waitForInput: true,
  },
  {
    id: 'audience-4',
    sender: 'ai',
    visualCard: {
      icon: '🎯',
      title: 'Your Audience Profile',
      items: [
        { label: 'Age Range', value: '28 – 45' },
        { label: 'Interests', value: 'Small business, entrepreneurship' },
        { label: 'Pain Point', value: 'Not enough leads or customers' },
        { label: 'Platform', value: 'Facebook & Instagram' },
      ],
    },
    content:
      "Here's a starter audience profile based on what you've told me. We'll refine this as we go — but this is a strong foundation for your first campaign.",
  },
];

// ---------------------------------------------------------------------------
// Guided-flow messages for Task 3: Create Your First Campaign
// ---------------------------------------------------------------------------
const createCampaignMessages: DMessage[] = [
  {
    id: 'campaign-1',
    sender: 'ai',
    content:
      "Time to build your first ad! Don't worry — I'll guide you through every piece. By the end of this step you'll have a ready-to-launch campaign structure.",
  },
  {
    id: 'campaign-2',
    sender: 'ai',
    video: {
      src: '/teaching-video.mp4',
      title: 'Anatomy of a High-Converting Ad',
      duration: '3:08',
    },
  },
  {
    id: 'campaign-3',
    sender: 'ai',
    content:
      "Let's start with your headline. A great headline grabs attention in the first 2 seconds. What's the biggest benefit your customers get from working with you?",
    waitForInput: true,
  },
  {
    id: 'campaign-4',
    sender: 'ai',
    content:
      "Love it. Now let's pair that with some ad copy. I'll draft something based on your answer — you can tweak it later.",
    waitForInput: true,
  },
  {
    id: 'campaign-5',
    sender: 'ai',
    visualCard: {
      icon: '📱',
      title: 'Your Ad Preview',
      items: [
        { label: 'Headline', value: 'Get More Customers This Month' },
        { label: 'Primary Text', value: 'Tired of inconsistent leads? Our proven system brings you qualified prospects every week.' },
        { label: 'CTA Button', value: 'Learn More' },
        { label: 'Placement', value: 'Facebook Feed + Instagram Feed' },
      ],
    },
    content:
      "Here's a mock preview of your ad. This structure is proven to convert — we'll optimize the creative once you're live.",
  },
];

// ---------------------------------------------------------------------------
// Guided-flow messages for Task 6: Launch & Monitor
// ---------------------------------------------------------------------------
const launchMonitorMessages: DMessage[] = [
  {
    id: 'launch-1',
    sender: 'ai',
    content:
      "Your campaign is set up — now let's talk about what happens after you hit publish. Monitoring your ads correctly is the difference between wasting money and printing it.",
  },
  {
    id: 'launch-2',
    sender: 'ai',
    video: {
      src: '/teaching-video.mp4',
      title: 'Reading Your Ad Dashboard Like a Pro',
      duration: '2:47',
    },
  },
  {
    id: 'launch-3',
    sender: 'ai',
    visualCard: {
      icon: '📈',
      title: 'Key Metrics to Watch',
      items: [
        { label: 'CPM (Cost per 1k impressions)', value: 'Target: under $15' },
        { label: 'CTR (Click-through rate)', value: 'Target: above 1.5%' },
        { label: 'CPC (Cost per click)', value: 'Target: under $2' },
        { label: 'CPA (Cost per acquisition)', value: 'Depends on your offer' },
      ],
    },
    content:
      "These are the four numbers you need to check daily for the first week. If any are off, I'll tell you exactly what to adjust.",
  },
  {
    id: 'launch-4',
    sender: 'ai',
    content:
      "Pro tip: Don't touch your ads for the first 48 hours after launch. Meta's algorithm needs time to learn who responds best. After that, we'll optimize together based on the data.",
  },
];

// ---------------------------------------------------------------------------
// Task definitions
// ---------------------------------------------------------------------------
const tasks: ActionTask[] = [
  {
    id: 'complete-profile',
    title: 'Complete Your Profile',
    subtitle: 'Auto-completed from onboarding',
    type: 'quick',
    status: 'completed',
    estimatedTime: '1 min',
  },
  {
    id: 'define-audience',
    title: 'Define Your Audience',
    subtitle: 'Nail down exactly who your ads should target',
    type: 'guided',
    status: 'active',
    estimatedTime: '3 min',
    messages: defineAudienceMessages,
  },
  {
    id: 'create-campaign',
    title: 'Create Your First Campaign',
    subtitle: 'Build a high-converting ad step by step',
    type: 'guided',
    status: 'locked',
    estimatedTime: '5 min',
    messages: createCampaignMessages,
  },
  {
    id: 'set-budget',
    title: 'Set Your Budget',
    subtitle: 'Choose a daily spend that fits your goals',
    type: 'quick',
    status: 'locked',
    estimatedTime: '1 min',
  },
  {
    id: 'expert-review',
    title: 'Get an Expert Review',
    subtitle: 'Have a strategist review your setup for free',
    type: 'offer',
    status: 'active',
    offerCta: 'Book a Free Strategy Call',
    offerUrl: '#strategy-call',
  },
  {
    id: 'launch-monitor',
    title: 'Launch & Monitor',
    subtitle: 'Go live and learn to read your results',
    type: 'guided',
    status: 'locked',
    estimatedTime: '4 min',
    messages: launchMonitorMessages,
  },
  {
    id: 'dfy-setup',
    title: 'Done-For-You Setup',
    subtitle: 'Let our team build and manage your campaigns',
    type: 'offer',
    status: 'active',
    offerCta: 'Get Started — $497',
    offerUrl: '#dfy-setup',
    offerPrice: '$497',
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a fresh copy of the initial task list.
 * - Task 1 ("Complete Profile") is already completed.
 * - Task 2 ("Define Audience") is active.
 * - Offer tasks (5, 7) are always active (visible but distinct).
 * - All other tasks are locked.
 */
export function getInitialTasks(): ActionTask[] {
  return tasks.map((task) => ({ ...task }));
}
