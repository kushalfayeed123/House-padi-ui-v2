# HousePadi Design System

A reference for AI assistants (or humans) building new screens for HousePadi.
Paste this whole document into a prompt when asking an LLM to design or style
a new page, so the output matches the rest of the product on the first try.

---

## 1. Concept

HousePadi is an AI real-estate agent for the Lagos rental market. The product's
entire value proposition is **trust through verification** — verified listings,
verified landlords, verified renters — delivered through a **chat-first**
interface rather than filter forms.

The visual language draws from two real, specific things in that world:
1. **Verification paperwork** — tickets, stamps, reference numbers, dashed
   tear-lines. Used *only* where something is actually being verified or
   confirmed (listings, KYC, leases) — never as decoration.
2. **The "closing the deal" arc** — the product opens dark (searching,
   negotiating) and closes light (paper/parchment, signing). This is why the
   footer is the one light-background surface on the site.

Do not default to generic SaaS patterns (numbered circle badges, floating
glass stat cards, teal-on-black) unless the content genuinely calls for them.

---

## 2. Color tokens

Defined as CSS custom properties in `app/globals.css`, consumed via Tailwind
arbitrary-value syntax: `bg-[var(--ink)]`, `text-[var(--amber)]`, etc.

| Token | Hex | Use for |
|---|---|---|
| `--ink` | `#0B1120` | Primary background (body, dark surfaces) |
| `--ink-soft` | `#131B2E` | Elevated dark surfaces — cards, panels, modals, inputs' containing element |
| `--amber` | `#E8A33D` | **The one accent color.** Primary CTAs, active states, links, focus rings, prices |
| `--amber-soft` | `#F0C374` | Hover state for amber elements only |
| `--verified` | `#2F8F6B` | Verification/trust signals *only* — "VERIFIED" stamps, KYC checkmarks, live-status dots. Do not use for general accents |
| `--paper` | `#F7F3E8` | Reserved for the footer and anything explicitly representing a signed document. Not a general light-mode surface |
| `--paper-dim` | `#EDE7D6` | Secondary tone on paper surfaces |

**Fixed rules, not suggestions:**
- Never use Tailwind's built-in `teal-*` or `slate-950/900/800` palettes on new screens — those are the old theme and will visually clash.
- Destructive actions (delete, archive, error states) stay on Tailwind's `red-400/500` — don't reroute those through amber.
- `--verified` green is earned, not decorative — only use it where something is actually confirmed/verified/live, otherwise it dilutes the signal.
- One accent color (`--amber`) at a time. Resist adding a second "pop" color.

---

## 3. Typography

Loaded via Google Fonts `@import` in `globals.css`.

| Role | Font | Tailwind/CSS class | Use for |
|---|---|---|---|
| Display | Fraunces (serif) | `font-display` | All headings (`h1`–`h3`), hero copy, section titles |
| Body | Inter (default sans) | *(default, no class needed)* | Paragraphs, labels, buttons, nav |
| Numerals/data | JetBrains Mono | `font-mono-num` | Prices, reference/ID numbers, timestamps, stat figures — anything that reads as verified data |

Headings are `font-semibold` or `font-medium`, never `font-bold` — the serif
carries enough weight on its own. Body text stays on Inter's default weights.

---

## 4. Layout & structure conventions

- Max content width: `max-w-7xl` for full sections, `max-w-3xl`/`max-w-sm` for forms/auth.
- Standard section vertical rhythm: `mb-20` between major landing-page sections.
- Card radius: `rounded-2xl` for content cards, `rounded-3xl` for large panels/modals, `rounded-xl` for buttons/inputs.
- Borders are `border-white/10` or `border-white/5` on dark surfaces — never a solid gray border.
- Fixed header is `h-20`; any page rendering `<Header />` needs `pt-32` on its main content to clear it.

---

## 5. Signature element: the ticket stub

The one recurring, ownable visual motif. A `.ticket-stub` class (defined in
`globals.css`) adds a faint amber gradient border. Combine with:
- A rotated "VERIFIED" badge: dashed border, `--verified` or `--amber`, `-rotate-6`, `font-mono-num`, small caps tracking-wide text.
- A dashed divider (`border-dashed border-white/10`) separating content from a footer.
- A mono reference number + brand mark footer: `REF #XXXXXXXX` / `HOUSEPADI`.

**Use this only where verification or a discrete "record" is the actual
content** — property listing results, KYC status, lease confirmations. Do not
apply it to marketing sections, nav, or anything that isn't representing a
verified record. Overuse turns a signature into wallpaper.

---

## 6. Components

**Primary button:** `bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-semibold rounded-xl transition-colors`

**Secondary/ghost button:** `bg-[var(--ink-soft)] hover:bg-white/5 text-slate-200 border border-white/10 rounded-xl transition-colors`

**Destructive action (text link, not filled):** `text-red-400 hover:text-red-300 transition-colors`

**Text input:** `bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors`

**Card:** `bg-[var(--ink-soft)] rounded-2xl border border-white/10` (add `hover:border-[var(--amber)]/40 transition-colors` if interactive)

**Status badge:** `bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20 rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider`

---

## 7. Motion & accessibility floor

- Use `motion-safe:` prefix on any animation/transition beyond simple color/border transitions, so `prefers-reduced-motion` is respected.
- All interactive elements need a visible focus state: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]`.
- Don't rely on color alone for status (pair the `--verified` dot with text, not just a colored dot).

---

## 8. Tech notes

- Tailwind **v4** (`@import "tailwindcss";` in `globals.css`, no `tailwind.config.js` theme extension needed for these tokens — they're plain CSS custom properties consumed via `[var(--x)]` arbitrary values).
- Use bracket syntax `bg-[var(--amber)]` consistently rather than the v4 shorthand `bg-(--amber)` — both work, but mixing them in the same file makes future diffs harder to scan and was a source of confusion once already.
- Keep dark-surface color logic in Tailwind classes directly rather than adding new global utility classes unless a pattern repeats 3+ times across files.

---

## 9. Prompt template for new screens

> Build [screen name] for HousePadi. Follow the HousePadi Design System doc
> exactly: `--ink`/`--ink-soft` backgrounds, `--amber` as the only accent,
> `--verified` green reserved for actual verification signals, Fraunces via
> `font-display` for headings, JetBrains Mono via `font-mono-num` for any
> price/ID/reference number. Use the `.ticket-stub` signature only if this
> screen shows a verified record (listing, KYC, lease) — otherwise skip it.
> Match existing button/input/card class patterns from section 6 exactly
> rather than inventing new ones.
