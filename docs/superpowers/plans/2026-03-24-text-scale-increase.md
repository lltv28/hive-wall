# Text Scale Increase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase all consumer-facing text sizes by ~25% via a formal CSS custom property type scale, with proportional element sizing adjustments for mobile legibility.

**Architecture:** Define type scale tokens (`--text-*`), weight tokens (`--font-*`), and line-height tokens (`--leading-*`) in `globals.css`. Update 17 consumer-facing component files to reference these tokens instead of hardcoded pixel values. No logic or behavioral changes.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-24-text-scale-increase-design.md`

---

### Task 1: Add CSS custom properties to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add type scale, weight, and line-height tokens to `:root`**

Add after the existing `/* Shadows */` section, before the closing `}` of `:root`:

```css
/* Type Scale */
--text-2xs: 10px;
--text-xs: 14px;
--text-sm: 16px;
--text-base: 18px;
--text-lg: 20px;
--text-xl: 24px;
--text-2xl: 40px;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.2;
--leading-snug: 1.4;
--leading-normal: 1.6;
--leading-relaxed: 1.7;
--leading-loose: 1.8;
```

- [ ] **Step 2: Verify dev server still loads**

Run: `npm run dev` (should already be running)
Visit: `http://localhost:3000`
Expected: No visual changes yet — tokens are defined but not referenced.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add type scale, weight, and line-height CSS custom properties"
```

---

### Task 2: Update App.tsx max-width

**Files:**
- Modify: `components/App.tsx:114`

- [ ] **Step 1: Change max-width from 390px to 430px**

In `App.tsx` line 114, change:
```tsx
style={{ width: '100%', maxWidth: isSplit ? 'none' : '390px', height: '100vh', background: '#F6F6F7' }}
```
to:
```tsx
style={{ width: '100%', maxWidth: isSplit ? 'none' : '430px', height: '100vh', background: '#F6F6F7' }}
```

- [ ] **Step 2: Verify**

Visit: `http://localhost:3000`
Expected: Content area slightly wider on desktop preview. No change on phones narrower than 430px.

- [ ] **Step 3: Commit**

```bash
git add components/App.tsx
git commit -m "feat: widen app container from 390px to 430px"
```

---

### Task 3: Update MessageBubble and TypingIndicator

These are the core chat rendering primitives — update them first so every subsequent component visually benefits.

**Files:**
- Modify: `components/MessageBubble.tsx`
- Modify: `components/TypingIndicator.tsx`

- [ ] **Step 1: Update MessageBubble text sizes, avatar, and padding**

In `MessageBubble.tsx`, apply these changes:

User bubble (line 52-53 area, the style object inside the user bubble div):
- `fontSize: '14px'` → `fontSize: 'var(--text-base)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`

AI bubble — sender name (line 80 area):
- `fontSize: '13px'` → `fontSize: 'var(--text-sm)'`
- `fontWeight: 600` → `fontWeight: 'var(--font-semibold)'`

AI bubble — avatar (line 73-77 area):
- `className="w-7 h-7 ...` → `className="w-9 h-9 ...`

AI bubble — message content (line 94-98 area):
- `fontSize: '14px'` → `fontSize: 'var(--text-base)'`
- `fontWeight: 400` → `fontWeight: 'var(--font-normal)'`
- `lineHeight: '28px'` → `lineHeight: 'var(--leading-loose)'`

AI bubble — padding on user bubble div (line 50 area):
- `padding: '16px'` → `padding: '20px'`

AI bubble — subtitle (line 121-124 area):
- The `text-xs` Tailwind class is fine — but add inline `fontSize: 'var(--text-xs)'` to override Tailwind's default, and keep `fontWeight` as is.

- [ ] **Step 2: Update TypingIndicator**

In `TypingIndicator.tsx`:

Avatar (line 9):
- `className="w-7 h-7 ...` → `className="w-9 h-9 ...`

Text "Lucas is thinking" (line 13-14):
- Remove `text-sm` from className
- Replace with inline style: `fontSize: 'var(--text-base)'`, `fontWeight: 'var(--font-medium)'`

