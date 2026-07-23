'use client';

import { useState } from 'react';

interface ChipPickerProps {
  chips: { label: string; value: string; emoji?: string; description?: string }[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  multiSelect?: boolean;
  onMultiSubmit?: (values: string[]) => void;
}

export default function ChipPicker({ chips, onSelect, disabled, multiSelect, onMultiSubmit }: ChipPickerProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const isDisabled = disabled || (!multiSelect && selectedValue !== null) || submitted;
  const isGridMode = chips.some((c) => c.emoji);

  function handleSelect(value: string) {
    if (isDisabled) return;

    if (multiSelect) {
      setSelectedValues((prev) => {
        const next = new Set(prev);
        if (next.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        return next;
      });
    } else {
      setSelectedValue(value);
      onSelect(value);
    }
  }

  function handleMultiSubmit() {
    if (selectedValues.size === 0) return;
    setSubmitted(true);
    const values = Array.from(selectedValues);
    if (onMultiSubmit) {
      onMultiSubmit(values);
    } else {
      onSelect(values.join(', '));
    }
  }

  if (isGridMode) {
    return (
      <div className="flex flex-col gap-3">
        <div style={{ display: 'grid', gridTemplateColumns: chips.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px' }}>
          {chips.map((chip, i) => {
            const isSelected = multiSelect
              ? selectedValues.has(chip.value)
              : selectedValue === chip.value;
            const cols = chips.length === 3 ? 3 : 2;
            const isLastOdd = i === chips.length - 1 && chips.length % cols === 1;

            return (
              <button
                key={chip.value}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelect(chip.value)}
                style={{
                  gridColumn: isLastOdd ? '1 / -1' : undefined,
                  padding: isLastOdd ? '18px' : '22px 18px',
                  background: '#ffffff',
                  border: isSelected ? '2px solid var(--alpha-brand-950)' : '2px solid transparent',
                  borderRadius: '12px',
                  boxShadow: isSelected ? 'none' : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                  textAlign: 'center',
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled && !isSelected ? 0.5 : 1,
                  transition: 'border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {isLastOdd ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{chip.emoji}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: '#18181B' }}>
                      {chip.label}
                    </span>
                  </span>
                ) : (
                  <>
                    <div style={{ fontSize: '34px', marginBottom: '6px' }}>{chip.emoji}</div>
                    <div style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-medium)',
                      color: '#18181B',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {chip.label}
                    </div>
                    {chip.description && (
                      <div style={{
                        fontSize: 'var(--text-xs)',
                        color: '#A1A1AA',
                        marginTop: '3px',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                      }}>
                        {chip.description}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
        {multiSelect && !submitted && (
          <button
            type="button"
            onClick={handleMultiSubmit}
            disabled={selectedValues.size === 0}
            className="self-center transition-all duration-200"
            style={{
              background: selectedValues.size > 0 ? 'var(--gradient-cta-active)' : 'var(--gradient-cta-disabled)',
              padding: '10px 24px',
              fontSize: 'var(--text-lg)',
              fontWeight: 500,
              color: 'var(--alpha-dark-900)',
              borderRadius: '10px',
              border: 'none',
              cursor: selectedValues.size > 0 ? 'pointer' : 'default',
              opacity: selectedValues.size > 0 ? 1 : 0.5,
            }}
          >
            Next
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const isSelected = multiSelect
            ? selectedValues.has(chip.value)
            : selectedValue === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(chip.value)}
              className="px-4 py-2.5 rounded-xl transition-colors"
              style={{
                fontSize: 'var(--text-base)',
                border: isSelected
                  ? '1px solid var(--alpha-brand-950)'
                  : '1px solid var(--alpha-light-100)',
                background: '#ffffff',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                color: isSelected
                  ? 'var(--alpha-brand-950)'
                  : 'var(--alpha-light-900)',
                fontVariationSettings: "'wdth' 100",
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled && !isSelected ? 0.5 : 1,
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
      {multiSelect && !submitted && (
        <button
          type="button"
          onClick={handleMultiSubmit}
          disabled={selectedValues.size === 0}
          className="self-start transition-all duration-200"
          style={{
            background: selectedValues.size > 0 ? 'var(--gradient-cta-active)' : 'var(--gradient-cta-disabled)',
            padding: '10px 24px',
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            color: selectedValues.size > 0 ? 'var(--alpha-dark-900)' : 'var(--alpha-light-400)',
            borderRadius: '10px',
            border: 'none',
            cursor: selectedValues.size > 0 ? 'pointer' : 'default',
            opacity: selectedValues.size > 0 ? 1 : 0.5,
          }}
        >
          Next
        </button>
      )}
    </div>
  );
}
