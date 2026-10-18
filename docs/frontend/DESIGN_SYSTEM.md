# Dolphin Design System

## Current approach

Dolphin currently uses global CSS tokens in `src/index.css` and feature-specific CSS files. Retain this approach until an actual need justifies a styling-system migration; do not mix Tailwind, CSS Modules, and ad hoc inline styling without a migration plan.

## Existing global tokens

| Token | Current value | Intended use |
|---|---|---|
| `--color-text-primary` | `#172033` | Primary text |
| `--color-text-secondary` | `#667085` | Supporting text |
| `--color-surface` | `#ffffff` | Cards and panels |
| `--color-border` | `#e4e7ec` | Dividers and control borders |
| `--color-primary` | `#3157d5` | Primary actions and focus |
| `--color-background` | `#f7f8fa` | App background |
| `--color-primary-soft` | `#eef2ff` | Subtle primary surfaces |
| `--color-danger` | `#b42318` | Destructive/error states |
| `--radius-sm/md/lg` | `6/10/14px` | Control/card radii |
| `--shadow-sm/md` | subtle / medium | Elevation |

## Component rules

- Use consistent button variants for primary, secondary, destructive, and quiet actions.
- Forms need persistent labels, inline validation, pending/disabled states, and an announced error summary when useful.
- Dialogs must have an accessible name, focus management, keyboard dismissal where safe, and an explicit destructive action label.
- Loading states should preserve layout and use concise status text or skeletons when appropriate.
- Empty states explain why there is no data and provide a valid next action where possible.
- Errors should identify what failed and offer retry when retry is safe.
- Use Lucide icons already present in the dependency tree; icons must not replace accessible text for important actions.

## Responsive behavior

The global stylesheet sets a 320px minimum viewport width and a visible `:focus-visible` ring. Every page still requires its own responsive audit. Test at 320, 375, 390, 430, 768, 1024, 1280, and 1440px. Data-heavy screens should switch to a mobile-appropriate card/list layout or a deliberately contained table region rather than causing whole-page horizontal overflow.

## Accessibility

- Maintain semantic headings and landmarks.
- Ensure controls have accessible names and validation messages are associated with fields.
- Preserve keyboard operation and visible focus.
- Do not use color as the only status indicator.
- Respect reduced-motion preferences for transitions.
- Keep touch targets comfortably usable on small screens.

## Known gaps

The source audit identified inconsistent page styling, multiple custom form/table implementations, native `window.alert()`/`window.confirm()` calls, and unverified viewport behavior across all modules. These should be addressed incrementally after each feature's current workflow is mapped and tested.
