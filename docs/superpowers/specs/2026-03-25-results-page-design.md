# Results Page Design Spec

**Date:** 2026-03-25
**Status:** Draft
**Replaces:** Current action plan phase (PlanFlow, FlowChat, ActionPlanSidebar, StepperBar, PinnedOffer)

## Overview

Replace the post-quiz action plan with a single-page results report. After completing the quiz, users see a personalized diagnostic report with a clear CTA to book a strategy call. The page reflects their quiz answers back to them, creating a "this was built for me" experience.

## Goals

- Maximize conversion to strategy call bookings
- Make the user feel their quiz answers were meaningfully analyzed
- Keep the funnel simple: quiz -> results -> book call
- Work responsively: mobile-first (430px quiz frame) but scale to full-width standalone

## Page Structure

The page is a single vertical scroll with the following sections in order:

### 1. Hero (dark gradient)

- **Background:** `linear-gradient(165deg, #1a3a2a, #0f2619)`
- **Content (centered):**
  - Label: "AI Product Readiness Score" (small, uppercase, low opacity)
  - Score: large number (e.g. "97%") — currently hardcoded, derived from quiz completion
  - Headline: one-liner personalized summary (e.g. "You're a near-perfect fit for an AI product.")
  - Description: 1-2 sentences explaining why, based on their profile
  - Recommendation pill: frosted green badge with icon, "Recommended" label, and product name (e.g. "AI Salesperson")
- **Recommendation is derived from the use case quiz answer (runtime key `q-q8`):**
  - `salesperson` -> AI Salesperson
  - `delivery` -> AI Service Delivery
  - `operations` -> AI Operations Tool
  - `unsure` -> AI Salesperson (default)

### 2. Your Profile (card)

- **Section label:** "Your Profile" with clipboard icon
- **Profile tags:** rendered as horizontal-wrap pills reflecting key quiz answers:
  - Business type (from `q-q1`)
  - Revenue range (from `q-q2`)
  - Time bottleneck (from `q-q4`) — displayed as descriptor (e.g. "Sales-heavy")
  - Top existing asset (from `q-q5`) — first value after splitting the comma-delimited string
- **Body text:** 2-3 sentence personalized summary. For v1, this can be a template string that interpolates answer labels.

### 3. What's Holding You Back (card)

- **Section label:** "What's Holding You Back" with warning icon
- **Section title:** bold headline (e.g. "Your business stops when you do.")
- **Pain list:** bulleted list with red dots. Items derived from quiz answers:
  - From `q-q3` (vacation test): maps answer to a pain statement
  - From `q-q4` (time bottleneck): maps to time-related pain
  - From `q-q6` (scaling attempts): split comma-delimited string, map each to a "tried X, didn't work" statement
  - From `q-q5` (assets): maps to "knowledge locked" statement if they selected `expertise-only`

### 4. Your AI Product Match (card)

- **Section label:** "Your AI Product Match" with target icon
- **Section title:** product name (from hero recommendation)
- **Body text:** 2-3 sentence description of what the product does and why it fits their business
- **Mini features row:** 3 equal tiles:
  - "24/7" / "Always selling" (or equivalent for the product type)
  - "14 days" / "To launch"
  - "DFY" / "We build it"

### 5. CTA #1

- **Button:** full-width green gradient, "Book Your Strategy Call"
- **Sub-text:** "Free 30-min call . No obligation"
- **Action:** links to a hardcoded URL constant (booking page). Defined in the results mapping file alongside lookup tables.

### 6. Client Results (card)

- **Section label:** "Client Results" with star icon
- **Testimonial:** avatar (placeholder circle for v1), quote text, name + business type + revenue
- **Content:** hardcoded for v1, ideally matched to the recommended product type in the future

### 7. How Kodara Works (card)

- **Section label:** "How Kodara Works" with tools icon
- **3-step process:** numbered circles (1, 2, 3) with title + description:
  1. Strategy Call — map sales process, identify best AI product
  2. We Build It — team builds end-to-end, trained on their content
  3. Launch & Scale — go live in 14 days, monitor and optimize

### 8. Social Proof Strip

- **Avatar stack:** 4 overlapping gradient circles
- **Text:** "500+ coaches & consultants have built AI products with Kodara"
- Not inside a card — sits directly in the content flow

### 9. CTA #2

- Same as CTA #1 (repeated)
- Spacer below for scroll padding

## Answer-to-Content Mapping

Quiz answers are available as `UserAnswers` (a `Record<string, string>` keyed by message ID). The results page needs a mapping layer that transforms raw answer values into display content.

### Answer key format

**Important:** The quiz config system transforms question IDs. A question with config ID `q1` becomes runtime message ID `q-q1` after `configToOnboardingMessages()` in `lib/quiz-config.ts`. All answer lookups in `buildResultsFromAnswers` must use the prefixed `q-{configId}` form.

### Multi-select answer format

Questions `q5` (existing assets), `q6` (scaling attempts), and `q13` (identity close) are multi-select. Their answers are stored as comma-delimited strings (e.g. `"training,books,courses"`). The mapping function must `.split(',')` these values before lookup.

### Mapping structure

```typescript
type ResultsConfig = {
  score: number;                    // hardcoded 97 for v1
  headline: string;                 // template with interpolation
  description: string;              // template with interpolation
  recommendation: {
    name: string;
    icon: string;
    description: string;
    features: { value: string; label: string }[];
  };
  profileTags: string[];            // derived from answers
  painPoints: string[];             // derived from answers
  testimonial: {
    quote: string;
    name: string;
    detail: string;
  };
  ctaUrl: string;                   // booking page URL
};
```

