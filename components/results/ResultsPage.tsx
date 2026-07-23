'use client';

import { useMemo } from 'react';
import { UserAnswers } from '@/lib/types';
import { buildResultsFromAnswers } from '@/lib/buildResults';
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

interface ResultsPageProps {
  userAnswers: UserAnswers;
}

export default function ResultsPage({ userAnswers }: ResultsPageProps) {
  const config = useMemo(() => buildResultsFromAnswers(userAnswers), [userAnswers]);

  const sections = [
    <ProfileCard key="profile" tags={config.profileTags} summary={config.description} />,
    <VideoPlaceholder key="video" />,
    <RecommendationCard
      key="rec"
      name={config.recommendation.name}
      description={config.recommendation.description}
      features={config.recommendation.features}
    />,
    <ActionPlanCard key="plan" productName={config.recommendation.name} />,
    <CtaBlock key="cta1" href={config.ctaUrl} />,
    <TestimonialCard
      key="testimonial"
      quote={config.testimonial.quote}
      name={config.testimonial.name}
      detail={config.testimonial.detail}
    />,
    <ProcessCard key="process" />,
    <DemoSection key="demos" />,
    <FaqSection key="faq" />,
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
