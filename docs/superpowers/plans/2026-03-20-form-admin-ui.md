# Form-Based Admin UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the JSON tree admin editor with a form-based UI featuring a sidebar with drag-to-reorder, dedicated form fields, and live quiz preview.

**Architecture:** Split the admin page into sub-components: sidebar, editor forms (question/interstitial/fitScore/task), and preview. The page orchestrates state and passes config + callbacks to each. Uses `@dnd-kit` for drag-to-reorder.

**Tech Stack:** Next.js 16, React 19, TypeScript, `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`

**Spec:** `docs/superpowers/specs/2026-03-20-form-admin-ui-design.md`

---

## File Structure

```
app/admin/
  page.tsx                    # Main admin page — layout, state, config fetch/save
  components/
    AdminSidebar.tsx          # Sidebar with tabs, sortable item lists, add/delete
    QuestionEditor.tsx        # Form for editing a quiz question + chips
    InterstitialEditor.tsx    # Form for editing an interstitial
    FitScoreEditor.tsx        # Form for editing a fit score
    TaskEditor.tsx            # Form for editing an action plan task
    AdminPreview.tsx          # Live preview panel with step-through
    SortableItem.tsx          # Reusable sortable list item (used by sidebar + chip list)
```

---

## Chunk 1: Dependencies

### Task 1: Swap dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dnd-kit (keep react-json-view until page is replaced)**

```bash
cd "C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1"
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0
```

Do NOT uninstall `@uiw/react-json-view` yet — the existing admin page still imports it. It gets removed in Task 5 after the page is rewritten.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build passes (only added dependencies, nothing removed).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap @uiw/react-json-view for @dnd-kit"
```

---

## Chunk 2: Reusable Sortable Item

### Task 2: Create SortableItem component

**Files:**
- Create: `app/admin/components/SortableItem.tsx`

- [ ] **Step 1: Create the sortable item wrapper**

A generic wrapper component for draggable list items using `@dnd-kit/sortable`:

```tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export default function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          {...listeners}
          style={{
            cursor: 'grab',
            color: '#D4D4D8',
            fontSize: '14px',
            flexShrink: 0,
            touchAction: 'none',
          }}
        >
          ⠿
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/components/SortableItem.tsx
git commit -m "feat: add SortableItem wrapper for dnd-kit"
```

---

## Chunk 3: Editor Form Components

### Task 3: Create all editor form components

**Files:**
- Create: `app/admin/components/QuestionEditor.tsx`
- Create: `app/admin/components/InterstitialEditor.tsx`
- Create: `app/admin/components/FitScoreEditor.tsx`
- Create: `app/admin/components/TaskEditor.tsx`

All editor components follow the same pattern:
- Accept the item data + an `onChange` callback
- Render labeled form fields
- Call `onChange` with updated data on every field change

- [ ] **Step 1: Create QuestionEditor.tsx**

Props:
```ts
interface QuestionEditorProps {
  question: QuizQuestion;
  onChange: (updated: QuizQuestion) => void;
}
```

Fields:
- Preamble: `<textarea>` (3 rows)
- Question Text: `<input type="text">`
- Subtitle: `<input type="text">`
- Selection Type: toggle button (Single / Multi) — sets `multiSelect`
- **Answer Options**: sortable list of chip rows, each with:
  - Drag handle (via `SortableItem`)
  - Emoji input (40px wide)
  - Label input (flex)
  - Description input (flex, placeholder "Optional description")
  - Delete button (red X)
- "Add Option" button at the bottom

**Chip value auto-update:** The `value` field is not shown as an input. On label `onBlur`, auto-generate `value` from label: `label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`. Only update if label is non-empty. New chips start with `value: 'option-' + Date.now()` as a unique fallback.

**"Add Option" default:** `{ label: '', value: 'option-' + Date.now(), emoji: '', description: '' }`

Chip reordering uses its own `DndContext` + `SortableContext` wrapping the chip list.

**Required dnd-kit imports for chip reorder:**
```ts
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
```

**onDragEnd pattern for chips:**
```ts
function handleChipDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = question.chips.findIndex(c => c.value === active.id);
    const newIndex = question.chips.findIndex(c => c.value === over.id);
    onChange({ ...question, chips: arrayMove(question.chips, oldIndex, newIndex) });
  }
}
```

Use `chip.value` as the sortable ID for each chip item.

Styling: use inline styles matching the spec — labels are `11px/500/#71717A/uppercase`, inputs are `1px solid #E5E5E8`, `8px` radius, `8px 12px` padding, `13px` font, section heading `14px/600/#18181B`.

