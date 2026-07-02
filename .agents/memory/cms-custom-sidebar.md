---
name: CMS Custom Sidebar Sections
description: localStorage-based custom navigation sections with emoji icons in the CMS sidebar.
---

## Storage

- `cms_custom_nav` → JSON array of `{ id, group, name, emoji }` in localStorage
- `cms_custom_notes` → JSON object mapping section id → notes string in localStorage

## Architecture

- `layout.tsx` reads/writes `cms_custom_nav` via `useState(loadCustomItems)`
- Extensible groups (Knowledge Engine, Number Library, Mappings, Content) each show a `+` button next to their section header
- `+` opens `AddSectionDialog` component (defined inline in layout.tsx)
- Custom items render below static items in their group, with a hover `×` delete button
- Each custom item links to `/custom/:id`

## Custom Section Page

- `src/pages/custom-section.tsx` → `CustomSectionPage` component
- Gets `id` from wouter `useParams<{ id: string }>()`
- Shows section emoji + name + group breadcrumb
- Provides a localStorage-persisted `<Textarea>` notes area (auto-saves on every keystroke)
- Has "Edit Section" button to rename/change emoji inline

## Route

`/custom/:id` → `CustomSectionPage` registered in `App.tsx`

**Why localStorage:** Custom sections are consultant-personal configuration, not shared DB data. No API needed.
