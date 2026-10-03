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
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
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
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
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
  tile-featured:
    backgroundColor: "{colors.petrol-tint}"
    rounded: "{rounded.tile}"
    padding: "20px"
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
    padding: "16px 20px"
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
- One sans family for everything; mono appears only on tech tags.
- Sentence-case headings at readable sizes; no all-caps labels.

## Colors

A cool petrol blue and a warm maroon on neutral zinc greys, each accent with a pale tint for backgrounds.

### Primary
- **Petrol** (`petrol`): links, the primary button, diagram node outlines and the filled "main" node, the active table-of-contents marker, the industry name in the experience timeline, and tile borders on hover.
- **Petrol Dark** (`petrol-dark`): tech-tag text and the primary button on hover.
- **Petrol Tint** (`petrol-tint`): the featured project tile, the case-study diagram panel, and alternating fact tiles and diagram panels.

### Secondary
- **Maroon** (`maroon`): the highlighted half of the hero headline, the dot in the "carol." wordmark, diagram arrows, tile title arrows, the outline of a diagram's final node, and the left rule of a Key decision note.
- **Maroon Tint** (`maroon-tint`): Key decision notes, the "now" pill, and alternating fact tiles and diagram panels.

### Neutral
- **Paper** (`paper`): the page background.
- **Surface** (`surface`): tiles, buttons, and diagram nodes, one step brighter than the paper.
- **Ink** (`ink`): headings, the wordmark, button labels, role titles.
- **Ink Body** (`ink-body`): running text.
- **Muted** (`muted`): ledes, summaries, nav links, the footer.
- **Subtle** (`subtle`): timeline years and skill category names.
- **Border** (`border`): the outline of the default button.
- **Hairline** (`hairline`): tile outlines, timeline and table rules, the footer rule, the table-of-contents track.

### Named Rules
**The Two Pens Rule.** Petrol draws structure and invites action; maroon annotates. Maroon is never used for a button or a link, and petrol is never used for a callout.

**The Token-Only Rule.** Every colour is a CSS variable on `:root` in `assets/css/site.css`. No raw colour values appear outside that block; a test enforces it.

**The 4.5:1 Rule.** Every text colour meets 4.5:1 contrast on every background it sits on. `tests/tokens.test.mjs` checks each pair.

## Typography

**Display and Body Font:** Inter (with system-ui, -apple-system, Segoe UI, sans-serif), self-hosted in weights 400, 500, 600, and 700.
**Label/Mono Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo), weight 400.

**Character:** One plain, legible sans does all the talking, with hierarchy from weight and tight tracking instead of size jumps. Mono is a single small accent that marks technology names as data.

### Hierarchy
- **Display** (700, 40px, 1.15, -0.03em): the hero headline and case-study titles. Drops to 30px at 640px and below.
- **Headline** (600, 20px, 1.25, -0.01em): section headings on the homepage and inside case studies.
- **Title** (600, 17px, 1.25): project tile names and case-study subheadings. Fact values use the same weight at 20px.
- **Lede** (400, 17px, 1.6): the sentence under a display heading, in muted grey, capped at 60ch.
- **Body** (400, 16px, 1.6): running text. Case-study prose is capped at 68ch and the homepage intro at 65ch. Secondary text steps down to 15px and 14px.
- **Label** (JetBrains Mono 400, 12px): tech tags only.

### Named Rules
**The Mono-for-Tags Rule.** Mono type appears only on tech tags, never below 12px. Inline code in case studies uses the body font at weight 500.

**The Sentence-Case Rule.** No uppercase labels and no tiny eyebrow text. Headings are sentence case at 17px or larger.

## Layout

A single centred column with 20px side gutters: 760px wide on the homepage, 960px on case-study pages. Sections are stacked with 64px above each, and the hero sits 48px below the nav. The footer follows an 80px gap and a hairline rule.

Project tiles sit in a two-column grid with a 16px gap; the first project spans both columns. Fact tiles auto-fit at a 160px minimum. The experience timeline and skills list are two-column rows, a fixed label column (120px and 160px) beside the content. Case studies place a 150px sticky table of contents beside the article with a 48px gap.

Spacing follows a loose 4px rhythm: 4, 8, 12, 16, 20, 24, 32, 48, 64.

