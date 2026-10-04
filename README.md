# carolisengineering.github.io

Personal portfolio site, built with [Hugo](https://gohugo.io/) (no theme) and deployed to GitHub Pages by GitHub Actions.

## Where things live

| Path | What it is |
|---|---|
| `data/about.json` | Hero, about, facts, experience, skills, and links |
| `content/projects/*.md` | One file per project: front matter drives the homepage tile, the body is the case study |
| `layouts/` | All templates (`_default/baseof.html` shell, `index.html` homepage, `projects/single.html` case study, `404.html`, partials, the `decision` shortcode) |
| `assets/css/site.css` | The only stylesheet; every color is a CSS variable on `:root` |
| `static/` | Fonts (with their OFL licenses) and the favicon, copied as-is |
| `tests/`, `scripts/` | Build tests, browser checks, and the screenshot script |
| `docs/` | Design spec and implementation plan for the redesign |

A project without a case study sets `build: { render: never, list: always }`, which gives it a compact row that links to its repo and no page of its own.

Project front matter drives three things beyond the title, summary, tags and repo:

- `diagram`: the short chain of 3–4 boxes on the homepage tile. Each node has a `label`, an optional `style` (`primary` or `secondary`), and a `next` connector (`"→"` or `"⇄"`) on every node except the last.
- `architecture`: the fuller diagram at the top of the case study. `nodes` each take an `id`, `label`, `row` and `col`, plus optional `note`, `style` and `span`; `edges` join two neighbouring nodes with `from`, `to`, and an optional `label` or `both: true`. Without it, the case study shows the `diagram` chain.
- `decision`: one sentence shown as the "Key decision" line on the tile.
- `outcomes`: up to three `{ value, label }` results shown as tiles under the case-study diagram.
- `status`: an optional short state such as "In progress", shown as a small label beside the title on the tile and the case study.

## Prerequisites

- Hugo **0.166.0**, the same version CI pins in `.github/workflows/hugo.yml`: `brew install hugo`, then `hugo version`.
- Node 22+ for the tests: `npm install`, then `npx playwright install chromium` once for the browser tests.

## Run it locally

```bash
hugo server            # http://localhost:1313, rebuilds on save
hugo server -D         # also renders drafts
```

`hugo server` builds in memory and doesn't write to `public/`. Placeholder warnings (below) show in the terminal, and the page still renders.

## Test it

```bash
npm test                  # every test: build output, links, contrast, TOC, overflow at 375px and 1280px
node --test tests/home.test.mjs   # one file
npm run og                # regenerate static/og.png, the social preview card, from the homepage
npm run screenshots       # full-page PNGs of home, a case study, and 404 at 375px and 1280px → screenshots/
```

The tests never touch your working tree. Each one copies the site to a temp directory, builds it with Hugo, and checks the output. By default they swap every `[TODO…]` placeholder in `data/about.json` for a filler value, so they pass before your years and experience are in. Project files get no such swap, so a `[TODO` in a project's front matter or case study fails the tests.

To check the build exactly the way CI runs it:

```bash
REQUIRE_FILLED=1 npm test         # the full suite, plus a check for any [TODO in the output
hugo --minify --panicOnWarning
```

### Placeholders

Any string in `data/about.json` or project front matter that contains `[TODO` is a placeholder. Hugo prints a warning for each one (`placeholder not filled: data/about.json.facts[0].value = …`). It also warns for every required field that is missing or empty, such as a project without `summary`, `tags` or `repo` (`project zz is missing repo`). Because CI builds with `--panicOnWarning`, **a site with placeholders cannot deploy**, and neither can one with any other Hugo warning. That includes a malformed project diagram, which needs 3–4 nodes, with `next` on every node except the last.

## The `public/` folder

`hugo` (without `server`) writes the finished site to `public/`. Hugo also creates `resources/` (a cache of processed assets) and `.hugo_build.lock`.

**None of these are committed.** They're all in `.gitignore`:

- CI builds the site from source on every push to `main`, and `peaceiris/actions-gh-pages` publishes the resulting `public/` to the `gh-pages` branch. GitHub Pages serves that branch.
- A committed `public/` would go stale the moment any source file changed, and every build would add a noisy diff.
- If `public/` shows up in `git status`, the ignore rule is missing or the files were added before the rule existed. Remove them from the index with `git rm -r --cached --ignore-unmatch public resources` (this keeps the files on disk) and commit.

A local `hugo` build is safe to delete at any time: `rm -rf public resources`. Don't edit files in `public/` by hand; the next build overwrites them.

Similarly, `node_modules/` and `screenshots/` are ignored. `package-lock.json` **is** committed so test dependencies stay pinned.

## Deploying

Merging to `main` deploys. The workflow checks out the repo, installs the pinned Hugo, Node 22 and Chromium, runs `npm test` with `REQUIRE_FILLED=1`, runs `hugo --minify --panicOnWarning`, and pushes `public/` to `gh-pages`. A failing test or any `[TODO` in the output (including a case-study body) stops the deploy. To upgrade Hugo, change the version in the workflow and install the same version locally, so local builds match CI.