Dots (lines 19-21):
- `w-[3px] h-[3px]` → `w-[4px] h-[4px]`

- [ ] **Step 3: Verify**

Visit: `http://localhost:3000`
Expected: Message text visibly larger (18px vs 14px). Avatar slightly bigger. Typing indicator dots bigger. Overall chat feels more readable.

- [ ] **Step 4: Commit**

```bash
git add components/MessageBubble.tsx components/TypingIndicator.tsx
git commit -m "feat: apply type scale to MessageBubble and TypingIndicator"
```

---

### Task 4: Update ChipPicker

**Files:**
- Modify: `components/ChipPicker.tsx`

- [ ] **Step 1: Update grid mode sizing**

Grid chip padding (line 70 area):
- `padding: isLastOdd ? '14px' : '18px 14px'` → `padding: isLastOdd ? '18px' : '22px 18px'`

Grid emoji size (line 90):
- `fontSize: '28px'` → `fontSize: '34px'`

Grid chip label (lines 84, 93-94):
- `fontSize: '13px'` → `fontSize: 'var(--text-sm)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`

Grid chip description (line 104):
- `fontSize: '11px'` → `fontSize: 'var(--text-xs)'`

Last-odd inline label (line 84 area):
- `fontSize: '13px'` → `fontSize: 'var(--text-sm)'`

Grid multi-submit button (line 129-130 area):
- `padding: '8px 20px'` → `padding: '10px 24px'`
- `fontSize: '16px'` → `fontSize: 'var(--text-lg)'`
- `borderRadius: '8px'` → `borderRadius: '10px'`

- [ ] **Step 2: Update pill mode sizing**

Pill chip (line 160 area):
- Change className `px-3 py-2 rounded-xl text-sm` → `px-4 py-2.5 rounded-xl`
- Add inline style: `fontSize: 'var(--text-base)'`

Pill multi-submit button (lines 189-190 area):
- `padding: '8px 20px'` → `padding: '10px 24px'`
- `fontSize: '14px'` → `fontSize: 'var(--text-base)'`
- `borderRadius: '8px'` → `borderRadius: '10px'`

- [ ] **Step 3: Verify**

Visit: `http://localhost:3000`, progress through the quiz.
Expected: Chips are larger with bigger text. Emoji icons bigger. Submit buttons proportionally larger.

- [ ] **Step 4: Commit**

```bash
git add components/ChipPicker.tsx
git commit -m "feat: apply type scale to ChipPicker"
```

---

### Task 5: Update FitScore and Callout

**Files:**
- Modify: `components/FitScore.tsx`
- Modify: `components/Callout.tsx`

- [ ] **Step 1: Update FitScore**

Ring container (line 23):
- `className="relative w-32 h-32 ...` → `className="relative w-40 h-40 ...`

Percentage text (line 44):
- Remove Tailwind `text-2xl font-semibold`
- Add inline style: `fontSize: 'var(--text-xl)'`, `fontWeight: 'var(--font-semibold)'`

Label "AI Product Readiness Score" (line 53):
- Remove Tailwind `text-xs font-medium`
- Add inline style: `fontSize: 'var(--text-xs)'`, `fontWeight: 'var(--font-medium)'`

Message text (line 60):
- Remove Tailwind `text-sm`
- Add inline style: `fontSize: 'var(--text-base)'`

CTA button (lines 72-77):
- `padding: '8px 20px'` → `padding: '10px 24px'`
- `fontSize: '16px'` → `fontSize: 'var(--text-lg)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`
- `borderRadius: '8px'` → `borderRadius: '10px'`

- [ ] **Step 2: Update Callout**

Stat number (lines 75-76):
- `fontSize: '32px'` → `fontSize: 'var(--text-2xl)'`
- `fontWeight: 700` → `fontWeight: 'var(--font-bold)'`

Headline (lines 87-88):
- `fontSize: '15px'` → `fontSize: 'var(--text-lg)'`
- `fontWeight: 600` → `fontWeight: 'var(--font-semibold)'`

