# tw-design-system

Sets up a token-based Tailwind design system and a set of component conventions in a React or
Next.js project that already uses Tailwind. Works from Claude Code, Codex and OpenCode.

One command adds:

- `base.css` next to your main CSS file, with three blocks: raw values, semantic names, and an
  empty dark-mode block.
- `tailwind.config.js` mapping every token to utilities (`bg-primary`, `hover:bg-primary-hover`,
  `ring-primary-focus`, `text-muted-text`, `border-border-color`, ...).
- The wiring in your main CSS: `@import "./base.css";` above the Tailwind import, plus
  `@config` on Tailwind v4.
- Four project skills: `create-ui-primitive`, `create-component`, `folder-structure`,
  `design-tokens`.
- A conventions block in `CLAUDE.md` (Claude Code) or `AGENTS.md` (Codex, OpenCode): UI primitive
  shape, `types.ts` placement, folder nesting, no barrel files, token rules, writing style.

Pass a primary color and the token blocks are filled: a 50 to 900 scale built around your color,
hover/active/focus states, an accent that fits it, status colors nudged toward it, and tinted
neutrals, with a contrast report. Without a color the blocks are created empty.

## Requirements

- Node 18 or newer.
- A project whose `package.json` depends on `react` and `tailwindcss` (v3 or v4).

## Install

### Claude Code

```
/plugin marketplace add /path/to/tw-design-system
/plugin install tw-design-system@tw-design-system
```

Or load it for one session: `claude --plugin-dir /path/to/tw-design-system`.

### Codex

```
node /path/to/tw-design-system/scripts/install.mjs --target codex
```

This writes a `tw-design-system-init` skill to `~/.agents/skills/`.

### OpenCode

```
node /path/to/tw-design-system/scripts/install.mjs --target opencode
```

This writes `/tw-design-system-init` to `~/.config/opencode/commands/`.

## Use

| Agent | Command |
| --- | --- |
| Claude Code | `/tw-design-system:init #0b44ae` |
| OpenCode | `/tw-design-system-init #0b44ae` |
| Codex | "set up tw-design-system with #0b44ae" |

The color is optional. Add `--dry-run` to see what would change, `--force` to overwrite an
existing `base.css`, `tailwind.config.js` or skill.

Without an agent:

```
node /path/to/tw-design-system/scripts/setup.mjs --color "#0b44ae" --agent claude --cwd /path/to/project
```

`--agent` decides where the conventions and skills go: `claude` writes `CLAUDE.md` and
`.claude/skills/`, `codex` and `opencode` write `AGENTS.md` and `.agents/skills/`.

## What it never does

- Install packages or create a project.
- Overwrite `base.css`, the tailwind config or an existing skill without `--force`.
- Touch a `tailwind.config.ts`, `.mjs` or `.cjs`. It reports it and leaves the merge to you.
- Edit text in `CLAUDE.md` or `AGENTS.md` outside its
  `<!-- tw-design-system:start -->` / `<!-- tw-design-system:end -->` markers. Running it again
  replaces only that block.
- Commit.

## Layout

```
.claude-plugin/        plugin.json and a local marketplace.json
commands/init.md       the Claude Code command
adapters/              Codex skill and OpenCode command, installed by scripts/install.mjs
scripts/setup.mjs      all detection and file writes
scripts/lib/color.mjs  OKLCH palette generation and contrast checks
templates/             base.css, tailwind config, conventions block, skills
```
