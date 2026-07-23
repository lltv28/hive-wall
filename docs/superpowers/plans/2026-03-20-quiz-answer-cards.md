# Quiz Answer Cards Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the ChipPicker into a 2-column grid of emoji cards for quiz questions, with fallback to small pills for guided flows.

**Architecture:** Extend the chip data type with optional `emoji` and `description` fields. ChipPicker detects `emoji` presence and switches between grid mode (cards) and pill mode (current). Parent components conditionally remove left indent for grid mode. All 13 quiz questions get emoji + description content.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-quiz-answer-cards-design.md`

---

## Chunk 1: Data Model

### Task 1: Extend chip type in types.ts

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Update the `DMessage` type's `chips` field**

In `lib/types.ts`, change:
```ts
chips?: { label: string; value: string }[];
```
To:
```ts
chips?: { label: string; value: string; emoji?: string; description?: string }[];
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Passes — the change is additive and backwards-compatible.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add emoji and description to chip type"
```

---

## Chunk 2: ChipPicker Grid Mode

### Task 2: Add grid card rendering to ChipPicker

**Files:**
- Modify: `components/ChipPicker.tsx`

- [ ] **Step 1: Update the `ChipPickerProps` interface**

Change:
```ts
chips: { label: string; value: string }[];
```
To:
```ts
chips: { label: string; value: string; emoji?: string; description?: string }[];
```

- [ ] **Step 2: Add grid mode detection**

At the top of the component function body, add:
```ts
const isGridMode = chips.some((c) => c.emoji);
```

- [ ] **Step 3: Implement grid card rendering**

When `isGridMode` is true, replace the current flex-wrap pill layout with a 2-column CSS grid. The full render logic for grid mode:

```tsx
if (isGridMode) {
  return (
    <div className="flex flex-col gap-3">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {chips.map((chip, i) => {
          const isSelected = multiSelect
            ? selectedValues.has(chip.value)
            : selectedValue === chip.value;
          const isLastOdd = i === chips.length - 1 && chips.length % 2 === 1;

          return (
            <button
              key={chip.value}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(chip.value)}
              style={{
                gridColumn: isLastOdd ? '1 / -1' : undefined,
                padding: isLastOdd ? '14px' : '18px 14px',
                background: isSelected ? 'rgba(59, 130, 246, 0.04)' : '#FFFFFF',
                border: isSelected ? '2px solid #3B82F6' : '2px solid #E5E5E8',
                borderRadius: '14px',
                textAlign: 'center',
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled && !isSelected ? 0.5 : 1,
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
            >
              {isLastOdd ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{chip.emoji}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181B' }}>
                    {chip.label}
                  </span>
                </span>
              ) : (
                <>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>{chip.emoji}</div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
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
                      fontSize: '11px',
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
          className="self-start rounded-full text-white transition-all duration-200"
          style={{
            background: selectedValues.size > 0 ? 'var(--btn-primary)' : 'var(--btn-disabled)',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
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
```

Place this block right after the `isGridMode` check, BEFORE the existing pill-mode return. The existing pill-mode code remains unchanged as the fallback.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Passes.

- [ ] **Step 5: Commit**

```bash
git add components/ChipPicker.tsx
git commit -m "feat: add 2-column grid card mode to ChipPicker"
```

---

## Chunk 3: Chat Layout — Remove Indent for Grid Mode

### Task 3: Conditionally remove ml-9 indent in OnboardingChat and FlowChat

**Files:**
- Modify: `components/OnboardingChat.tsx`
- Modify: `components/FlowChat.tsx`

- [ ] **Step 1: Update OnboardingChat.tsx**

Find the chip container div (currently `<div className="mt-3 ml-9">`). Make the `ml-9` conditional on whether the chips have emoji:

Change:
```tsx
{msg.chips && msg.id === activeChipMessageId && (
  <div className="mt-3 ml-9">
```

To:
```tsx
{msg.chips && msg.id === activeChipMessageId && (
  <div className={`mt-3 ${msg.chips.some((c) => c.emoji) ? '' : 'ml-9'}`}>
```

- [ ] **Step 2: Update FlowChat.tsx**

Same change. Find:
```tsx
{msg.chips && msg.id === activeChipMessageId && (
  <div className="mt-3 ml-9">
```

Change to:
```tsx
{msg.chips && msg.id === activeChipMessageId && (
  <div className={`mt-3 ${msg.chips.some((c) => c.emoji) ? '' : 'ml-9'}`}>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Passes.

- [ ] **Step 4: Commit**

```bash
git add components/OnboardingChat.tsx components/FlowChat.tsx
git commit -m "feat: remove left indent for grid-mode quiz cards"
```

---

## Chunk 4: Onboarding Messages Content

### Task 4: Add emoji and description to all quiz chip data

**Files:**
- Modify: `lib/onboardingMessages.ts`

This is the largest task — updating all 13 quiz questions (~55 chips) with `emoji` and `description` fields. The full content is specified in the design spec.

- [ ] **Step 1: Update Step 1 — Business Type (q1)**

Replace chips array:
```ts
chips: [
  { label: 'Coach / Consultant', value: 'coach', emoji: '\uD83C\uDFAF', description: '1-on-1 or group advisory' },
  { label: 'Service Provider', value: 'service', emoji: '\uD83C\uDFE5', description: 'Doctor, lawyer, accountant, etc.' },
  { label: 'Agency Owner', value: 'agency', emoji: '\uD83D\uDE80', description: 'Marketing, design, or dev agency' },
  { label: 'Course Creator', value: 'course', emoji: '\uD83D\uDCDA', description: 'Online courses & digital products' },
  { label: 'Other', value: 'other', emoji: '\u2728', description: 'Something else entirely' },
],
```

Note: The label for "Service Provider (doctor, lawyer, etc.)" is shortened to "Service Provider" since the detail moves to `description`. Same for "Course / Digital Product Creator" shortened to "Course Creator".

- [ ] **Step 2: Update Step 2 — Revenue Range (q2)**

```ts
chips: [
  { label: 'Under $100K', value: 'under-100k', emoji: '\uD83C\uDF31', description: 'Early stage or side hustle' },
  { label: '$100K - $300K', value: '100k-300k', emoji: '\uD83D\uDCC8', description: 'Growing and gaining traction' },
  { label: '$300K - $1M', value: '300k-1m', emoji: '\uD83D\uDD25', description: 'Scaling fast' },
  { label: '$1M - $5M', value: '1m-5m', emoji: '\u2B50', description: 'Established and profitable' },
  { label: '$5M+', value: '5m-plus', emoji: '\uD83D\uDC8E', description: 'Enterprise-level operation' },
],
```

- [ ] **Step 3: Update Step 3 — Vacation Test (q3)**

```ts
chips: [
  { label: 'It runs fine without me', value: 'runs-fine', emoji: '\u2600\uFE0F', description: 'Systems handle everything' },
  { label: 'Things would slow down', value: 'slows-down', emoji: '\u26A0\uFE0F', description: 'Team manages, but barely' },
  { label: 'Everything grinds to a halt', value: 'grinds-to-halt', emoji: '\uD83D\uDEA8', description: 'The business IS you' },
],
```

- [ ] **Step 4: Update Step 4 — Time Bottleneck (q4)**

```ts
chips: [
  { label: 'Selling new leads', value: 'selling', emoji: '\uD83D\uDCB0', description: 'Calls, proposals, follow-ups' },
  { label: 'Delivering for clients', value: 'delivering', emoji: '\uD83D\uDEE0\uFE0F', description: 'Doing the actual work' },
  { label: 'Creating content', value: 'content', emoji: '\u270F\uFE0F', description: 'Marketing, social, emails' },
  { label: 'Admin & operations', value: 'admin', emoji: '\uD83D\uDCCB', description: 'Hiring, systems, overhead' },
],
```

- [ ] **Step 5: Update Step 5 — Existing Assets (q5, multiSelect)**

```ts
chips: [
  { label: 'Training materials / SOPs', value: 'training', emoji: '\uD83D\uDCC4', description: 'Documented processes' },
  { label: 'Books or PDFs', value: 'books', emoji: '\uD83D\uDCD6', description: 'Written expertise' },
  { label: 'Online courses', value: 'courses', emoji: '\uD83C\uDF93', description: 'Video or digital programs' },
  { label: 'Group coaching', value: 'coaching', emoji: '\uD83D\uDC65', description: 'Live group sessions' },
  { label: 'Recorded calls', value: 'recordings', emoji: '\uD83C\uDF99\uFE0F', description: 'Workshops or meetings' },
  { label: 'Deep expertise only', value: 'expertise-only', emoji: '\uD83E\uDDE0', description: 'No content yet, just knowledge' },
],
```

- [ ] **Step 6: Update Step 6 — Scaling Attempts (q6, multiSelect)**

```ts
chips: [
  { label: 'Hired employees', value: 'hired', emoji: '\uD83D\uDC65', description: 'Built an internal team' },
  { label: 'Outsourced to agency', value: 'agency', emoji: '\uD83C\uDFE2', description: 'Delegated to external help' },
  { label: 'Built a course', value: 'course', emoji: '\uD83D\uDCDA', description: 'Created digital products' },
  { label: 'Tried AI tools', value: 'ai-tools', emoji: '\uD83E\uDD16', description: 'ChatGPT, automations, etc.' },
  { label: 'Group coaching', value: 'group', emoji: '\uD83D\uDDE3\uFE0F', description: 'Leveraged 1-to-many' },
  { label: 'Still looking', value: 'looking', emoji: '\uD83D\uDD0D', description: "Haven't found the right fit" },
],
```

- [ ] **Step 7: Update Step 7 — AI Usage (q7)**

```ts
chips: [
  { label: 'Not at all yet', value: 'none', emoji: '\uD83D\uDC4B', description: 'Starting from zero' },
  { label: 'Small tasks', value: 'small-tasks', emoji: '\uD83E\uDDE9', description: 'Occasional use, basic stuff' },
  { label: 'Use it regularly', value: 'regular', emoji: '\uD83D\uDCBB', description: 'Integrated into workflow' },
  { label: 'All-in on AI', value: 'all-in', emoji: '\uD83D\uDE80', description: 'AI-first business' },
],
```

- [ ] **Step 8: Update Step 8 — Use Case (q8)**

Shorten the long case-study labels. Detail moves to description:
```ts
chips: [
  { label: 'AI Salesperson', value: 'salesperson', emoji: '\uD83D\uDCB0', description: 'Pre-sell clients automatically' },
  { label: 'AI Service Delivery', value: 'delivery', emoji: '\uD83D\uDEE0\uFE0F', description: 'Serve clients without you' },
  { label: 'AI Operations Tool', value: 'operations', emoji: '\u2699\uFE0F', description: 'Outperform entire teams' },
  { label: 'Not sure yet', value: 'unsure', emoji: '\uD83E\uDD14', description: 'Show me more options' },
],
```

- [ ] **Step 9: Update Step 9 — Magic Question (q9)**

```ts
chips: [
  { label: 'Sell without sales calls', value: 'sell', emoji: '\uD83D\uDCB0', description: 'Close deals on autopilot' },
  { label: 'Deliver without doing the work', value: 'deliver', emoji: '\uD83D\uDEE0\uFE0F', description: 'AI handles fulfillment' },
  { label: 'Reach leads without content', value: 'reach', emoji: '\uD83D\uDCE3', description: 'Attract without the grind' },
  { label: 'Onboard without hand-holding', value: 'onboard', emoji: '\uD83D\uDC4B', description: 'Automate client setup' },
],
```

- [ ] **Step 10: Update Step 10 — Sales Process (q10)**

```ts
chips: [
  { label: '1-on-1 sales calls', value: 'calls', emoji: '\uD83D\uDCDE', description: 'Personal consultations' },
  { label: '1-to-many presentations', value: 'webinar', emoji: '\uD83C\uDFAC', description: 'Webinars, live events' },
  { label: 'In-person consultation', value: 'in-person', emoji: '\uD83E\uDD1D', description: 'Face-to-face meetings' },
  { label: 'Self-serve online', value: 'self-serve', emoji: '\uD83D\uDED2', description: 'They buy without talking to you' },
],
```

- [ ] **Step 11: Update Step 11 — Sales Complexity (q11)**

```ts
chips: [
  { label: 'Just 1 touch point', value: 'one', emoji: '\u26A1', description: 'Quick, simple close' },
  { label: '2-3 conversations', value: 'few', emoji: '\uD83D\uDCAC', description: 'Some nurturing needed' },
  { label: 'Many touch points', value: 'many', emoji: '\uD83D\uDD54', description: 'Long sales cycle' },
],
```

- [ ] **Step 12: Update Step 12 — Vision (q12)**

```ts
chips: [
  { label: 'Grow without adding headcount', value: 'grow-efficient', emoji: '\uD83D\uDCC8', description: 'Lean, efficient scaling' },
  { label: 'Less time, same revenue', value: 'less-time', emoji: '\uD83C\uDFD6\uFE0F', description: 'Work less, earn the same' },
  { label: 'Build an empire', value: 'empire', emoji: '\uD83D\uDC51', description: 'Scale as big as possible' },
  { label: 'Business runs without me', value: 'without-me', emoji: '\uD83C\uDF0C', description: 'True freedom' },
],
```

- [ ] **Step 13: Update Step 13 — Identity Close (q13, multiSelect)**

```ts
chips: [
  { label: 'Stop trading time for money', value: 'time-for-money', emoji: '\u23F0', description: 'Break the hourly trap' },
  { label: 'Scale past 7 figures', value: 'scale', emoji: '\uD83D\uDCC8', description: 'Grow without a big team' },
  { label: 'Unlimited clients', value: 'unlimited', emoji: '\uD83C\uDF1F', description: 'No capacity ceiling' },
  { label: 'Sells while I sleep', value: 'sells-while-sleep', emoji: '\uD83C\uDF19', description: 'Revenue on autopilot' },
  { label: "Business doesn't depend on me", value: 'not-depend', emoji: '\uD83D\uDD13', description: 'True independence' },
  { label: 'More strategy, less delivery', value: 'strategy', emoji: '\uD83E\uDDE0', description: 'CEO mindset, not worker' },
],
```

- [ ] **Step 14: Verify build**

Run: `npm run build`
Expected: Passes.

- [ ] **Step 15: Commit**

```bash
git add lib/onboardingMessages.ts
git commit -m "feat: add emoji and description to all quiz chip data"
```

---

## Chunk 5: Build Verification

### Task 5: Verify everything works end-to-end

- [ ] **Step 1: Run the build**

```bash
cd "C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1"
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Visual check**

Run `npm run dev` and verify at `http://localhost:3000`:
- Quiz questions show 2-column emoji grid cards
- Odd last items span full width
- Single-select: clicking a card highlights it blue, others fade
- Multi-select: multiple cards can be selected, Next button appears
- Guided flow chips (action plan tasks) still render as small pills
- Cards span full width (no left indent under avatar)

- [ ] **Step 3: Fix any issues**

If there are build or visual issues, fix them.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve any issues from quiz card implementation"
```
