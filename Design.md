# Design System — design.md
**This file governs every coding session on this project. Read it before writing any UI code.**

---

## 1. Non-negotiable rule: no hand-written components

**We do not build UI components by hand.** "By hand" means writing a component's markup/styling from scratch the normal way a coding agent defaults to. Every component used in this app must come from one of the sources below, in the order below. Do not skip the order to save time, and do not fall back to hand-written code just because it's faster — check every source in the chain first.

### Component sourcing order (strict priority)

1. **coss.com/UI** — check here first for any component.
2. **Motion Primitives** (motion-primitives) — check here second, especially for anything animated/interactive.
3. **Shared/common components** ("CM components") — if the required component isn't in either library above, check whether it already exists as a shared component in this codebase/design system before building anything new.
4. **Shadcn** — only if the component isn't available from any of the three sources above.

If, after checking all four sources, truly nothing fits: stop and ask before hand-building anything — don't silently fall back to a from-scratch component.

> **Setup:** Initialize the Coss UI registry with `npx shadcn@latest init @coss/style`, then add components through the Coss registry. See https://coss.com/ui/docs/get-started.

### Using each library's MCP server

Where a component library above exposes an MCP server, coding agents should connect to it and use it to:
- discover which components already exist for a given UI need, and
- install/scaffold the component directly through the MCP server,

**instead of** browsing the site manually or re-implementing the component from its docs/source by hand. This is faster and keeps every instance of a component in sync with the library's actual source.

Check at the start of each session whether an MCP server is configured/available for coss.com/UI and for Motion Primitives. If one is connected, always query it first for a matching component before doing anything else in the sourcing order above.

---

## 2. Design tokens

These are the only colors and fonts used anywhere in the app. Don't introduce new hex values, weights, or families outside this set.

```js
// tailwind.config.js (theme.extend)
module.exports = {
  theme: {
    extend: {
      colors: {
        text: 'rgb(26, 15, 13)',
        background: 'rgb(252, 249, 248)',
        primary: 'rgb(192, 101, 86)',
        secondary: 'rgb(222, 163, 154)',
        accent: 'rgb(212, 115, 99)',
      },
      fontSize: {
        sm: '0.750rem',
        base: '1rem',
        xl: '1.333rem',
        '2xl': '1.777rem',
        '3xl': '2.369rem',
        '4xl': '3.158rem',
        '5xl': '4.210rem',
      },
      fontFamily: {
        heading: 'Asta Sans',
        body: 'Asta Sans',
      },
      fontWeight: {
        normal: '400',
        bold: '700',
      },
    },
  },
};
```

**Usage rules:**
- `text` / `background` — base foreground/background pair for the whole app.
- `primary` — main call-to-action / brand color.
- `secondary` — lighter supporting tone (e.g. muted surfaces, subtle backgrounds, disabled-but-visible states).
- `accent` — highlights, active states, small emphasis details. Close to `primary` in hue on purpose — use it for restraint, not for a second competing brand color.
- Only two font weights exist (`normal` 400, `bold` 700) — don't reach for a medium/semibold that isn't defined here.
- `heading` and `body` currently point to the same family (Asta Sans) — keep the type scale (`sm`→`5xl`) as the way hierarchy is expressed, not by switching families.

---

## 3. Session checklist for coding agents

Before writing any UI code in a session:
1. Re-read this file.
2. Identify every component the task needs.
3. For each one, check coss.com/UI → Motion Primitives → shared/common components → Shadcn, in that order, using the library's MCP server where available.
4. Only write custom code for layout/composition that glues sourced components together — never for the components themselves.
5. Apply colors and fonts exclusively from the token set in Section 2.