Import `QuizQuestion` from `@/lib/quiz-config`.

- [ ] **Step 2: Create InterstitialEditor.tsx**

Props:
```ts
interface InterstitialEditorProps {
  interstitial: QuizInterstitial;
  onChange: (updated: QuizInterstitial) => void;
}
```

Fields: Headline (input), Body (textarea, 4 rows), Stat (input, optional).

Same styling pattern as QuestionEditor.

- [ ] **Step 3: Create FitScoreEditor.tsx**

Props:
```ts
interface FitScoreEditorProps {
  fitScore: QuizFitScore;
  onChange: (updated: QuizFitScore) => void;
}
```

Fields: Percentage (number input, 0-100), Message (textarea, 3 rows), CTA Text (input).

- [ ] **Step 4: Create TaskEditor.tsx**

Props:
```ts
interface TaskEditorProps {
  task: ConfigActionPlanTask;
  onChange: (updated: ConfigActionPlanTask) => void;
}
```

Fields:
- Title (input) — always
- Subtitle (input) — always
- Type (dropdown: quick/guided/offer) — always
- Initial Status (dropdown: completed/active/locked) — always
- Estimated Time (input) — shown when type is quick or guided
- Offer CTA (input) — shown when type is offer
- Offer URL (input) — shown when type is offer
- Offer Price (input) — shown when type is offer
- Guided Messages: read-only badge showing "{n} messages" — shown when type is guided and messages exist

All dropdowns: use native `<select>` elements styled consistently.

- [ ] **Step 5: Verify build**

```bash
npm run build
```

May still fail due to the old admin page importing `@uiw/react-json-view`. That's fine — Task 5 replaces it.

- [ ] **Step 6: Commit**

```bash
git add app/admin/components/QuestionEditor.tsx app/admin/components/InterstitialEditor.tsx app/admin/components/FitScoreEditor.tsx app/admin/components/TaskEditor.tsx
git commit -m "feat: add form editor components for questions, interstitials, fit scores, tasks"
```

---

## Chunk 4: Sidebar and Preview

### Task 4: Create AdminSidebar and AdminPreview

**Files:**
- Create: `app/admin/components/AdminSidebar.tsx`
- Create: `app/admin/components/AdminPreview.tsx`

- [ ] **Step 1: Create AdminSidebar.tsx**

Props:
```ts
interface AdminSidebarProps {
  config: QuizConfig;
  activeTab: 'flow' | 'plan';
  selectedId: string | null;
  onTabChange: (tab: 'flow' | 'plan') => void;
  onSelect: (id: string, type: 'question' | 'interstitial' | 'fitScore' | 'task') => void;
  onReorderFlow: (newFlow: FlowItem[]) => void;
  onReorderPlan: (newPlan: ConfigActionPlanTask[]) => void;
  onAddQuestion: () => void;
  onAddInterstitial: () => void;
  onAddFitScore: () => void;
  onAddTask: () => void;
  onDeleteFlowItem: (id: string, type: 'question' | 'interstitial' | 'fitScore') => void;
  onDeleteTask: (id: string) => void;
}
```

**Required dnd-kit imports:**
```ts
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
```

**onDragEnd pattern for flow items:**
```ts
function handleFlowDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = config.flow.findIndex(f => f.id === active.id);
    const newIndex = config.flow.findIndex(f => f.id === over.id);
    onReorderFlow(arrayMove(config.flow, oldIndex, newIndex));
  }
}
```
Same pattern for action plan reordering with `config.actionPlan` and `onReorderPlan`.

