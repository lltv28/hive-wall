# Design System Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the quiz funnel UI with the comprehensive Figma design system (shadows, typography, buttons, chat bubbles, chips, avatars, viewport, glassmorphism).

**Architecture:** Pure CSS/styling changes across globals.css and 7 components. No state logic, hook, or data flow changes. Each task updates one concern (tokens, typography, component) so regressions are isolated.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS 4, CSS custom properties

**Design System Reference:** `C:\Users\lucas\OneDrive\Documents\claude-code\comprehensive_design_system.md`

---

## File Map

| File | Changes |
|------|---------|
| `app/globals.css` | Update shadow tokens, add missing alpha tokens, add letter-spacing utility, add glassmorphism class |
| `components/MessageBubble.tsx` | User bubble glassmorphism, AI text color/size/line-height, avatar size 28px, letter-spacing |
| `components/TypingIndicator.tsx` | Avatar size 28px to match MessageBubble |
| `components/ChipPicker.tsx` | Backdrop-filter, border to 1px alpha-light-50, radius 12px, text weight 500 |
| `components/FitScore.tsx` | CTA button gradient style, radius 8px |
| `components/Callout.tsx` | CTA button gradient style, radius 8px |
| `components/OnboardingChat.tsx` | CTA button gradient style, radius 8px |
| `components/App.tsx` | Viewport max-width 390px |

---

## Chunk 1: CSS Tokens

### Task 1: Update globals.css design tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update shadow tokens to match design system multi-layer stacks**

Replace the Shadows section (lines 47-48):

```css
  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-elevated: 0 4px 12px rgba(0,0,0,0.08);
```

With:

```css
  /* Shadows */
  --shadow-card: 0px 22px 6px 0px rgba(0,0,0,0), 0px 14px 6px 0px rgba(0,0,0,0), 0px 8px 5px 0px rgba(0,0,0,0.01), 0px 4px 4px 0px rgba(0,0,0,0.02), 0px 1px 2px 0px rgba(0,0,0,0.02);
  --shadow-dropdown: 0px 67px 19px 0px rgba(0,0,0,0), 0px 43px 17px 0px rgba(0,0,0,0.01), 0px 24px 15px 0px rgba(0,0,0,0.02), 0px 11px 11px 0px rgba(0,0,0,0.03), 0px 3px 6px 0px rgba(0,0,0,0.04);
  --shadow-avatar: 0px 20px 6px 0px rgba(12,48,70,0), 0px 13px 5px 0px rgba(12,48,70,0.02), 0px 7px 4px 0px rgba(12,48,70,0.07), 0px 3px 3px 0px rgba(12,48,70,0.12), 0px 1px 2px 0px rgba(12,48,70,0.14);
```

- [ ] **Step 2: Add missing alpha token and CTA gradient vars**

Add after the `--alpha-light-900` line (after line 17):

```css
  --alpha-light-700: rgba(var(--text-rgb), 0.70);
```

Replace the Button colors section (lines 19-22):

```css
  /* Button colors */
  --btn-primary: #2E7D52;
  --btn-primary-hover: #256B45;
  --btn-disabled: #D4D4D8;
```

With:

```css
  /* CTA Button gradients */
  --gradient-cta-active: linear-gradient(to bottom, #737373, #404040);
  --gradient-cta-disabled: linear-gradient(to bottom, #D4D4D4, #A3A3A3);

  /* Legacy — kept for progress bar, milestone, brand accent */
  --btn-primary: #2E7D52;
  --btn-primary-hover: #256B45;
  --btn-disabled: #D4D4D8;
```

- [ ] **Step 3: Add global letter-spacing and glassmorphism utility**

Add after the body rule (after line 59):

```css
/* Global letter-spacing for body text */
p, span, button, input, textarea, label {
  letter-spacing: -0.15px;
}
h1, h2, h3, h4, h5, h6 {
  letter-spacing: -0.5px;
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: align CSS tokens with design system (shadows, gradients, letter-spacing)"
```

---

## Chunk 2: Chat Bubbles & Avatar

### Task 2: Update MessageBubble and TypingIndicator

