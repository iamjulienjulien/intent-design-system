# Changelog

All notable changes to **Intent Design System** will be documented in this file.

The format is inspired by _Keep a Changelog_ and follows _Semantic Versioning_.

---

## [0.2.2] — 2026-02-04

### ✨ Minor release — Form controls expansion

This release extends the **form control layer** of Intent Design System,  
introducing intent-first inputs designed to work **standalone** or **composed** inside fields.

---

### ➕ Added

#### 🕹️ Controls

- **IntentControlInput**
    - Unified input / textarea component
    - Standalone mode (with visual frame)
    - `insideField` mode for seamless integration with `IntentControlField`
    - Optional textarea autosize (`minRows` / `maxRows`)
    - Intent-driven invalid / disabled states

- **IntentControlTags**
    - Multi-value input control (tags / chips / keywords)
    - Add, remove and navigate values via keyboard
    - Designed for structured inputs (labels, categories, filters)
    - Fully compatible with `IntentControlField`

---

### 🎨 Visual & UX Improvements

- Consistent editable-control styling across inputs, selects and segmented controls
- Improved focus management inside composite controls
- Clear separation between editable controls and field frames

---

### 🧠 Architecture

- Reinforced pattern: **Field owns the frame, Control owns the interaction**
- Shared intent resolution pipeline across all form controls
- Stable CSS hooks for naked vs standalone modes

---

### ⚠️ Notes

- No breaking changes
- CSS entry point remains `/styles/index.css`

---

## [0.2.0] — 2026-02-02

### 🚀 Major release — System expansion

This release marks a **structural leap** for Intent Design System.  
The project evolves from a minimal foundation to a **coherent semantic UI system**.

From **2 core components** to **18 intent-first components**, all sharing:

- the same semantic contract
- the same intent resolution pipeline
- stable CSS hooks
- a narrative-first philosophy

---

### ✨ Added

#### 🧱 Surface

- **IntentSurface** (matured)
- **IntentCommandPalette**

#### 🕹️ Controls

- **IntentControlButton**
- **IntentControlLink**
- **IntentControlSelect**
- **IntentControlField**
- **IntentControlToggle**
- **IntentControlTabs**
- **IntentControlSegmented** ✨ _(new segmented / toggle group control)_

#### 🎛️ Pickers

- **IntentPickerTone**
- **IntentPickerGlow**

#### 🧭 Layout

- **IntentJourney** (stepper / timeline)
- **IntentDivider**

#### 🚦 Indicators & Feedback

- **IntentIndicator**
- **IntentToast**

#### 🧬 Data

- **IntentTable**
- **IntentTree**
- **IntentCodeViewer**

---

### 🎨 Visual & Interaction Improvements

- Intent-consistent **variants** across all controls (`flat`, `outlined`, `elevated`, `ghost`)
- **Glow system unified** (functional vs aesthetic glows)
- **Segmented control pill animation** (sliding active indicator)
- Improved focus, hover and pressed states
- Better disabled-state semantics (visual + behavioral)

---

### 🧠 Architecture

- Centralized **intent resolution** (`resolveIntent`)
- Strict separation between:
    - semantic intent
    - layout variables
    - visual variants
- No dynamic Tailwind classes inside components
- Stable CSS hooks for long-term theming and overrides

---

### 🧪 Playground (separate repository)

- Dedicated playground app (not published to npm)
- Interactive component previews
- Live intent / variant / glow controls
- Game of Thrones–themed datasets for demos
- Acts as a **living specification**, not a showcase

---

### 📝 Documentation

- README rewritten for **v0.2.0**
- Clear explanation of:
    - intent philosophy
    - variants vs tone vs glow
    - system API
- Developer “About” section added

---

### ⚠️ Notes

- Playground is **not part of the npm package**
- CSS import remains mandatory
- No breaking API changes from 0.1.x, but internal behavior is now fully standardized

---

## [0.1.0] — Initial release

### ✨ Added

- **IntentSurface**
- **IntentControlButton**
- Core intent model (informed / empowered / warned / threatened / themed / toned / glowed)
- Variant system
- Glow foundations

---

## 🧭 Roadmap (preview)

- Accessibility audit (ARIA patterns, screen readers)
- Motion preferences (`prefers-reduced-motion`)
- Intent-driven charts & data visualizations
- Narrative presets (RPG, dashboard, editorial)
- Documentation site

---

_Intent is meaning.  
Visuals are consequences._
