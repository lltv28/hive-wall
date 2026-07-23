import {
  QuizConfig,
  QuizQuestion,
  QuizCallout,
  QuizFitScore,
  FlowItem,
  ConfigActionPlanTask,
  GuidedMessage,
  QuizMilestone,
} from './quiz-config';
import { saveConfig } from './config-provider';
import { onboardingSteps } from './onboardingMessages';
import { getInitialTasks } from './actionPlanTasks';

export async function seedConfig(): Promise<void> {
  const questions: QuizQuestion[] = [];
  const callouts: QuizCallout[] = [];
  const fitScores: QuizFitScore[] = [];
  const flow: FlowItem[] = [];

  // -------------------------------------------------------------------------
  // Walk each step group and classify it
  // -------------------------------------------------------------------------
  for (const stepGroup of onboardingSteps) {
    // Check if any message in this group has chips → question
    const chipMessage = stepGroup.find((m) => m.chips);
    if (chipMessage) {
      // All messages before the chip-bearing message contribute preamble
      const chipIndex = stepGroup.indexOf(chipMessage);
      const preambleParts = stepGroup
        .slice(0, chipIndex)
        .filter((m) => m.content)
        .map((m) => m.content!);

      const question: QuizQuestion = {
        id: chipMessage.id,
        content: chipMessage.content ?? '',
        chips: chipMessage.chips!.map((c) => ({
          label: c.label,
          value: c.value,
          ...(c.emoji ? { emoji: c.emoji } : {}),
          ...(c.description ? { description: c.description } : {}),
        })),
        ...(preambleParts.length > 0
          ? { preamble: preambleParts.join('\n\n') }
          : {}),
        ...(chipMessage.subtitle ? { subtitle: chipMessage.subtitle } : {}),
        ...(chipMessage.multiSelect ? { multiSelect: true } : {}),
      };

      questions.push(question);
      flow.push({ type: 'question', id: chipMessage.id });
      continue;
    }

    // Check if any message has an callout
    const interMessage = stepGroup.find((m) => m.callout);
    if (interMessage && interMessage.callout) {
      const inter: QuizCallout = {
        id: interMessage.id,
        headline: interMessage.callout.headline,
        body: interMessage.callout.body,
        ...(interMessage.callout.stat
          ? { stat: interMessage.callout.stat }
          : {}),
      };

      callouts.push(inter);
      flow.push({ type: 'callout', id: interMessage.id });
      continue;
    }

    // Check if any message has a fitScore
    const fitMessage = stepGroup.find((m) => m.fitScore);
    if (fitMessage && fitMessage.fitScore) {
      const fs: QuizFitScore = {
        id: fitMessage.id,
        percentage: fitMessage.fitScore.percentage,
        message: fitMessage.fitScore.message,
        cta: fitMessage.fitScore.cta,
      };

      fitScores.push(fs);
      flow.push({ type: 'fitScore', id: fitMessage.id });
      continue;
    }
  }

  // -------------------------------------------------------------------------
  // Build actionPlan from getInitialTasks()
  // -------------------------------------------------------------------------
  const initialTasks = getInitialTasks();

  const actionPlan: ConfigActionPlanTask[] = initialTasks.map((task) => {
    const configTask: ConfigActionPlanTask = {
      id: task.id,
      title: task.title,
      type: task.type,
      ...(task.subtitle ? { subtitle: task.subtitle } : {}),
      ...(task.status ? { initialStatus: task.status } : {}),
      ...(task.estimatedTime ? { estimatedTime: task.estimatedTime } : {}),
      ...(task.offerCta ? { offerCta: task.offerCta } : {}),
      ...(task.offerUrl ? { offerUrl: task.offerUrl } : {}),
      ...(task.offerPrice ? { offerPrice: task.offerPrice } : {}),
      ...(task.messages
        ? {
            messages: task.messages.map((m) => {
              const gm: GuidedMessage = {
                id: m.id,
                sender: m.sender,
                ...(m.content !== undefined ? { content: m.content } : {}),
                ...(m.subtitle ? { subtitle: m.subtitle } : {}),
                ...(m.video ? { video: m.video } : {}),
                ...(m.visualCard ? { visualCard: m.visualCard } : {}),
                ...(m.chips
                  ? {
                      chips: m.chips.map((c) => ({
                        label: c.label,
                        value: c.value,
                        ...(c.emoji ? { emoji: c.emoji } : {}),
                        ...(c.description ? { description: c.description } : {}),
                      })),
                    }
                  : {}),
                ...(m.offerCard ? { offerCard: m.offerCard } : {}),
                ...(m.waitForInput ? { waitForInput: true } : {}),
              };
              return gm;
            }),
          }
        : {}),
    };

    return configTask;
  });

  // -------------------------------------------------------------------------
  // Assemble and save
  // -------------------------------------------------------------------------
  const milestones: QuizMilestone[] = [
    { atFlowIndex: 3, label: 'Profile', insight: "Strong foundation — you're ahead of 73% of coaches we've assessed" },
    { atFlowIndex: 7, label: 'Readiness', insight: "High readiness detected — your business model is primed for AI products" },
    { atFlowIndex: 12, label: 'Potential', insight: 'Matched to 3 proven AI product templates for your niche' },
    { atFlowIndex: 19, label: 'Results' },
  ];

  const config: QuizConfig = {
    flow,
    questions,
    callouts,
    fitScores,
    actionPlan,
    milestones,
  };

  await saveConfig(config);
}
