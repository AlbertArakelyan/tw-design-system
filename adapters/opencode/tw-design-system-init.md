---
description: Set up the Tailwind design system and component conventions in this React/Next.js project
---

# tw-design-system init

Run this in the project root and read its JSON output:

```
node "{{PLUGIN_ROOT}}/scripts/setup.mjs" --agent opencode "$ARGUMENTS"
```

`$ARGUMENTS` may hold a primary color (`#0b44ae`), `--force` and `--dry-run`.

Then:

1. If `ok` is false, explain the error briefly and stop.
2. Report what was written and skipped: main CSS wiring, `base.css`, the tailwind config, the
   skills in `.agents/skills/`, and the block in `AGENTS.md`.
3. If a color was given, show the step it landed on, hover/active, accent, status colors and the
   contrast checks; flag anything under 4.5:1. Without a color, say the token blocks are empty and
   re-running with a color and `--force` fills them.
4. For skipped files, say why and ask before re-running with `--force`. A config in another format
   is never touched; offer to merge `{{PLUGIN_ROOT}}/templates/tailwind.config.tmpl` by hand.
5. Read the main CSS once and confirm `@import "./base.css";` is above the Tailwind import and the
   `@config` path (Tailwind v4) points at the config.

Don't commit anything.
