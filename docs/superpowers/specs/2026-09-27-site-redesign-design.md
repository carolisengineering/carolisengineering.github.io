# carolisengineering.github.io redesign: design spec

- **Date:** 2026-09-27
- **Status:** Draft, awaiting review
- **Supersedes:** `docs/design-notes.md` (working notes from brainstorming)
- **Visual reference:** `docs/redesign-options.pdf` (mockups from every brainstorming round)

## 1. Goal

Redesign the portfolio so it shows Carol's skills and projects to hiring managers and engineers, with more depth for the featured projects. It should not read like a resume.

The current site looks generic ("like AI output"): dark background, bright aqua, bordered cards everywhere, pill tags, and oversized hero type caused by Ananke's CSS fighting a custom stylesheet.

**Success looks like:**
- Within 30–90 seconds, a visitor understands who Carol is, what Carol builds, and the core stack.
- A visitor can open a case study and quickly find the decisions and results.
- The page looks clean, modern, and hand-made.
- Nothing on the site identifies an employer.

## 2. Hard constraints

1. **Anonymity:** no employer names anywhere, in content, data, or markup. The experience data model has no company field. There is no resume link and no LinkedIn.
2. **Links:** GitHub only. Adding Email later must require only a data change.
3. **Visual rules:**
   - No tiny all-caps labels.
   - Mono font only for tech tags, at 12px or larger.
   - Solid colors only; no gradients.
   - No orange and no bright aqua or teal.
   - No "boxes-everywhere" layout.
4. **Light mode only.** Every color is a CSS variable so dark mode can be added later.
5. **No screenshots.** Project visuals are architecture diagrams generated from data.

## 3. Architecture

Hugo stays. The Ananke theme is removed and replaced by a small set of layouts we own.

```
hugo.toml                       no theme; markup/TOC config
layouts/
  _default/baseof.html          html shell: <head>, nav, <main>, footer
  index.html                    homepage
  404.html                      simple not-found page in the same style
  projects/single.html          case-study page
  partials/nav.html
  partials/footer.html
  partials/diagram.html         architecture diagram (compact for tiles, large for page hero)
  partials/project-tile.html
  partials/placeholder-check.html  warns on unfilled placeholders (see §7)
  shortcodes/decision.html      maroon "Key decision" callout
assets/css/site.css             the only stylesheet, processed by Hugo Pipes (minify + fingerprint)
static/fonts/                   self-hosted Inter + JetBrains Mono (woff2, latin subset) + OFL license files
static/favicon.svg              "c." mark: petrol "c", maroon dot
data/about.json                 hero, about, facts, experience, skills, links
content/_index.md
content/projects/
  office-hours.md               featured, has a case study
  strength-in-numbers.md        featured, has a case study
  this-site.md                  tile only; no page is rendered, tile links to GitHub
```

Each unit has one job:
- **`about.json`** is the single source for homepage text that isn't about a project.
- **Each project file** is the single source for that project's tile and its case study.
- **`diagram.html`** is the only place diagrams are rendered.
- **`site.css`** is the only stylesheet.

## 4. Content model

### 4.1 `data/about.json`

```json
{
  "name": "Carol",
  "now": "Building agent evals",
  "headline": "Software engineer who builds",
  "headlineHighlight": "and explains.",
  "lede": "I solve technical problems with code and communication: backend systems, infrastructure, and AI agents with real evals behind them.",
  "intro": "I build backend systems and the infrastructure under them, and I care as much about explaining them as building them.",
  "facts": [
    { "value": "[TODO years] years", "label": "shipping production software" },
    { "value": "4 languages", "label": "in production: Python, Java, Go, JS" },
    { "value": "3 clouds", "label": "AWS, Azure, GCP, all on Kubernetes" }
  ],
  "experience": [
    { "start": "[TODO]", "end": "now", "role": "Software Engineer", "industry": "[TODO industry]", "summary": "[TODO one line]" }
  ],
  "links": [
    { "label": "GitHub", "url": "https://github.com/carolisengineering" }
  ],
  "skills": [ { "category": "Languages", "items": ["Python", "Java", "Go", "JavaScript"] } ]
}
```

- `now` is optional; if it's empty, the pill isn't rendered.
- `headlineHighlight` is rendered in maroon, directly after `headline`.
- `facts` can have any number of entries (1 or more). Tints alternate: odd-numbered tiles use the petrol tint and even-numbered tiles use the maroon tint.
- `experience` entries have no company field, by design.
- `skills` keeps all nine current categories and items unchanged.
- `links` is rendered in the nav, hero, and footer. The first link is GitHub, which appears in the nav as "GitHub ↗". Adding `{ "label": "Email", "url": "mailto:…" }` makes Email appear in the hero and footer.
- The copy above is a first draft (§7). The existing `avatar` and `title` fields are dropped.

