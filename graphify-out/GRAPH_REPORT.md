# Graph Report - . (2026-08-08)

## Corpus Check

- Corpus is ~10,127 words - fits in a single context window. You may not need a graph.

## Summary

- 307 nodes · 380 edges · 47 communities (17 shown, 30 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.76)
- Token cost: 66,343 input · 0 output

## Community Hubs (Navigation)

- AccordionItem Component & React Peer Dep
- TypeScript Config
- Runtime Dependencies
- CI/CD Workflow Actions
- Logo Component
- Test/Story File Type Refs
- SectionHeading & Component Tests
- Package Scripts
- Dev Tooling Dependencies
- CLAUDE.md Component Conventions
- ValuesCloud Stories
- Dependabot & Peer-Dep Policy
- Axe A11y Test Setup
- Contributing Guide
- eslint Dependency
- eslint-config-prettier Dependency
- eslint-js Dependency
- eslint-plugin-react Dependency
- eslint-plugin-react-hooks Dependency
- globals Dependency
- jsdom Dependency
- storybook Dependency
- storybook-addon-a11y Dependency
- storybook-addon-essentials Dependency
- storybook-addon-interactions Dependency
- storybook-addon-links Dependency
- storybook-blocks Dependency
- storybook-react Dependency
- storybook-react-vite Dependency
- types-node Dependency
- types-react Dependency
- types-react-dom Dependency
- typescript Dependency
- typescript-eslint Dependency
- typescript-eslint-eslint-plugin Dependency
- vitejs-plugin-react Dependency
- vitest Dependency
- vitest-ui Dependency
- Storybook Main Config
- Storybook Preview Config
- Tech Stack Note
- README Install
- README License
- README Usage

## God Nodes (most connected - your core abstractions)

1. `compilerOptions` - 24 edges
2. `scripts` - 12 edges
3. `react` - 10 edges
4. `Lint, Format & Test Job` - 10 edges
5. `usePrefersReducedMotion()` - 9 edges
6. `exclude` - 8 edges
7. `ValuesCloud()` - 7 edges
8. `Deploy Storybook to GitHub Pages Job` - 7 edges
9. `react` - 6 edges
10. `Logo()` - 6 edges

## Surprising Connections (you probably didn't know these)

- `Peer Dependencies (react, react-dom >= 18)` --semantically_similar_to--> `React/React-DOM Peer Dependency Ignore Rule` [INFERRED] [semantically similar]
  README.md → .github/dependabot.yml
- `allowBuilds: esbuild false` --conceptually_related_to--> `CI Workflow` [INFERRED]
  pnpm-workspace.yaml → .github/workflows/ci.yml
- `Commands Reference (build, type-check, test:unit, lint, format, dev, preview, install)` --conceptually_related_to--> `Lint, Format & Test Job` [INFERRED]
  CLAUDE.md → .github/workflows/ci.yml
- `Non-Interactive Tool Guidance` --semantically_similar_to--> `Setup` [INFERRED] [semantically similar]
  CLAUDE.md → CONTRIBUTING.md
- `Non-Interactive Tool Guidance` --conceptually_related_to--> `CI Workflow` [INFERRED]
  CLAUDE.md → .github/workflows/ci.yml

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **Tag-Triggered Release Pipeline (CLAUDE.md, CONTRIBUTING.md, README.md, publish.yml)** — claude_publishing_release_flow, contributing_publishing, readme_release, _github_workflows_publish_workflow [INFERRED 0.85]
- **Local and CI Quality Gate (Format, Lint, Test)** — _pre_commit_config, _github_workflows_ci_ci_job, contributing_ci_checks [INFERRED 0.85]
- **Dependabot Minor/Patch Grouping with Major and Peer-Dep Carve-outs** — _github_dependabot_npm_minor_and_patch_group, _github_dependabot_github_actions_minor_and_patch_group, _github_dependabot_react_peer_dependency_exclusion [EXTRACTED 1.00]

## Communities (47 total, 30 thin omitted)

### Community 0 - "AccordionItem Component & React Peer Dep"

Cohesion: 0.09
Nodes (27): react, react, react, AccordionItem(), AccordionItemProps, Default, MultipleOpenAtOnce, OneOpenAtATime (+19 more)

### Community 1 - "TypeScript Config"

Cohesion: 0.06
Nodes (33): DOM, DOM.Iterable, ES2020, vite/client, compilerOptions, allowJs, allowSyntheticDefaultImports, declaration (+25 more)

### Community 2 - "Runtime Dependencies"

