# CLAUDE.md — SkillForge Engineering Specification

This file provides context, architectural constraints, and verification workflows for **Claude Code** when building and maintaining **SkillForge**.

## 1. Project Overview

**SkillForge** is an open-source CLI tool (`skillforge`) that converts a natural-language description into a versioned, validated, and installable **Agent Skill** compatible with `npx skills add <owner>/<repo> --skill <skill-name>`.

- **Core Value Proposition:** _"Describe una habilidad en una frase. Obtén un skill versionado, validado e instalable para tu agente de código."_
- **Zero-API Requirement:** 100% local heuristic analysis and template generation. Never require paid API keys, LLM SDKs, or external network calls for the MVP.

---

## 2. Essential Commands

Always run these commands to verify your changes before completing any task:

```bash
npm install                                                        # Install dependencies
npm run typecheck                                                  # tsc --noEmit (Must pass with 0 errors)
npm run lint                                                       # eslint . (Must pass with 0 warnings/errors)
npm test                                                           # vitest run (Must pass >= 25 tests)
npm run build                                                      # tsc -p tsconfig.build.json
npx tsx src/cli/index.ts create "Descripción..." --yes             # Run CLI create in non-interactive mode
npx tsx src/cli/index.ts validate ./skills/nextjs-pr-reviewer      # Validate bundled example skill
npx tsx src/cli/index.ts test ./skills/nextjs-pr-reviewer          # Run static coverage tests on example skill
npx tsx src/cli/index.ts pack ./skills/nextjs-pr-reviewer          # Package skill into dist/nextjs-pr-reviewer.skillforge.zip
npx tsx src/cli/index.ts init                                      # Scaffold skillforge-skills repository
```

---

## 3. Mandatory Tech Stack & Strict Conventions

- **Runtime:** Node.js 20+ with `"type": "module"` (ESM).
- **TypeScript:** Strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`).
- **ESM Imports:** All relative TypeScript imports MUST include the `.js` extension (e.g., `import { logger } from '../utils/logger.js';`).
- **Allowed Dependencies Only:**
  - Runtime: `commander`, `zod`, `@clack/prompts`, `picocolors`, `ora`.
  - Dev: `typescript`, `tsx`, `vitest`, `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `@types/node`.
  - **ZIP Packaging:** Implement ZIP creation natively in `src/utils/zip.ts` using `node:zlib` (`deflateRawSync` + CRC32 + PKZIP headers). Do NOT add external zip packages (`adm-zip`, `archiver`, `jszip`).
- **Language Separation Rule:**
  - **Code, identifiers, types, file names, and comments:** Strictly in **English**.
  - **User-facing CLI messages, prompts, errors, and generated default skill templates:** Strictly in **Spanish** (unless `--lang en` is passed).
- **Logging Rule (`no-console: error`):**
  - Never use `console.log`, `console.error`, or `console.warn` anywhere in `src/` or `tests/`.
  - Always use the central logger in `src/utils/logger.ts` backed by `process.stdout.write` and `process.stderr.write`.

---

## 4. Architecture & Directory Structure

Keep CLI presentation separated from core business logic so all generators and validators can be unit-tested directly without spawning child processes:

```text
src/
├── cli/
│   └── index.ts               # Commander entrypoint & argument wiring
├── commands/
│   ├── create.ts              # Interactive (@clack/prompts) + non-interactive (--yes) create flow
│   ├── validate.ts            # CLI handler for skillforge validate
│   ├── test.ts                # CLI handler for skillforge test
│   ├── pack.ts                # CLI handler + file filtering for skillforge pack
│   └── init.ts                # CLI handler + scaffolding for skillforge init
├── generators/
│   ├── analyzer.ts            # Heuristic category detection & kebab-case name generation
│   └── skill-generator.ts     # Writes SKILL.md, README.md, skillforge.config.json, references/, tests/
├── templates/
│   └── index.ts               # Actionable templates (es/en) for all 11 mandatory categories
├── validators/
│   ├── schema.ts              # Zod schemas for frontmatter, skillforge.config.json, and cases.json
│   ├── skill-validator.ts     # Structural, frontmatter, reference, and config validation
│   └── skill-tester.ts        # Static test runner & coverage score calculator (0-100)
├── utils/
│   ├── fs.ts                  # Safe filesystem helpers
│   ├── logger.ts              # Central terminal logger (picocolors)
│   ├── string.ts              # Kebab-case, accent stripping, YAML frontmatter parser
│   └── zip.ts                 # Zero-dependency PKZIP archive builder & reader
└── types/
    └── index.ts               # Shared TypeScript interfaces and union types
```

