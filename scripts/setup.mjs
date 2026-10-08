#!/usr/bin/env node
// Sets up the design system in a React/Next.js + Tailwind project: base.css with
// token blocks, a tailwind config mapping them, the main CSS wiring, project
// skills and the conventions block in CLAUDE.md or AGENTS.md.
//
// node scripts/setup.mjs [--color <hex>] [--agent claude|codex|opencode]
//                        [--cwd <dir>] [--dry-run] [--force]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generatePalette } from "./lib/color.mjs";

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = path.join(PLUGIN_ROOT, "templates");

const MARKER_START = "<!-- tw-design-system:start -->";
const MARKER_END = "<!-- tw-design-system:end -->";

const AGENTS = {
  claude: { instructions: "CLAUDE.md", skills: ".claude/skills" },
  codex: { instructions: "AGENTS.md", skills: ".agents/skills" },
  opencode: { instructions: "AGENTS.md", skills: ".agents/skills" },
};

const CSS_CANDIDATES = [
  "src/app/globals.css",
  "app/globals.css",
  "src/styles/globals.css",
  "styles/globals.css",
  "src/index.css",
  "src/main.css",
  "src/App.css",
  "index.css",
];

const CONFIG_NAMES = ["tailwind.config.js", "tailwind.config.cjs", "tailwind.config.mjs", "tailwind.config.ts"];

const fail = (message) => {
  console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
};

const parseArgs = (argv) => {
  const args = { agent: "claude", cwd: process.cwd(), dryRun: false, force: false, color: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--color") args.color = argv[++index];
    else if (arg === "--agent") args.agent = argv[++index];
    else if (arg === "--cwd") args.cwd = path.resolve(argv[++index]);
    else if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(arg)) args.color = arg;
    else if (arg.trim()) fail(`Unknown argument "${arg}".`);
  }

  if (!AGENTS[args.agent]) {
    fail(`--agent must be one of: ${Object.keys(AGENTS).join(", ")}.`);
  }

  return args;
};

const toPosix = (value) => value.split(path.sep).join("/");

const exists = (cwd, relative) => fs.existsSync(path.join(cwd, relative));

const read = (file) => fs.readFileSync(file, "utf8");

const fill = (template, values) =>
  template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in values ? values[key] : match));

const detect = (cwd) => {
  const packagePath = path.join(cwd, "package.json");

  if (!fs.existsSync(packagePath)) {
    fail(`No package.json in ${cwd}. Run this from the project root or pass --cwd.`);
  }

  const pkg = JSON.parse(read(packagePath));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (!deps.react) {
    fail("This project does not depend on react. tw-design-system is for React/Next.js projects.");
  }

  if (!deps.tailwindcss) {
    fail("This project does not depend on tailwindcss. Install Tailwind first, then run this again.");
  }

  const tailwindMajor = Number(String(deps.tailwindcss).match(/\d+/)?.[0] ?? 4);
  const hasSrc = exists(cwd, "src");
  const src = hasSrc ? "src/" : "";

  let framework = "react";
  let routesDir = `${src}pages/`;

  if (deps.next) {
    const appDir = ["src/app", "app"].find((dir) => exists(cwd, dir));
    const pagesDir = ["src/pages", "pages"].find((dir) => exists(cwd, dir));

    if (appDir) {
      framework = "next-app";
      routesDir = `${appDir}/`;
    } else {
      framework = "next-pages";
      routesDir = `${pagesDir ?? `${src}pages`}/`;
    }
  }

  let mainCss = CSS_CANDIDATES.find((candidate) => exists(cwd, candidate));

  if (!mainCss) {
    mainCss = findCssWithTailwind(cwd);
  }

  const existingConfig = CONFIG_NAMES.find((name) => exists(cwd, name));

  return {
    pkg,
    framework,
    tailwindMajor,
    src,
    routesDir,
    mainCss,
    existingConfig,
    isModule: pkg.type === "module",
  };
};

const findCssWithTailwind = (cwd) => {
  const skip = new Set(["node_modules", ".next", "dist", "build", "out", ".git"]);
  const stack = [cwd];

  while (stack.length) {
    const dir = stack.pop();

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;

      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name.endsWith(".css")) {
        const content = read(full);

        if (/@import\s+["']tailwindcss["']|@tailwind\s+base/.test(content)) {
          return toPosix(path.relative(cwd, full));
        }
      }
    }
  }

  return null;
};

