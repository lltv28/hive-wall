# Form-Based Admin UI — Design Spec

## Overview

Replace the JSON tree editor admin page (`app/admin/page.tsx`) with a form-based editor UI. Three-column layout: sidebar with drag-to-reorder item list, form editor panel, and live preview. The backend (config types, API routes, transformers, renderer refactor) is unchanged.

## Scope

- **File to replace:** `app/admin/page.tsx`
- **New dependency:** `@dnd-kit/core` + `@dnd-kit/sortable` for drag-to-reorder
- **Can remove:** `@uiw/react-json-view` (no longer needed)

## Layout

Three-column layout, full viewport (`100vw x 100vh`):

```
+--------------------+---------------------------+----------------------------+
| Sidebar (220px)    | Editor Panel (flex: 1)    | Preview Panel (45%)        |
|                    |                           |                            |
| [Quiz Flow] [Plan] | Form fields for selected  | LIVE PREVIEW               |
|                    | item                      | Auto-updating              |
| Q1: Business Type  |                           |                            |
| Q2: Revenue        | Question Text:            | [Rendered quiz component]  |
| Interstitial       | [________________]        |                            |
| Q3: Vacation       |                           |                            |
| ...                | Subtitle:                 |                            |
|                    | [________________]        | [Prev] 3/15 [Next]         |
| [+ Add Question]   |                           |                            |
+--------------------+---------------------------+----------------------------+
```

### Top Bar
- Spans full width
- Left: "Quiz Admin" title with green dot icon
- Right: "Save" green pill button (`#2E7D52`), shows "Saving..." during save, briefly shows "Saved!" after

## Sidebar (220px)

### Tabs
Two tabs at top: **"Quiz Flow"** and **"Action Plan"**. Active tab has subtle background highlight.

### Quiz Flow Tab
- Ordered list matching `config.flow` array
- Each item shows:
  - Drag handle icon (left, `#D4D4D8`, grab cursor)
  - Type badge: colored dot or icon (blue for questions, amber for interstitials, green for fit scores)
  - Label: "Q1: Business Type", "Interstitial: Social Proof", "Fit: 45%", etc.
- Click selects item (blue left border highlight), loads it in the editor panel
- Drag to reorder — updates `config.flow` array order
- Bottom buttons: "+ Add Question", "+ Add Interstitial", "+ Add Fit Score"
  - Adding creates a new item with default empty content, appends to both the typed array and the `flow` array

### Action Plan Tab
- Ordered list of `config.actionPlan` items
- Each item shows: drag handle, type badge (colored by quick/guided/offer), title
- Click to select and edit
- Drag to reorder — updates `config.actionPlan` array order
- Bottom: "+ Add Task" button

### Labels
- Questions: derive label from `config.questions` by matching the flow item's `id` — show "Q{n}: {first 20 chars of content}"
- Interstitials: "Interstitial: {headline}"
- Fit Scores: "Fit: {percentage}%"
- Tasks: just the task title

## Editor Panel

### Question Editor
| Field | Input Type | Maps to |
|-------|-----------|---------|
| Preamble | textarea (3 rows) | `QuizQuestion.preamble` |
| Question Text | text input | `QuizQuestion.content` |
| Subtitle | text input | `QuizQuestion.subtitle` |
| Selection Type | toggle (Single / Multi) | `QuizQuestion.multiSelect` |
| **Answer Options** | sortable list (below) | `QuizQuestion.chips` |

**Answer Options List:**
Each option row:
```
[drag handle] [emoji input (40px)] [label input (flex)] [description input (flex)] [delete X]
```
- Emoji input: small text input, 40px wide, centered
- Label: text input, flex grow
- Description: text input, flex grow, placeholder "Optional description"
- Delete: red X button, removes the chip
- Drag to reorder within the list (reorders `chips` array)
- "Add Option" button at the bottom — appends `{ label: '', value: 'option-' + Date.now(), emoji: '', description: '' }`. The `value` field auto-updates from label on blur (kebab-case) but starts with a unique fallback to avoid duplicates.

### Interstitial Editor
| Field | Input Type | Maps to |
|-------|-----------|---------|
| Headline | text input | `QuizInterstitial.headline` |
| Body | textarea (4 rows) | `QuizInterstitial.body` |
| Stat | text input, optional | `QuizInterstitial.stat` |

### Fit Score Editor
| Field | Input Type | Maps to |
|-------|-----------|---------|
| Percentage | number input (0-100) | `QuizFitScore.percentage` |
| Message | textarea (3 rows) | `QuizFitScore.message` |
| CTA Text | text input | `QuizFitScore.cta` |

### Action Plan Task Editor
| Field | Input Type | Maps to | Shown When |
|-------|-----------|---------|------------|
| Title | text input | `ConfigActionPlanTask.title` | Always |
| Subtitle | text input | `ConfigActionPlanTask.subtitle` | Always |
| Type | dropdown (quick/guided/offer) | `ConfigActionPlanTask.type` | Always |
| Initial Status | dropdown (completed/active/locked) | `ConfigActionPlanTask.initialStatus` | Always |
| Estimated Time | text input | `ConfigActionPlanTask.estimatedTime` | quick, guided |
| Offer CTA | text input | `ConfigActionPlanTask.offerCta` | offer |
| Offer URL | text input | `ConfigActionPlanTask.offerUrl` | offer |
| Offer Price | text input | `ConfigActionPlanTask.offerPrice` | offer |
| Guided Messages | read-only summary | `ConfigActionPlanTask.messages` | guided |

**Guided Messages summary:** Shows "{n} messages" as a read-only badge. No inline editing — these are edited in code for now.