**Files:**
- Modify: `components/MessageBubble.tsx`
- Modify: `components/TypingIndicator.tsx`

- [ ] **Step 1: Update user chat bubble to glassmorphism**

In `MessageBubble.tsx`, replace the user bubble render (lines 41-58):

```tsx
    return (
      <div className={`flex justify-end ${isNew ? 'animate-fade-in-up' : ''}`}>
        <div
          className="max-w-[480px] rounded-[20px]"
          style={{ background: '#DCFCE7', padding: '10px 16px' }}
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
            {message.content}
          </p>
        </div>
      </div>
    );
```

With:

```tsx
    return (
      <div className={`flex justify-end ${isNew ? 'animate-fade-in-up' : ''}`}>
        <div
          className="max-w-[480px]"
          style={{
            background: 'rgba(255, 255, 255, 0.28)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid var(--alpha-light-50)',
            borderRadius: '16px',
            padding: '16px',
          }}
        >
          <p
            className="whitespace-pre-wrap"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '20px',
              color: 'var(--alpha-light-900)',
            }}
          >
            {message.content}
          </p>
        </div>
      </div>
    );
```

- [ ] **Step 2: Update AI avatar to 28px with shadow, and AI text styling**

In `MessageBubble.tsx`, update the AI avatar (line 67):

Change `className="w-6 h-6` to `className="w-7 h-7` (24px to 28px).

Update the AI message text styles (lines 91-96):

```tsx
                        style={{
                          fontSize: '14px',
                          fontWeight: 400,
                          lineHeight: '28px',
                          color: 'var(--alpha-light-900)',
                        }}
```

Update the "Kodara AI" label (line 77):

```tsx
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--alpha-light-900)' }}>
```

Add avatar shadow to the avatar div (line 68). Add to the style object:

```tsx
            style={{
              background: 'radial-gradient(circle, #7BC49A 0%, #4A9E6E 50%, #2E7D52 100%)',
              boxShadow: 'var(--shadow-avatar)',
            }}
```

- [ ] **Step 3: Update TypingIndicator avatar to 28px with shadow**

In `TypingIndicator.tsx`, change `className="w-6 h-6` to `className="w-7 h-7`.

