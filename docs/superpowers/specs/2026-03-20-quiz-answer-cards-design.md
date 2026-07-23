# Quiz Answer Cards — Design Spec

## Overview

Redesign the ChipPicker component to render quiz-style 2-column grid cards with emojis and descriptions when the chip data includes `emoji` field. Falls back to current small pill style when `emoji` is absent.

## Data Model Change

Extend the chip type in `lib/types.ts`:

```ts
chips?: { label: string; value: string; emoji?: string; description?: string }[];
```

Also update the `ChipPickerProps` interface in `components/ChipPicker.tsx` to match:
```ts
chips: { label: string; value: string; emoji?: string; description?: string }[];
```

Backwards-compatible — guided flow chips in `actionPlanTasks.ts` keep their current `{ label, value }` format and render as small pills.

Note: The `handleMultiSubmit` callback in `OnboardingChat.tsx` accepts `chips: { label: string; value: string }[]` — no change needed since the extended type is structurally compatible (extra optional properties are ignored).

## ChipPicker Component — Grid Mode

When any chip in the array has `emoji`, the component renders in grid mode:

### Layout
- **2-column CSS grid**, `gap: 8px`, full available width
- If the total number of chips is odd, the last item spans both columns as a compact horizontal row (emoji inline left, title right)
- No `ml-9` left indent — grid cards span the full chat message area width

### Card Anatomy (Even Items)
```
+-------------------------+
|       [emoji 28px]      |
|     Title (13px/600)    |
|  Description (11px)     |
+-------------------------+
```
- `padding: 18px 14px`
- `background: #FFFFFF`
- `border: 2px solid #E5E5E8`
- `border-radius: 14px`
- `text-align: center`
- `cursor: pointer`
- Title: `13px`, weight `600`, color `#18181B`, max 2 lines, `overflow: hidden`, `text-overflow: ellipsis`
- Description: `11px`, color `#A1A1AA`, `margin-top: 3px`, `line-height: 1.3`, max 2 lines

### Card Anatomy (Odd Last Item — Full-Width)
```
+------------------------------------------------+
|  [emoji 20px]  Title (13px/600)                 |
+------------------------------------------------+
```
- `grid-column: 1 / -1`
- `padding: 14px`
- Horizontal layout: emoji + title inline, centered
- Description is hidden in the full-width compact layout

### Selected State
- `border: 2px solid #3B82F6`
- `background: rgba(59, 130, 246, 0.04)`

### Disabled State (after selection in single-select)
- Unselected cards: `opacity: 0.5`, `cursor: default`
- Selected card: remains full opacity

### Multi-Select Behavior
- Clicking a card toggles its selected state (blue border on/off)
- Multiple cards can be selected simultaneously
- "Next" green pill button appears below the grid when `selectedValues.size > 0`
- Same button style as current: `rounded-full`, `var(--btn-primary)`, `10px 24px` padding

### Fallback (Pill Mode)
When no chips have `emoji`, render using the existing small pill layout (current behavior, unchanged).

## Chat Layout Changes

### OnboardingChat.tsx
When the active chip message has grid-mode chips (has `emoji`), remove the `ml-9` class from the chip container so cards span the full message width:
```tsx
// Current: <div className="mt-3 ml-9">
// Grid mode: <div className="mt-3">
```

### FlowChat.tsx
Same change — remove `ml-9` when chips have `emoji`.

## Onboarding Messages — Full Chip Content

All 13 quiz questions get `emoji` and `description` added. Guidelines: single Unicode emoji, descriptions 3-8 words, professional but friendly tone.

For Step 8 (Use Case), the long case-study labels are shortened to a title and moved detail to the description field.

### Step 1 — Business Type (q1)
| label | emoji | description |
|-------|-------|-------------|
| Coach / Consultant | &#127919; | 1-on-1 or group advisory |
| Service Provider | &#127973; | Doctor, lawyer, accountant, etc. |
| Agency Owner | &#128640; | Marketing, design, or dev agency |
| Course Creator | &#128218; | Online courses & digital products |
| Other | &#10024; | Something else entirely |

### Step 2 — Revenue Range (q2)
| label | emoji | description |
|-------|-------|-------------|
| Under $100K | &#127793; | Early stage or side hustle |
| $100K - $300K | &#128200; | Growing and gaining traction |
| $300K - $1M | &#128293; | Scaling fast |
| $1M - $5M | &#11088; | Established and profitable |
| $5M+ | &#128142; | Enterprise-level operation |

