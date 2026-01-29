# Intent Design System

**A design system where meaning comes first.**  
**A narrative contract between the interface and the player.**

---

## ✨ What is Intent Design System?

Intent Design System is **not** a styling framework.

It is a **semantic design system** built around a single idea:

> **Every interface speaks.  
> Intent defines what it says.**

Instead of starting from colors, tokens, or components,  
Intent Design System starts with **meaning**.

Visuals are never decisions.  
They are **consequences**.

---

## 📦 Installation

```bash
npm install intent-design-system
# or
pnpm add intent-design-system
```

### CSS import (required)

```ts
import "intent-design-system/styles/intent.css";
```

---

## 🚀 Basic usage

```tsx
import { IntentSurface } from "intent-design-system";

<IntentSurface className="p-6 rounded-ids-2xl">Informed surface</IntentSurface>;
```

---

## 🎯 Intent comes first

```tsx
<IntentSurface intent="empowered">Success!</IntentSurface>
```

---

## 🧭 Intents

- **informed** — Neutral information
- **empowered** — Success & progression
- **warned** — Attention required
- **threatened** — Danger & errors
- **themed** — Brand / product semantic
- **toned** — Explicit color intent
- **glowed** — Presence & aura

---

## 🧱 Variants

- `flat`
- `outlined`
- `elevated`
- `ghost`

Variants frame intent. They never change it.

---

## 🎨 Tone (intent="toned")

```tsx
<IntentSurface intent="toned" tone="emerald" />
```

---

## ✨ Glow

```tsx
<IntentSurface glow />
<IntentSurface intent="glowed" glow="aurora" />
```

Aesthetic glows:
aurora · ember · cosmic · mythic · royal · mono

---

## 🌗 Mode

```tsx
<IntentSurface mode="light" />
```

- `dark` (default)
- `light`

---

## ⚙️ API

```ts
intent?: IntentName;
variant?: VariantName;
tone?: ToneName;
glow?: boolean | GlowName;
intensity?: "soft" | "medium" | "strong";
mode?: "dark" | "light";
disabled?: boolean;
```

---

## 🧠 Philosophy

Intent is meaning.  
Visuals are consequences.

The interface is not a menu.  
It is a **world**.