Responsive behaviour:
- **800px and below:** the case-study table of contents is hidden and the article takes the full column.
- **640px and below:** tiles, facts, timeline rows, and skill rows collapse to one column, and display type drops to 30px.
- The nav wraps instead of collapsing into a menu. Long strings break anywhere, and the page never scrolls horizontally at 375px.

## Elevation & Depth

The system is flat. There are no shadows. Depth comes from three tonal layers: off-white paper, white surfaces one step brighter, and pale petrol or maroon tints for anything that should stand forward. Hairline borders define white tiles against the paper.

### Named Rules
**The No-Shadow Rule.** Nothing lifts. Hover is shown by a border or background colour change over 150ms, never by movement or shadow.

**The Solid-Colour Rule.** No gradients. Every fill is one flat colour.

## Shapes

Soft, small corners throughout. Tiles, fact tiles, and the case-study diagram panel use gently rounded corners (12px). Buttons, diagram nodes, and inner panels use a tighter curve (8px). The "now" pill is fully rounded. Key decision notes are square on the left, where the maroon rule sits, and rounded (8px) on the right.

Borders are thin: 1px hairlines on tiles and rules, 1.5px on diagram nodes so the boxes read as drawn outlines. Tinted areas carry no border at all.

## Components

Light and unfussy: soft tints, thin lines, and generous space, with nothing that asks for attention.

### Buttons
- **Shape:** tight rounded corners (8px), 10px by 18px padding, 15px medium-weight label.
- **Primary:** petrol fill with white text. One per view; on the homepage it is "See projects".
- **Default:** white surface with a grey border and ink text, used for outbound links such as GitHub.
- **Hover / Focus:** primary darkens to Petrol Dark; default border darkens to Muted. Both transition over 150ms. Keyboard focus shows a 2px petrol outline offset by 2px.

### Tags
- **Style:** plain mono text in Petrol Dark at 12px, laid out as a wrapping row with 12px between items. No background, border, or pill shape.
- **State:** static; tags are not interactive.

### Project tiles
- **Corner Style:** 12px.
- **Background:** white surface with a hairline border. The featured tile is filled with Petrol Tint and spans the full row.
- **Shadow Strategy:** none; see Elevation & Depth.
- **Border:** hairline at rest, petrol on hover.
- **Internal Padding:** 20px, with 12px between the diagram, title, summary, and tags.
- **Behaviour:** the whole tile is one link. The title ends in a maroon arrow: `→` when it opens a case study, `↗` when it leaves for GitHub. Only the featured tile shows a summary. Non-featured tiles put their diagram on an alternating petrol or maroon tinted panel.

### Navigation
- **Style:** a single row with the "carol." wordmark on the left (18px bold, maroon dot) and three text links on the right (15px, muted).
- **States:** links darken to ink on hover. There is no active state and no mobile menu; the row wraps.
- **Footer:** a hairline rule, the outbound links in muted grey, and "Built with Hugo" at 14px.

### Architecture diagram (signature)
A row of three or four labelled boxes joined by maroon arrows, generated from project front matter. Nodes are white with a 1.5px petrol outline and petrol text. One node per diagram is filled petrol to mark the centre of the system, and the final node may take a maroon outline. Each arrow wraps together with the node after it, so no line ends on an arrow. The compact size (13px) sits in tiles; the large size (15px, centred) sits on a Petrol Tint panel at the top of a case study.

### Key decision note (signature)
A Maroon Tint block with a 3px maroon rule down the left edge and 16px by 20px padding, opening with "Key decision:" in bold ink. It marks the one or two choices in a case study that mattered most.

### Fact tiles
Borderless tinted tiles (12px corners, 16px padding) alternating Petrol Tint and Maroon Tint, each with a 20px semibold value over a 14px muted label.

### Timeline and skills rows
Two-column rows without boxes. The timeline sets years in subtle grey beside a role, a petrol industry name, and a one-line summary, with hairlines between rows. Skills set a subtle-grey category beside a comma-separated list.

### Table of contents
A sticky list at 14px with a 2px hairline track on the left. The section in view turns petrol, in both text and track, and gains medium weight.

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
- **Don't** use mono type for anything except tech tags, or set it below 12px.
- **Don't** use orange, bright aqua, or teal.
- **Don't** build boxes-everywhere card layouts; rows and whitespace come first, and tiles are reserved for projects and facts.
- **Don't** add screenshots of projects.
- **Don't** add a dark theme without adding a full second set of variables.
