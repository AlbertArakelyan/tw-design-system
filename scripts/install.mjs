#!/usr/bin/env node
// Installs the entry point for agents that don't load Claude Code plugins.
//
// node scripts/install.mjs --target codex      -> ~/.agents/skills/tw-design-system-init/SKILL.md
// node scripts/install.mjs --target opencode   -> ~/.config/opencode/commands/tw-design-system-init.md

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = {
  codex: {
    source: "adapters/codex/tw-design-system-init/SKILL.md",
    destination: path.join(os.homedir(), ".agents", "skills", "tw-design-system-init", "SKILL.md"),
    usage: 'In Codex, ask "set up tw-design-system with #0b44ae" or pick the skill from /skills.',
  },
  opencode: {
    source: "adapters/opencode/tw-design-system-init.md",
    destination: path.join(os.homedir(), ".config", "opencode", "commands", "tw-design-system-init.md"),
    usage: "In OpenCode, run /tw-design-system-init #0b44ae",
  },
};

const targetIndex = process.argv.indexOf("--target");
const target = TARGETS[process.argv[targetIndex + 1]];

if (targetIndex === -1 || !target) {
  console.error(`Usage: node scripts/install.mjs --target ${Object.keys(TARGETS).join("|")}`);
  process.exit(1);
}

const content = fs
  .readFileSync(path.join(PLUGIN_ROOT, target.source), "utf8")
  .replaceAll("{{PLUGIN_ROOT}}", PLUGIN_ROOT);

fs.mkdirSync(path.dirname(target.destination), { recursive: true });
fs.writeFileSync(target.destination, content);

console.log(`Installed ${target.destination}`);
console.log(target.usage);
