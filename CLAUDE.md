# Claude Code — Operational Guide for theafricanparent.org

## Workflow

- **New root pages**: Always add new paths to `validPrefixes` in `middleware.ts`
- **Saving changes**: Run `git push origin claude/fervent-mirzakhani:anne` (anne is the default upstream branch)
- **Styling**: Always work with the existing `globals.css` and Tailwind theme — do not create parallel design systems
- **Documentation**: After every session, create a file in `annes-changes-summary/` with format `dd-mm-yy-title-of-change.md`

---

## Styling Conventions

- **Icons**: Use `react-icons` — never emojis in UI
- **Icon library priority**: `react-icons` over `lucide-react`
- **Buttons**: Always use `<CustomButton>` component (`/components/CustomButton.tsx`) with existing variants:
  - `primary` — green background, white text
  - `secondary` — transparent, green border
  - `urgent` — terracotta background, white text
  - `primary-deep` — deep green background, white text
- **Special spans**: Use `<WavyUnderlineSpan>` / `<CircleSpan>` from `components/SpecialSpan.tsx` where appropriate
- **No box shadows** or scale/translation hover effects on buttons
- **No new shadow utilities** on interactive elements

---

## Architecture Rules

- **Modularise**: Keep client (`"use client"`) and server components in separate files
- **State management**: Use React context, custom hooks, and `useMutation` — avoid repetitive `useState`/`useEffect` chains
- **Form validation**: Always use `zod` for schema validation
- **Component location**:
  - Page-level shared components → `app/components/`
  - Global reusable UI → `components/`
  - Page-specific sub-components → co-locate in the page's directory

---

## Guardrails — Read Before Editing

| Area | Rule |
|---|---|
| `prisma/` files | ❌ Do not modify |
| `prisma/schema.prisma` | ❌ Never change without notifying Henry |
| Server actions / fetch files | ⚠️ Do not change logic without notifying Henry and waiting for approval |
| Core layout files | ⚠️ Discuss major structural changes first |

**Henry must be informed before any changes to:**
- `app/actions/` (server actions)
- `lib/` (utility functions used by server logic)
- `prisma/schema.prisma`
- API route handlers (`app/api/`)

---

## Division of Responsibility

| Anne | Henry |
|---|---|
| UI design, copy, page structure | Logic, data fetching, server actions |
| New pages, components, styling | Schema changes, API changes |
| Brand tokens, layout | Auth, payments, webhooks |

The goal is: **Anne makes UI changes easily. Henry makes logic changes to match the UI.**

---

## Pricing Conventions

| Product type | Format |
|---|---|
| Single tools | `£9`, `£12`, `£14`, `£29` |
| Action packs | `£22`, `£24`, `£49` |
| Strategy session | `£75 per session` |
| Variable parent support | `From £180` |
| School entry offers | `From £450`, `From £1,200` |
| Large school consultancy | `Custom pricing based on scope` |

**Never use ranges** (e.g. `£9–£29`).

---

## Email Routing

| Address | Used for | Visible? |
|---|---|---|
| `hello@theafricanparent.org` | General enquiries | ✅ Footer, contact page |
| `support@theafricanparent.org` | Parent support, post-purchase | ✅ Parent flows |
| `schools@theafricanparent.org` | School/institutional enquiries | ✅ Schools page |
| `media@theafricanparent.org` | Press, speaking | ✅ Selective |
| `safeguarding@theafricanparent.org` | Safeguarding concerns only | ✅ Safeguarding page only |
| `shop@` `finance@` `bookings@` `admin@` | System/internal only | ❌ Never display |

All forms must route internally — never expose hidden email addresses in HTML.

---

## User Journey Model

```
Problem
→ identify situation (/tools/start-here)
→ get immediate direction (situation page)
→ choose a tool or paid pack (tool card with price)
→ take action
→ upgrade to strategy session if needed (/work-with-me)
```

Tools pages must be **situation-led**, not product-grid layout.
