# tw-design-system

This repository is a plugin, not an app. If a user asks you to apply it to their project, run:

```
node <path to this folder>/scripts/setup.mjs --agent <claude|codex|opencode> [--color "#hex"] [--dry-run] [--force]
```

from their project root (or pass `--cwd`). The script prints JSON describing what it wrote and
skipped; relay it, flag contrast checks under 4.5:1, and ask before using `--force`.

Working on the plugin itself:

- All file writes live in `scripts/setup.mjs`; palette math lives in `scripts/lib/color.mjs`.
- Templates in `templates/` use `{{PLACEHOLDER}}` values filled by `setup.mjs` (`SRC`, `SRC_LABEL`,
  `MAIN_CSS`, `BASE_CSS`, `CONFIG_FILE`, `ROUTES_DIR`, `ROUTING_RULE`, `TAILWIND_WIRING`,
  `SKILLS_DIR`). Add new ones in `main()` in `setup.mjs`.
- `commands/init.md` (Claude Code) and the two files in `adapters/` say the same thing; keep them
  in sync.
- No dependencies. Node 18+ built-ins only.
- Test against scratch fixtures, never against a real project's working tree.
