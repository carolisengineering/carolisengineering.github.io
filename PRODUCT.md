# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: recruiters.** Non-technical or semi-technical screeners matching Carol to a role by stack, years of experience, and kind of work. They skim, they are comparing many candidates, and they need to come away able to say what Carol does and whether to pass the profile on. (Confirmed 2026-10-03. This changes the redesign spec, which named hiring managers and engineers as the audience.)

**Secondary: hiring managers and interviewing engineers.** They arrive after a recruiter passes Carol on, or directly from GitHub, and read a case study for decisions, tradeoffs, and results.

## Product Purpose

A personal portfolio that shows Carol's skills and projects, with more depth for the featured projects. It supports an active search for broad full-stack roles, spanning backend, full-stack, and AI work, without narrowing to one of them.

Success, from the redesign spec:

- Within 30–90 seconds a visitor understands who Carol is, what Carol builds, and the core stack.
- A visitor can open a case study and quickly find the decisions and results.
- It does not read like a resume.
- Nothing on the site identifies an employer.

## Positioning

Carol solves technical problems with code and communication: an engineer who builds systems and explains them. The case studies are the proof of the second half, since each one is written around decisions and tradeoffs rather than a feature list. (Inferred from the site's headline and the spec; not separately confirmed.)

## Operating Context

- Visitors arrive from a GitHub profile, an application, or a link Carol sends. A recruiter is likely to open it alongside many other candidates' profiles.
- The homepage carries the hero, an about section with fact tiles, an anonymous experience timeline, skills by category, and project tiles. Featured projects open a case-study page; smaller ones link straight to their GitHub repo.
- Content is edited in two places: `data/about.json` for everything that is not a project, and one Markdown file per project in `content/projects/`.

## Capabilities and Constraints

- **Anonymity (binding).** No employer names anywhere in content, data, or markup. The experience model has no company field: entries are years, role, industry, and a one-line summary. No resume link and no LinkedIn.
- **GitHub-only contact (binding).** GitHub is the only outbound link. Email may be added later, and that must need only a data change.
- **No screenshots (binding).** Projects are shown through architecture diagrams generated from front-matter data (3–4 nodes).
- **Light mode only (binding).** Every colour is a CSS variable so dark mode can be added later.
- **Stack.** Hugo 0.166.0 with no theme, one stylesheet (`assets/css/site.css`), self-hosted fonts, deployed to GitHub Pages by GitHub Actions on push to `main`.
- **Deploy gate.** CI runs the test suite with `REQUIRE_FILLED=1` and builds with `--panicOnWarning`, so any `[TODO` placeholder, missing required field, or Hugo warning blocks the deploy.
- **Open:** recruiters are the primary audience, but the site offers no direct way to contact Carol and no resume. Whether that stays as is has not been decided.

## Brand Commitments

- Name: Carol; site title `carolisengineering`.
- Favicon: a "c." mark.
- Voice: first person, plain, specific. States what was built and why, without superlatives.
- Visual rules Carol made binding in the redesign spec: no tiny all-caps labels; mono type only for tech tags, at 12px or larger; solid colours only, no gradients; no orange and no bright aqua or teal; no boxes-everywhere card layouts.

## Evidence on Hand

- `data/about.json`: 5 years building production software; 4 languages (Python, Java, Go, JavaScript); 3 clouds (AWS, Azure, GCP); two roles, in the legal and communications industries; skills in ten categories.
- `content/projects/office-hours.md`: full case study of a student-support agent on the Claude Agent SDK, with eval and red-team results.
- `content/projects/strength-in-numbers.md`: full case study of a workout-tracking web app. The app itself is in progress (set logging and the workout screen are not built) and has no users yet, so its results are about correctness, not usage.
- `content/projects/this-site.md`: tile only, links to the repo.
- `static/og-placeholder.png` is a placeholder social card, not a finished asset.
- Absent, and not to be fabricated: employer names, testimonials, metrics beyond those in the files above, a photo, a resume.

## Product Principles

1. **Legible to a non-engineer first.** A recruiter should be able to name Carol's role, stack, and experience level from the homepage without opening anything.
2. **Depth is one click away, never in the way.** Case studies serve the technical reader; the homepage does not make the skimmer wade through them.
3. **Show range without blurring it.** Backend, full-stack, and AI work each appear as concrete evidence, not as a list of everything.
4. **Anonymity is not negotiable.** No design or copy choice may identify an employer.
5. **Only real evidence.** Every claim on the site traces to the data files or a project; nothing is invented to fill a gap.

## Accessibility & Inclusion

Text and background colour pairs must meet a 4.5:1 contrast ratio; `tests/tokens.test.mjs` enforces this. The browser tests check for horizontal overflow at 375px and 1280px.
