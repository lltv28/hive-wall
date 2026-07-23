import { DMessage, ActionTask } from '@/lib/types';

// ---------------------------------------------------------------------------
// Quiz Config Types
// ---------------------------------------------------------------------------

export type ChipOption = {
  label: string;
  value: string;
  emoji?: string;
  description?: string;
};

export type QuizQuestion = {
  id: string;
  preamble?: string;
  content: string;
  subtitle?: string;
  chips: ChipOption[];
  multiSelect?: boolean;
};

export type QuizCallout = {
  id: string;
  headline: string;
  body: string;
  stat?: string;
  video?: { src: string; title: string };
};

export type QuizFitScore = {
  id: string;
  percentage: number;
  message: string;
  cta: string;
};

export type FlowItem = {
  type: 'question' | 'callout' | 'fitScore';
  id: string;
};

export type QuizMilestone = {
  atFlowIndex: number;
  label: string;
  insight?: string;
};

export type GuidedMessage = {
  id: string;
  sender: 'ai' | 'user';
  content?: string;
  subtitle?: string;
  video?: { src: string; title: string; duration: string };
  visualCard?: { icon: string; title: string; items: { label: string; value: string }[] };
  chips?: ChipOption[];
  offerCard?: { title: string; description: string; cta: string; price?: string };
  waitForInput?: boolean;
};

export type ConfigActionPlanTask = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'quick' | 'guided' | 'offer';
  initialStatus?: 'completed' | 'active' | 'locked';
  estimatedTime?: string;
  messages?: GuidedMessage[];
  offerCta?: string;
  offerUrl?: string;
  offerPrice?: string;
};

export type QuizConfig = {
  flow: FlowItem[];
  questions: QuizQuestion[];
  callouts: QuizCallout[];
  fitScores: QuizFitScore[];
  actionPlan: ConfigActionPlanTask[];
  milestones: QuizMilestone[];
};

// ---------------------------------------------------------------------------
// Transformer 1: QuizConfig -> DMessage[] (onboarding flow)
// ---------------------------------------------------------------------------

export function configToOnboardingMessages(config: QuizConfig): DMessage[] {
  const messages: DMessage[] = [];

  config.flow.forEach((item, index) => {
    const isLast = index === config.flow.length - 1;

    if (item.type === 'question') {
      const q = config.questions.find((qq) => qq.id === item.id);
      if (!q) return;

      // Emit preamble message if present
      if (q.preamble) {
        messages.push({
          id: `preamble-${q.id}`,
          sender: 'ai',
          content: q.preamble,
        });
      }

      // Emit question message
      messages.push({
        id: `q-${q.id}`,
        sender: 'ai',
        content: q.content,
        subtitle: q.subtitle,
        chips: q.chips,
        multiSelect: q.multiSelect,
        waitForInput: true,
        ...(isLast ? { triggersPhaseChange: true } : {}),
      });
    } else if (item.type === 'callout') {
      const callout = config.callouts.find((cc) => cc.id === item.id);
      if (!callout) return;

      messages.push({
        id: `callout-${callout.id}`,
        sender: 'ai',
        callout: {
          headline: callout.headline,
          body: callout.body,
          stat: callout.stat,
          video: callout.video,
        },
        ...(isLast
          ? { triggersPhaseChange: true }
          : { waitForInput: true }),
      });
    } else if (item.type === 'fitScore') {
      const fs = config.fitScores.find((ff) => ff.id === item.id);
      if (!fs) return;

      messages.push({
        id: `fit-${fs.id}`,
        sender: 'ai',
        fitScore: {
          percentage: fs.percentage,
          message: fs.message,
          cta: fs.cta,
        },
        ...(isLast
          ? { triggersPhaseChange: true }
          : { waitForInput: true }),
      });
    }
  });

  return messages;
}

// ---------------------------------------------------------------------------
// Transformer 2: QuizConfig -> ActionTask[] (action plan)
// ---------------------------------------------------------------------------

export function configToActionPlanTasks(config: QuizConfig): ActionTask[] {
  let firstActiveAssigned = false;

  return config.actionPlan.map((task) => {
    let status: 'completed' | 'active' | 'locked';

    if (task.initialStatus) {
      status = task.initialStatus;
    } else if (task.type === 'offer') {
      status = 'active';
    } else if (!firstActiveAssigned) {
      status = 'active';
      firstActiveAssigned = true;
    } else {
      status = 'locked';
    }

    return {
      id: task.id,
      title: task.title,
      subtitle: task.subtitle,
      type: task.type,
      status,
      estimatedTime: task.estimatedTime,
      messages: task.messages as DMessage[] | undefined,
      offerCta: task.offerCta,
      offerUrl: task.offerUrl,
      offerPrice: task.offerPrice,
    };
  });
}
