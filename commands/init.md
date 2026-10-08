---
description: Set up the Tailwind design system and component conventions in this React/Next.js project
argument-hint: "[primary color hex, e.g. #0b44ae] [--force] [--dry-run]"
allowed-tools: ["Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs:*)", "Read", "Edit", "Glob", "Grep"]
---

# tw-design-system init

Run the setup script in the current project. It is deterministic and does all file writes:

```!
node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" --agent claude "$ARGUMENTS"
```

The JSON above is the result. Then:

1. **If `ok` is false**, explain the error in one or two sentences and stop. Don't install
   packages or create the project for the user unless they ask.
2. **Report** what was written and what was skipped, in plain words: the main CSS file and how it
   was wired, `base.css`, the tailwind config, the skills folder, and the `CLAUDE.md` block.
3. **Palette**: if a color was given, show the primary scale step it landed on, hover/active, the
   accent and status colors, and every contrast check. Call out any check under 4.5:1 and suggest
   the fix (for a light primary: dark text on primary buttons, or a darker primary).
   If no color was given, say the token blocks are empty and that running the command again with
   a color (plus `--force`) fills them.
4. **Skipped files**: for each one, say why. If an existing `base.css` or `tailwind.config.js` was
   kept, ask before re-running with `--force`, since it overwrites them. An existing config in
   another format (`.ts`, `.mjs`, `.cjs`) is never touched: offer to merge the token mapping from
   `${CLAUDE_PLUGIN_ROOT}/templates/tailwind.config.tmpl` into it by hand.
5. **Sanity pass**: read the main CSS file once and check `@import "./base.css";` sits above the
   Tailwind import and the `@config` path (Tailwind v4) resolves to the config file. Fix only
   real mismatches.

Don't commit anything.