const buildBaseCss = (palette) => {
  const template = read(path.join(TEMPLATES, "base.css.tmpl"));

  if (!palette) {
    return fill(template, { RAW: "", SEMANTIC: "" });
  }

  const steps = Object.entries(palette.primary)
    .map(([step, hex]) => `  --primary-${step}: ${hex};`)
    .join("\n");

  const raw = [
    `  --primary: ${palette.base};`,
    "",
    steps,
    "",
    `  --accent: ${palette.accent};`,
    "",
    `  --success: ${palette.status.success};`,
    `  --warning: ${palette.status.warning};`,
    `  --danger: ${palette.status.danger};`,
    `  --info: ${palette.status.info};`,
    "",
    `  --background-light: ${palette.neutrals.background};`,
    `  --surface-light: ${palette.neutrals.surface};`,
    `  --text-light: ${palette.neutrals.text};`,
    `  --muted-light: ${palette.neutrals.muted};`,
    `  --border-light: ${palette.neutrals.border};`,
  ].join("\n");

  const semantic = [
    "  --background: var(--background-light);",
    "  --surface: var(--surface-light);",
    "  --text-color: var(--text-light);",
    "  --muted-text: var(--muted-light);",
    "  --border-color: var(--border-light);",
    "",
    `  --primary-hover: var(--primary-${palette.hoverStep});`,
    `  --primary-active: var(--primary-${palette.activeStep});`,
    "  --primary-focus: color-mix(in srgb, var(--primary) 40%, transparent);",
    "",
    "  --accent-hover: color-mix(in srgb, var(--accent) 85%, black);",
    "  --accent-bg: color-mix(in srgb, var(--accent) 12%, white);",
    "",
    "  --danger-hover: color-mix(in srgb, var(--danger) 85%, black);",
    "  --danger-active: color-mix(in srgb, var(--danger) 70%, black);",
    "",
    "  --success-bg: color-mix(in srgb, var(--success) 12%, white);",
    "  --warning-bg: color-mix(in srgb, var(--warning) 12%, white);",
    "  --danger-bg: color-mix(in srgb, var(--danger) 12%, white);",
    "  --info-bg: color-mix(in srgb, var(--info) 12%, white);",
  ].join("\n");

  return fill(template, { RAW: `${raw}\n`, SEMANTIC: `${semantic}\n` });
};

const buildConfig = (info) => {
  const contentDirs = info.src
    ? ["./src/**/*.{js,ts,jsx,tsx,mdx}"]
    : ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"];

  const body = fill(read(path.join(TEMPLATES, "tailwind.config.tmpl")), {
    CONTENT: contentDirs.map((dir) => `    '${dir}',`).join("\n"),
  });

  return info.isModule ? `export default ${body}` : `module.exports = ${body}`;
};