### 4.2 Project front matter

```yaml
---
title: office-hours
summary: Student-support agent grounded in a program knowledge base, built on the Claude Agent SDK.
tags: [Python, Claude Agent SDK, RAG, Evals, Langfuse, Red-teaming]
repo: https://github.com/carolisengineering/office-hours
weight: 1                 # homepage order; lowest = first = wide featured tile
diagram:
  - { label: Student question, next: "→" }
  - { label: Agent, style: primary, next: "⇄" }
  - { label: Knowledge base, next: "→" }
  - { label: Evals, style: secondary }
---
```

- `lede` is optional. The case-study page falls back to `summary` if it's missing.
- `diagram` holds 3–4 nodes.
  - `style` is omitted (petrol outline on white), `primary` (filled petrol, white text), or `secondary` (maroon outline and text).
  - `next` is the connector drawn after the node. It's omitted on the last node.
- **A project without a case study** sets `build: { render: never, list: always }` and has no body. Its tile links to `repo` with "↗". Every other tile links to the case-study page with "→".
- The body is the case study, written as `##` sections in this order:
  1. The problem
  2. What I built
  3. How it works
  4. Decisions & tradeoffs
  5. Results & evals
  6. What I'd do next
- A key decision is written as `{{< decision >}}…{{< /decision >}}`.

## 5. Pages

### 5.1 Homepage (single centered column, max width ~760px)

1. **Nav:**
   - Left: "carol." (the dot in maroon), linking to `/`.
   - Right: "Projects" (`#projects`), "About" (`#about`), and "GitHub ↗".
2. **Hero:**
   - The `now` pill (maroon tint, maroon text).
   - `<h1>` made of the headline plus the maroon highlight.
   - The lede.
   - A filled petrol "See projects" button (`#projects`) and a white bordered button for each entry in `links`.
3. **Projects (`#projects`):**
   - Heading "Projects".
   - Tiles in a 2-column grid. The first project by weight spans both columns and has a petrol-tint background.
   - The other tiles are white with a hairline border, and their diagram backgrounds alternate between petrol tint and maroon tint.
   - Each tile shows a compact diagram, the title with an arrow in maroon, the summary (featured tile only), and the tags in mono.
   - The whole tile is one link.
   - Below about 640px the grid becomes one column.
4. **About (`#about`):**
   - Heading "About".
   - The intro paragraph.
   - A grid of fact tiles (`repeat(auto-fit, minmax(160px, 1fr))`), so 3–4 fit on one row and more wrap onto the next. They stack below about 640px.
   - Subheading "Experience".
   - The timeline: one row per entry, with the years in muted text; "Role · Industry" with the industry in petrol; and the summary line in muted text.
5. **Skills:** heading "Skills", then a `<dl>` with the category in muted text and the items as comma-joined text.
6. **Footer:** GitHub (plus any other links) and "Built with Hugo", in small muted text.

### 5.2 Case-study page (max width ~960px)

1. **Header:**
   - The nav.
   - "← All projects" linking to `/#projects`.
   - `<h1>` with the title.
   - The lede.
   - The tags in mono.
   - "Repo ↗".
2. **Diagram hero:** a large diagram on a petrol-tint panel. The boxes wrap on narrow screens.
3. **Body:**
   - Two columns: a sticky table of contents about 150px wide, and the article.
   - The TOC is Hugo's `.TableOfContents`, limited to `##` headings.
   - The current section is highlighted in petrol with a left bar. A small inline script using an `IntersectionObserver` sets this highlight. Without JS, the TOC still works as plain anchor links.
   - Below about 800px the TOC is hidden and the article is one column.
4. **Decision callout:** maroon 3px left border, maroon-tint background, and a bold "Key decision:" prefix.

### 5.3 404 page
It has the nav, a "Page not found" heading, and a link back home.

## 6. Visual system

