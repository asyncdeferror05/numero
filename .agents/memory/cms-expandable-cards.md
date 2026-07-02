---
name: CMS Expandable Card Pattern
description: How expandable list rows are implemented across all CMS pages — inline state, not a shared wrapper component.
---

## Pattern

Each page stores `const [expandedId, setExpandedId] = useState<number | null>(null)` (or `expandedNum` for professions which keys on the number 1–9).

Cards use `<Card>` → `<CardContent className="p-0">` with two children:
1. A `<div role="button" tabIndex={0} onClick={...} onKeyDown={...}>` header (the clickable row)
2. A conditional expanded detail block below

Action buttons (edit, delete, toggle) inside the header div use `onClick={(e) => e.stopPropagation()}` to avoid triggering expand.

**Why:** Shared `ExpandableRow` component created at `src/components/expandable-row.tsx` but found that per-page inline state is cleaner when action buttons are in the header — avoids prop-drilling the stopPropagation logic.

**How to apply:** Use this pattern for any new list page. Import `ChevronRight` from lucide-react and `cn` from `@/lib/utils`. Add `border-primary/30` to the card when `isOpen`.

## Critical: No nested `<button>` elements

Never put `<Button>` components inside a `div[role="button"]` without `stopPropagation`. React throws a hydration error for nested interactive elements. Always wrap action buttons in a `<div onClick={(e) => e.stopPropagation()}>`.
