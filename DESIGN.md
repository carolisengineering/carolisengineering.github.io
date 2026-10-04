---
name: carolisengineering
description: A light, flat portfolio where architecture diagrams carry the structure and maroon notes carry the reasoning.
colors:
  petrol: "#1D5F7A"
  petrol-dark: "#174C62"
  petrol-tint: "#E6F0F3"
  maroon: "#6E2230"
  maroon-tint: "#F4E9EA"
  paper: "#FAFAF9"
  surface: "#FFFFFF"
  ink: "#18181B"
  ink-body: "#3F3F46"
  muted: "#52525B"
  subtle: "#71717A"
  border: "#E4E4E7"
  hairline: "#EDEDEC"
  on-petrol: "#FFFFFF"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
  lede:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  box: "8px"
  tile: "12px"
  pill: "999px"
spacing:
  gutter: "20px"
  tile-gap: "16px"
  tile-pad: "20px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.petrol}"
    textColor: "{colors.on-petrol}"
    rounded: "{rounded.box}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.petrol-dark}"
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.box}"
    padding: "10px 18px"
  tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.tile}"
    padding: "20px"
  tile-compact:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.tile}"
    padding: "16px 20px"
  node:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.petrol}"
    rounded: "{rounded.box}"
    padding: "6px 10px"
  node-primary:
    backgroundColor: "{colors.petrol}"
    textColor: "{colors.on-petrol}"
    rounded: "{rounded.box}"
    padding: "6px 10px"
  node-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.maroon}"
    rounded: "{rounded.box}"
    padding: "6px 10px"
  fact:
    backgroundColor: "{colors.petrol-tint}"
    rounded: "{rounded.tile}"
    padding: "16px"
  decision:
    backgroundColor: "{colors.maroon-tint}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.box}"
    padding: "24px 20px 16px"
  decision-label:
    backgroundColor: "{colors.maroon}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  tag:
    textColor: "{colors.petrol-dark}"
    typography: "{typography.label}"
---

# Design System: carolisengineering

## Overview

**Creative North Star: "The Annotated Schematic"**

The site reads like a clean technical drawing with notes in the margin. Each project is introduced by a small architecture diagram, three or four labelled boxes joined by arrows, and the reasoning behind the work is set apart in maroon "Key decision" notes. Petrol blue draws the structure; maroon marks the annotation. Everything else is ink on off-white paper.

The feel is light and unfussy. Surfaces are flat, tints are soft, and space does the separating that borders and shadows would do elsewhere. A narrow single column (760px on the homepage, 960px on case studies) keeps the page calm and quick to skim. The system was built to replace a dark, aqua, card-heavy theme that looked generic, and it deliberately avoids every one of those traits.

**Key Characteristics:**
- Light mode only, on warm off-white paper.
- Two accents with fixed jobs: petrol for structure and action, maroon for annotation and emphasis.
- Flat: no shadows and no gradients anywhere.
- Diagrams built from HTML boxes stand in for screenshots.
- One sans family for everything; there is no mono face.
- Sentence-case headings at readable sizes; no all-caps labels.

## Colors

A cool petrol blue and a warm maroon on neutral zinc greys, each accent with a pale tint for backgrounds.

### Primary
- **Petrol** (`petrol`): links, the primary button, diagram node outlines and the filled "main" node, the active table-of-contents marker, and tile borders on hover.
- **Petrol Dark** (`petrol-dark`): tech-tag text and the primary button on hover.
- **Petrol Tint** (`petrol-tint`): the diagram panel in project tiles and at the top of a case study, fact tiles, and text selection.

### Secondary
- **Maroon** (`maroon`): the highlighted half of the hero headline, the dot in the "carol." wordmark, diagram arrows, tile title arrows, the outline of a diagram's final node, connector labels, and the label on a Key decision note.
- **Maroon Tint** (`maroon-tint`): Key decision notes and the "now" pill.

### Neutral
- **Paper** (`paper`): the page background.
- **Surface** (`surface`): tiles, buttons, and diagram nodes, one step brighter than the paper.
- **Ink** (`ink`): headings, the wordmark, button labels, role titles.
- **Ink Body** (`ink-body`): running text.
- **Muted** (`muted`): ledes, summaries, nav links, the footer.
- **Subtle** (`subtle`): timeline years, skill category names, and the outline of the default button.
- **Border** (`border`): reserved; no component uses it at present.
- **Hairline** (`hairline`): tile outlines, timeline and table rules, the footer rule, the table-of-contents track.

### Named Rules
**The Two Pens Rule.** Petrol draws structure and invites action; maroon annotates. Maroon is never the colour of a button or of link text, and petrol is never used for a callout. A small maroon arrow may mark direction inside a link.

**The Token-Only Rule.** Every colour is a CSS variable on `:root` in `assets/css/site.css`. No raw colour values appear outside that block; a test enforces it.