---

## 5. Domain Specifications & Business Rules

### 5.1 Categories (`SkillCategory`)

The heuristic analyzer (`src/generators/analyzer.ts`) and template engine (`src/templates/index.ts`) must support these 11 categories:

1. `code-review`
2. `debugging`
3. `documentation`
4. `framework-migration`
5. `accessibility`
6. `performance`
7. `security`
8. `seo`
9. `testing`
10. `repo-onboarding`
11. `refactoring`

### 5.2 Validation Rules (`skillforge validate <path>`)

Must return exit code `0` if valid, `1` if invalid, checking:

1. `SKILL.md` exists in the target folder.
2. Valid YAML frontmatter delimited by `---`.
3. `name` exists, `1..64` chars, matches `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.
4. `name` matches the parent folder name (`path.basename(resolvedDir)`).
5. `name` does NOT contain reserved words `anthropic` or `claude`.
6. `description` exists, non-empty, max `1024` characters.
7. Markdown body contains structured headings (`## `) and actionable instructions:
   - Propósito / Purpose
   - Cuándo activarse / When to Activate
   - Entradas esperadas / Expected Inputs
   - Proceso paso a paso / Step-by-Step Process
   - Reglas y restricciones / Rules and Constraints
   - Formato de salida / Output Format
   - Criterios de calidad / Quality Criteria
   - Qué no debe hacer el agente / What the Agent Must NOT Do
   - Ejemplos de uso / Usage Examples
8. All relative files referenced in `SKILL.md` (e.g., `references/checklist.md`, `tests/cases.json`) exist on disk.
9. If `skillforge.config.json` exists, it passes `SkillForgeConfigSchema` (Zod) and its `name` matches `SKILL.md`.

### 5.3 Static Evaluation Rules (`skillforge test <path>`)

1. Run `validateSkill(skillPath)` first.
2. Load and validate `tests/cases.json` with Zod (`input`, `expectedBehavior`, and non-empty `criteria: string[]`).
3. Normalize accents and case in `SKILL.md` + `references/checklist.md`, then check how many `criteria` terms per test case are covered.
4. Calculate per-case score (`0..100`) and overall `coverageScore` (average across cases).
5. Write `skillforge-report.json` inside the skill directory.
6. Pass (exit code `0`) only if `validation.valid === true` AND `coverageScore >= 70`; otherwise fail (exit code `1`).

### 5.4 Packaging Rules (`skillforge pack <path>`)

1. Validate skill first; abort with exit code `1` if invalid.
2. Create `dist/<skill-name>.skillforge.zip`.
3. Include only allowed files (`SKILL.md`, `README.md`, `skillforge.config.json`, `LICENSE`, and files under `references/`, `tests/`, `scripts/`, `assets/`).
4. Strictly exclude `node_modules`, `.git`, `dist`, `coverage`, `skillforge-report.json`, `.DS_Store`, `.env*`, `*.log`, `*.tmp`, `*.pem`, `*.key`, `secret*`, `credentials*`.

### 5.5 Bundled Example (`skills/nextjs-pr-reviewer`)

The repository must include `skills/nextjs-pr-reviewer` out of the box with:

- Complete `SKILL.md`, `README.md`, `skillforge.config.json`, `references/checklist.md`, and `tests/cases.json` (at least 5 test cases).
- Must pass `validate` and `test` with a score >= 70.

---

## 6. Execution Protocol for Claude Code

When asked to build or update the project, execute in this exact order:

1. **Scaffold & Configuration:** Write `package.json`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `.npmignore`, and community docs (`LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `README.md`).
2. **Core Implementation:** Implement `src/types`, `src/utils`, `src/validators`, `src/templates`, `src/generators`, `src/commands`, and `src/cli/index.ts`.
3. **Example Skill:** Create `skills/nextjs-pr-reviewer` with all 5 required files.
4. **Test Suite:** Create `tests/skillforge.test.ts` with at least 25 unit and integration tests covering all commands and edge cases.
5. **Install & Self-Verify:**
   - Run `npm install`
   - Run `npm run typecheck`
   - Run `npm run lint`
   - Run `npm test`
   - Run `npm run build`
   - Smoke-test all 5 CLI commands (`create`, `validate`, `test`, `pack`, `init`) and clean up any temporary directories created in the root during smoke testing.
