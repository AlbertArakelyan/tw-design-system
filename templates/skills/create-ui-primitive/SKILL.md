---
name: create-ui-primitive
description: Use when the user asks for a new generic, reusable UI component (button, input, modal, select, textarea, toggle, dropdown, card, badge, tooltip, etc.), or when markup you are about to write has a reusable UI sense. Scaffolds {{SRC}}components/UI/<Name>/ with <Name>.tsx + types.ts, native-attribute props, PropsWithChildren<...> wrapping, no FC, no barrel, useMemo variant maps and design tokens.
---

# Create a UI primitive

UI primitives live in `{{SRC}}components/UI/<Name>/` and all share one shape, so they compose
predictably. The rules are in the "UI components" section of the project's agent instructions
file; this is the procedure.

## 0. Check scope first

- Look in `{{SRC}}components/UI/` for something that already does the job. Extend it (a new variant,
  a new `*ClassName` prop) before creating a sibling.
- A one-off styled element used in a single place is **not** a primitive. Write it inline in the
  feature component.
- Decide, and ask the user only if it is unclear:
  - Name (PascalCase).
  - The native element it renders (`<button>`, `<input>`, `<a>`/framework `Link`, `<dialog>`, `<div>`...).
  - Variant unions (size, variant, rounded, align...) and their default values.
  - Extra props beyond the native attributes (`isLoading`, `icon`, `label`, `error`...).
  - Whether it renders `children`.

## 1. Read what exists

Open one or two existing primitives in `{{SRC}}components/UI/` and match them exactly: import
order, class string style, focus ring, token usage. Consistency beats taste.

## 2. Files

```
{{SRC}}components/UI/<Name>/
├── <Name>.tsx     component, default export
└── types.ts       I<Name>Props + <Name><Aspect>Type unions
```

No `index.ts`. Consumers import `@/components/UI/<Name>/<Name>` and `@/components/UI/<Name>/types`.

**Exception:** if the only type the component needs is `PropsWithChildren` (no variants, no extra
props, no native attributes to forward), skip `types.ts` and type the parameter inline:

```tsx
import { PropsWithChildren } from "react";

const Container = ({ children }: PropsWithChildren) => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
);

export default Container;
```

## 3. `types.ts`

Props extend the root element's native attributes. When the component renders children, the
native attributes go **inside** `PropsWithChildren<...>`; never list `PropsWithChildren` next to
them.

```ts
import { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export type ButtonSizeType = "sm" | "md" | "lg";
export type ButtonVariantType = "primary" | "outline" | "ghost";
export type ButtonRoundedType = "default" | "full";

export interface IButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  size?: ButtonSizeType;
  variant?: ButtonVariantType;
  rounded?: ButtonRoundedType;
  icon?: ReactNode;
  isLoading?: boolean;
  contentClassName?: string;
}
```

No children (e.g. an input): extend the attributes directly, no `PropsWithChildren`.

```ts
export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  wrapperClassName?: string;
  labelClassName?: string;
}
```

Native attribute types by element: `ButtonHTMLAttributes<HTMLButtonElement>`,
`InputHTMLAttributes<HTMLInputElement>`, `TextareaHTMLAttributes<HTMLTextAreaElement>`,
`SelectHTMLAttributes<HTMLSelectElement>`, `AnchorHTMLAttributes<HTMLAnchorElement>`,
`HTMLAttributes<HTMLDivElement>`, `DialogHTMLAttributes<HTMLDialogElement>`, a framework link
`ComponentProps<typeof Link>`. A type alias is fine when nothing is added:
`export type ICardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;`

## 4. `<Name>.tsx`

```tsx
import { useMemo } from "react";

import { ButtonRoundedType, ButtonSizeType, ButtonVariantType, IButtonProps } from "./types";

const Button = ({
  children,
  size = "md",
  variant = "primary",
  rounded = "default",
  icon,
  isLoading = false,
  contentClassName = "",
  className = "",
  disabled,
  type = "button",
  ...props
}: IButtonProps) => {
  const sizeClassName = useMemo(() => {
    const sizeMapping: Record<ButtonSizeType, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return sizeMapping[size] || sizeMapping.md;
  }, [size]);

  const variantClassName = useMemo(() => {
    const variantMapping: Record<ButtonVariantType, string> = {
      primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
      outline: "border border-primary text-primary hover:bg-primary-50 active:bg-primary-100",
      ghost: "text-primary hover:bg-primary-50 active:bg-primary-100",
    };

    return variantMapping[variant] || variantMapping.primary;
  }, [variant]);

  const roundedClassName = useMemo(() => {
    const roundedMapping: Record<ButtonRoundedType, string> = {
      default: "rounded-lg",
      full: "rounded-full",
    };

    return roundedMapping[rounded] || roundedMapping.default;
  }, [rounded]);

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-focus disabled:cursor-not-allowed disabled:opacity-50 ${sizeClassName} ${variantClassName} ${roundedClassName} ${className}`}
      {...props}
    >
      {icon}
      <span className={contentClassName}>{children}</span>
    </button>
  );
};

export default Button;
```

Rules this template follows, keep them:

- **No `FC`.** Props are typed on the destructured parameter.
- Defaults live in the destructuring, never `defaultProps`.
- Every variant union maps through a `Record<UnionType, string>` inside `useMemo`, with a fallback
  to the default value.
- `{...props}` goes on the root element, or on the most important element when the root is a
  wrapper (an `Input` spreads onto the `<input>`, not its wrapper `<div>`). `className` goes where
  `{...props}` goes.
- One `*ClassName` prop per meaningful inner element (`wrapperClassName`, `labelClassName`,
  `iconClassName`, `menuClassName`), named by role.
- Colours come from tokens only (`bg-primary`, `text-muted-text`, `border-border-color`,
  `ring-primary-focus`). No hex, no `blue-600`. Missing a colour? Use the `design-tokens` skill.
- Interactive elements get a visible `focus-visible` ring and real semantics (`<button type>`,
  `aria-expanded`/`aria-controls` for disclosures, `aria-current` for current items).
- Any user-facing default text (an aria-label, a "Close" label) follows the project's text rules;
  if the project has an i18n layer, it goes through it.

## 5. Verify

- Run the project's lint and type-check (`yarn lint` / `npm run lint`, `tsc --noEmit`).
- If you rendered it somewhere, check it in the running app, or say you could not.

## 6. Report

Files created, the variant unions and defaults, and where it is used.

## Don't

- Don't add `index.ts` re-exports.
- Don't write `extends PropsWithChildren, SomeHTMLAttributes<...>`.
- Don't use `FC` / `React.FC`.
- Don't declare types inside the `.tsx` file.
- Don't add `forwardRef` unless a consumer needs the ref (React 19 passes `ref` as a prop anyway).
- Don't pull in a UI library (MUI, Chakra, daisyUI, shadcn copies) for something this folder can hold.