Cohesion: 0.06
Nodes (31): framer-motion, lucide-react, author, dependencies, framer-motion, lucide-react, description, exports (+23 more)

### Community 3 - "CI/CD Workflow Actions"

Cohesion: 0.10
Nodes (30): Dependabot github-actions Ecosystem Update, github-actions-minor-and-patch Update Group, actions/cache, actions/checkout, actions/deploy-pages, actions/setup-node, actions/upload-pages-artifact, Lint, Format & Test Job (+22 more)

### Community 4 - "Logo Component"

Cohesion: 0.09
Nodes (20): BRANDED, Logo(), LogoBackground, LogoColor, LogoProps, resolveBackground(), resolveColor(), CustomColors (+12 more)

### Community 5 - "Test/Story File Type Refs"

Cohesion: 0.11
Nodes (17): src/test, **/_.stories.ts, \**/_.stories.tsx, **/_.test.ts, \**/_.test.tsx, ./tsconfig.json, compilerOptions, emitDeclarationOnly (+9 more)

### Community 6 - "SectionHeading & Component Tests"

Cohesion: 0.15
Nodes (10): SectionHeading(), SectionHeadingLevel, SectionHeadingProps, AllLevels, Plain, Story, Unstyled, WithAnchor (+2 more)

### Community 7 - "Package Scripts"

Cohesion: 0.17
Nodes (12): scripts, build, build:storybook, dev, format, lint, prepare, prepublishOnly (+4 more)

### Community 8 - "Dev Tooling Dependencies"

Cohesion: 0.22
Nodes (9): devDependencies, prettier, @typescript-eslint/parser, vite, vitest-axe, prettier, @typescript-eslint/parser, vite (+1 more)

### Community 9 - "CLAUDE.md Component Conventions"

Cohesion: 0.29
Nodes (8): Accessibility Convention, Commands Reference (build, type-check, test:unit, lint, format, dev, preview, install), Component Authorship Convention, Styling Convention (unstyled-by-default, structural CSS exception), TypeScript Convention (strict, no any), Component Conventions (Contributing), CSS Export Subpath (@branchleft/components/css), Development Section

### Community 10 - "ValuesCloud Stories"

Cohesion: 0.25
Nodes (7): CustomAccents, Default, extendedValues, ManyValues, NoWiggle, Story, values

### Community 11 - "Dependabot & Peer-Dep Policy"

Cohesion: 0.40
Nodes (5): Dependabot npm Ecosystem Update, npm-minor-and-patch Update Group, React/React-DOM Peer Dependency Ignore Rule, allowBuilds: esbuild false, Peer Dependencies (react, react-dom >= 18)

### Community 12 - "Axe A11y Test Setup"

Cohesion: 0.50
Nodes (3): Assertion, AsymmetricMatchersContaining, vitest

### Community 13 - "Contributing Guide"

Cohesion: 0.67
Nodes (3): Org-Wide Contribution Guide (branchLeft/.github), Prerequisites, Contributing Section (README pointer)

## Knowledge Gaps

- **162 isolated node(s):** `config`, `preview`, `name`, `version`, `packageManager` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Tooling Dependencies` to `Runtime Dependencies`, `eslint Dependency`, `eslint-config-prettier Dependency`, `eslint-js Dependency`, `eslint-plugin-react Dependency`, `eslint-plugin-react-hooks Dependency`, `globals Dependency`, `jsdom Dependency`, `storybook Dependency`, `storybook-addon-a11y Dependency`, `storybook-addon-essentials Dependency`, `storybook-addon-interactions Dependency`, `storybook-addon-links Dependency`, `storybook-blocks Dependency`, `storybook-react Dependency`, `storybook-react-vite Dependency`, `types-node Dependency`, `types-react Dependency`, `types-react-dom Dependency`, `typescript Dependency`, `typescript-eslint Dependency`, `typescript-eslint-eslint-plugin Dependency`, `vitejs-plugin-react Dependency`, `vitest Dependency`, `vitest-ui Dependency`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `react` connect `AccordionItem Component & React Peer Dep` to `Runtime Dependencies`, `Logo Component`, `SectionHeading & Component Tests`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `keywords` connect `Runtime Dependencies` to `AccordionItem Component & React Peer Dep`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Lint, Format & Test Job` (e.g. with `eslint Pre-Commit Hook` and `prettier Pre-Commit Hook`) actually correct?**
  _`Lint, Format & Test Job` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `preview`, `name` to the rest of the system?**
  _162 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AccordionItem Component & React Peer Dep` be split into smaller, more focused modules?**
  _Cohesion score 0.09291521486643438 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