Add `boxShadow: 'var(--shadow-avatar)'` to the avatar style object.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add components/MessageBubble.tsx components/TypingIndicator.tsx
git commit -m "feat: glassmorphism user bubble, 28px avatar with shadow, design system text styles"
```

---

## Chunk 3: CTA Buttons

### Task 3: Update all CTA buttons to gradient style with 8px radius

**Files:**
- Modify: `components/FitScore.tsx`
- Modify: `components/Callout.tsx`
- Modify: `components/OnboardingChat.tsx`
- Modify: `components/ChipPicker.tsx`

The design system uses `linear-gradient(to bottom, #737373, #404040)` for active CTAs, `8px` radius, `500` weight, and `rgba(255,255,255,0.80)` text. All CTA buttons in the app currently use `rounded-full` (pill), solid green `var(--btn-primary)`, and `600` weight.

- [ ] **Step 1: Update FitScore CTA (lines 66-78)**

Replace:

```tsx
        <button
          type="button"
          onClick={onCtaClick}
          className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
          style={{
            background: 'var(--btn-primary)',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {cta}
        </button>
```

With:

```tsx
        <button
          type="button"
          onClick={onCtaClick}
          className="cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
          style={{
            background: 'var(--gradient-cta-active)',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--alpha-dark-900)',
            borderRadius: '8px',
            border: 'none',
          }}
        >
          {cta}
        </button>
```

- [ ] **Step 2: Update Callout CTA (lines 114-127)**

Same pattern as FitScore. Replace the button with gradient style, 8px radius, weight 500.

- [ ] **Step 3: Update OnboardingChat "See My Results" CTA**

In `OnboardingChat.tsx`, find the "See My Results" button and replace:

```tsx
                className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
                style={{
                  background: 'var(--btn-primary)',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
```

With:

```tsx
                className="cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
                style={{
                  background: 'var(--gradient-cta-active)',
                  padding: '8px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--alpha-dark-900)',
                  borderRadius: '8px',
                  border: 'none',
                }}
```

- [ ] **Step 4: Update ChipPicker multi-select "Next" buttons (lines 122-137 and 177-193)**

Both "Next" buttons in ChipPicker use the same pattern. Replace `rounded-full` pill with 8px radius gradient:

```tsx
          className="self-start transition-all duration-200"
          style={{
            background: selectedValues.size > 0 ? 'var(--gradient-cta-active)' : 'var(--gradient-cta-disabled)',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: selectedValues.size > 0 ? 'var(--alpha-dark-900)' : 'var(--alpha-light-400)',
            borderRadius: '8px',
            border: 'none',
            cursor: selectedValues.size > 0 ? 'pointer' : 'default',
            opacity: selectedValues.size > 0 ? 1 : 0.5,
          }}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add components/FitScore.tsx components/Callout.tsx components/OnboardingChat.tsx components/ChipPicker.tsx
git commit -m "feat: gradient CTA buttons with 8px radius per design system"
```

---

## Chunk 4: Chip/Option Styling

### Task 4: Update ChipPicker to design system specs

**Files:**
- Modify: `components/ChipPicker.tsx`

- [ ] **Step 1: Update grid-mode emoji chips (lines 68-77)**

Change the chip button styles:
- Border: `2px solid #E5E5E8` → `1px solid var(--alpha-light-50)`
- Selected border: `2px solid var(--btn-primary)` → `1px solid var(--alpha-light-100)`
- Background: `#FFFFFF` → `var(--alpha-light-50)` with `backdropFilter: 'blur(4px)'`
- Selected bg: `var(--alpha-brand-50)` stays
- Border radius: `14px` → `12px`
- Text weight: `600` → `500` (lines 83, 93)

Replace lines 71-72:

```tsx
                  background: isSelected ? 'var(--alpha-brand-50)' : 'var(--alpha-light-50)',
                  border: isSelected ? '1px solid var(--alpha-light-100)' : '1px solid var(--alpha-light-50)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
```

Update text weights from `600` to `500` on lines 83 and 93.

- [ ] **Step 2: Update inline text chips (lines 156-170)**

The inline chips already use `1px solid var(--alpha-light-100)` which is close. Update:
- Add `backdropFilter: 'blur(4px)'` and `WebkitBackdropFilter: 'blur(4px)'`
- Background default: `transparent` → `var(--alpha-light-50)`
- Border radius: `rounded-lg` (8px) → `rounded-xl` (12px) in className

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/ChipPicker.tsx
git commit -m "feat: chip glassmorphism, 12px radius, 1px borders per design system"
```

---

## Chunk 5: Viewport Width

### Task 5: Update viewport max-width to 390px

**Files:**
- Modify: `components/App.tsx:106`

- [ ] **Step 1: Change maxWidth from 430px to 390px**

On line 106, change:

```tsx
      style={{ width: '100%', maxWidth: '430px', height: '100vh' }}
```

To:

```tsx
      style={{ width: '100%', maxWidth: '390px', height: '100vh' }}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Visually verify in browser**

Open http://localhost:3000. Check that:
- The app is slightly narrower (40px less)
- Chips still fit in the grid layout
- Progress bar still renders correctly
- No horizontal overflow

- [ ] **Step 4: Commit**

```bash
git add components/App.tsx
git commit -m "feat: align viewport to 390px (iPhone 16 Pro) per design system"
```

---

## Chunk 6: Final Build Verification

### Task 6: Full build and visual check

- [ ] **Step 1: Full production build**

Run: `npm run build`
Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 2: Visual walkthrough**

Open http://localhost:3000 and walk through the full quiz flow:
1. Welcome callout → verify card shadow, CTA button gradient
2. First question → verify AI text is 14px/28px, avatar is 28px with shadow
3. Answer a chip → verify chip glassmorphism, 12px radius, 1px borders
4. Read acknowledgment → verify italic text styling
5. Fit score card → verify CTA gradient button
6. Progress bar → verify milestones still animate
7. Generating checklist inline → verify card shadow
8. Action plan phase → verify PlanFlow still works

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any visual issues from design system alignment"
```
