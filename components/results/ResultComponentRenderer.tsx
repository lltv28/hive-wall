'use client';

import { ResultsConfig } from '@/lib/buildResults';
import ResultsHero from './ResultsHero';
import ProfileCard from './ProfileCard';
import VideoPlaceholder from './PainCard';
import RecommendationCard from './RecommendationCard';
import ActionPlanCard from './ActionPlanCard';
import CtaBlock from './CtaBlock';
import TestimonialCard from './TestimonialCard';
import ProcessCard from './ProcessCard';
import DemoSection from './DemoSection';
import FaqSection from './FaqSection';
import SocialProofStrip from './SocialProofStrip';

interface ResultComponentRendererProps {
  componentKey: string;
  config: ResultsConfig;
  isActive: boolean;
  onContinue: () => void;
}

export default function ResultComponentRenderer({ componentKey, config, isActive, onContinue }: ResultComponentRendererProps) {
  let component: React.ReactNode = null;

  switch (componentKey) {
    case 'hero':
      component = (
        <ResultsHero
          score={config.score}
          headline={config.headline}
          description={config.description}
          recommendation={config.recommendation}
        />
      );
      break;
    case 'profile':
      component = <ProfileCard tags={config.profileTags} summary={config.description} />;
      break;
    case 'video':
      component = <VideoPlaceholder />;
      break;
    case 'recommendation':
      component = (
        <RecommendationCard
          name={config.recommendation.name}
          description={config.recommendation.description}
          features={config.recommendation.features}
        />
      );
      break;
    case 'actionPlan':
      component = <ActionPlanCard productName={config.recommendation.name} />;
      break;
    case 'cta':
      component = <CtaBlock href={config.ctaUrl} />;
      break;
    case 'testimonial':
      component = (
        <TestimonialCard
          quote={config.testimonial.quote}
          name={config.testimonial.name}
          detail={config.testimonial.detail}
        />
      );
      break;
    case 'process':
      component = <ProcessCard />;
      break;
    case 'demos':
      component = <DemoSection />;
      break;
    case 'faq':
      component = <FaqSection />;
      break;
    case 'socialProof':
      component = <SocialProofStrip />;
      break;
  }

  return (
    <>
      {component}
      {isActive && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onContinue}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
            style={{
              background: 'var(--gradient-cta-active)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--alpha-dark-900)',
            }}
          >
            Continue
          </button>
        </div>
      )}
    </>
  );
}