### Derivation approach (v1)

A pure function `buildResultsFromAnswers(answers: UserAnswers): ResultsConfig` that:
1. Looks up each answer value in a static lookup table using `q-{id}` keys
2. Splits multi-select answers (`q-q5`, `q-q6`) with `.split(',')` before lookup
3. Selects the recommendation based on `q-q8` answer
4. Builds profile tags from `q-q1`, `q-q2`, `q-q4`, `q-q5` (first value) answer labels
5. Builds pain points from `q-q3`, `q-q4`, `q-q6`, `q-q5` answer values
6. Returns a `ResultsConfig` object with a hardcoded `ctaUrl`

This keeps the mapping logic isolated and testable. The lookup tables can later be moved into the admin-editable config.

**Note:** Questions `q7`, `q9`-`q13` are collected but not used in v1 results. They remain available in `UserAnswers` for future personalization.

## Component Architecture

### New components

- **`ResultsPage.tsx`** — top-level results page component. Receives `UserAnswers`, calls `buildResultsFromAnswers`, renders all sections.
- **`ResultsHero.tsx`** — dark gradient hero with score, headline, description, recommendation pill.
- **`ProfileCard.tsx`** — profile tags + summary text.
- **`PainCard.tsx`** — pain headline + bulleted list.
- **`RecommendationCard.tsx`** — product name, description, mini feature tiles.
- **`TestimonialCard.tsx`** — avatar, quote, attribution.
- **`ProcessCard.tsx`** — 3-step numbered process.
- **`SocialProofStrip.tsx`** — avatar stack + stat text.
- **`CtaBlock.tsx`** — green gradient button + sub-text. Accepts `href` prop.

### New lib files

- **`lib/buildResults.ts`** — contains `buildResultsFromAnswers()`, the `ResultsConfig` type, and all static lookup tables. Single file, no external dependencies beyond `types.ts`.

### Shared patterns

All section cards follow the same structure: white background, 12px border-radius, 20px padding, 1px `#E5E5E8` border. Section labels are 10px uppercase green with icon. Extract a `SectionCard` wrapper if useful, but not required — the CSS is simple enough to repeat.

### Removed components

The following components are no longer used in the main flow. Leave as dead code for now — they are referenced by the admin preview system:
- `PlanFlow.tsx`
- `FlowChat.tsx`
- `FlowHeader.tsx`
- `ActionPlanSidebar.tsx`
- `StepperBar.tsx`
- `PinnedOffer.tsx`
- `TaskItem.tsx`
- `PlanHeader.tsx`

### Modified components

- **`App.tsx`** — the `AppState` type becomes `'onboarding' | 'results'`. Update the demo controls: rename "Action Plan" button to "Results" and set state to `'results'`. The `handleOnboardingComplete` callback continues to set state only — `userAnswers` is already stored in `AppContent` where `ResultsPage` will be rendered.
- **`AppContent`** (inside `App.tsx`) — replace `PlanFlow` rendering with `ResultsPage`, passing `userAnswers` as a prop. `ResultsPage` must be rendered inside `AppContent`, not the outer `App`, because that is where `userAnswers` state lives.
- **`OnboardingChat.tsx`** — no changes needed. It already calls `onComplete(answers)`.

## Data Flow

```
Quiz (OnboardingChat)
  -> onComplete(userAnswers)
    -> AppContent stores userAnswers, sets state to 'results'
      -> ResultsPage receives userAnswers as prop
        -> buildResultsFromAnswers(userAnswers) -> ResultsConfig
          -> Render sections
```

**Note:** `ResultsPage` renders inside `AppContent` (not the outer `App`) because `userAnswers` state lives there.

## Scroll Behavior

The results page is a long vertical scroll — different from the chat flow. The results page scrolls within the existing app container (the 430px phone frame in demo mode, or full viewport in standalone mode). The container wrapping `ResultsPage` should use `overflow-y: auto`.

## Responsive Behavior

- **Mobile (430px frame):** single column, full-width sections, hero padding scales down slightly
- **Tablet/Desktop (>640px):** max-width container (640px), centered. Hero can stretch full-width with content constrained. Section cards get slightly more padding.
- All content is single-column at every breakpoint — no layout shifts needed.

## Animations

- **Hero:** fade-in on mount, score number counts up from 0 to `ResultsConfig.score` over ~1.2s
- **Sections:** staggered fade-in-up as user scrolls (using Intersection Observer or scroll-triggered CSS). Each section fades in 100ms after the previous.
- **Recommendation pill:** slight scale-in animation after score finishes counting
- **CTA buttons:** hover lift (`translateY(-1px)`) + shadow increase

## CSS Approach

Use the existing design system tokens from `globals.css`:
- Colors: `--alpha-brand-950`, `--alpha-light-*`, `--gradient-cta-active`
- Typography: `--text-sm`, `--text-base`, `--text-lg`, `--font-medium`, `--font-semibold`
- Shadows: `--shadow-card`
- Animations: extend existing `animate-fade-in-up` with stagger support

New CSS is minimal — mostly the hero gradient (inline or a new class) and the section card pattern.

## Out of Scope (v1)

- Dynamic score calculation based on answers (score is hardcoded at 97%)
- Admin editing of results page content (uses hardcoded templates + answer interpolation)
- Multiple testimonials or testimonial matching
- Calendly embed (CTA is a link for now)
- Share/PDF export of results
- Email capture / lead gen gate
- Usage of questions `q7`, `q9`-`q13` in results content
