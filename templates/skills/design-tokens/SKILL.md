---
name: design-tokens
description: Use when a component needs a colour that has no utility yet, when adding or renaming a design token, when filling in dark mode, or when the brand/primary colour changes. Covers the two-edit rule ({{BASE_CSS}} + {{CONFIG_FILE}}), the three blocks of base.css, naming, derived states with color-mix, and regenerating the palette.
---

# Design tokens

Colours live in CSS variables in `{{BASE_CSS}}` and are exposed as Tailwind utilities by
`{{CONFIG_FILE}}`. Components only ever use the utilities (`bg-primary`, `text-muted-text`), never
hex values or Tailwind's default palette.

## How it is wired

{{TAILWIND_WIRING}}

`{{BASE_CSS}}`:

```css
:root {
  /* 1. raw values */
  --primary: #...;            /* equals one of the steps below */
  --primary-50: #...; ... --primary-900: #...;
  --accent: #...;
  --success: #...; --warning: #...; --danger: #...; --info: #...;
  --background-light: #...; --surface-light: #...; --text-light: #...;
  --muted-light: #...; --border-light: #...;
}

:root {
  /* 2. semantic names, what components use */
  --background: var(--background-light);
  --surface: var(--surface-light);
  --text-color: var(--text-light);
  --muted-text: var(--muted-light);
  --border-color: var(--border-light);
  --primary-hover: var(--primary-800);
  --primary-active: var(--primary-900);
  --primary-focus: color-mix(in srgb, var(--primary) 40%, transparent);
  --danger-bg: color-mix(in srgb, var(--danger) 12%, white);
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* 3. dark remaps */
  }
}
```

## Adding a token: two edits, always

1. Add the variable to `{{BASE_CSS}}`. A raw colour goes in block 1. A role (what it is *for*) goes
   in block 2, pointing at a raw value or a `color-mix(...)` of one.
2. Map it in `{{CONFIG_FILE}}` under `theme.extend.colors`:

   ```js
   highlight: {
     DEFAULT: 'var(--highlight)',
     hover: 'var(--highlight-hover)',
   },
   ```

Miss either edit and the class silently generates nothing. After adding, use the class once and
confirm it appears in the built CSS (or in dev tools).

Naming: name by role, not by look (`--surface`, `--muted-text`, `--danger-bg`, not `--light-gray`).
A component-specific shade that is a simple mix can stay inline as an arbitrary value with tokens:
`shadow-[0_12px_32px_-16px_color-mix(in_srgb,var(--primary)_18%,transparent)]`.

## Derived states

- hover/active: a darker step of the scale (`var(--primary-800)`) or
  `color-mix(in srgb, var(--x) 85%, black)`.
- focus ring: `color-mix(in srgb, var(--x) 40%, transparent)`.
- soft backgrounds: `color-mix(in srgb, var(--x) 12%, white)`.
- Tailwind opacity modifiers work on token colours: `bg-primary/10`, `border-white/20`.

## Dark mode

Block 3 starts empty. To add dark mode:

1. Add `*-dark` raw values in block 1 (`--background-dark`, `--surface-dark`, `--text-dark`, ...).
2. Inside the `@media (prefers-color-scheme: dark)` block, remap every semantic name from block 2
   (`--background: var(--background-dark);`). Hover/active usually flip to lighter steps
   (`--primary-hover: var(--primary-400);`), `*-bg` tints mix with black instead of white.
3. If the site needs a manual toggle, duplicate the remaps under `:root[data-theme="dark"]` and
   guard the media block with `:root:not([data-theme="light"])`.

Components need no changes, which is the point of using semantic tokens only.

## Changing the brand colour

Re-run the plugin's setup with the new colour and `--force`, which regenerates `{{BASE_CSS}}` and
`{{CONFIG_FILE}}` (back up any hand-added tokens first, then re-add them):

```
node <tw-design-system>/scripts/setup.mjs --color "#0b44ae" --force
```

The generator builds the 50-900 scale in OKLCH with the given colour placed exactly on its nearest
step, picks hover/active from the next darker steps, derives a harmonious accent, keeps status
colours on their natural hues but nudged toward the primary, and tints neutrals with the primary
hue. It also reports contrast; fix anything under 4.5:1 before shipping (a light primary usually
needs dark text on buttons).
