# Loading Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the checklist + multi-card social proof loading screen with a single persistent proof card, progress bar, and step label.

**Architecture:** The `GeneratingChecklist` component is rewritten in-place. The `SocialProofContent` interface is trimmed (remove `testimonialQuote`/`testimonialAttribution`). Timer logic is simplified to a single interval advancing `currentStep` 0→3, then transitioning to a ready state via opacity fade, then firing `onComplete`. The outer wrapper in `App.tsx` only changes to drop the removed props.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, CSS transitions

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `components/GeneratingChecklist.tsx` | Rewrite | Proof card, progress bar, step label, timer logic |
| `components/App.tsx` | Modify (line 120-121) | Remove `testimonialQuote`/`testimonialAttribution` from socialProof prop |

---

### Task 1: Trim SocialProofContent interface and App.tsx call site

**Files:**
- Modify: `components/GeneratingChecklist.tsx:10-18` (SocialProofContent interface)
- Modify: `components/App.tsx:116-124` (socialProof prop object)

- [ ] **Step 1: Remove testimonial fields from SocialProofContent and make props required**

In `components/GeneratingChecklist.tsx`, change the `SocialProofContent` interface from:

```typescript
interface SocialProofContent {
  stat: string;
  statLabel: string;
  statSubtext: string;
  testimonialQuote: string;
  testimonialAttribution: string;
  readyTitle: string;
  readySubtitle: string;
}
```

to:

```typescript
interface SocialProofContent {
  stat: string;
  statLabel: string;
  statSubtext: string;
  readyTitle: string;
  readySubtitle: string;
}
```

Also in `GeneratingChecklistProps`, make `steps` and `socialProof` required (remove `?`):

```typescript
interface GeneratingChecklistProps {
  onComplete: () => void;
  steps: Step[];
  title?: string;
  subtitle?: string;
  icon?: string;
  socialProof: SocialProofContent;
}
```

Delete the `defaultSteps` constant (lines 29-34) — it is no longer needed since `steps` is required.

Update the component signature to destructure `steps` directly (no fallback):

```typescript
export default function GeneratingChecklist({ onComplete, steps, title, subtitle, icon, socialProof }: GeneratingChecklistProps) {
```

(Remove the `const steps = customSteps ?? defaultSteps;` line.)

- [ ] **Step 2: Remove testimonial props from App.tsx call site**

In `components/App.tsx`, change the `socialProof` prop (lines 116-124) from:

```tsx
socialProof={{
  stat: '500+',
  statLabel: 'Coaches & consultants have built AI products with Kodara',
  statSubtext: 'Average time to first revenue: 14 days',
  testimonialQuote: 'I went from idea to paying customers in 2 weeks. The AI product practically sells itself.',
  testimonialAttribution: '— Coach, Leadership Development',
  readyTitle: 'Your personalized report is ready',
  readySubtitle: 'Complete action plan with guided steps',
}}
```

to:

