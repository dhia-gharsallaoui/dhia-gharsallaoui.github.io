# Synapse Dark Redesign — Design Spec

**Date:** 2026-07-01
**Branch:** `redesign/synapse-dark`
**Status:** Approved (design), implementing

## Goal

Re-skin the personal portfolio (Hugo + `hugo-profile`) to match the aesthetic of the
`CloudCTL` reference (`~/Downloads/index.html`): a dark, purple→blue "synapse gradient"
editorial tech look, while keeping it a personal portfolio driven by `hugo.yaml`.

## Decisions (from brainstorming)

1. **Fidelity:** Full dark re-skin **plus signature components** — project card grid,
   skills logo marquee, split contact form.
2. **Theme mode:** Keep the **light + dark toggle**. Dark is primary; light is a
   coherent derived variant (not an inversion). Reuse `hugo-profile`'s existing toggle
   (`body.classList` `dark`, `localStorage["pref-theme"]`, `prefers-color-scheme`).
3. **Sections:** hero, about, experience, projects, skills, education, contact, footer.
   **No** FAQ, **no** mission band, **no** achievements (dropped mid-build per request).
4. **Hero motion:** Keep the animated synapse-network **canvas**, gated on
   `prefers-reduced-motion` (static fallback) and paused when off-screen.
5. **Contact form:** **mailto-compose** — fields build a pre-filled
   `mailto:gharsallaoui.dhia@gmail.com`. No backend.
6. **Implementation:** **Approach A** — project-level Hugo layouts overriding the theme
   partials + a new CSS/JS design layer. Content stays in `hugo.yaml`; theme submodule
   untouched; CI + toggle preserved.

## Design system

- **Fonts:** Outfit (display + body), IBM Plex Mono (eyebrows, labels, stats, chips).
- **Dark tokens:** `--bg #0D0911`, `--surface #151022`, `--surface-2 #1B1430`,
  `--line rgba(170,120,210,.16)`, `--text #F1F1F1`, `--muted #9D93AC`,
  `--blue #1099EA`, `--purple #AA3BBD`, `--blue-bright #3FB2F7`, `--purple-bright #CC6ADF`,
  `--synapse linear-gradient(90deg,#1099EA,#6A6BD8,#AA3BBD)`, `--radius 14px`, `--max 1180px`.
- **Light tokens (derived):** `--bg #F6F4FA`, `--surface #FFFFFF`, `--surface-2 #F0ECF7`,
  `--text #17121F`, `--muted #665C77`, `--blue #0B79C9`, `--purple #8E2FA0`,
  `--line rgba(120,80,160,.14)`; synapse gradient reused (slightly deepened). Target AA contrast.
- Tokens on `:root` (light default), overridden under `body.dark`.

## Sections → content mapping (`hugo.yaml`)

| Section | Source params | Treatment |
|---|---|---|
| Nav | `hero.title`, `socialLinks` | Sticky translucent; synapse glyph + wordmark; links; gradient Contact pill; theme toggle |
| Hero | `hero.intro/title/subtitle/content/button/socialLinks` | Mono eyebrow tags → big Outfit headline w/ gradient accent phrase → subcopy → gradient CTA + ghost CTA → mono stat row → socials → animated canvas bg |
| About | `about.content` | Eyebrow + headline + paragraphs |
| Experience | `experience.items[]` | Vertical timeline w/ gradient spine; each role a surface card (job, company, date, achievement bullets) |
| Projects | `projects.items[]` (title, content, image, badges, links) | 3-col card grid using real screenshots as media + badge chips + View Project link; gradient hover |
| Skills | `about.skills.items[]` | Auto-scrolling **logo marquee** (self-hosted SVGs) for tools w/ logos + mono **concept-chips** row for logo-less skills |
| Education | `education.items[]` | Eyebrow + surface cards |
| Achievements | `achievements.items[]` | Eyebrow + surface cards |
| Contact | `socialLinks`, email | Split card: left copy + email + socials; right mailto-compose form |
| Footer | `hero.title`, `socialLinks` | Wordmark, copyright, links, socials |

New additive `hugo.yaml` params (optional, non-breaking): hero eyebrow tags, hero stats.

## File structure (project-level; overrides theme)

```
layouts/_default/baseof.html      # fonts + redesign CSS/JS; body toggle class; reuse toggle JS
layouts/index.html                # load redesign CSS only; order redesign partials
layouts/partials/redesign/*.html  # nav, hero, about, experience, projects,
                                  # skills, education, achievements, contact, footer, head
static/css/redesign.css           # full design system (tokens, sections, motion, responsive)
static/js/redesign.js             # canvas anim, scroll-reveal, marquee, toggle, mailto compose
static/icons/*.svg                # synapse logo + brand logos (MIT simple-icons subset)
```

## Motion

Hero canvas (nodes + synapse links); per-section scroll-reveal; marquee auto-scroll
(pause on hover); card/nav/button hover states. All gated on `prefers-reduced-motion`.
Canvas paused when off-screen via IntersectionObserver.

## Verification

Build with pinned Hugo 0.128.0 → serve → screenshot at 1440 / 1024 / 768 / 375 in
**both light and dark**, plus a `prefers-reduced-motion` pass. Compare against the
reference. Sanity-check no console errors and reasonable CWV.

## Out of scope

Real form backend, FAQ, mission band, blog/single-page redesign, changing `main`.
```