### Step 3 — Vacation Test (q3)
| label | emoji | description |
|-------|-------|-------------|
| It runs fine without me | &#127774; | Systems handle everything |
| Things would slow down | &#9888;&#65039; | Team manages, but barely |
| Everything grinds to a halt | &#128680; | The business IS you |

### Step 4 — Time Bottleneck (q4)
| label | emoji | description |
|-------|-------|-------------|
| Selling new leads | &#128176; | Calls, proposals, follow-ups |
| Delivering for clients | &#128736;&#65039; | Doing the actual work |
| Creating content | &#9999;&#65039; | Marketing, social, emails |
| Admin & operations | &#128203; | Hiring, systems, overhead |

### Step 5 — Existing Assets (q5, multiSelect)
| label | emoji | description |
|-------|-------|-------------|
| Training materials / SOPs | &#128196; | Documented processes |
| Books or PDFs | &#128214; | Written expertise |
| Online courses | &#127891; | Video or digital programs |
| Group coaching | &#128101; | Live group sessions |
| Recorded calls | &#127908; | Workshops or meetings |
| Deep expertise only | &#129504; | No content yet, just knowledge |

### Step 6 — Scaling Attempts (q6, multiSelect)
| label | emoji | description |
|-------|-------|-------------|
| Hired employees | &#128101; | Built an internal team |
| Outsourced to agency | &#127970; | Delegated to external help |
| Built a course | &#128218; | Created digital products |
| Tried AI tools | &#129302; | ChatGPT, automations, etc. |
| Group coaching | &#128483;&#65039; | Leveraged 1-to-many |
| Still looking | &#128269; | Haven't found the right fit |

### Step 7 — AI Usage (q7)
| label | emoji | description |
|-------|-------|-------------|
| Not at all yet | &#128075; | Starting from zero |
| Small tasks | &#129520; | Occasional use, basic stuff |
| Use it regularly | &#128187; | Integrated into workflow |
| All-in on AI | &#128640; | AI-first business |

### Step 8 — Use Case (q8)
Labels are shortened from the originals. Detail moves to description.

| label | emoji | description |
|-------|-------|-------------|
| AI Salesperson | &#128176; | Pre-sell clients automatically |
| AI Service Delivery | &#128736;&#65039; | Serve clients without you |
| AI Operations Tool | &#9881;&#65039; | Outperform entire teams |
| Not sure yet | &#129300; | Show me more options |

### Step 9 — Magic Question (q9)
| label | emoji | description |
|-------|-------|-------------|
| Sell without sales calls | &#128176; | Close deals on autopilot |
| Deliver without doing the work | &#128736;&#65039; | AI handles fulfillment |
| Reach leads without content | &#128227; | Attract without the grind |
| Onboard without hand-holding | &#128075; | Automate client setup |

### Step 10 — Sales Process (q10)
| label | emoji | description |
|-------|-------|-------------|
| 1-on-1 sales calls | &#128222; | Personal consultations |
| 1-to-many presentations | &#127916; | Webinars, live events |
| In-person consultation | &#129309; | Face-to-face meetings |
| Self-serve online | &#128722; | They buy without talking to you |

### Step 11 — Sales Complexity (q11)
| label | emoji | description |
|-------|-------|-------------|
| Just 1 touch point | &#9889; | Quick, simple close |
| 2-3 conversations | &#128172; | Some nurturing needed |
| Many touch points | &#128340; | Long sales cycle |

### Step 12 — Vision (q12)
| label | emoji | description |
|-------|-------|-------------|
| Grow without adding headcount | &#128200; | Lean, efficient scaling |
| Less time, same revenue | &#127958;&#65039; | Work less, earn the same |
| Build an empire | &#128081; | Scale as big as possible |
| Business runs without me | &#127754; | True freedom |

### Step 13 — Identity Close (q13, multiSelect)
| label | emoji | description |
|-------|-------|-------------|
| Stop trading time for money | &#9200; | Break the hourly trap |
| Scale past 7 figures | &#128200; | Grow without a big team |
| Unlimited clients | &#127775; | No capacity ceiling |
| Sells while I sleep | &#127769; | Revenue on autopilot |
| Business doesn't depend on me | &#128275; | True independence |
| More strategy, less delivery | &#129504; | CEO mindset, not worker |

## Design System Alignment

All colors, typography, and spacing follow the Kodara Design System:
- Blue accent: `#3B82F6` (selected state)
- Text primary: `#18181B`
- Text muted: `#A1A1AA`
- Border: `#E5E5E8`
- Card background: `#FFFFFF`
- Border radius: `14px`
