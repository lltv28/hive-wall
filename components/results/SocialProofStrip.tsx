'use client';

const GRADIENTS = [
  'linear-gradient(135deg, #93c5a8, #5ea97a)',
  'linear-gradient(135deg, #a1a1aa, #71717a)',
  'linear-gradient(135deg, #d4d4d8, #a1a1aa)',
  'linear-gradient(135deg, #7ac4a0, #3a9b68)',
];

export default function SocialProofStrip() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
      <div style={{ display: 'flex' }}>
        {GRADIENTS.map((bg, i) => (
          <div
            key={i}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: bg,
              border: '2px solid #F6F6F7',
              marginLeft: i > 0 ? '-8px' : 0,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: '12px', color: '#71717A' }}>
        <strong style={{ color: '#52525B' }}>500+</strong> coaches &amp; consultants have built AI products with Kodara
      </div>
    </div>
  );
}
