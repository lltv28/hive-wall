'use client';

import { useState } from 'react';
import SectionCard from './SectionCard';

const FAQS = [
  {
    question: 'What exactly is a "Done-For-You AI Product"?',
    answer: 'We build a custom AI-powered tool trained on your expertise, methodology, and content. It works 24/7 to sell, deliver, or operate parts of your business — without you being involved in every interaction.',
  },
  {
    question: 'How long does it take to build?',
    answer: 'Most AI products go live within 14 days. We handle everything — strategy, development, training, and deployment. You just provide your existing content and expertise.',
  },
  {
    question: 'Do I need any technical skills?',
    answer: 'None at all. Our team handles 100% of the technical work. You bring the expertise, we build the product. Most of our clients have zero technical background.',
  },
  {
    question: 'What kind of results can I expect?',
    answer: 'Results vary by business type and product, but our clients typically see ROI within the first 30 days. AI Salesperson clients average 40+ qualified leads per month. AI Delivery clients free up 20+ hours per week.',
  },
  {
    question: 'What if my business is too niche?',
    answer: "We've built AI products for over 500 coaches and consultants across dozens of niches — from executive coaching to pet training. The more specialized your expertise, the more valuable your AI product becomes.",
  },
  {
    question: 'What happens on the strategy call?',
    answer: "It's a free 30-minute call where we analyze your business, identify the highest-ROI AI product opportunity, and map out exactly how we'd build it. No obligation, no pressure — just clarity on what's possible.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        background: '#fff',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)',
            color: '#18181B',
            lineHeight: 1.4,
          }}
        >
          {question}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="#A1A1AA"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      <div
        style={{
          maxHeight: open ? '300px' : '0',
          overflow: 'hidden',
          transition: 'max-height 300ms ease',
        }}
      >
        <div
          style={{
            padding: '0 16px 16px',
            fontSize: '13px',
            color: '#71717A',
            lineHeight: 1.6,
          }}
        >
          {answer}
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
  return (
    <SectionCard label="Frequently Asked Questions" icon={'\u2753'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {FAQS.map((faq, i) => (
          <FaqItem key={i} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </SectionCard>
  );
}