**The 4.5:1 Rule.** Every text colour meets 4.5:1 contrast on every background it sits on. `tests/tokens.test.mjs` checks each pair.

## Typography

**Display and Body Font:** Inter (with system-ui, -apple-system, Segoe UI, sans-serif), self-hosted in weights 400, 500, 600, and 700.

Sizes are written in `rem` in the stylesheet, so the scale follows the visitor's default text size; the pixel values here assume the usual 16px default.

**Character:** One plain, legible sans does all the talking, with hierarchy from weight and tight tracking instead of size jumps.

### Hierarchy
- **Display** (700, 40px, 1.15, -0.03em): the hero headline and case-study titles. Drops to 30px at 640px and below.
- **Headline** (600, 24px, 1.25, -0.02em): section headings on the homepage and inside case studies.
- **Title** (600, 17px, 1.25): project tile names and case-study subheadings. Fact values use the same weight at 20px.
- **Lede** (400, 17px, 1.6): the sentence under a display heading, in muted grey, capped at 60ch.
- **Body** (400, 16px, 1.6): running text. Case-study prose is capped at 56ch, which sets about 70 characters to a line in Inter (`ch` is the width of "0", wider than the average letter). Headings use balanced wrapping. Secondary text steps down to 15px and 14px.
- **Label** (500, 13px, Petrol Dark): tech tags.

### Named Rules
**The One-Family Rule.** Inter sets everything, including tech tags and inline code. There is no mono face: it read as a costume, not as information. Inline code in case studies uses the body font at weight 500.

**The Sentence-Case Rule.** No uppercase labels and no tiny eyebrow text. Headings are sentence case at 17px or larger.

## Layout

A single centred column with 20px side gutters: 760px wide on the homepage, 960px on case-study pages. The homepage runs hero, About, Projects, Experience, Skills; Experience is hidden while `showExperience` is `false` in `data/about.json`. Sections are stacked with 64px above each, and the hero sits 48px below the nav. The footer follows an 80px gap and a hairline rule.

Project tiles sit in a two-column grid with a 16px gap; a project without a case study spans both columns as a compact row. Fact tiles auto-fit at a 160px minimum. The experience timeline and skills list are two-column rows, a fixed label column (120px and 160px) beside the content. Case studies place a 180px sticky table of contents beside the article with a 64px gap.

Spacing follows a loose 4px rhythm: 4, 8, 12, 16, 20, 24, 32, 48, 64.

Responsive behaviour:
- **800px and below:** the case-study table of contents becomes a wrapping row of links above the article, and the article takes the full column.
- **640px and below:** tiles, timeline rows, and skill rows collapse to one column, and display type drops to 30px. Fact tiles stack, each setting its value beside its label on a 120px column.
- Text links in the nav, footer, and case-study header keep their visual size but carry padding that gives each a touch target at least 44px tall. The nav wraps instead of collapsing into a menu. Long strings break anywhere, and the page never scrolls horizontally at 375px.

## Elevation & Depth

The system is flat. There are no shadows. Depth comes from three tonal layers: off-white paper, white surfaces one step brighter, and pale petrol or maroon tints for anything that should stand forward. Hairline borders define white tiles against the paper.

### Named Rules
**The No-Shadow Rule.** Nothing lifts. Hover is shown by a border or background colour change over 150ms, never by movement or shadow.

**The Solid-Colour Rule.** No gradients. Every fill is one flat colour.

## Shapes

Soft, small corners throughout. Tiles, fact tiles, and the case-study diagram panel use gently rounded corners (12px). Buttons, diagram nodes, and inner panels use a tighter curve (8px). The "now" pill is fully rounded. Key decision notes are rounded (8px) on every corner, and their label is fully rounded.

Borders are thin: 1px hairlines on tiles and rules, 1.5px on diagram nodes so the boxes read as drawn outlines. Tinted areas carry no border at all.

## Components

Light and unfussy: soft tints, thin lines, and generous space, with nothing that asks for attention.

### Buttons
- **Shape:** tight rounded corners (8px), 10px by 18px padding, 15px medium-weight label.
- **Primary:** petrol fill with white text. One per view; on the homepage it is "See projects".
- **Default:** white surface with a mid-grey border (the Subtle grey, so the edge is visible against the paper) and ink text, used for outbound links such as GitHub.
- **Hover / Focus:** primary darkens to Petrol Dark; default border darkens to Ink. Both transition over 150ms. Keyboard focus shows a 2px petrol outline offset by 2px.

### Tags
- **Style:** a list in the body font, Petrol Dark at 13px medium, with a subtle-grey dot between items. It wraps like text. No background, border, or pill shape.
- **State:** static; tags are not interactive.