## Preview Panel (45% width)

### Header
- "LIVE PREVIEW" label (left)
- "Auto-updating" green badge (right)

### Preview Area
- Scrollable, white background
- Renders quiz messages up to the selected flow item using actual quiz components
- Uses `configToOnboardingMessages(config)` to produce `DMessage[]`
- **Flow-to-message index mapping:** Each flow item produces a variable number of messages (questions with `preamble` produce 2, everything else produces 1). To show "up to flow item N", compute the message end-index as the cumulative count of messages from flow items 0 through N. Helper: `flow.slice(0, n+1).reduce((sum, item) => sum + (item.type === 'question' && config.questions.find(q => q.id === item.id)?.preamble ? 2 : 1), 0)`.
- Shows `messages.slice(0, endIndex)`
- Message rendering:
  - `msg.fitScore` → `<FitScore>` component
  - `msg.interstitial` → `<Interstitial>` component
  - Default → `<MessageBubble>` with optional `<ChipPicker>` below for chip messages
- Updates instantly as form fields change (reads from React state, no save needed)

### Navigation Controls
Bottom bar with:
- "Previous" button (disabled at index 0)
- Step counter: "3 / 15" (shows flow item index, not message index — `selectedFlowIndex + 1 / flow.length`)
- "Next" button (disabled at last flow item)
- Previous/Next step through flow items, which also updates the sidebar selection to stay in sync

## Deleting Items

Each sidebar item shows a small trash icon on the right when hovered or selected. Clicking it:
- For flow items: removes the item from both the typed array (`questions`, `interstitials`, or `fitScores`) AND the `flow` array
- For action plan tasks: removes from `config.actionPlan`
- If the deleted item was selected, clears the selection
- No confirmation dialog (changes aren't persisted until Save is clicked)

## Adding Items — Defaults

**New Question:** `{ id: crypto.randomUUID(), content: 'New question', chips: [{ label: 'Option 1', value: 'option-1', emoji: '', description: '' }], multiSelect: false }`

**New Interstitial:** `{ id: crypto.randomUUID(), headline: 'New interstitial', body: '', stat: '' }`

**New Fit Score:** `{ id: crypto.randomUUID(), percentage: 50, message: 'Your score', cta: 'Continue' }`

**New Task:** `{ id: crypto.randomUUID(), title: 'New task', subtitle: '', type: 'quick', initialStatus: 'locked', estimatedTime: '1 min' }`

New items are appended to their typed array and (for flow items) to `config.flow`. The new item is auto-selected after creation.

## Empty States

- **Empty flow list:** Sidebar shows centered "No quiz items yet" with the Add buttons below
- **Empty action plan list:** Sidebar shows "No tasks yet" with the Add Task button
- **No selection:** Editor panel shows centered "Select an item from the sidebar to edit"

## Drag-to-Reorder Implementation

Use `@dnd-kit/core` and `@dnd-kit/sortable`:
- `DndContext` wraps the sidebar list
- `SortableContext` with `verticalListSortingStrategy`
- Each item wrapped in `useSortable`
- `onDragEnd` handler reorders the appropriate array in config state

Three separate drag contexts:
1. **Flow items** (sidebar) — reorders `config.flow` array
2. **Action plan items** (sidebar) — reorders `config.actionPlan` array
3. **Chip options** (editor panel) — reorders `chips` array within a question

## State Management

All state lives in the admin page component:
- `config: QuizConfig | null` — fetched from `/api/config` on mount
- `activeTab: 'flow' | 'plan'` — sidebar tab
- `selectedId: string | null` — which item is selected for editing
- `selectedType: 'question' | 'interstitial' | 'fitScore' | 'task' | null`
- `saving: boolean`
- `saved: boolean` — briefly true after save for "Saved!" feedback

### Config Updates
All form field changes update `config` in React state immediately (for instant preview). The "Save" button POSTs the full config to `/api/config`.

Helper function pattern:
```ts
function updateQuestion(id: string, updates: Partial<QuizQuestion>) {
  setConfig(prev => ({
    ...prev!,
    questions: prev!.questions.map(q => q.id === id ? { ...q, ...updates } : q),
  }));
}
```

Similar helpers for `updateInterstitial`, `updateFitScore`, `updateTask`.

## Styling

- Sidebar: `#fafafa` background, `1px solid #E5E5E8` right border
- Editor panel: white background
- Preview panel: white background, `1px solid #E5E5E8` left border
- Form inputs: `1px solid #E5E5E8` border, `8px` radius, `8px 12px` padding, `13px` font
- Form labels: `11px`, `500` weight, `#71717A` color, uppercase
- Section headings in editor: `14px`, `600` weight, `#18181B`
- Drag handles: `#D4D4D8` color, `grab` cursor
- Active sidebar item: `1px solid #3B82F6` left border, light blue tint background
- Top bar: white, `1px solid #E5E5E8` bottom border, `48px` height

## File Structure

Single file replacement:
```
app/admin/page.tsx   # Replace entirely (was JSON tree, now form-based)
```

The page will be large (~400-500 lines) since it contains the sidebar, editor forms, preview, and drag logic. This is acceptable for a single admin page that won't be reused elsewhere. If it grows unwieldy, editor panels can be extracted to `app/admin/` components later.

## Dependencies

- **Add:** `@dnd-kit/core` and `@dnd-kit/sortable` — use latest versions compatible with React 19. If `@dnd-kit` v6+ stable is not available, check for `@dnd-kit/core@next` / `@dnd-kit/sortable@next` or fall back to `@hello-pangea/dnd` which has confirmed React 19 support.
- **Remove:** `@uiw/react-json-view` (no longer needed)