Body (lines 100-101):
- `fontSize: '14px'` → `fontSize: 'var(--text-base)'`
- `lineHeight: 1.7` → `lineHeight: 'var(--leading-relaxed)'`

Video overlay title (line 62):
- `fontSize: '11px'` → `fontSize: 'var(--text-xs)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`

Padding (line 70):
- `padding: video ? '16px 24px 24px' : '24px'` → `padding: video ? '20px 28px 28px' : '28px'`

CTA button (lines 120-123):
- `padding: '8px 20px'` → `padding: '10px 24px'`
- `fontSize: '16px'` → `fontSize: 'var(--text-lg)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`
- `borderRadius: '8px'` → `borderRadius: '10px'`

- [ ] **Step 3: Verify**

Visit: `http://localhost:3000`, progress to a fit score and callout card.
Expected: Larger ring, bigger stat numbers, larger headlines and body text. CTA buttons proportionally bigger.

- [ ] **Step 4: Commit**

```bash
git add components/FitScore.tsx components/Callout.tsx
git commit -m "feat: apply type scale to FitScore and Callout"
```

---

### Task 6: Update OnboardingChat layout and inline elements

**Files:**
- Modify: `components/OnboardingChat.tsx`

- [ ] **Step 1: Update chat layout**

Scroll container inner div (line 270):
- `className="max-w-[640px] mx-auto flex flex-col gap-6 pt-6 pb-[90vh] px-4"` → `className="max-w-[640px] mx-auto flex flex-col gap-7 pt-6 pb-[90vh] px-5"`

- [ ] **Step 2: Update acknowledgment avatar and text**

Acknowledgment avatar (line 357):
- `className="w-6 h-6 ...` → `className="w-8 h-8 ...`

Acknowledgment text (lines 363-366 area):
- `fontSize: '13px'` → `fontSize: 'var(--text-sm)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`

- [ ] **Step 3: Update back button**

Back button (line 325-326 area):
- `fontSize: '11px'` → `fontSize: 'var(--text-xs)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`

- [ ] **Step 4: Verify**

Visit: `http://localhost:3000`, answer a question to see the acknowledgment and back button.
Expected: Wider spacing between messages. Acknowledgment text and avatar larger. Back button text larger.

- [ ] **Step 5: Commit**

```bash
git add components/OnboardingChat.tsx
git commit -m "feat: apply type scale to OnboardingChat layout and inline elements"
```

---

### Task 7: Update OnboardingProgress and StepperBar

**Files:**
- Modify: `components/OnboardingProgress.tsx`
- Modify: `components/StepperBar.tsx`

- [ ] **Step 1: Update OnboardingProgress**

Container height (line 112):
- `height: '78px'` → `height: '90px'`

Bar height (line 161):
- `height: '6px'` → `height: '8px'`

Pill percentage (line 140-141 area):
- `fontSize: '9px'` → `fontSize: 'var(--text-2xs)'`
- `fontWeight: 700` → `fontWeight: 'var(--font-bold)'`

Pill padding (line 143):
- `padding: '2px 8px'` → `padding: '3px 10px'`

Phase labels (line 215-216 area):
- `fontSize: '8px'` → `fontSize: 'var(--text-2xs)'`
- `fontWeight: isCompleted ? 600 : 500` → `fontWeight: isCompleted ? 'var(--font-semibold)' : 'var(--font-medium)'`

Insight label (line 253 area):
- `fontSize: '13px'` → `fontSize: 'var(--text-sm)'`
- `fontWeight: 600` → `fontWeight: 'var(--font-semibold)'`

Insight text (line 259 area):
- `fontSize: '12px'` → `fontSize: 'var(--text-xs)'`

- [ ] **Step 2: Update StepperBar**

Dots (lines 48-49):
- `width: '20px'` → `width: '24px'`
- `height: '20px'` → `height: '24px'`

Step number (lines 74-75):
- `fontSize: '9px'` → `fontSize: 'var(--text-2xs)'`
- `fontWeight: 700` → `fontWeight: 'var(--font-bold)'`

