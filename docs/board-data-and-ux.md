# Board data model and editor UX flows

## Data model overview

The board experience is driven by three core entities: locations, boards, and slides.

```
Location (slug)
   └── Board (boardSlug, locationSlug)
           └── Slide (id, slug, boardSlug, locationSlug)
```

- **Location** owns a collection of boards and provides the geographic context for scheduling.
- **Board** groups slides for a specific placement; boards enforce `maxSlides` limits from the `BoardsProvider`.
- **Slide** carries presentation metadata (title, description, assets) along with scheduling attributes:
  - `status`: `draft | scheduled | published`
  - `publishAt` / `expireAt`: ISO strings persisted via `updateSlide` and `cacheDrafts`
  - `position`: implicit order managed by drag-and-drop operations

## Scheduling flow

1. Editors open the **SchedulePanel** from a slide menu action.
2. The panel initializes from the selected slide and validates that a `locationSlug` is available.
3. Changes to status, publish window, or expiry are merged into the `BoardsProvider` state via `updateSlide`.
4. Persisted updates are cached client-side to avoid data loss during navigation.

```
Slide menu → SchedulePanel → updateSlide(boardSlug, slideId, payload) → cacheSlides/cacheDrafts
```

## Slide stack editing flow

1. **Load**: `SlideStack` retrieves slides for the active board, lazy-loading drafts from IndexedDB when empty.
2. **Arrange**: Users reorder slides via `@dnd-kit` sensors; `reorderSlides` updates in-memory ordering.
3. **Author**: Creating or duplicating slides uses `insertSlide` with max-count guardrails.
4. **Cleanup**: Delete requests prompt for confirmation and respect `useAuth().canDeleteSlides` permissions.

## Navigation and routing

- Board URLs follow `/locations/:locationSlug/boards/:boardSlug` and are resolved via `resolveRoute` in `src/router/index.ts`.
- Unauthorized viewers receive an `unauthorized` route match so UI can enforce role-based access.
- Editors should keep URLs in sync with navigation links to ensure deep-linkability for QA and analytics.

## Editor ergonomics checklist

- Show current slide counts near the add button to surface `maxSlides` limits.
- Keep contextual menus keyboard focusable; `aria-haspopup="menu"` and button labels should name the slide.
- Preload image assets when slides become visible to keep previews sharp during drag interactions.
