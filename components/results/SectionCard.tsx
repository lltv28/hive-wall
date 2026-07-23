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