- [ ] **Step 3: Verify**

Visit: `http://localhost:3000`, progress through quiz to see milestones.
Expected: Progress bar taller. Pill and labels larger. Stepper dots bigger.

- [ ] **Step 4: Commit**

```bash
git add components/OnboardingProgress.tsx components/StepperBar.tsx
git commit -m "feat: apply type scale to OnboardingProgress and StepperBar"
```

---

### Task 8: Update GeneratingChecklist

**Files:**
- Modify: `components/GeneratingChecklist.tsx`

- [ ] **Step 1: Update all text sizes**

Heading (line 79):
- Remove Tailwind `text-[20px]` from className, keep `leading-[28px] font-medium tracking-[-0.5px]`
- Add inline style: `fontSize: 'var(--text-xl)'`

Subtitle (line 84):
- Remove Tailwind `text-sm`
- Add inline style: `fontSize: 'var(--text-base)'`

Stat number (line 103):
- `fontSize: '32px'` → `fontSize: 'var(--text-2xl)'`
- `fontWeight: 700` → `fontWeight: 'var(--font-bold)'`

Stat label (line 106):
- `fontSize: '14px'` → `fontSize: 'var(--text-base)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`

Stat subtext (line 109):
- `fontSize: '12px'` → `fontSize: 'var(--text-xs)'`

Ready title (line 131):
- `fontSize: '15px'` → `fontSize: 'var(--text-lg)'`
- `fontWeight: 600` → `fontWeight: 'var(--font-semibold)'`

Ready subtitle (line 134):
- `fontSize: '12px'` → `fontSize: 'var(--text-xs)'`

Step label (line 198):
- Remove Tailwind `text-xs`
- Add inline style: `fontSize: 'var(--text-xs)'`

- [ ] **Step 2: Verify**

Visit: `http://localhost:3000`, complete the quiz to trigger the generating checklist.
Expected: All text in the generating phase visibly larger.

- [ ] **Step 3: Commit**

```bash
git add components/GeneratingChecklist.tsx
git commit -m "feat: apply type scale to GeneratingChecklist"
```

---

### Task 9: Update card components (OfferCard, PinnedOffer, VideoEmbed, VisualCard)

**Files:**
- Modify: `components/OfferCard.tsx`
- Modify: `components/PinnedOffer.tsx`
- Modify: `components/VideoEmbed.tsx`
- Modify: `components/VisualCard.tsx`

- [ ] **Step 1: Update OfferCard**

Title (line 51-52):
- Remove Tailwind `text-sm font-bold`
- Add inline style: `fontSize: 'var(--text-base)'`, `fontWeight: 'var(--font-bold)'`

Description (line 60-61):
- Remove Tailwind `text-xs`
- Add inline style: `fontSize: 'var(--text-xs)'`

Price (line 70-71):
- Remove Tailwind `text-lg font-bold`
- Add inline style: `fontSize: 'var(--text-xl)'`, `fontWeight: 'var(--font-bold)'`

CTA button (lines 87-90):
- `padding: '10px 24px'` (already correct? check — current is `padding: '10px 24px'`)
- Actually current is `padding: '10px 24px'` and `fontSize: '16px'`. Change:
- `fontSize: '16px'` → `fontSize: 'var(--text-lg)'`
- `fontWeight: 600` → `fontWeight: 'var(--font-semibold)'`

- [ ] **Step 2: Update PinnedOffer**

Title (line 49):
- `fontSize: '12px'` → `fontSize: 'var(--text-xs)'`
- `fontWeight: 500` → `fontWeight: 'var(--font-medium)'`

Subtitle (line 56):
- `fontSize: '10px'` → `fontSize: 'var(--text-2xs)'`

- [ ] **Step 3: Update VideoEmbed**

Title (line 27):
- Remove Tailwind `text-xs`
- Add inline style: `fontSize: 'var(--text-xs)'`

Duration (line 32):
- Remove Tailwind `text-xs`
- Add inline style: `fontSize: 'var(--text-xs)'`

