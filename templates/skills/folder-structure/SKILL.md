---
name: folder-structure
description: Use when deciding where a new file goes (component, hook, util, constant, context, type, style) or when reorganizing folders in this React/Next.js project. Gives the folder map, the nesting limit, where types.ts files go, the index.ts-with-code vs barrel rule and the routes-directory trap.
---

# Folder structure

## Map

```
{{SRC_LABEL}}
├── {{ROUTES_DIR}}                    routes only (see "Routes" below)
├── components/
│   ├── UI/
│   │   └── Button/
│   │       ├── Button.tsx            generic primitive
│   │       └── types.ts
│   ├── Layout/Layout.tsx             shared, no types, so a single file in its folder
│   ├── Header/
│   │   ├── Header.tsx                shared by every page
│   │   ├── types.ts                  types for Header and its parts
│   │   └── MobileMenu/MobileMenu.tsx private part, imports "../types"
│   └── pages/
│       └── Home/
│           ├── Hero/
│           │   ├── Hero.tsx          page-specific section
│           │   ├── types.ts
│           │   └── HeroIllustration/HeroIllustration.tsx   deepest level
│           └── About/About.tsx
├── contexts/ThemeProvider.tsx        React context + useThemeContext()
├── hooks/
│   └── useScrollProgress/
│       ├── index.ts                  the hook itself (real code, not a barrel)
│       └── types.ts
├── utils/<topic>/index.ts            pure helpers
├── constants/<topic>.ts              static data, config, navigation lists
├── types/<topic>.ts                  global types only
└── <css folder>/                     {{MAIN_CSS}} + base.css
```

## Routes

{{ROUTING_RULE}}

## Rules

- **One folder per component**, file name = folder name = component name: `Hero/Hero.tsx`, never
  `Hero/index.tsx`.
- **Nesting limit**: `components/pages/<Page>/<Section>/<Part>/`, four levels under `components/`.
  Shared components allow one level of private parts: `components/<Shared>/<Part>/`. A part that
  needs parts of its own is promoted: to its own section, or to a shared component.
- **Promote, don't reach across**: a component needed by a second page moves to
  `components/<Name>/`. Never import from `components/pages/<OtherPage>/`.
- **types.ts placement**: next to the code that uses it. A folder of related components shares
  one `types.ts` at the folder level. `types/` at the root is for types used across unrelated
  features (navigation items, API envelopes). A component typed only with `PropsWithChildren`
  needs no `types.ts`.
- **Hooks**: `hooks/use<Name>/index.ts`, options/return types in `hooks/use<Name>/types.ts`.
- **Contexts**: `contexts/<Name>Provider.tsx` exporting the provider (default) and a
  `use<Name>Context()` hook that throws outside the provider. Use one instead of prop drilling.
- **Constants and data**: `constants/<topic>.ts`. Data arrays carry stable ids.
- **Styles**: `{{MAIN_CSS}}` plus `{{BASE_CSS}}`; no other global CSS files, no CSS modules for
  components.

## Barrels

Never add an `index.ts` that only re-exports its neighbours (`components/index.ts`,
`components/UI/Button/index.ts`). Import from the defining file:
`import Button from "@/components/UI/Button/Button";`.

An `index.ts` that contains the actual implementation (hooks, utils, some constants) is fine. The
test: if deleting the file would only break import paths, it was a barrel.

## When moving files

Update every import, run lint and type-check, and grep for the old path before reporting.
