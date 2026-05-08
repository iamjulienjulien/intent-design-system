# Intent Design System

**A design system where meaning comes first.**  
**A narrative contract between the interface and the player.**

---

## 🚀 v0.3.0 — Full Component Library

Version **0.3.0** marks a new milestone for Intent Design System.

The system now ships **50 intent-first components** across every UI layer:

- surfaces, overlays and feedback
- form controls (inputs, selects, tags, date, color, files, markdown…)
- data display (table, tree, code, PDF, stats, charts…)
- layout and navigation (toolbar, drawer, dialog, stepper, timeline…)
- design utilities (theme preview, tone picker, glow picker)

> Intent Design System is a complete, extensible semantic UI system.

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

> The design system is distributed via **npm**.

```bash
npm install intent-design-system
```

### CSS import (required)

```ts
import "intent-design-system/styles";
```

> **Note:** `zustand` is bundled as a runtime dependency — no separate install needed.

---

## 🧱 Components (50)

### Surfaces
`IntentSurface` · `IntentSurfaceCard` · `IntentSurfacePanel` · `IntentSurfaceSkeleton` · `IntentSurfaceWidget`

### Controls
`IntentControlButton` · `IntentControlButtonGroup` · `IntentControlLink` · `IntentControlToggle` · `IntentControlSegmented` · `IntentControlTabs` · `IntentControlSelect` · `IntentControlCombobox` · `IntentControlInput` · `IntentControlTags` · `IntentControlDate` · `IntentControlTime` · `IntentControlField` · `IntentControlMarkdown` · `IntentControlData` · `IntentControlColor` · `IntentControlFiles` · `IntentControlDropdown` · `IntentControlNavList` · `IntentControlRange`

### Overlays & Feedback
`IntentCommandPalette` · `IntentDialog` · `IntentDrawer` · `IntentPopover` · `IntentConfirmDialog` · `IntentToast`

### Layout
`IntentDivider` · `IntentJourney` · `IntentStepper` · `IntentTimeline` · `IntentToolbar`

### Data & Content
`IntentTable` · `IntentTree` · `IntentCodeViewer` · `IntentContentText` · `IntentStat` · `IntentPdfViewer` · `IntentLoader` · `IntentProgressBar`

### Indicators
`IntentIndicator`

### Visualization
`IntentVisualizationBar` · `IntentGenealogyHierarchy`

### Design
`IntentPickerTone` · `IntentPickerGlow` · `IntentThemePreview`

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

Intent is the **semantic contract**.  
Variant, tone, glow, and intensity adapt automatically.

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

Variants **frame** intent.  
They never change its meaning.

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

`aurora` · `ember` · `cosmic` · `mythic` · `royal` · `mono`

---

## 🌗 Mode

```tsx
<IntentSurface mode="light" />
```

- `dark` (default)
- `light`

---

## ⚙️ Unified Intent API

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

## 🧪 Playground

The playground is a **separate repository**, used for exploration and validation.  
It is **not yet published** and intentionally decoupled from the library.

---

## 🧠 Philosophy

Intent is meaning.  
Visuals are consequences.

The interface is not a menu.  
It is a **world**.

---

## 👋 About the developer

**Julien Julien**  
Full Stack Developer & narrative project creator.

> I design sustainable digital applications and tools  
> where code, structure, and storytelling move forward together.
>
> I favor clear, evolutive systems,  
> built for the long term rather than the instant.

📍 Angers, France 🇫🇷  
🌍 https://julienjulien.fr
