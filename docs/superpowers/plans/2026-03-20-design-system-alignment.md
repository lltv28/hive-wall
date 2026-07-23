# Design System Alignment — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the quiz funnel UI with the Kodara DESIGN_SYSTEM.md — fixing color palette, typography, shadows, button styles, avatars, message bubbles, and layout.

**Architecture:** The design system defines blue (`#3B82F6`) as the app accent and green (`#2E7D52`) for primary CTA buttons. The quiz funnel currently uses a custom green brand accent and gray gradient buttons. We swap `--brand-rgb` to blue, fix message bubbles to match chat spec, replace button styles with green pills, and update the AI avatar from a purple "K" to a blue sparkle icon.

**Tech Stack:** Next.js 16, Tailwind CSS 4, TypeScript

**Source reference:** `C:\Users\lucas\OneDrive\Documents\claude-code\DESIGN_SYSTEM.md`

**Intentional deviations kept:**
- Sidebar width stays at `320px` (design system's `200px` is for a nav sidebar; the action plan task list needs more space)
- No reaction bar on AI messages (not applicable for a quiz funnel)
- No timestamps on AI messages (not a real-time chat)

---

## Chunk 1: CSS Token & Shadow Updates

### Task 1: Update globals.css design tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Change `--brand-rgb` to blue**

Change `--brand-rgb: 16, 104, 68` to `--brand-rgb: 59, 130, 246` (= `#3B82F6`). This cascades blue through all `--alpha-brand-*` tokens used across every component.

- [ ] **Step 2: Replace button gradient tokens with green solid**

Remove the gradient approach. Replace:
```css
--btn-from: #737373;
--btn-to: #404040;
--btn-disabled-from: #e5e5e5;
--btn-disabled-to: #d4d4d4;
```
With:
```css
--btn-primary: #2E7D52;
--btn-primary-hover: #256B45;
--btn-disabled: #D4D4D8;
```

- [ ] **Step 3: Update `--shadow-card` to match design system**

Replace:
```css
--shadow-card: 0px 22px 6px rgba(0,0,0,0),...;
```
With:
```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-elevated: 0 4px 12px rgba(0,0,0,0.08);
```

- [ ] **Step 4: Remove `--shadow-modal` and `--shadow-avatar`**

Remove these two tokens — `--shadow-modal` is not referenced in any component, and `--shadow-avatar` is no longer needed after the avatar change in Task 3. Delete these lines:
```css
--shadow-modal: ...;
--shadow-avatar: ...;
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: align CSS tokens with Kodara design system"
```

---

## Chunk 2: App Background & Layout

### Task 2: Update App.tsx background and container

**Files:**
- Modify: `components/App.tsx`

- [ ] **Step 1: Change app background from gray to light blue**

Change `bg-[#f0f0f0]` to `bg-[#E8F0FE]` on the root container div.

- [ ] **Step 2: Update generating card shadow**

In the generating phase card wrapper, change `boxShadow: 'var(--shadow-card)'` — this now uses the updated token from Task 1, so verify it looks right. No code change needed here.

- [ ] **Step 3: Commit**

```bash
git add components/App.tsx
git commit -m "feat: update app background to design system light blue"
```

---

## Chunk 3: AI Avatar (Sparkle Icon)

### Task 3: Replace purple "K" avatar with blue sparkle in MessageBubble and TypingIndicator

**Files:**
- Modify: `components/MessageBubble.tsx`
- Modify: `components/TypingIndicator.tsx`

The design system specifies: 24px blue gradient circle (`radial-gradient(circle, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)`) containing a white 4-pointed sparkle icon.

- [ ] **Step 1: Update MessageBubble.tsx avatar**

Replace the purple gradient circle with "K" letter:
```tsx
<div
  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
  style={{
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    boxShadow: 'var(--shadow-avatar)',
  }}
>
  <span className="text-[10px] text-white/80 font-semibold">K</span>
</div>
```

With a blue sparkle avatar:
```tsx
<div
  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
  style={{
    background: 'radial-gradient(circle, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)',
  }}
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M12 2L13.5 9.5L20 12L13.5 14.5L12 22L10.5 14.5L4 12L10.5 9.5L12 2Z" />
  </svg>
</div>
```

- [ ] **Step 2: Update TypingIndicator.tsx avatar**

Same change — replace purple gradient + "K" with blue sparkle:
```tsx
<div
  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
  style={{
    background: 'radial-gradient(circle, #93C5FD 0%, #60A5FA 50%, #3B82F6 100%)',
  }}
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M12 2L13.5 9.5L20 12L13.5 14.5L12 22L10.5 14.5L4 12L10.5 9.5L12 2Z" />
  </svg>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add components/MessageBubble.tsx components/TypingIndicator.tsx
git commit -m "feat: replace purple avatar with blue sparkle per design system"
```

---

## Chunk 4: Message Bubbles & Typography

### Task 4: Align user and AI message styles with design system chat spec

**Files:**
- Modify: `components/MessageBubble.tsx`

Design system spec:
- **User bubble**: `#DBEAFE` bg, `#18181B` text, `20px` radius, `10px 16px` padding, `15px` font, `400` weight, line-height `1.6`
- **AI message**: `15px` font, `400` weight, line-height `1.7`, color `#3F3F46`, bold headers `#18181B`
- **AI sender header**: "Kodara AI" — `13px`, `600` weight, `#3F3F46`

- [ ] **Step 1: Update user bubble**

Change the user message div from:
```tsx
<div
  className="max-w-[480px] px-4 py-4 rounded-xl"
  style={{ background: 'var(--alpha-brand-950)', color: '#ffffff' }}
>
  <p
    className="text-sm leading-7 tracking-[-0.15px] font-medium whitespace-pre-wrap"
    style={{ fontVariationSettings: "'wdth' 100" }}
  >
```

To:
```tsx
<div
  className="max-w-[480px] rounded-[20px]"
  style={{ background: '#DBEAFE', padding: '10px 16px' }}
>
  <p
    className="whitespace-pre-wrap"
    style={{
      fontSize: '15px',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#18181B',
    }}
  >
```

- [ ] **Step 2: Remove AI message bubble background**

The design system specifies AI messages have NO bubble — transparent background, no padding, no border-radius. Remove the bubble wrapper styling from the AI message content div:

Change:
```tsx
<div
  className="px-4 py-3 rounded-xl"
  style={{ background: 'var(--alpha-light-25)' }}
>
```

To:
```tsx
<div>
```

- [ ] **Step 3: Add AI sender header**

In the AI message branch, add a sender name row above the message content. After the avatar div and before the `flex flex-col gap-2` container, add:
```tsx
<div className="flex flex-col gap-1">
  <span style={{ fontSize: '13px', fontWeight: 600, color: '#3F3F46' }}>
    Kodara AI
  </span>
  <div className="flex flex-col gap-2">
    {/* existing message content + children */}
  </div>
</div>
```

- [ ] **Step 4: Update AI message text styling**

Change the AI message content div from:
```tsx
<div
  className="text-sm leading-7 tracking-[-0.15px] font-normal whitespace-pre-wrap"
  style={{
    color: 'var(--alpha-light-900)',
    fontVariationSettings: "'wdth' 100",
  }}
>
```

To:
```tsx
<div
  className="whitespace-pre-wrap"
  style={{
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.7,
    color: '#3F3F46',
  }}
>
```

- [ ] **Step 5: Update formatText bold style**

In the `formatText` function, change `font-semibold` (600) to `font-bold` (700) to match the design system's AI bold header spec (`15px, 700 weight, #18181B`). Also add explicit color:

Change:
```tsx
<p key={i} className="font-semibold mt-3 mb-1">
```
To:
```tsx
<p key={i} className="font-bold mt-3 mb-1" style={{ color: '#18181B' }}>
```

- [ ] **Step 6: Update AI subtitle text**

Change `color: 'var(--alpha-light-500)'` to `color: '#A1A1AA'` (design system `--text-muted`).

- [ ] **Step 7: Commit**

```bash
git add components/MessageBubble.tsx
git commit -m "feat: align message bubbles with design system chat spec"
```

---

## Chunk 5: CTA Buttons (Green Pills)

### Task 5: Change all primary CTA buttons to green pills

**Files:**
- Modify: `components/OnboardingChat.tsx`
- Modify: `components/FlowChat.tsx`
- Modify: `components/FitScore.tsx`
- Modify: `components/ChipPicker.tsx`
- Modify: `components/Interstitial.tsx`
- Modify: `components/OfferCard.tsx`

Design system primary button: `#2E7D52` bg, white text, `14px` font, `600` weight, `9999px` radius, hover `#256B45`, `10px 24px` padding.

- [ ] **Step 1: Update "See My Results" button in OnboardingChat.tsx**

Replace:
```tsx
className="px-6 py-3 rounded-lg text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 active:scale-[0.98]"
style={{
  background: 'linear-gradient(to bottom, var(--btn-from), var(--btn-to))',
  fontVariationSettings: "'wdth' 100",
}}
```

With:
```tsx
className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
style={{
  background: 'var(--btn-primary)',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
}}
```

- [ ] **Step 2: Update "Complete Task" button in FlowChat.tsx (guided flow)**

Same pattern — find the button with `Complete Task` text and apply green pill style:
```tsx
className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px"
style={{
  background: 'var(--btn-primary)',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
}}
```

- [ ] **Step 3: Update "Mark Complete" button in FlowChat.tsx (quick task)**

Same green pill style.

- [ ] **Step 4: Update FitScore.tsx CTA button**

Replace:
```tsx
className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 active:scale-[0.98]"
style={{
  background: 'linear-gradient(to bottom, var(--btn-from), var(--btn-to))',
  fontVariationSettings: "'wdth' 100",
}}
```

With:
```tsx
className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
style={{
  background: 'var(--btn-primary)',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
}}
```

- [ ] **Step 5: Update ChipPicker.tsx "Next" button (multi-select submit)**

Replace gradient + rounded-lg with green pill for enabled state, muted pill for disabled:
```tsx
className="self-start rounded-full text-white transition-all duration-200"
style={{
  background: selectedValues.size > 0 ? 'var(--btn-primary)' : 'var(--btn-disabled)',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: selectedValues.size > 0 ? 'pointer' : 'default',
  opacity: selectedValues.size > 0 ? 1 : 0.5,
}}
```

- [ ] **Step 6: Update Interstitial.tsx "Next" button**

Replace:
```tsx
className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-opacity hover:opacity-90"
style={{
  background: '#92400e',
  color: '#ffffff',
  fontVariationSettings: "'wdth' 100",
}}
```

With:
```tsx
className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px"
style={{
  background: 'var(--btn-primary)',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
}}
```

- [ ] **Step 7: Update OfferCard.tsx button to pill shape**

Change the button from `rounded-lg` to `rounded-full` to match the pill shape convention:
```tsx
className="w-full rounded-full transition-colors"
style={{
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
  ...
}}
```

Keep the amber/green variant colors for the OfferCard button backgrounds (these are contextual accent colors for offer cards, not primary CTAs).

- [ ] **Step 8: Commit**

```bash
git add components/OnboardingChat.tsx components/FlowChat.tsx components/FitScore.tsx components/ChipPicker.tsx components/Interstitial.tsx components/OfferCard.tsx
git commit -m "feat: change CTA buttons to green pills per design system"
```

---

## Chunk 6: Sidebar Alignment

### Task 6: Update ActionPlanSidebar background and border

**Files:**
- Modify: `components/ActionPlanSidebar.tsx`

Design system sidebar: white background, `1px solid #E5E5E8` right border.

- [ ] **Step 1: Change sidebar background and border**

Replace:
```tsx
style={{
  borderColor: 'var(--alpha-light-50)',
  background: 'rgba(var(--brand-rgb), 0.05)',
}}
```

With:
```tsx
style={{
  borderColor: '#E5E5E8',
  background: '#FFFFFF',
}}
```

- [ ] **Step 2: Commit**

```bash
git add components/ActionPlanSidebar.tsx
git commit -m "feat: align sidebar with design system white bg and border"
```

---

## Chunk 7: Generating Checklist Shadow

### Task 7: Update generating card wrapper shadow

**Files:**
- Modify: `components/App.tsx`

- [ ] **Step 1: Update generating card shadow and border**

In the generating phase card, change `borderColor: 'var(--alpha-light-100)'` to `borderColor: '#E5E5E8'`:
```tsx
style={{ boxShadow: 'var(--shadow-card)', borderColor: '#E5E5E8', animation: 'fade-in 200ms ease-out' }}
```

The `--shadow-card` token was already updated in Task 1.

- [ ] **Step 2: Commit**

```bash
git add components/App.tsx
git commit -m "feat: align generating card border with design system"
```

---

## Chunk 8: Build Verification

### Task 8: Verify the project builds and runs

- [ ] **Step 1: Run the build**

```bash
cd "C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1"
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Visual check**

```bash
npm run dev
```

Verify at `http://localhost:3000`:
- App background is light blue (`#E8F0FE`)
- User bubbles are light blue (`#DBEAFE`) with dark text
- AI messages have blue sparkle avatar and "Kodara AI" sender header
- CTA buttons are green pills
- Sidebar is white with proper border
- Chips/active states use blue accent
- FitScore ring uses blue accent
- Progress bar uses blue

- [ ] **Step 3: Fix any build errors**

If there are issues, fix them.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve any build issues from design system alignment"
```