- [ ] **Step 4: Update VisualCard**

Title (line 25-26):
- Remove Tailwind `text-sm font-semibold`
- Add inline style: `fontSize: 'var(--text-base)'`, `fontWeight: 'var(--font-semibold)'`

Item label (line 39):
- Remove Tailwind `text-xs`
- Add inline style: `fontSize: 'var(--text-xs)'`

Item value (line 47-48):
- Remove Tailwind `text-sm font-medium`
- Add inline style: `fontSize: 'var(--text-base)'`, `fontWeight: 'var(--font-medium)'`

- [ ] **Step 5: Verify**

Visit: `http://localhost:3000`, navigate to the action plan phase to see offer cards and visual cards.
Expected: All card text larger and more readable.

- [ ] **Step 6: Commit**

```bash
git add components/OfferCard.tsx components/PinnedOffer.tsx components/VideoEmbed.tsx components/VisualCard.tsx
git commit -m "feat: apply type scale to OfferCard, PinnedOffer, VideoEmbed, VisualCard"
```

---

### Task 10: Update flow components (PlanFlow, FlowChat, FlowHeader)

**Files:**
- Modify: `components/PlanFlow.tsx`
- Modify: `components/FlowChat.tsx`
- Modify: `components/FlowHeader.tsx`

- [ ] **Step 1: Update PlanFlow layout**

Chat container inner div (line 173):
- `className="max-w-[640px] mx-auto flex flex-col gap-6 pt-5 pb-[50vh] px-4"` → `className="max-w-[640px] mx-auto flex flex-col gap-7 pt-5 pb-[50vh] px-5"`

- [ ] **Step 2: Update FlowChat layout and buttons**

Chat container inner div (line 301):
- `gap-6` → `gap-7` (padding already `px-5`, keep it)

"Mark Complete" button (lines 214-215):
- `fontSize: '16px'` → `fontSize: 'var(--text-lg)'`
- `fontWeight: 600` → `fontWeight: 'var(--font-semibold)'`
- `padding: '10px 24px'` (check current — if `'10px 24px'` already, keep; otherwise update)

"Complete Task" button (lines 359-360):
- `fontSize: '14px'` → `fontSize: 'var(--text-base)'`
- `fontWeight: 600` → `fontWeight: 'var(--font-semibold)'`

Quick task subtitle text (line 197-198):
- `text-sm` Tailwind class → add inline `fontSize: 'var(--text-base)'`

- [ ] **Step 3: Update FlowHeader**

Title (line 49 area):
- Current: `text-[13px] font-semibold` → replace with inline `fontSize: 'var(--text-base)'`, `fontWeight: 'var(--font-semibold)'`

Type label (line 60 area):
- Current: `text-[10px] font-medium` → replace with inline `fontSize: 'var(--text-xs)'`, `fontWeight: 'var(--font-medium)'`

- [ ] **Step 4: Verify**

Visit: `http://localhost:3000`, complete quiz and navigate through action plan tasks.
Expected: Flow header, task messages, and buttons all scaled up. Wider message gaps.

- [ ] **Step 5: Commit**

```bash
git add components/PlanFlow.tsx components/FlowChat.tsx components/FlowHeader.tsx
git commit -m "feat: apply type scale to PlanFlow, FlowChat, FlowHeader"
```

---

### Task 11: Push and verify live deployment

**Files:** None (deployment only)

- [ ] **Step 1: Push to GitHub**

```bash
git push origin master
```

Render auto-deploys on push.

- [ ] **Step 2: Wait for deploy and verify**

```bash
render deploys list srv-d71bbm14tr6s73al16t0 --output json
```

Wait for status `"live"`, then test on phone at `https://ai-quiz-funnel-v1.onrender.com`.

- [ ] **Step 3: Verify on mobile**

Open `https://ai-quiz-funnel-v1.onrender.com` on phone. Check:
- Message text is clearly readable without squinting
- Chips are easy to tap
- Progress bar is visible and clear
- CTA buttons are prominent
- No horizontal overflow on any screen