// Returns the updated main CSS, or null when nothing needs to change.
const wireMainCss = (css, info, configFile) => {
  let next = css;
  const cssDir = path.posix.dirname(info.mainCss);
  const baseImport = '@import "./base.css";';

  if (!/@import\s+["']\.\/base\.css["']/.test(next)) {
    const tailwindImport = next.match(/^.*@import\s+["']tailwindcss["'].*$/m);

    next = tailwindImport
      ? next.replace(tailwindImport[0], `${baseImport}\n${tailwindImport[0]}`)
      : `${baseImport}\n${next}`;
  }

  if (info.tailwindMajor >= 4 && !/@config\s+/.test(next)) {
    let relativeConfig = path.posix.relative(cssDir === "." ? "" : cssDir, configFile);

    if (!relativeConfig.startsWith(".")) relativeConfig = `./${relativeConfig}`;

    const configLine = `@config "${relativeConfig}";`;
    const tailwindImport = next.match(/^.*@import\s+["']tailwindcss["'].*$/m);

    next = tailwindImport
      ? next.replace(tailwindImport[0], `${tailwindImport[0]}\n\n${configLine}`)
      : `${next.trimEnd()}\n\n${configLine}\n`;
  }

  if (!/var\(--background\)/.test(next)) {
    next = `${next.trimEnd()}\n\nbody {\n  background: var(--background);\n  color: var(--text-color);\n}\n`;
  }

  return next === css ? null : next;
};

const routingRule = (info) => {
  if (info.framework === "next-pages") {
    return `**Every file under \`${info.routesDir}\` becomes a route**, so never put components, types or helpers there. \`${info.routesDir}\` holds page files only; their parts live in \`${info.src}components/pages/{PageName}/\`.`;
  }

  if (info.framework === "next-app") {
    return `\`${info.routesDir}\` holds route files only (\`page.tsx\`, \`layout.tsx\`, \`loading.tsx\`, \`route.ts\`, ...). Even though the App Router allows colocation, keep page parts in \`${info.src}components/pages/{PageName}/\` so the route tree stays a plain map of URLs.`;
  }

  return `\`${info.routesDir}\` holds one component per page and nothing else; their parts live in \`${info.src}components/pages/{PageName}/\`.`;
};

const tailwindWiring = (info, configFile) => {
  const cssDir = path.posix.dirname(info.mainCss);

  if (info.tailwindMajor >= 4) {
    return `Tailwind v4, but there **is** a v3-style \`${configFile}\` at the project root, loaded explicitly by an \`@config\` line in \`${info.mainCss}\`. \`${info.mainCss}\` imports \`./base.css\` **above** \`@import "tailwindcss"\`, then the \`@config\`, then sets the \`body\` background and text colour from the tokens.`;
  }

  return `Tailwind v3 with \`${configFile}\` at the project root (picked up automatically). \`${info.mainCss}\` imports \`./base.css\` at the very top, before the \`@tailwind\` directives, and sets the \`body\` background and text colour from the tokens. The CSS variables live in \`${cssDir}/base.css\`.`;
};

const upsertBlock = (existing, block) => {
  const wrapped = `${MARKER_START}\n${block.trim()}\n${MARKER_END}`;

  if (existing === null) {
    return `${wrapped}\n`;
  }

  const start = existing.indexOf(MARKER_START);
  const end = existing.indexOf(MARKER_END);

  if (start !== -1 && end !== -1 && end > start) {
    return `${existing.slice(0, start)}${wrapped}${existing.slice(end + MARKER_END.length)}`;
  }

  return `${existing.trimEnd()}\n\n${wrapped}\n`;
};

const listSkills = () =>
  fs.readdirSync(path.join(TEMPLATES, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const main = () => {
  // Commands pass $ARGUMENTS as one quoted string (an unquoted "#0b44ae" would be a
  // shell comment), so split every argument on whitespace.
  const args = parseArgs(process.argv.slice(2).flatMap((arg) => arg.split(/\s+/)).filter(Boolean));
  const info = detect(args.cwd);

  if (!info.mainCss) {
    fail("Could not find the main CSS file (one that imports Tailwind). Create it or tell the agent where it is.");
  }

  let palette = null;

  if (args.color) {
    try {
      palette = generatePalette(args.color);
    } catch (error) {
      fail(error.message);
    }
  }
  const agent = AGENTS[args.agent];
  const cssDir = path.posix.dirname(info.mainCss);
  const baseCssPath = cssDir === "." ? "base.css" : `${cssDir}/base.css`;
  const configFile = info.existingConfig ?? "tailwind.config.js";

  const values = {
    SRC: info.src,
    SRC_LABEL: info.src || "./",
    MAIN_CSS: info.mainCss,
    BASE_CSS: baseCssPath,
    CONFIG_FILE: configFile,
    ROUTES_DIR: info.routesDir,
    ROUTING_RULE: routingRule(info),
    TAILWIND_WIRING: tailwindWiring(info, configFile),
    SKILLS_DIR: agent.skills,
  };

  const writes = [];
  const skipped = [];

  const plan = (file, content, { overwrite }) => {
    const full = path.join(args.cwd, file);
    const present = fs.existsSync(full);

    if (present && !overwrite) {
      skipped.push({ file, reason: "exists (use --force to overwrite)" });
      return;
    }

    writes.push({ file, full, content, action: present ? "updated" : "created" });
  };

  plan(baseCssPath, buildBaseCss(palette), { overwrite: args.force });

  if (info.existingConfig && info.existingConfig !== "tailwind.config.js") {
    skipped.push({
      file: info.existingConfig,
      reason: "existing config in another format; merge the token mapping from templates/tailwind.config.tmpl by hand",
    });
  } else {
    plan(configFile, buildConfig(info), { overwrite: args.force });
  }

  const wiredCss = wireMainCss(read(path.join(args.cwd, info.mainCss)), info, configFile);

  if (wiredCss) {
    writes.push({ file: info.mainCss, full: path.join(args.cwd, info.mainCss), content: wiredCss, action: "updated" });
  }

  for (const skill of listSkills()) {
    const target = `${agent.skills}/${skill}/SKILL.md`;
    const content = fill(read(path.join(TEMPLATES, "skills", skill, "SKILL.md")), values);

    plan(target, content, { overwrite: args.force });
  }

  const instructionsPath = path.join(args.cwd, agent.instructions);
  const currentInstructions = fs.existsSync(instructionsPath) ? read(instructionsPath) : null;
  const block = fill(read(path.join(TEMPLATES, "instructions.md.tmpl")), values);
  const nextInstructions = upsertBlock(currentInstructions, block);

  if (nextInstructions !== currentInstructions) {
    writes.push({
      file: agent.instructions,
      full: instructionsPath,
      content: nextInstructions,
      action: currentInstructions === null ? "created" : "updated",
    });
  }

  if (!args.dryRun) {
    for (const write of writes) {
      fs.mkdirSync(path.dirname(write.full), { recursive: true });
      fs.writeFileSync(write.full, write.content);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: args.dryRun,
        project: {
          framework: info.framework,
          tailwind: info.tailwindMajor,
          src: info.src || "(none)",
          routesDir: info.routesDir,
          mainCss: info.mainCss,
          config: configFile,
        },
        agent: args.agent,
        written: writes.map(({ file, action }) => ({ file, action })),
        skipped,
        palette: palette && {
          primary: palette.base,
          baseStep: palette.baseStep,
          hover: `primary-${palette.hoverStep}`,
          active: `primary-${palette.activeStep}`,
          accent: palette.accent,
          status: palette.status,
          contrast: palette.checks,
        },
      },
      null,
      2,
    ),
  );
};

main();