### Project tiles
- **Corner Style:** 12px.
- **Background:** white surface with a hairline border. The diagram sits on a Petrol Tint panel.
- **Shadow Strategy:** none; see Elevation & Depth.
- **Border:** hairline at rest, petrol on hover.
- **Internal Padding:** 20px, with 12px between the diagram, title, summary, and tags.
- **Behaviour:** the whole tile is one link. The title ends in a maroon arrow: `→` when it opens a case study, `↗` when it leaves for GitHub. Every tile shows its summary. Projects with a case study get equal tiles, two to a row. A project without one gets a compact full-width row: tighter padding (16px by 20px) and no diagram panel.

### Navigation
- **Style:** a single row with the "carol." wordmark on the left (18px bold, maroon dot) and three text links on the right (15px, muted).
- **States:** links darken to ink on hover. There is no active state and no mobile menu; the row wraps.
- **Footer:** a hairline rule, the outbound links in muted grey, and "Built with Hugo" at 14px.

### Chain diagram (signature)
A row of three or four labelled boxes joined by maroon arrows, generated from project front matter. Nodes are white with a 1.5px petrol outline and petrol text. One node per diagram is filled petrol to mark the centre of the system, and the final node may take a maroon outline. Arrows are drawn as small SVG strokes, not typed glyphs, so one-way and two-way connectors share one weight. A diagram is always one row or one column: when its container is too narrow for a row (520px for compact, 720px for large) it stacks with the arrows pointing down. The compact size (13px) sits in tiles. A case study without an architecture diagram falls back to the large size (15px, centred) on its Petrol Tint panel.

### Key decision note (signature)
A Maroon Tint block (8px corners) with a small maroon "Key decision" label sitting on its top edge, like a tag on a drawing: white 13px semibold text on a fully rounded maroon pill. There is no side stripe. It marks the one choice in a case study that mattered most. The same decision appears as one line on the project's homepage tile, introduced by "Key decision" in maroon semibold.

### Architecture diagram (signature)
The diagram at the top of a case study. Up to about six nodes sit on a small grid, joined by thin maroon connectors that can carry a one-word label ("REST", "search"). Nodes may carry a second, lighter line. Connectors are drawn with borders, so they stretch to fit. Below 720px of container width the grid transposes, rows becoming columns, so the diagram stays legible on a phone instead of shrinking. Tiles keep the short three-box chain.

### Results at a glance
A row of fact tiles directly under a case study's diagram, each a short figure over a plain label, taken from the project's `outcomes` front matter. It lets a reader find the results without scrolling to the Results section.

### Decision lead-ins and results tables
In a case study, each decision paragraph outside the Key decision note opens with a bold lead-in in ink that names the decision. Comparisons across versions go in a table: hairline row rules, a subtle-grey header, tabular figures that never break across lines.

### Status label
A small fully rounded Maroon Tint label with maroon 13px medium text, such as "In progress". It sits beside a project title on its tile and on its case study, and marks a state the reader should know before reading on.

### Fact tiles
Borderless Petrol Tint tiles (12px corners, 16px padding), each with a 20px semibold value over a 14px muted label. They share one tint: maroon is kept for annotation.

### Timeline and skills rows
Two-column rows without boxes. The timeline sets years in subtle grey beside a role in ink, an industry name in muted grey, and a one-line summary, with hairlines between rows. Skills set a subtle-grey category beside a list separated by the same subtle-grey dot as the tech tags.

### Table of contents
A sticky list at 14px with a 2px hairline track on the left. The section being read turns petrol, in both text and track, gains medium weight, and is marked `aria-current`. The first section is marked at load and the last once the page is scrolled to the bottom.

### Case-study ending
A hairline rule, then one row: "Next project: name →" in 17px semibold ink on the left, and the Repo and All projects links on the right.

### Skip link
A petrol button reading "Skip to content", off screen until it receives keyboard focus, when it appears at the top left.

## Do's and Don'ts

### Do:
- **Do** take every colour from the `:root` variables in `assets/css/site.css`.
- **Do** keep petrol for structure and action, and maroon for annotation.
- **Do** show a project with a 3–4 node diagram generated from data.
- **Do** separate content with space, hairlines, and tints.
- **Do** keep headings sentence case at 17px or larger.
- **Do** keep hover changes to border or background colour over 150ms, and remove transitions under `prefers-reduced-motion`.
- **Do** keep every text and background pair at 4.5:1 or better.
- **Do** check any new layout at 375px and 1280px for horizontal overflow.

### Don't:
- **Don't** use gradients; fills are solid.
- **Don't** add shadows.
- **Don't** use tiny all-caps labels.
- **Don't** add a mono face, for tags or anything else.
- **Don't** use orange, bright aqua, or teal.
- **Don't** build boxes-everywhere card layouts; rows and whitespace come first, and tiles are reserved for projects and facts.
- **Don't** add screenshots of projects.
- **Don't** add a dark theme without adding a full second set of variables.