| Token | Value | Use |
|---|---|---|
| `--primary` | `#1D5F7A` | buttons, links, TOC active, diagram fills, industry text |
| `--primary-dark` | `#174C62` | tag text |
| `--primary-tint` | `#E6F0F3` | featured tile, odd fact tiles, diagram panels |
| `--secondary` | `#6E2230` | headline highlight, brand dot, arrows, secondary diagram nodes, callout border |
| `--secondary-tint` | `#F4E9EA` | now pill, even fact tiles, alternate diagram panels, callout bg |
| `--bg` | `#FAFAF9` | page background |
| `--surface` | `#FFFFFF` | white tiles, secondary buttons |
| `--text` | `#18181B` | body headings |
| `--text-body` | `#3F3F46` | paragraphs |
| `--muted` | `#52525B` | ledes, summaries, footer |
| `--subtle` | `#71717A` | years, skill categories |
| `--border` | `#E4E4E7` | buttons, inputs |
| `--hairline` | `#EDEDEC` | tile borders, timeline rules |

- **Type:**
  - Inter: 400/500/600/700.
  - JetBrains Mono: 400, used only for tags, at 12px.
  - Body text 15–16px, line-height about 1.6.
  - `h1`: hero about 40px desktop and 30px mobile, `letter-spacing: -0.03em`.
  - Section headings: about 20px, weight 600, sentence case.
- **Shape:** tiles use a 12px radius, buttons and diagram boxes 8px.
- **Spacing:** generous, on a 4px scale.
- **Motion:** hover states only, such as a tile border darkening, with no transforms. `prefers-reduced-motion` is respected.
- **Accessibility:**
  - Every text and background pair must meet WCAG AA: 4.5:1 for body text, 3:1 for text 18.66px bold or larger.
  - Visible focus rings (2px `--primary` outline).
  - Each diagram has an `aria-label` that reads its flow, such as "Student question to Agent to Knowledge base to Evals".
  - Semantic landmarks (`header`, `main`, `nav`, `footer`).

## 7. Content

- **Kept as-is:** skills and the GitHub link.
- **Drafted by Claude for Carol to edit:**
  - The hero `headline`, `headlineHighlight`, `lede`, and `now`.
  - The about `intro`.
  - The summary and diagram for each project.
  - First-draft case studies for office-hours and strength-in-numbers, based on each repo's README, design docs, and code in `~/code/`.
- **Supplied by Carol:** the years of experience (fact 1) and the experience entries.
- **Placeholders:**
  - Any string containing `[TODO` is a placeholder.
  - `partials/placeholder-check.html` walks `about.json` and project front matter and calls `warnf` for each placeholder it finds.
  - CI builds with `--panicOnWarning`, so a site with placeholders can't deploy. Any other Hugo warning also fails CI, which is intended.
  - Locally, `hugo server` shows the warnings and still renders.
- **Anonymity review:** before the branch is merged, every drafted text is checked for employer names, internal project names, and identifying details.

## 8. Housekeeping

These are done in one commit at the start of implementation:

- Remove:
  - the Ananke submodule (`.gitmodules` and `themes/ananke`, including `.git/modules` cleanup)
  - the committed `public/` directory
  - `.hugo_build.lock`
  - `static/css/portfolio.css`
  - `data/projects.json`
  - `archetypes/`
- `.gitignore` adds `public/`, `resources/`, and `.hugo_build.lock`. (`.superpowers/` is already there.)
- Install Hugo locally with `brew install hugo`.
- `hugo.toml`: remove `theme` and `params.body_classes`. Add `[markup.tableOfContents] startLevel = 2, endLevel = 2`. Add a site `description` param.

## 9. Build and deploy

- All work happens on a `redesign` branch, and nothing deploys until it's merged to `main`.
- The workflow `.github/workflows/hugo.yml` keeps its structure (checkout, then Hugo, then peaceiris deploy to `gh-pages`), with these changes:
  - `submodules: true` is removed.
  - `hugo-version` is pinned to the exact version `brew` installs locally.
  - The build step becomes `hugo --minify --panicOnWarning`.

## 10. Verification (required before calling it done)

1. `hugo --minify --panicOnWarning` succeeds once the placeholders are filled. Before that, it fails only on `[TODO` warnings.
2. Headless screenshots at 375px and 1280px of the homepage, the office-hours case study, and the 404 page. These are reviewed by Claude and shared with Carol.
3. A contrast check script that computes the ratio for every text and background token pair used in §6 and asserts it meets AA.
4. An internal link check over the built `public/`: every `href` to a local path or `#anchor` resolves. Tile links go to case studies or repos, the jump links work, and "← All projects" works.
5. `grep` over the built `public/` for the placeholder marker `[TODO` returns nothing (once content is filled), and there is no reference to `ananke` or `portfolio.css`.

## 11. Out of scope

- Dark mode
- Blog or writing section
- Screenshots or images
- Analytics or tracking
- Contact form
- Email link (the data model supports it; the content decision is deferred)
- Case studies for non-featured projects
