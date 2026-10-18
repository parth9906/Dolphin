# Whale UI/UX Audit

**Method:** static review of the uploaded React/TypeScript source and CSS. This is not a browser-based responsive/accessibility test; no viewport screenshots or automated accessibility checks were run.

## Application shell and navigation

`src/app/AppShell.tsx` implements a sidebar, mobile navigation open state, backdrop, close buttons, permission-aware navigation, account menu state, and logout pending state. The menu button includes `aria-controls` and `aria-expanded`. Route permission-denied screens use `role="alert"`.

Follow-up checks required: focus movement into/out of the mobile drawer, Escape-key behavior, focus restoration, whether the drawer locks background scrolling, active-nav semantics, and whether all actionable icon-only buttons have accessible names.

## Page density and component boundaries

The largest pages combine substantial view, state, and workflow logic (see line counts in `REPOSITORY_AUDIT.md`). This increases the chance of inconsistent form behavior and makes independent responsive testing difficult. Refactor by workflow boundaries, not by arbitrary line count.

## Loading/error/empty/success behavior

There are feature-specific states and retry affordances in existing pages, but no single shared state pattern was established from the source. Audit each route for all states and ensure a failed request never silently appears as an empty successful result. Preserve the actual error code/status for permission and conflict handling.

## Forms

React Hook Form, Zod, and resolver dependencies are available, but the source does not consistently establish that every form uses them. Before changing a form, inspect its current validation and API DTO. Required behavior includes inline field errors, accessible label/error relationships, pending/duplicate-submit protection, preservation of inputs after recoverable API failures, and explicit success/failure feedback.

## Tables, filters, and pagination

The API supports Spring Data `Page` responses for many list endpoints. The leave page currently requests only page 0 with size 50. Each table must be checked for server-side pagination/filter/sort support before adding controls; client-side filtering over one fetched page must not be presented as filtering the entire dataset.

## Browser-native dialogs

Native `window.confirm()` is used by hostel, inventory, attendance, homework, and leave workflows; `window.alert()` is used by certificates. These block normal app styling and do not provide the intended custom accessible experience. Replace incrementally with a reusable dialog/notification pattern after verifying mutation semantics and unsaved-change behavior.

## Responsive verification still required

No screenshot-based or browser-run verification was performed at 320, 375, 390, 430, 768, 1024, 1280, and 1440px. For each page, check:

- No unintended document-level horizontal overflow.
- Tables use an intentional mobile alternative or bounded horizontal scroll where appropriate.
- Forms become single-column at narrow widths.
- Dialogs fit within viewport and safe areas.
- Controls have adequate touch target size.
- Keyboard focus is visible and logical.
- Mobile drawer is keyboard-accessible and closes after navigation.
- Long labels, IDs, and errors wrap without overlapping controls.

## Design system

The project primarily uses global and feature-specific CSS (`src/index.css`, `src/App.css`, and feature CSS files). A design-token audit is required before adding a new styling framework. Do not add Tailwind or a component framework until the existing CSS and build setup are fully assessed. Consolidate repeated tokens and primitives where the source demonstrates real reuse; do not create a universal component with unrelated flags.

## Priority UX changes

1. Centralize organization context and remove stale/ambiguous context states.
2. Establish consistent loading, empty, error, retry, and permission-denied patterns.
3. Replace native confirmation/alert workflows with accessible UI.
4. Make high-density attendance, marks, timetable, and roster screens intentionally responsive.
5. Add browser-level checks and accessibility regression coverage before claiming production readiness.


## Assessment register mobile presentation — 2026-10-18

The assessment register now has a purpose-built card layout at widths up to `760px`; the wide six-column table remains the desktop presentation. Cards retain subject, date, maximum marks, scope, active state, and the same permission-gated actions. This was reviewed statically only; no browser screenshots or viewport tests were run, so overflow-free behavior at 320px is not yet verified.

## Follow-up connectivity feedback — 2026-10-18

- Added `frontend/src/app/NetworkStatusIndicator.tsx` to report browser connectivity using `navigator.onLine` and online/offline events.
- The indicator is available across authenticated routes. When offline, it warns that unsaved edits are not durably persisted and that a restored browser connection does not prove the API is reachable.
- This does not replace offline persistence, API health checks, or synchronization. No service worker, IndexedDB implementation, or pending-operation queue was found in the active frontend source.
- Keyboard/focus, viewport, browser, and accessibility regression tests remain pending; this is a static implementation review only.

## Changes made in the current working copy

- Organization selection consumers now use the shared typed store instead of independently reading the storage key.
- Active native browser `alert`/`confirm` calls found in Leave, Attendance, Homework, Certificates, Inventory, and Hostel were replaced with SweetAlert2 dialogs. The stylesheet is imported globally so the dialogs remain styled when a feature is loaded directly.
- The Vite proxy now reads `VITE_BACKEND_TARGET` from the environment with the existing localhost URL as fallback.

These changes have passed TypeScript syntax transpilation only. Responsive visual checks, keyboard/focus testing, full TypeScript checking, linting, and browser-level regression testing remain pending because package installation could not complete in the current environment.

## Focused accessibility and recovery fixes — 2026-10-19

- Timetable tabs now expose a single linked tabpanel, implement the roving tab stop, and support Arrow Left/Right plus Home/End navigation. Keyboard behavior has a focused Vitest regression test; it has not been executed in this environment.
- Assessment Management no longer reports an empty register after a failed initial load, preserves the last successful page on a failed refresh, and clears records immediately when institution scope changes.
- User Management ignores stale directory responses from older search/filter requests and preserves the last successful page on refresh failure. Initial failures display a load-error state rather than “No accounts found.”
- Timetable's dashboard retry now covers the organization, academic hierarchy, campus, and timetable queries; campus lookup errors are surfaced.
- Responsive table wrappers and existing narrow-screen layouts were retained. No browser viewport or screen-reader test is claimed; visual verification still requires a browser run.
- Offline state remains intentionally honest: connectivity is reported, but unsaved edits are not durably persisted and writes are not automatically replayed.

- Attendance's top-level query retry now re-fetches failed queries in place instead of reloading the browser page, reducing the risk of losing in-memory drafts during recovery.
