export type TaskType = 'quick' | 'guided' | 'offer';
export type TaskStatus = 'completed' | 'active' | 'locked';

export type ActionTask = {
  id: string;
  title: string;
  subtitle?: string;
  type: TaskType;
  status: TaskStatus;
  estimatedTime?: string;
  messages?: DMessage[];
  offerCta?: string;
  offerUrl?: string;
  offerPrice?: string;
};

export type DMessage = {
  id: string;
  sender: 'ai' | 'user';
  content?: string;
  subtitle?: string;
  video?: { src: string; title: string; duration: string };
  visualCard?: { icon: string; title: string; items: { label: string; value: string }[] };
  chips?: { label: string; value: string; emoji?: string; description?: string }[];
  multiSelect?: boolean;
  offerCard?: { title: string; description: string; cta: string; price?: string };
  fitScore?: { percentage: number; message: string; cta: string };
  callout?: { headline: string; body: string; stat?: string; video?: { src: string; title: string } };
  waitForInput?: boolean;
  triggersPhaseChange?: boolean;
  resultComponent?: 'hero' | 'profile' | 'video' | 'recommendation' | 'actionPlan' | 'cta' | 'testimonial' | 'process' | 'demos' | 'faq' | 'socialProof';
};

export type UserAnswers = Record<string, string>;