**Question numbering in sidebar labels:**
```ts
let qCount = 0;
config.flow.map(item => {
  if (item.type === 'question') qCount++;
  const label = item.type === 'question'
    ? `Q${qCount}: ${config.questions.find(q => q.id === item.id)?.content?.slice(0, 20) ?? ''}`
    : item.type === 'interstitial'
    ? `Interstitial: ${config.interstitials.find(i => i.id === item.id)?.headline ?? ''}`
    : `Fit: ${config.fitScores.find(f => f.id === item.id)?.percentage ?? 0}%`;
  ...
});
```

Layout:
- 220px fixed width, `#fafafa` background, right border `#E5E5E8`
- Two tabs at top: "Quiz Flow" / "Action Plan" — active tab gets subtle bg highlight
- **Quiz Flow tab**: `DndContext` + `SortableContext` wrapping flow items list
  - Each item: `SortableItem` with type badge (colored dot), label, trash icon on hover
  - Label derivation: questions → "Q{n}: {first 20 chars}", interstitials → "Interstitial: {headline}", fit scores → "Fit: {percentage}%"
  - Question numbering: count only questions in flow order (skip interstitials/fitScores)
  - Selected item: left blue border + light blue tint
  - Bottom: three Add buttons
  - Empty state: "No quiz items yet"
- **Action Plan tab**: separate `DndContext` + `SortableContext`
  - Each item: `SortableItem` with type badge, title, trash icon on hover
  - Bottom: Add Task button
  - Empty state: "No tasks yet"

`onDragEnd` handler: reorder the array and call `onReorderFlow` or `onReorderPlan`.

- [ ] **Step 2: Create AdminPreview.tsx**

Props:
```ts
interface AdminPreviewProps {
  config: QuizConfig;
  selectedFlowIndex: number;
  onStepChange: (index: number) => void;
}
```

Layout:
- White background, left border `#E5E5E8`
- Header: "LIVE PREVIEW" label + "Auto-updating" green badge
- Scrollable preview area rendering quiz messages
- Bottom navigation bar: Previous / step counter / Next