```tsx
socialProof={{
  stat: '500+',
  statLabel: 'Coaches & consultants have built AI products with Kodara',
  statSubtext: 'Average time to first revenue: 14 days',
  readyTitle: 'Your personalized report is ready',
  readySubtitle: 'Complete action plan with guided steps',
}}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to `testimonialQuote` or `testimonialAttribution`.

- [ ] **Step 4: Commit**

```bash
git add components/GeneratingChecklist.tsx components/App.tsx
git commit -m "refactor: remove testimonial fields from SocialProofContent interface"
```

---

### Task 2: Rewrite GeneratingChecklist — remove old rendering, add proof card + progress bar + step label

**Files:**
- Modify: `components/GeneratingChecklist.tsx` (full component body rewrite)

This task replaces all rendering below the header. The `Spinner` and `Checkmark` sub-components are deleted. The checklist rows and social proof phase cards are replaced with a proof card, progress bar, and step label.

- [ ] **Step 1: Remove Spinner, Checkmark, and old state**

Delete the `Spinner` function (lines 36-46), `Checkmark` function (lines 48-55), and from the component body remove:
- `completedSteps` state (line 60)
- `phase` state (line 61)

(`defaultSteps` and the `steps` fallback were already removed in Task 1.)

Keep:
- `currentStep` state

Add new state:
```typescript
const [isReady, setIsReady] = useState(false);
const [contentVisible, setContentVisible] = useState(true);
const [barWidth, setBarWidth] = useState(0);
```

- [ ] **Step 2: Replace the timer logic**

Replace the entire `useEffect` (lines 63-102) with:

```typescript
useEffect(() => {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const stepDuration = 800;

  // Animate first segment from 0% → 25% on mount (rAF ensures 0% paints first)
  const raf = requestAnimationFrame(() => {
    setBarWidth(((0 + 1) / steps.length) * 100);
  });

  // Advance currentStep from 1 → steps.length - 1, updating bar width each time
  for (let i = 1; i < steps.length; i++) {
    timers.push(setTimeout(() => {
      setCurrentStep(i);
      setBarWidth(((i + 1) / steps.length) * 100);
    }, i * stepDuration));
  }

  // After last step fills: 400ms pause, then fade to ready
  const fillEnd = steps.length * stepDuration;
  timers.push(setTimeout(() => {
    setContentVisible(false); // start fade out
  }, fillEnd + 400));

  timers.push(setTimeout(() => {
    setIsReady(true);
    setContentVisible(true); // fade back in with new content
  }, fillEnd + 400 + 300)); // 300ms matches CSS opacity transition

  // Fire onComplete 2s after ready appears
  timers.push(setTimeout(onComplete, fillEnd + 400 + 300 + 2000));

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [onComplete]);
```

- [ ] **Step 3: Replace rendering below the header**

Replace everything after the header `</div>` (after line 126 in original) with:

```tsx
{/* Proof card */}
<div
  className="w-full max-w-[360px]"
  style={{
    background: '#FFFFFF',
    border: '1px solid #E5E5E8',
    borderRadius: '14px',
    padding: '24px',
    textAlign: 'center',
  }}
>
  <div style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 300ms ease' }}>
    {!isReady ? (
      <>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#18181B', marginBottom: '4px' }}>
          {socialProof.stat}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#3F3F46', lineHeight: 1.5 }}>
          {socialProof.statLabel}
        </div>
        <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '8px' }}>
          {socialProof.statSubtext}
        </div>
      </>
    ) : (
      <>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#22C55E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10.5L8.5 14L15 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#18181B', marginBottom: '4px' }}>
          {socialProof.readyTitle}
        </div>
        <div style={{ fontSize: '12px', color: '#A1A1AA' }}>
          {socialProof.readySubtitle}
        </div>
      </>
    )}
  </div>
</div>

{/* Progress bar */}
<div className="w-full max-w-[360px] mt-4">
  <div
    style={{
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(var(--brand-rgb), 0.08)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: '100%',
        borderRadius: '2px',
        background: 'rgba(var(--brand-rgb), 0.92)',
        width: `${barWidth}%`,
        transition: 'width 800ms ease-out',
      }}
    />
  </div>
</div>

{/* Step label */}
{!isReady && (
  <p
    className="w-full max-w-[360px] mt-2 text-xs text-center"
    style={{ color: 'var(--alpha-light-500)', fontVariationSettings: "'wdth' 100" }}
  >
    {steps[currentStep]?.label}
  </p>
)}
```

- [ ] **Step 4: Verify the full component compiles**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors.

- [ ] **Step 5: Visual check in browser**

Start the dev server and navigate to the generating state. Verify:
- Proof card displays immediately with stat number, label, and subtext
- Progress bar starts at 0% and animates to 25% on mount, then continues to 100% over ~3.2s
- Step label below the bar updates at each step
- After 100%, card fades to green checkmark + ready text
- Step label disappears during ready state
- After ~2s in ready, app transitions to action plan

- [ ] **Step 6: Commit**

```bash
git add components/GeneratingChecklist.tsx
git commit -m "feat: redesign loading screen with proof card, progress bar, and step labels"
```

---

### Task 3: Clean up — remove unused CSS and verify final state

**Files:**
- Modify: `app/globals.css` (remove unused `thinking-enter` keyframe if confirmed unused)

- [ ] **Step 1: Check if `thinking-enter` animation is used anywhere**

Search the codebase for `thinking-enter`. If only defined in `globals.css` and not referenced by any component, remove the `@keyframes thinking-enter` block and `.animate-thinking-enter` class (lines 119-126 in globals.css).

- [ ] **Step 2: Final visual regression check**

Walk through the full flow in the browser:
1. Complete the onboarding quiz
2. Verify the generating/loading screen looks correct
3. Verify transition to action plan works

- [ ] **Step 3: Commit if cleanup was made**

```bash
git add app/globals.css
git commit -m "chore: remove unused thinking-enter CSS animation"
```
