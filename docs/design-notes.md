# Site redesign: working notes

Decisions and candidates from brainstorming (2026-09-27). The final spec will supersede this file.

## Direction

- A mix of "minimal technical" (B) and "bold visual" (C): a light, clean base with a tinted featured-project tile and screenshot slots.
- No tiny all-caps labels anywhere. Section headings are sentence case at a readable size.
- Mono font only for tech tags, at 12px or larger.
- Skills are shown as readable rows (category → items), not card grids.
- Solid colors only; no gradients.
- Anonymity: never name employers. No resume link, no LinkedIn.
- Links: GitHub only for now; data model should allow adding Email later.
- About section: layout A (stacked), short intro, then 3 fact tiles, then an anonymous Experience timeline (years · role · industry · one line on what you did).
- Projects: no screenshots. Each tile shows a mini architecture diagram (3–4 boxes, HTML from data). Featured projects (office-hours, strength-in-numbers) get case-study pages; smaller ones link to GitHub.
- Case-study pages: layout B. Title, lede, tags, diagram hero, then a sticky section sidebar (hidden on mobile) with maroon "Key decision" callouts. Sections: Problem, What I built, How it works, Decisions & tradeoffs, Results & evals, What I would do next.
- Light mode only. Colors are CSS variables so dark mode can be added later.
- Avoid: orange, bright aqua/teal (the current site), boxes-everywhere card layouts.

## Palette candidates (all liked)

| Name        | Accent    | Light accent            | Dark text variant | Tint      |
|-------------|-----------|-------------------------|-------------------|-----------|
| Petrol blue | `#1D5F7A` | `#5FA3B8`               | `#174C62`         | `#E6F0F3` |
| Deep spruce | `#12695F` | `#5DAA9C`               | `#0E544C`         | `#E4F1EE` |
| Bordeaux    | `#7B1E3A` | `#C0607C`               | `#651830`         | `#F6E9ED` |
| Maroon      | `#6E2230` | `#B0636F`               | `#5A1B27`         | `#F4E9EA` |

Neutrals used in mockups: background `#FAFAF9`, text `#18181B`, muted `#52525B`, border `#E4E4E7`.

**Chosen:** Petrol blue `#1D5F7A` as primary, Maroon `#6E2230` as secondary. Mockups from every round are saved in `docs/redesign-options.pdf`.
