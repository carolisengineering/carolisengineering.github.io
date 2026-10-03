# Site redesign: implementation report

- **Branch:** `redesign`. **Nothing is committed yet.**
- **Spec:** `docs/superpowers/specs/2026-09-27-site-redesign-design.md`
- **Plan:** `docs/superpowers/plans/2026-09-27-site-redesign.md`

## Status

- **Tests:** `npm test` has 109 passing and 1 skipped. The skipped one is the placeholder check, which only runs with `REQUIRE_FILLED=1`.
- **CI build:** `hugo --minify --panicOnWarning` fails only on the `[TODO` placeholders in `data/about.json`, as the spec intends.
- **Screenshots:** home, the office-hours case study and 404, at 375px and 1280px, are in `screenshots/`. That folder is gitignored; regenerate it with `npm run screenshots`.

## Reviewing the changes

- The deletions (the Ananke theme, `public/`, `.gitmodules`, `.hugo_build.lock`, `archetypes/`, `data/projects.json`, `static/css/portfolio.css` and the old `layouts/index.html`) are **staged**, because `git rm` stages them. Everything else is unstaged or untracked.
- Use `git diff HEAD` to see everything; plain `git diff` hides the staged deletions.

## What was built

- **Site:** owned Hugo layouts replace the Ananke theme. All page text comes from `data/about.json` and `content/projects/*.md`. Fonts (Inter and JetBrains Mono) are self-hosted with their OFL licenses, and there's a favicon and a single stylesheet at `assets/css/site.css`.
- **Pages:**
  - homepage: hero, project tiles with data-driven diagrams, about, facts, experience, skills
  - case-study pages with a table of contents that highlights the current section, and a "Key decision" callout
  - a 404 page
- **Two case studies:** office-hours and strength-in-numbers, drafted from each repo's README and design docs. A reviewer checked the numbers against those repos and they're correct.
- **CI** (`.github/workflows/hugo.yml`):
  - no submodule checkout
  - Hugo pinned to 0.166.0
  - installs Node 22 and Chromium, runs `npm test` with `REQUIRE_FILLED=1`, then `hugo --minify --panicOnWarning`, then deploys to `gh-pages`
- **Tests** (`npm test`) cover:
  - build output
  - internal links and anchors
  - token contrast pairs, plus a rendered AA contrast check of every visible text node against its real background
  - no horizontal scrolling at 375px and 1280px, including with long unbroken strings
  - the TOC highlight
  - focus rings and corner radius
  - that wrapped diagrams keep each arrow with the box after it
  - placeholder and required-field warnings
  - malformed diagrams
  - project ordering by weight
  - anonymity guards: a stray `company` key is never rendered, and there are no LinkedIn or resume links
- **`README.md`** covers:
  - running, serving and testing locally
  - how placeholders and required fields block a deploy
  - why `public/`, `resources/` and `.hugo_build.lock` are never committed, and how to untrack them if they get added
  - how deploying works

## Review and fixes

A fresh reviewer checked all the changes and found nothing critical.

**Fixed after the review:**

- **Important: long unbroken text overflowed on phones.** A results file path or URL in a case study made pages scroll sideways at 375px. Fixed with wrapping CSS, a phone-width grid fix, and styling for code blocks; a new test covers it.
- **The test temp directories were never deleted.** About 160MB had built up. They're now removed after each run, and the 406 old ones were deleted.
- **Two statements in the README were inaccurate:**
  - It overstated which placeholders the tests fill in.
  - The command for untracking `public/` needed `--ignore-unmatch`.

**Minor issues, also fixed at your request:**

1. **Missing required fields now warn.** `layouts/partials/required-check.html` fails the build when any of these is missing or empty:
   - about fields: `headline`, `headlineHighlight`, `lede`, `intro`
   - lists: `facts`, `experience`, `links`, `skills`, and each entry's own fields
   - each project's `summary`, `tags` and `repo`
   - a diagram box with no label

   In a local preview those elements are left out instead of shown empty, and the nav no longer crashes if `links` is empty.
2. **Focus outline:** tiles keep their 12px corners and buttons their 8px when focused.
3. **Tile link names:** a screen reader now reads each tile by its title, plus the summary on the featured tile, instead of the whole diagram and all the tags.
4. **Case-study landmarks:** the table of contents nav is labelled "On this page", and the extra unlabeled landmark is gone.
5. **Wrapped diagrams:** each arrow wraps together with the box after it, so no line ends on an arrow.
6. **CI runs the tests:** a `[TODO` anywhere on the site, including a case-study body, now blocks a deploy.

## Decisions made along the way

- **No commits and no separate worktree.** The work happened directly on the `redesign` branch so you could review the working tree.
- **Deviations from the spec's file list:**
  - `hugo.toml` turns off tag, term and RSS pages, and `content/projects/_index.md` never renders. Without these, Hugo warns about pages with no layout, and `--panicOnWarning` would fail the build.
  - There's one extra color token, `--on-primary` (white), for text on filled petrol.
  - Code spans and code blocks in case studies use the body font, because mono is reserved for tech tags.
- **`--subtle` is only used on the page background and white.** It fails AA on both tint colors (4.17 and 4.07).
- **Case studies:** numbers come only from the current post-fix office-hours README. "Riverton University" is named as the fictional test domain.
- **The progress log is kept** at `.superpowers/sdd/2026-09-27-site-redesign/` (gitignored) until you commit. You can delete it any time.

## Risk

CI now runs the browser tests on Linux. So far they've only run on macOS. If fonts render slightly differently there, the first run could fail, and it would show up on the first push to `main`.

## Your to-dos

1. **Fill in the placeholders in `data/about.json`:** your years of experience (fact 1) and your experience entries (`start`, `industry`, `summary`).
2. **Anonymity review:** read all the drafted text for anything that could identify an employer:
   - the about text
   - the project summaries and diagram labels
   - both case studies

   An automated search only found technical uses of the word "client". The reviewer flagged two lines worth a look: "my earlier backend work was in Go", and the skills list (Harness, New Relic, Azure Service Bus), which is unchanged from before.
3. **Check one claim:** in the strength-in-numbers case study, confirm the profile screen counts as "built". That repo's spec index still lists it as Draft.
4. **Review the changes** with `git diff HEAD` and the screenshots, then commit, or ask for changes.
5. **Before merging to `main`:** run `REQUIRE_FILLED=1 npm test` and `hugo --minify --panicOnWarning`. Both must pass.
