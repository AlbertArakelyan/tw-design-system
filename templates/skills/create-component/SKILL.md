---
name: create-component
description: Use when adding any non-primitive React component, such as a page section, a page-specific part, a shared piece like a header, footer, layout or card list, or a sub-part of an existing component. Decides where it goes ({{SRC}}components/pages/<Page>/..., {{SRC}}components/<Shared>/..., or nested inside a parent), whether it needs a types.ts, and how it consumes UI primitives and tokens.
---

# Create a component

For generic reusable primitives (button, input, modal...) use `create-ui-primitive` instead.
This skill covers everything else.

## 1. Decide where it lives

| It is... | Location |
| --- | --- |
| Used by one page only (a section, a block) | `{{SRC}}components/pages/<Page>/<Name>/<Name>.tsx` |
| A part used by only one parent | inside the parent: `<Parent>/<Name>/<Name>.tsx` |
| Used by two or more pages (header, footer, layout, a card used in several places) | `{{SRC}}components/<Name>/<Name>.tsx` |
| A generic presentational primitive | `{{SRC}}components/UI/<Name>/` via `create-ui-primitive` |

Routing: {{ROUTING_RULE}}

Depth: at most `components/pages/<Page>/<Section>/<Part>/`. If a part needs its own parts, it is a
section or a shared component; move it up. See `folder-structure` for the full map.

When a page-specific component starts being used by a second page, move it to
`{{SRC}}components/<Name>/` and update the imports. Don't import across `pages/<OtherPage>/`.

## 2. Decide on `types.ts`

- The component declares any type (props interface, union, data item shape): it gets a
  `types.ts` and imports from it. **Never declare types inside the `.tsx`.**
- Several sibling components in one folder share types: one `types.ts` at that folder's level,
  e.g. `{{SRC}}components/Header/types.ts` used by `Header/MobileMenu/MobileMenu.tsx` and
  `Header/LanguageSwitcher/LanguageSwitcher.tsx` (imported as `../types`).
- No props and no types: no `types.ts`.
- Only `children`: `({ children }: PropsWithChildren)` inline, no `types.ts`.
- Global, cross-feature types only (e.g. a navigation item shape used by header and footer):
  `{{SRC}}types/<topic>.ts`.

Naming: `I<Name>Props`, `<Name><Aspect>Type` for unions, `I<Thing>` for data shapes.

Props for non-primitives follow the same idea as primitives when they render a meaningful root:
extend its attributes (inside `PropsWithChildren<...>` when it takes children), spread `...props`
onto it, accept `className`.

```ts
// {{SRC}}components/Header/types.ts
import { HTMLAttributes } from "react";

export interface IMobileMenuProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
}
```

## 3. Write it

```tsx
// {{SRC}}components/pages/Home/Features/Features.tsx
import Card from "@/components/UI/Card/Card";

import { IFeature } from "./types";

const features: IFeature[] = [
  { id: "fast", title: "...", description: "..." },
  { id: "simple", title: "...", description: "..." },
];

const Features = () => (
  <section id="features" className="bg-surface py-20 lg:py-28">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">...</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.id}>...</Card>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
```

- Default export, PascalCase, file name = folder name = component name. No `FC`.
- Reuse primitives from `{{SRC}}components/UI/`. If you are about to style a button, input or card
  by hand, use or create the primitive instead.
- Static lists are typed data arrays with a stable `id` used as `key`, never the index or a label.
- Colours from tokens only. Decorative elements get `aria-hidden="true"`.
- Motion goes behind `motion-safe:` so reduced-motion users get a still page.
- Page sections don't fetch data. Pass data in or read it from a context/service.
- Import order: framework/external, components (UI, then local), data/dictionaries, hooks, utils,
  constants, types.
- If the project has an i18n layer, every visible string goes through it.

## 4. Wire it in

Add it to its parent or page. Don't reorder existing sections without asking.

## 5. Verify and report

Lint and type-check, check it renders, then report the files created and where it is used.

## Don't

- Don't put components, types or helpers under the routes directory.
- Don't create `index.ts` re-exports.
- Don't nest deeper than `pages/<Page>/<Section>/<Part>/`.
- Don't declare types in the component file.