Preview logic:
- Compute `messages = configToOnboardingMessages(config)`
- Compute `endIndex` for the selected flow item: walk `config.flow.slice(0, selectedFlowIndex + 1)`, for each item add 1 (or 2 if it's a question with `preamble`)
- Show `messages.slice(0, endIndex)`
- Render each message: `fitScore` → `<FitScore>`, `interstitial` → `<Interstitial>`, default → `<MessageBubble>` with optional `<ChipPicker>`
- Step counter shows `selectedFlowIndex + 1 / config.flow.length`

**Required imports:**
```ts
import { QuizConfig, configToOnboardingMessages } from '@/lib/quiz-config';
import { DMessage } from '@/lib/types';
import MessageBubble from '@/components/MessageBubble';
import ChipPicker from '@/components/ChipPicker';
import FitScore from '@/components/FitScore';
import Interstitial from '@/components/Interstitial';
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/components/AdminSidebar.tsx app/admin/components/AdminPreview.tsx
git commit -m "feat: add AdminSidebar with drag-to-reorder and AdminPreview with step-through"
```

---

## Chunk 5: Main Admin Page

### Task 5: Replace admin page with form-based layout

**Files:**
- Modify: `app/admin/page.tsx` (complete rewrite)

- [ ] **Step 1: Rewrite page.tsx**

Complete rewrite of `app/admin/page.tsx`. The page orchestrates all state and renders the three-column layout.

**Imports:**
```ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { QuizConfig, QuizQuestion, QuizInterstitial, QuizFitScore, FlowItem, ConfigActionPlanTask } from '@/lib/quiz-config';
import AdminSidebar from './components/AdminSidebar';
import QuestionEditor from './components/QuestionEditor';
import InterstitialEditor from './components/InterstitialEditor';
import FitScoreEditor from './components/FitScoreEditor';
import TaskEditor from './components/TaskEditor';
import AdminPreview from './components/AdminPreview';
```

**State:**
```ts
const [config, setConfig] = useState<QuizConfig | null>(null);
const [activeTab, setActiveTab] = useState<'flow' | 'plan'>('flow');
const [selectedId, setSelectedId] = useState<string | null>(null);
const [selectedType, setSelectedType] = useState<'question' | 'interstitial' | 'fitScore' | 'task' | null>(null);
const [saving, setSaving] = useState(false);
const [saved, setSaved] = useState(false);
```

**Config fetch on mount** (same as before).

**Helper update functions:**
- `updateQuestion(id, updates)` — updates `config.questions` array
- `updateInterstitial(id, updates)` — updates `config.interstitials` array
- `updateFitScore(id, updates)` — updates `config.fitScores` array
- `updateTask(id, updates)` — updates `config.actionPlan` array
- `handleReorderFlow(newFlow)` — sets `config.flow`
- `handleReorderPlan(newPlan)` — sets `config.actionPlan`

**Add handlers** (create item with defaults from spec, append to arrays, auto-select):
- `handleAddQuestion()` — creates question with `crypto.randomUUID()` id, appends to `config.questions` and `config.flow`, selects it
- `handleAddInterstitial()` — same pattern
- `handleAddFitScore()` — same pattern
- `handleAddTask()` — appends to `config.actionPlan`, selects it

**Delete handlers:**
- `handleDeleteFlowItem(id, type)` — removes from typed array + `config.flow`, clears selection if deleted item was selected
- `handleDeleteTask(id)` — removes from `config.actionPlan`, clears selection

**Save handler:**
- POST to `/api/config`, set `saving` → `saved` briefly

**Selected flow index** (for preview sync):
```ts
const selectedFlowIndex = selectedType && selectedType !== 'task' && selectedId
  ? Math.max(0, config.flow.findIndex(f => f.id === selectedId))
  : 0;
```

**Layout JSX:**
```
Full viewport flex row:
  Top bar (absolute, full width, 48px):
    Left: green dot + "Quiz Admin"
    Right: Save button
  Below top bar (flex row, fill remaining):
    AdminSidebar (220px)
    Editor panel (flex: 1):
      if no selection: centered "Select an item from the sidebar to edit"
      if question: look up `config.questions.find(q => q.id === selectedId)` → if found, render `<QuestionEditor>`, else show empty state
      if interstitial: look up in `config.interstitials` → `<InterstitialEditor>`
      if fitScore: look up in `config.fitScores` → `<FitScoreEditor>`
      if task: look up in `config.actionPlan` → `<TaskEditor>`
    AdminPreview (45%)
```

**Selection handler:**
```ts
const handleSelect = (id: string, type: 'question' | 'interstitial' | 'fitScore' | 'task') => {
  setSelectedId(id);
  setSelectedType(type);
  if (type !== 'task') setActiveTab('flow');
  else setActiveTab('plan');
};
```

**Preview step change** handler should also update sidebar selection (keep them in sync):
```ts
const handlePreviewStepChange = (index: number) => {
  const flowItem = config.flow[index];
  if (flowItem) {
    setSelectedId(flowItem.id);
    setSelectedType(flowItem.type);
  }
};
```

- [ ] **Step 2: Remove @uiw/react-json-view**

Now that the page no longer imports it:
```bash
npm uninstall @uiw/react-json-view
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Passes.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx package.json package-lock.json
git commit -m "feat: replace JSON tree editor with form-based admin UI"
```

---

## Chunk 6: Verification

### Task 6: End-to-end verification and cleanup

- [ ] **Step 1: Run the build**

```bash
cd "C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1"
npm run build
```

Expected: Build succeeds.

- [ ] **Step 2: Test the admin page**

Start dev server, open `http://localhost:3001/admin`:
- Sidebar shows quiz flow items with correct labels
- Clicking an item loads its form in the editor panel
- Editing a field updates the preview in real-time
- Drag-to-reorder works in sidebar
- Add/delete buttons work
- Save button persists changes
- Action Plan tab shows tasks
- Preview step-through (Next/Previous) works and syncs with sidebar

- [ ] **Step 3: Test the quiz still works**

Open `http://localhost:3001/`:
- Quiz loads and works as before
- Edit something in admin, save, refresh quiz — changes appear

- [ ] **Step 4: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: resolve any issues from form admin UI implementation"
```
