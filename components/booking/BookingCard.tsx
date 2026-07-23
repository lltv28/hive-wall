'use client';

import { useEffect, useRef, useState } from 'react';

type Stage = 'date' | 'time' | 'confirm' | 'success';

interface BookingCardProps {
  /** Called once the booking is confirmed (success shown). */
  onBooked: () => void;
  /** Drive the flow automatically (demo / wall mode) instead of waiting for clicks. */
  autoComplete?: boolean;
  /** Base step delay in ms for autoComplete. Scaled down for snappier wall playback. */
  autoDelayMs?: number;
  title?: string;
}

type Day = { date: Date; dow: string; num: number };

const TIME_SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM'];

// Seven upcoming weekdays (skip Sundays to feel business-like), built once per mount.
function buildDays(): Day[] {
  const days: Day[] = [];
  const cursor = new Date();
  while (days.length < 7) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 0) continue;
    days.push({
      date: new Date(cursor),
      dow: cursor.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
      num: cursor.getDate(),
    });
  }
  return days;
}

const fmtLong = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export default function BookingCard({
  onBooked,
  autoComplete = false,
  autoDelayMs = 1400,
  title = 'Book a free AI strategy call',
}: BookingCardProps) {
  const [days] = useState(buildDays);
  const [stage, setStage] = useState<Stage>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const onBookedRef = useRef(onBooked);
  useEffect(() => {
    onBookedRef.current = onBooked;
  }, [onBooked]);

  // Auto-pilot: walk date -> time -> confirm -> success, then report the booking.
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (!autoComplete || autoRanRef.current) return;
    autoRanRef.current = true;

    const unit = Math.max(260, autoDelayMs * 0.5);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    at(unit * 0.6, () => {
      setSelectedDate(days[1].date);
      setStage('time');
    });
    at(unit * 1.4, () => {
      setSelectedTime(TIME_SLOTS[2]);
      setStage('confirm');
    });
    at(unit * 2.0, () => {
      setName('Jordan Avery');
      setEmail('jordan@example.com');
    });
    at(unit * 2.8, () => setStage('success'));
    at(unit * 3.8, () => onBookedRef.current());

    return () => timers.forEach(clearTimeout);
  }, [autoComplete, autoDelayMs, days]);

  const cardStyle: React.CSSProperties = {
    borderColor: '#E5E5E8',
    boxShadow: 'var(--shadow-card)',
  };

  const labelStyle: React.CSSProperties = {
    color: '#2E7D52',
    fontSize: '12px',
    fontWeight: 'var(--font-semibold)',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    marginBottom: '10px',
  };

  return (
    <section className="bg-white rounded-2xl border p-6 animate-fade-in-up" style={cardStyle}>
      <p style={labelStyle}>{stage === 'success' ? 'Call Booked' : 'Strategy Call'}</p>

      <h2
        style={{
          color: 'var(--alpha-light-900)',
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          lineHeight: 1.35,
          marginBottom: '6px',
        }}
      >
        {stage === 'success' ? "You're booked in." : title}
      </h2>

      <div
        className="flex flex-wrap gap-x-4 gap-y-1"
        style={{ color: '#71717A', fontSize: '13px', marginBottom: '18px' }}
      >
        <span>30 min</span>
        <span>·</span>
        <span>With the Kodara team</span>
        <span>·</span>
        <span>Google Meet</span>
      </div>

      {/* Stage: pick a date */}
      {stage === 'date' && (
        <div>
          <p style={{ color: '#A1A1AA', fontSize: '13px', marginBottom: '10px' }}>Select a date</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {days.map((day) => {
              const isSelected = selectedDate?.getTime() === day.date.getTime();
              return (
                <button
                  key={day.date.toISOString()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.date);
                    setStage('time');
                  }}
                  className="flex flex-col items-center rounded-xl border py-2 transition-colors duration-150 cursor-pointer"
                  style={{
                    borderColor: isSelected ? '#2E7D52' : '#E5E5E8',
                    background: isSelected ? '#2E7D52' : '#ffffff',
                    color: isSelected ? '#ffffff' : 'var(--alpha-light-900)',
                  }}
                >
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{day.dow}</span>
                  <span style={{ fontSize: '16px', fontWeight: 'var(--font-semibold)' }}>{day.num}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage: pick a time */}
      {stage === 'time' && selectedDate && (
        <div>
          <button
            type="button"
            onClick={() => setStage('date')}
            className="mb-2 cursor-pointer"
            style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '12px', padding: 0 }}
          >
            ‹ Back to dates
          </button>
          <p style={{ color: '#A1A1AA', fontSize: '13px', marginBottom: '4px' }}>Available times</p>
          <p style={{ color: 'var(--alpha-light-900)', fontSize: '13px', fontWeight: 'var(--font-medium)', marginBottom: '10px' }}>
            {fmtLong(selectedDate)}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  setSelectedTime(slot);
                  setStage('confirm');
                }}
                className="rounded-xl border py-2 text-center transition-colors duration-150 cursor-pointer hover:border-[#2E7D52]"
                style={{
                  borderColor: '#E5E5E8',
                  background: '#ffffff',
                  color: 'var(--alpha-light-900)',
                  fontSize: '13px',
                  fontWeight: 'var(--font-medium)',
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stage: confirm details */}
      {stage === 'confirm' && selectedDate && selectedTime && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStage('success');
            window.setTimeout(() => onBookedRef.current(), 900);
          }}
        >
          <button
            type="button"
            onClick={() => setStage('time')}
            className="mb-2 cursor-pointer"
            style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '12px', padding: 0 }}
          >
            ‹ Back to times
          </button>
          <p style={{ color: 'var(--alpha-light-900)', fontSize: '13px', fontWeight: 'var(--font-medium)', marginBottom: '12px' }}>
            {fmtLong(selectedDate)} at {selectedTime}
          </p>
          <input
            type="text"
            required
            placeholder="First and last name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border mb-2 px-3 py-2"
            style={{ borderColor: '#E5E5E8', fontSize: '14px', color: 'var(--alpha-light-900)' }}
          />
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border mb-3 px-3 py-2"
            style={{ borderColor: '#E5E5E8', fontSize: '14px', color: 'var(--alpha-light-900)' }}
          />
          <button
            type="submit"
            className="w-full cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
            style={{
              background: 'var(--gradient-cta-active)',
              color: 'var(--alpha-dark-900)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-medium)',
            }}
          >
            Confirm booking
          </button>
        </form>
      )}

      {/* Stage: success */}
      {stage === 'success' && selectedDate && selectedTime && (
        <div className="text-center py-2 animate-fade-in">
          <div
            className="mx-auto mb-3 flex items-center justify-center rounded-full"
            style={{ width: '48px', height: '48px', background: '#2E7D52' }}
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8L7 12L13 4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ color: 'var(--alpha-light-900)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: '4px' }}>
            Your call is confirmed
          </p>
          <p style={{ color: '#71717A', fontSize: '13px' }}>
            {fmtLong(selectedDate)} at {selectedTime} · invite sent
          </p>
        </div>
      )}
    </section>
  );
}
