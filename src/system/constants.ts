/* ============================================================================
   src/system/constants.ts
   Intent Design System – Public constants & meta registry
============================================================================ */

/* ============================================================================
   Shared meta types
============================================================================ */

export type MetaOption<TValue extends string | number = string> = {
    value: TValue;
    label: string;

    description?: string;
    shortLabel?: string;
    emoji?: string;

    group?: string;
    category?: string;

    disabled?: boolean;
    docsOnly?: boolean;
    experimental?: boolean;
};

/* ============================================================================
   🧠 Intent meta
   Semantic or meta-level visual intention of a component.
============================================================================ */

export const INTENT_VALUES = [
    "informed",
    "empowered",
    "warned",
    "threatened",
    "themed",
    "toned",
    "glowed",
] as const;

type Intent = (typeof INTENT_VALUES)[number];
type IntentGlow = "info" | "empower" | "warn" | "threat" | "theme";

type IntentMeta =
    | (MetaOption<Intent> & {
          category: "semantic";
          tone: Tone;
          glow: IntentGlow;
      })
    | (MetaOption<Intent> & {
          category: "meta";
          tone: null;
          glow?: undefined;
      });

export const DEFAULT_INTENT = "informed" as const;

export const INTENT = [
    {
        value: "informed",
        label: "Informed",
        emoji: "ℹ️",
        category: "semantic",
        tone: "blue",
        description: "Neutral informative state.",
        glow: "info",
    },
    {
        value: "empowered",
        label: "Empowered",
        emoji: "✊",
        category: "semantic",
        tone: "emerald",
        description: "Positive, active and validating state.",
        glow: "empower",
    },
    {
        value: "warned",
        label: "Warned",
        emoji: "⚠️",
        category: "semantic",
        tone: "amber",
        description: "Cautionary or attention state.",
        glow: "warn",
    },
    {
        value: "threatened",
        label: "Threatened",
        emoji: "⛔",
        category: "semantic",
        tone: "rose",
        description: "Critical or dangerous state.",
        glow: "threat",
    },
    {
        value: "themed",
        label: "Themed",
        emoji: "🎭",
        category: "semantic",
        tone: "violet",
        description: "Theme-driven semantic state.",
        glow: "theme",
    },
    {
        value: "toned",
        label: "Toned",
        emoji: "🎨",
        category: "meta",
        tone: null,
        description: "Uses an explicit tone palette.",
    },
    {
        value: "glowed",
        label: "Glowed",
        emoji: "✨",
        category: "meta",
        tone: null,
        description: "Uses an explicit glow ambiance.",
    },
] as const satisfies readonly IntentMeta[];

/* ============================================================================
   🧱 Variant meta
   Visual rendering strategy of the component frame.
============================================================================ */

export const VARIANT_VALUES = ["flat", "outlined", "elevated", "ghost"] as const;

type Variant = (typeof VARIANT_VALUES)[number];

export const DEFAULT_VARIANT = "elevated" as const;

export const VARIANT = [
    {
        value: "flat",
        label: "Flat",
        description: "Soft background with minimal structure.",
    },
    {
        value: "outlined",
        label: "Outlined",
        description: "Border-first rendering.",
    },
    {
        value: "elevated",
        label: "Elevated",
        description: "Layered surface with stronger presence.",
    },
    {
        value: "ghost",
        label: "Ghost",
        description: "Minimal, transparent rendering.",
    },
] as const satisfies readonly MetaOption<Variant>[];

/* ============================================================================
   🌊 Intensity meta
   Strength of visual expression across layers and effects.
============================================================================ */

export const INTENSITY_VALUES = ["soft", "medium", "strong"] as const;

type Intensity = (typeof INTENSITY_VALUES)[number];

export const DEFAULT_INTENSITY = "medium" as const;

export const INTENSITY = [
    {
        value: "soft",
        label: "Soft",
        description: "Subtle and restrained rendering.",
    },
    {
        value: "medium",
        label: "Medium",
        description: "Balanced default intensity.",
    },
    {
        value: "strong",
        label: "Strong",
        description: "High-impact rendering.",
    },
] as const satisfies readonly MetaOption<Intensity>[];

/* ============================================================================
   🌓 Mode meta
   Host visual environment.
============================================================================ */

export const MODE_VALUES = ["light", "dark"] as const;

type Mode = (typeof MODE_VALUES)[number];

export const DEFAULT_MODE = "dark" as const;

export const MODE = [
    {
        value: "light",
        label: "Light",
        emoji: "☀️",
        description: "Optimized for light backgrounds.",
    },
    {
        value: "dark",
        label: "Dark",
        emoji: "🌑",
        description: "Optimized for dark backgrounds.",
    },
] as const satisfies readonly MetaOption<Mode>[];

/* ============================================================================
   🎚 Tone step meta
   Tailwind-like scale step used as palette anchor.
============================================================================ */

export const TONE_STEP_VALUES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

type ToneStep = (typeof TONE_STEP_VALUES)[number];

export const DEFAULT_TONE_STEP = 500 as const;

export const TONE_STEP = [
    { value: 50, label: "50", description: "Very light tone step." },
    { value: 100, label: "100", description: "Light tone step." },
    { value: 200, label: "200", description: "Soft-light tone step." },
    { value: 300, label: "300", description: "Gentle tone step." },
    { value: 400, label: "400", description: "Slightly light tone step." },
    { value: 500, label: "500", description: "Canonical tone step." },
    { value: 600, label: "600", description: "Slightly dark tone step." },
    { value: 700, label: "700", description: "Dark tone step." },
    { value: 800, label: "800", description: "Deep tone step." },
    { value: 900, label: "900", description: "Very deep tone step." },
    { value: 950, label: "950", description: "Maximum dark tone step." },
] as const satisfies readonly MetaOption<ToneStep>[];

/* ============================================================================
   🎨 Tone meta
   Explicit palette family for intent="toned".
============================================================================ */

export const TONE_VALUES = [
    "slate",
    "gray",
    "zinc",
    "neutral",
    "stone",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
    "theme",
    "black",
] as const;

type Tone = (typeof TONE_VALUES)[number];

export type ToneMeta = MetaOption<Tone> & {
    color: {
        name: string;
        hex: string;
        rgb: string;
    };
};

export const DEFAULT_TONE = "theme" as const;

export const TONE = [
    {
        value: "slate",
        label: "Slate",
        group: "neutral",
        description: "Cool muted slate palette.",
        color: { name: "slate", hex: "#64748b", rgb: "100 116 139" },
    },
    {
        value: "gray",
        label: "Gray",
        group: "neutral",
        description: "Classic neutral gray palette.",
        color: { name: "gray", hex: "#6b7280", rgb: "107 114 128" },
    },
    {
        value: "zinc",
        label: "Zinc",
        group: "neutral",
        description: "Industrial zinc palette.",
        color: { name: "zinc", hex: "#71717a", rgb: "113 113 122" },
    },
    {
        value: "neutral",
        label: "Neutral",
        group: "neutral",
        description: "Balanced neutral palette.",
        color: { name: "neutral", hex: "#737373", rgb: "115 115 115" },
    },
    {
        value: "stone",
        label: "Stone",
        group: "neutral",
        description: "Earthy stone palette.",
        color: { name: "stone", hex: "#78716c", rgb: "120 113 108" },
    },

    {
        value: "red",
        label: "Red",
        group: "color",
        description: "Bold red palette.",
        color: { name: "red", hex: "#ef4444", rgb: "239 68 68" },
    },
    {
        value: "orange",
        label: "Orange",
        group: "color",
        description: "Energetic orange palette.",
        color: { name: "orange", hex: "#f97316", rgb: "249 115 22" },
    },
    {
        value: "amber",
        label: "Amber",
        group: "color",
        description: "Warm amber palette.",
        color: { name: "amber", hex: "#f59e0b", rgb: "245 158 11" },
    },
    {
        value: "yellow",
        label: "Yellow",
        group: "color",
        description: "Bright yellow palette.",
        color: { name: "yellow", hex: "#eab308", rgb: "234 179 8" },
    },
    {
        value: "lime",
        label: "Lime",
        group: "color",
        description: "Vivid lime palette.",
        color: { name: "lime", hex: "#84cc16", rgb: "132 204 22" },
    },
    {
        value: "green",
        label: "Green",
        group: "color",
        description: "Classic green palette.",
        color: { name: "green", hex: "#22c55e", rgb: "34 197 94" },
    },
    {
        value: "emerald",
        label: "Emerald",
        group: "color",
        description: "Rich emerald palette.",
        color: { name: "emerald", hex: "#10b981", rgb: "16 185 129" },
    },
    {
        value: "teal",
        label: "Teal",
        group: "color",
        description: "Balanced teal palette.",
        color: { name: "teal", hex: "#14b8a6", rgb: "20 184 166" },
    },
    {
        value: "cyan",
        label: "Cyan",
        group: "color",
        description: "Bright cyan palette.",
        color: { name: "cyan", hex: "#06b6d4", rgb: "6 182 212" },
    },
    {
        value: "sky",
        label: "Sky",
        group: "color",
        description: "Airy sky palette.",
        color: { name: "sky", hex: "#0ea5e9", rgb: "14 165 233" },
    },
    {
        value: "blue",
        label: "Blue",
        group: "color",
        description: "Classic blue palette.",
        color: { name: "blue", hex: "#3b82f6", rgb: "59 130 246" },
    },
    {
        value: "indigo",
        label: "Indigo",
        group: "color",
        description: "Deep indigo palette.",
        color: { name: "indigo", hex: "#6366f1", rgb: "99 102 241" },
    },
    {
        value: "violet",
        label: "Violet",
        group: "color",
        description: "Luminous violet palette.",
        color: { name: "violet", hex: "#8b5cf6", rgb: "139 92 246" },
    },
    {
        value: "purple",
        label: "Purple",
        group: "color",
        description: "Royal purple palette.",
        color: { name: "purple", hex: "#a855f7", rgb: "168 85 247" },
    },
    {
        value: "fuchsia",
        label: "Fuchsia",
        group: "color",
        description: "Electric fuchsia palette.",
        color: { name: "fuchsia", hex: "#d946ef", rgb: "217 70 239" },
    },
    {
        value: "pink",
        label: "Pink",
        group: "color",
        description: "Bright pink palette.",
        color: { name: "pink", hex: "#ec4899", rgb: "236 72 153" },
    },
    {
        value: "rose",
        label: "Rose",
        group: "color",
        description: "Rose-toned palette.",
        color: { name: "rose", hex: "#f43f5e", rgb: "244 63 94" },
    },

    {
        value: "theme",
        label: "Theme",
        group: "special",
        description: "Uses the host theme color.",
        color: { name: "themed", hex: "#a855f7", rgb: "168 85 247" },
    },
    {
        value: "black",
        label: "Black",
        group: "special",
        description: "Uses the darkest ink family.",
        color: { name: "ink", hex: "#000000", rgb: "0 0 0" },
    },
] as const satisfies readonly ToneMeta[];

/* ============================================================================
   ✨ Glow meta
   Intent or aesthetic ambient glow definitions.
============================================================================ */

export const INTENT_GLOW_VALUES = ["info", "empower", "warn", "threat", "theme"] as const;

export const AESTHETIC_GLOW_VALUES = [
    // froids
    "aurora",
    "boreal",
    "mythic",
    "verdant",

    // violets / roses
    "nebula",
    "cosmic",
    "royal",
    "neon",

    // rouges / roses
    "blush",
    "rosefire",
    "crimson",
    "velvet",

    // chauds
    "solstice",
    "ember",
    "copper",
    "sepia",

    // neutres / nocturnes
    "nocturne",
    "eclipse",
    "graphite",
    "phantom",

    // gris clairs / monochromes
    "frost",
    "pearl",
    "silver",
    "mono",
] as const;

export const GLOW_VALUES = [...INTENT_GLOW_VALUES, ...AESTHETIC_GLOW_VALUES] as const;

type Glow = (typeof GLOW_VALUES)[number];

type GlowGradientStop = {
    size: string;
    at: string;
    color: string;
    stop: string;
};

type GlowGradient = {
    dark: GlowGradientStop[];
    light: GlowGradientStop[];
    text?: {
        dark: string;
        light: string;
    };
    swatch?: string;
};

export type GlowMeta =
    | (MetaOption<Glow> & {
          category: "intent";
          tone: null;
          gradient: GlowGradient;
      })
    | (MetaOption<Glow> & {
          category: "aesthetic";
          tone: Tone;
          gradient: GlowGradient;
      });
export type GlowMeta2 = MetaOption<Glow> & {
    category: "intent" | "aesthetic";
    tone: Tone | null;
    gradient: GlowGradient;
};
export const DEFAULT_GLOW = "aurora" as const;

/* ============================================================================
   Helpers
============================================================================ */

function buildGlowTextGradient(
    dark: readonly GlowGradientStop[],
    light: readonly GlowGradientStop[],
    opts?: {
        darkAngle?: number;
        lightAngle?: number;
        darkStops?: [number, number, number?];
        lightStops?: [number, number, number?];
    }
) {
    const darkAngle = opts?.darkAngle ?? 135;
    const lightAngle = opts?.lightAngle ?? 135;

    function pickTextColors(stops: readonly GlowGradientStop[]) {
        const colors = stops.map((stop) => stop.color);
        const c1 = colors[0] ?? "rgba(255,255,255,1)";
        const c2 = colors[1] ?? c1;
        const c3 = colors[2] ?? c2;
        return [c1, c2, c3] as const;
    }

    const [dark1, dark2, dark3] = pickTextColors(dark);
    const [light1, light2, light3] = pickTextColors(light);

    const darkStops = opts?.darkStops ?? (dark.length >= 3 ? [0, 52, 100] : [0, 100]);
    const lightStops = opts?.lightStops ?? (light.length >= 3 ? [0, 52, 100] : [0, 100]);

    const darkGradient =
        dark.length >= 3
            ? `linear-gradient(${darkAngle}deg, ${dark1} ${darkStops[0]}%, ${dark2} ${darkStops[1]}%, ${dark3} ${darkStops[2]}%)`
            : `linear-gradient(${darkAngle}deg, ${dark1} ${darkStops[0]}%, ${dark2} ${darkStops[1]}%)`;

    const lightGradient =
        light.length >= 3
            ? `linear-gradient(${lightAngle}deg, ${light1} ${lightStops[0]}%, ${light2} ${lightStops[1]}%, ${light3} ${lightStops[2]}%)`
            : `linear-gradient(${lightAngle}deg, ${light1} ${lightStops[0]}%, ${light2} ${lightStops[1]}%)`;

    return {
        dark: darkGradient,
        light: lightGradient,
    };
}

export const GLOW = [
    {
        value: "info",
        label: "Info",
        emoji: "ℹ️",
        category: "intent",
        tone: null,
        description: "Neutral informative halo.",
        gradient: {
            dark: [
                { size: "180% 140%", at: "18% 18%", color: "rgba(255,255,255,0.14)", stop: "72%" },
                { size: "160% 140%", at: "82% 35%", color: "rgba(148,163,184,0.14)", stop: "70%" },
            ],
            light: [
                { size: "180% 140%", at: "18% 18%", color: "rgba(255,255,255,0.06)", stop: "68%" },
                { size: "160% 140%", at: "82% 35%", color: "rgba(148,163,184,0.08)", stop: "66%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "180% 140%",
                        at: "18% 18%",
                        color: "rgba(255,255,255,0.96)",
                        stop: "72%",
                    },
                    {
                        size: "160% 140%",
                        at: "82% 35%",
                        color: "rgba(148,163,184,0.92)",
                        stop: "70%",
                    },
                ],
                [
                    {
                        size: "180% 140%",
                        at: "18% 18%",
                        color: "rgba(71,85,105,0.92)",
                        stop: "68%",
                    },
                    {
                        size: "160% 140%",
                        at: "82% 35%",
                        color: "rgba(148,163,184,0.88)",
                        stop: "66%",
                    },
                ]
            ),
        },
    },
    {
        value: "empower",
        label: "Empower",
        emoji: "✊",
        category: "intent",
        tone: null,
        description: "Positive, emerald-forward halo.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(52,211,153,0.28)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(16,185,129,0.22)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(52,211,153,0.12)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(16,185,129,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(110,231,183,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(16,185,129,0.96)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(5,150,105,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(16,185,129,0.88)",
                        stop: "68%",
                    },
                ]
            ),
        },
    },
    {
        value: "warn",
        label: "Warn",
        emoji: "⚠️",
        category: "intent",
        tone: null,
        description: "Amber caution halo.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(251,191,36,0.28)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(245,158,11,0.22)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(251,191,36,0.12)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(245,158,11,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(253,224,71,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(245,158,11,0.96)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(217,119,6,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(245,158,11,0.88)",
                        stop: "68%",
                    },
                ]
            ),
        },
    },
    {
        value: "threat",
        label: "Threat",
        emoji: "⛔",
        category: "intent",
        tone: null,
        description: "Critical rose-red halo.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(244,63,94,0.28)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(190,18,60,0.20)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(244,63,94,0.12)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(190,18,60,0.09)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(251,113,133,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(225,29,72,0.96)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(190,18,60,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(244,63,94,0.88)",
                        stop: "68%",
                    },
                ]
            ),
        },
    },
    {
        value: "theme",
        label: "Theme",
        emoji: "🎭",
        category: "intent",
        tone: null,
        description: "Host-theme-driven glow.",
        gradient: {
            dark: [
                {
                    size: "80% 200%",
                    at: "15%",
                    color: "var(--ids-theme-glow-1, rgba(168,85,247,0.28))",
                    stop: "78%",
                },
                {
                    size: "60% 200%",
                    at: "85%",
                    color: "var(--ids-theme-glow-2, rgba(168,85,247,0.22))",
                    stop: "76%",
                },
            ],
            light: [
                {
                    size: "80% 200%",
                    at: "15%",
                    color: "var(--ids-theme-glow-1, rgba(168,85,247,0.12))",
                    stop: "72%",
                },
                {
                    size: "60% 200%",
                    at: "85%",
                    color: "var(--ids-theme-glow-2, rgba(168,85,247,0.10))",
                    stop: "70%",
                },
            ],
            text: {
                dark: "linear-gradient(135deg, var(--ids-theme-glow-1, rgba(196,181,253,1)) 0%, var(--ids-theme-glow-2, rgba(168,85,247,1)) 100%)",
                light: "linear-gradient(135deg, var(--ids-theme-glow-1, rgba(147,51,234,1)) 0%, var(--ids-theme-glow-2, rgba(168,85,247,1)) 100%)",
            },
        },
    },

    {
        value: "aurora",
        label: "Aurora",
        emoji: "🌌",
        category: "aesthetic",
        tone: "sky",
        description: "Cyan-magenta atmospheric glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(34,211,238,0.28)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(217,70,239,0.26)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(34,211,238,0.12)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(217,70,239,0.11)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(103,232,249,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(232,121,249,0.96)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(8,145,178,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(192,38,211,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #22d3ee 0%, #60a5fa 50%, #d946ef 100%)",
        },
    },
    {
        value: "boreal",
        label: "Boreal",
        emoji: "🧊",
        category: "aesthetic",
        tone: "cyan",
        description: "Icy cyan-indigo glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "18% 18%", color: "rgba(34,211,238,0.30)", stop: "74%" },
                { size: "165% 150%", at: "82% 30%", color: "rgba(99,102,241,0.26)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "18% 18%", color: "rgba(34,211,238,0.13)", stop: "70%" },
                { size: "165% 150%", at: "82% 30%", color: "rgba(99,102,241,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "18% 18%",
                        color: "rgba(103,232,249,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "82% 30%",
                        color: "rgba(129,140,248,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "18% 18%",
                        color: "rgba(14,116,144,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "82% 30%",
                        color: "rgba(79,70,229,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #22d3ee 0%, #38bdf8 45%, #6366f1 100%)",
        },
    },
    {
        value: "mythic",
        label: "Mythic",
        emoji: "🐉",
        category: "aesthetic",
        tone: "emerald",
        description: "Emerald-sky legendary glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(52,211,153,0.32)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(14,165,233,0.28)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(52,211,153,0.13)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(14,165,233,0.11)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(110,231,183,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(56,189,248,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(5,150,105,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(2,132,199,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #34d399 0%, #10b981 45%, #0ea5e9 100%)",
        },
    },
    {
        value: "verdant",
        label: "Verdant",
        emoji: "🌿",
        category: "aesthetic",
        tone: "emerald",
        description: "Green-lime organic glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(52,211,153,0.32)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(163,230,53,0.22)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(52,211,153,0.13)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(163,230,53,0.09)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(110,231,183,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(190,242,100,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(5,150,105,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(101,163,13,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #34d399 0%, #22c55e 45%, #a3e635 100%)",
        },
    },
    {
        value: "nebula",
        label: "Nebula",
        emoji: "🪐",
        category: "aesthetic",
        tone: "indigo",
        description: "Layered multi-stop cosmic glow.",
        gradient: {
            dark: [
                { size: "200% 160%", at: "20% 18%", color: "rgba(99,102,241,0.30)", stop: "74%" },
                { size: "170% 160%", at: "80% 32%", color: "rgba(217,70,239,0.28)", stop: "72%" },
                { size: "140% 140%", at: "55% 10%", color: "rgba(56,189,248,0.12)", stop: "70%" },
            ],
            light: [
                { size: "200% 160%", at: "20% 18%", color: "rgba(99,102,241,0.12)", stop: "70%" },
                { size: "170% 160%", at: "80% 32%", color: "rgba(217,70,239,0.11)", stop: "68%" },
                { size: "140% 140%", at: "55% 10%", color: "rgba(56,189,248,0.06)", stop: "66%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "200% 160%",
                        at: "20% 18%",
                        color: "rgba(129,140,248,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "170% 160%",
                        at: "80% 32%",
                        color: "rgba(232,121,249,0.96)",
                        stop: "72%",
                    },
                    {
                        size: "140% 140%",
                        at: "55% 10%",
                        color: "rgba(125,211,252,0.92)",
                        stop: "70%",
                    },
                ],
                [
                    {
                        size: "200% 160%",
                        at: "20% 18%",
                        color: "rgba(79,70,229,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "170% 160%",
                        at: "80% 32%",
                        color: "rgba(192,38,211,0.88)",
                        stop: "68%",
                    },
                    {
                        size: "140% 140%",
                        at: "55% 10%",
                        color: "rgba(14,165,233,0.84)",
                        stop: "66%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 38%, #d946ef 72%, #38bdf8 100%)",
        },
    },
    {
        value: "cosmic",
        label: "Cosmic",
        emoji: "🌠",
        category: "aesthetic",
        tone: "purple",
        description: "Indigo-fuchsia deep space glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "20% 15%", color: "rgba(99,102,241,0.32)", stop: "74%" },
                { size: "165% 150%", at: "80% 35%", color: "rgba(217,70,239,0.28)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "20% 15%", color: "rgba(99,102,241,0.13)", stop: "70%" },
                { size: "165% 150%", at: "80% 35%", color: "rgba(217,70,239,0.11)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "20% 15%",
                        color: "rgba(129,140,248,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "80% 35%",
                        color: "rgba(232,121,249,0.96)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "20% 15%",
                        color: "rgba(79,70,229,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "80% 35%",
                        color: "rgba(192,38,211,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
        },
    },
    {
        value: "royal",
        label: "Royal",
        emoji: "👑",
        category: "aesthetic",
        tone: "purple",
        description: "Violet-pink noble glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(139,92,246,0.32)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(236,72,153,0.28)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(139,92,246,0.13)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(236,72,153,0.11)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(196,181,253,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(244,114,182,0.96)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(124,58,237,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(219,39,119,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 45%, #ec4899 100%)",
        },
    },
    {
        value: "neon",
        label: "Neon",
        emoji: "🪩",
        category: "aesthetic",
        tone: "fuchsia",
        description: "Electric cyberpunk violet-pink glow.",
        gradient: {
            dark: [
                { size: "200% 155%", at: "18% 18%", color: "rgba(168,85,247,0.34)", stop: "74%" },
                { size: "170% 150%", at: "82% 30%", color: "rgba(236,72,153,0.32)", stop: "72%" },
                { size: "140% 130%", at: "52% 8%", color: "rgba(217,70,239,0.18)", stop: "68%" },
            ],
            light: [
                { size: "200% 155%", at: "18% 18%", color: "rgba(168,85,247,0.14)", stop: "70%" },
                { size: "170% 150%", at: "82% 30%", color: "rgba(236,72,153,0.13)", stop: "68%" },
                { size: "140% 130%", at: "52% 8%", color: "rgba(217,70,239,0.08)", stop: "66%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "200% 155%",
                        at: "18% 18%",
                        color: "rgba(196,181,253,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "170% 150%",
                        at: "82% 30%",
                        color: "rgba(244,114,182,0.96)",
                        stop: "72%",
                    },
                    {
                        size: "140% 130%",
                        at: "52% 8%",
                        color: "rgba(232,121,249,0.92)",
                        stop: "68%",
                    },
                ],
                [
                    {
                        size: "200% 155%",
                        at: "18% 18%",
                        color: "rgba(147,51,234,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "170% 150%",
                        at: "82% 30%",
                        color: "rgba(219,39,119,0.88)",
                        stop: "68%",
                    },
                    {
                        size: "140% 130%",
                        at: "52% 8%",
                        color: "rgba(192,38,211,0.84)",
                        stop: "66%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #a855f7 0%, #d946ef 45%, #ec4899 100%)",
        },
    },
    {
        value: "blush",
        label: "Blush",
        emoji: "🌸",
        category: "aesthetic",
        tone: "pink",
        description: "Soft pink rose bloom glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "16% 20%", color: "rgba(244,114,182,0.30)", stop: "74%" },
                { size: "165% 150%", at: "84% 30%", color: "rgba(236,72,153,0.24)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "16% 20%", color: "rgba(244,114,182,0.13)", stop: "70%" },
                { size: "165% 150%", at: "84% 30%", color: "rgba(236,72,153,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "16% 20%",
                        color: "rgba(249,168,212,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "84% 30%",
                        color: "rgba(244,114,182,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "16% 20%",
                        color: "rgba(219,39,119,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "84% 30%",
                        color: "rgba(236,72,153,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #f9a8d4 0%, #f472b6 48%, #ec4899 100%)",
        },
    },
    {
        value: "rosefire",
        label: "Rosefire",
        emoji: "🌹",
        category: "aesthetic",
        tone: "rose",
        description: "Hot rose-red radiant glow.",
        gradient: {
            dark: [
                { size: "195% 150%", at: "15% 20%", color: "rgba(244,63,94,0.32)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(236,72,153,0.24)", stop: "72%" },
            ],
            light: [
                { size: "195% 150%", at: "15% 20%", color: "rgba(244,63,94,0.14)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(236,72,153,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "195% 150%",
                        at: "15% 20%",
                        color: "rgba(251,113,133,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(244,114,182,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "195% 150%",
                        at: "15% 20%",
                        color: "rgba(225,29,72,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(219,39,119,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #fb7185 0%, #f43f5e 45%, #ec4899 100%)",
        },
    },
    {
        value: "crimson",
        label: "Crimson",
        emoji: "🩸",
        category: "aesthetic",
        tone: "red",
        description: "Deep crimson ceremonial glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "16% 20%", color: "rgba(239,68,68,0.30)", stop: "74%" },
                { size: "165% 150%", at: "84% 30%", color: "rgba(190,18,60,0.22)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "16% 20%", color: "rgba(239,68,68,0.13)", stop: "70%" },
                { size: "165% 150%", at: "84% 30%", color: "rgba(190,18,60,0.09)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "16% 20%",
                        color: "rgba(252,165,165,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "84% 30%",
                        color: "rgba(239,68,68,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "16% 20%",
                        color: "rgba(220,38,38,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "84% 30%",
                        color: "rgba(190,18,60,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #fca5a5 0%, #ef4444 45%, #be123c 100%)",
        },
    },
    {
        value: "velvet",
        label: "Velvet",
        emoji: "🎀",
        category: "aesthetic",
        tone: "rose",
        description: "Dark velvet magenta-crimson glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "18% 20%", color: "rgba(190,24,93,0.28)", stop: "74%" },
                { size: "165% 150%", at: "82% 32%", color: "rgba(136,19,55,0.22)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "18% 20%", color: "rgba(190,24,93,0.12)", stop: "70%" },
                { size: "165% 150%", at: "82% 32%", color: "rgba(136,19,55,0.08)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "18% 20%",
                        color: "rgba(244,114,182,0.96)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "82% 32%",
                        color: "rgba(190,24,93,0.92)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "18% 20%",
                        color: "rgba(157,23,77,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "82% 32%",
                        color: "rgba(136,19,55,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #f472b6 0%, #be185d 48%, #881337 100%)",
        },
    },
    {
        value: "solstice",
        label: "Solstice",
        emoji: "🌅",
        category: "aesthetic",
        tone: "yellow",
        description: "Golden-yellow radiant glow.",
        gradient: {
            dark: [
                { size: "195% 150%", at: "15% 20%", color: "rgba(250,204,21,0.36)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(251,191,36,0.26)", stop: "72%" },
            ],
            light: [
                { size: "195% 150%", at: "15% 20%", color: "rgba(250,204,21,0.16)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(251,191,36,0.11)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "195% 150%",
                        at: "15% 20%",
                        color: "rgba(254,240,138,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(250,204,21,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "195% 150%",
                        at: "15% 20%",
                        color: "rgba(202,138,4,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(245,158,11,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #fde047 0%, #facc15 48%, #f59e0b 100%)",
        },
    },
    {
        value: "ember",
        label: "Ember",
        emoji: "🔥",
        category: "aesthetic",
        tone: "amber",
        description: "Warm amber-orange glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(245,158,11,0.32)", stop: "74%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(249,115,22,0.26)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "15% 20%", color: "rgba(245,158,11,0.14)", stop: "70%" },
                { size: "165% 150%", at: "85% 30%", color: "rgba(249,115,22,0.11)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(252,211,77,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(249,115,22,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "15% 20%",
                        color: "rgba(217,119,6,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "85% 30%",
                        color: "rgba(234,88,12,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 45%, #f97316 100%)",
        },
    },
    {
        value: "copper",
        label: "Copper",
        emoji: "🟠",
        category: "aesthetic",
        tone: "orange",
        description: "Copper-orange metallic glow.",
        gradient: {
            dark: [
                { size: "190% 150%", at: "16% 20%", color: "rgba(249,115,22,0.34)", stop: "74%" },
                { size: "165% 150%", at: "84% 30%", color: "rgba(180,83,9,0.24)", stop: "72%" },
            ],
            light: [
                { size: "190% 150%", at: "16% 20%", color: "rgba(249,115,22,0.15)", stop: "70%" },
                { size: "165% 150%", at: "84% 30%", color: "rgba(180,83,9,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 150%",
                        at: "16% 20%",
                        color: "rgba(253,186,116,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "84% 30%",
                        color: "rgba(249,115,22,0.94)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 150%",
                        at: "16% 20%",
                        color: "rgba(194,65,12,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "84% 30%",
                        color: "rgba(154,52,18,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #fdba74 0%, #f97316 48%, #b45309 100%)",
        },
    },
    {
        value: "sepia",
        label: "Sepia",
        emoji: "🟤",
        category: "aesthetic",
        tone: "stone",
        description: "Earthy brown sepia glow.",
        gradient: {
            dark: [
                { size: "185% 145%", at: "18% 20%", color: "rgba(180,83,9,0.26)", stop: "74%" },
                { size: "165% 145%", at: "82% 32%", color: "rgba(120,53,15,0.22)", stop: "72%" },
            ],
            light: [
                { size: "185% 145%", at: "18% 20%", color: "rgba(180,83,9,0.12)", stop: "70%" },
                { size: "165% 145%", at: "82% 32%", color: "rgba(120,53,15,0.09)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "185% 145%",
                        at: "18% 20%",
                        color: "rgba(251,191,143,0.96)",
                        stop: "74%",
                    },
                    { size: "165% 145%", at: "82% 32%", color: "rgba(180,83,9,0.92)", stop: "72%" },
                ],
                [
                    {
                        size: "185% 145%",
                        at: "18% 20%",
                        color: "rgba(146,64,14,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 145%",
                        at: "82% 32%",
                        color: "rgba(120,53,15,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #fdba74 0%, #b45309 45%, #78350f 100%)",
        },
    },
    {
        value: "nocturne",
        label: "Nocturne",
        emoji: "🌙",
        category: "aesthetic",
        tone: "slate",
        description: "Muted twilight violet glow.",
        gradient: {
            dark: [
                { size: "180% 150%", at: "22% 18%", color: "rgba(148,163,184,0.18)", stop: "74%" },
                { size: "165% 150%", at: "82% 34%", color: "rgba(139,92,246,0.20)", stop: "72%" },
            ],
            light: [
                { size: "180% 150%", at: "22% 18%", color: "rgba(148,163,184,0.09)", stop: "70%" },
                { size: "165% 150%", at: "82% 34%", color: "rgba(139,92,246,0.09)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "180% 150%",
                        at: "22% 18%",
                        color: "rgba(203,213,225,0.96)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "82% 34%",
                        color: "rgba(167,139,250,0.92)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "180% 150%",
                        at: "22% 18%",
                        color: "rgba(100,116,139,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 150%",
                        at: "82% 34%",
                        color: "rgba(124,58,237,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #94a3b8 0%, #6366f1 35%, #8b5cf6 100%)",
        },
    },
    {
        value: "eclipse",
        label: "Eclipse",
        emoji: "🌘",
        category: "aesthetic",
        tone: "zinc",
        description: "Dark violet-charcoal eclipse glow.",
        gradient: {
            dark: [
                { size: "180% 150%", at: "18% 18%", color: "rgba(88,28,135,0.18)", stop: "74%" },
                { size: "165% 150%", at: "82% 34%", color: "rgba(39,39,42,0.22)", stop: "72%" },
            ],
            light: [
                { size: "180% 150%", at: "18% 18%", color: "rgba(88,28,135,0.08)", stop: "70%" },
                { size: "165% 150%", at: "82% 34%", color: "rgba(39,39,42,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "180% 150%",
                        at: "18% 18%",
                        color: "rgba(196,181,253,0.94)",
                        stop: "74%",
                    },
                    { size: "165% 150%", at: "82% 34%", color: "rgba(63,63,70,0.92)", stop: "72%" },
                ],
                [
                    {
                        size: "180% 150%",
                        at: "18% 18%",
                        color: "rgba(107,33,168,0.90)",
                        stop: "70%",
                    },
                    { size: "165% 150%", at: "82% 34%", color: "rgba(39,39,42,0.88)", stop: "68%" },
                ]
            ),
            swatch: "linear-gradient(135deg, #a78bfa 0%, #581c87 40%, #27272a 100%)",
        },
    },
    {
        value: "graphite",
        label: "Graphite",
        emoji: "🪨",
        category: "aesthetic",
        tone: "slate",
        description: "Deep graphite blue-gray glow.",
        gradient: {
            dark: [
                { size: "180% 150%", at: "20% 18%", color: "rgba(71,85,105,0.22)", stop: "74%" },
                { size: "165% 150%", at: "82% 34%", color: "rgba(51,65,85,0.18)", stop: "72%" },
            ],
            light: [
                { size: "180% 150%", at: "20% 18%", color: "rgba(71,85,105,0.10)", stop: "70%" },
                { size: "165% 150%", at: "82% 34%", color: "rgba(51,65,85,0.08)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "180% 150%",
                        at: "20% 18%",
                        color: "rgba(148,163,184,0.94)",
                        stop: "74%",
                    },
                    {
                        size: "165% 150%",
                        at: "82% 34%",
                        color: "rgba(71,85,105,0.92)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "180% 150%",
                        at: "20% 18%",
                        color: "rgba(71,85,105,0.90)",
                        stop: "70%",
                    },
                    { size: "165% 150%", at: "82% 34%", color: "rgba(51,65,85,0.88)", stop: "68%" },
                ]
            ),
            swatch: "linear-gradient(135deg, #94a3b8 0%, #475569 45%, #334155 100%)",
        },
    },
    {
        value: "phantom",
        label: "Phantom",
        emoji: "👻",
        category: "aesthetic",
        tone: "neutral",
        description: "Shadowy near-black spectral glow.",
        gradient: {
            dark: [
                { size: "175% 145%", at: "20% 18%", color: "rgba(63,63,70,0.20)", stop: "74%" },
                { size: "160% 145%", at: "82% 34%", color: "rgba(24,24,27,0.24)", stop: "72%" },
            ],
            light: [
                { size: "175% 145%", at: "20% 18%", color: "rgba(63,63,70,0.09)", stop: "70%" },
                { size: "160% 145%", at: "82% 34%", color: "rgba(24,24,27,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "175% 145%",
                        at: "20% 18%",
                        color: "rgba(161,161,170,0.92)",
                        stop: "74%",
                    },
                    { size: "160% 145%", at: "82% 34%", color: "rgba(63,63,70,0.90)", stop: "72%" },
                ],
                [
                    { size: "175% 145%", at: "20% 18%", color: "rgba(82,82,91,0.90)", stop: "70%" },
                    { size: "160% 145%", at: "82% 34%", color: "rgba(24,24,27,0.88)", stop: "68%" },
                ]
            ),
            swatch: "linear-gradient(135deg, #a1a1aa 0%, #3f3f46 45%, #18181b 100%)",
        },
    },
    {
        value: "frost",
        label: "Frost",
        emoji: "❄️",
        category: "aesthetic",
        tone: "zinc",
        description: "Ice-white crystalline glow.",
        gradient: {
            dark: [
                { size: "190% 155%", at: "18% 18%", color: "rgba(255,255,255,0.24)", stop: "74%" },
                { size: "170% 150%", at: "82% 32%", color: "rgba(241,245,249,0.20)", stop: "72%" },
            ],
            light: [
                { size: "190% 155%", at: "18% 18%", color: "rgba(255,255,255,0.15)", stop: "70%" },
                { size: "170% 150%", at: "82% 32%", color: "rgba(241,245,249,0.10)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "190% 155%",
                        at: "18% 18%",
                        color: "rgba(255,255,255,0.99)",
                        stop: "74%",
                    },
                    {
                        size: "170% 150%",
                        at: "82% 32%",
                        color: "rgba(241,245,249,0.96)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "190% 155%",
                        at: "18% 18%",
                        color: "rgba(248,250,252,0.96)",
                        stop: "70%",
                    },
                    {
                        size: "170% 150%",
                        at: "82% 32%",
                        color: "rgba(203,213,225,0.88)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #cbd5e1 100%)",
        },
    },
    {
        value: "pearl",
        label: "Pearl",
        emoji: "🤍",
        category: "aesthetic",
        tone: "gray",
        description: "Soft pale gray pearlescent glow.",
        gradient: {
            dark: [
                { size: "180% 145%", at: "18% 18%", color: "rgba(235,237,240,0.18)", stop: "74%" },
                { size: "165% 145%", at: "82% 30%", color: "rgba(214,219,226,0.15)", stop: "72%" },
            ],
            light: [
                { size: "180% 145%", at: "18% 18%", color: "rgba(235,237,240,0.10)", stop: "70%" },
                { size: "165% 145%", at: "82% 30%", color: "rgba(214,219,226,0.09)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "180% 145%",
                        at: "18% 18%",
                        color: "rgba(245,247,250,0.98)",
                        stop: "74%",
                    },
                    {
                        size: "165% 145%",
                        at: "82% 30%",
                        color: "rgba(214,219,226,0.92)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "180% 145%",
                        at: "18% 18%",
                        color: "rgba(229,231,235,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 145%",
                        at: "82% 30%",
                        color: "rgba(156,163,175,0.84)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #f5f7fa 0%, #e5e7eb 48%, #d1d5db 100%)",
        },
    },
    {
        value: "silver",
        label: "Silver",
        emoji: "🩶",
        category: "aesthetic",
        tone: "gray",
        description: "Cool silver metallic glow.",
        gradient: {
            dark: [
                { size: "180% 145%", at: "18% 18%", color: "rgba(229,231,235,0.16)", stop: "74%" },
                { size: "165% 145%", at: "82% 30%", color: "rgba(156,163,175,0.16)", stop: "72%" },
            ],
            light: [
                { size: "180% 145%", at: "18% 18%", color: "rgba(229,231,235,0.09)", stop: "70%" },
                { size: "165% 145%", at: "82% 30%", color: "rgba(156,163,175,0.08)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "180% 145%",
                        at: "18% 18%",
                        color: "rgba(243,244,246,0.96)",
                        stop: "74%",
                    },
                    {
                        size: "165% 145%",
                        at: "82% 30%",
                        color: "rgba(156,163,175,0.90)",
                        stop: "72%",
                    },
                ],
                [
                    {
                        size: "180% 145%",
                        at: "18% 18%",
                        color: "rgba(209,213,219,0.92)",
                        stop: "70%",
                    },
                    {
                        size: "165% 145%",
                        at: "82% 30%",
                        color: "rgba(107,114,128,0.86)",
                        stop: "68%",
                    },
                ]
            ),
            swatch: "linear-gradient(135deg, #f3f4f6 0%, #d1d5db 48%, #9ca3af 100%)",
        },
    },
    {
        value: "mono",
        label: "Mono",
        emoji: "⚪",
        category: "aesthetic",
        tone: "slate",
        description: "Minimal monochrome glow.",
        gradient: {
            dark: [
                { size: "170% 150%", at: "50% 20%", color: "rgba(255,255,255,0.16)", stop: "72%" },
            ],
            light: [
                { size: "170% 150%", at: "50% 20%", color: "rgba(148,163,184,0.08)", stop: "68%" },
            ],
            text: buildGlowTextGradient(
                [
                    {
                        size: "170% 150%",
                        at: "50% 20%",
                        color: "rgba(255,255,255,0.98)",
                        stop: "72%",
                    },
                ],
                [{ size: "170% 150%", at: "50% 20%", color: "rgba(148,163,184,0.92)", stop: "68%" }]
            ),
            swatch: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #64748b 100%)",
        },
    },
] as const satisfies readonly GlowMeta[];

/* ============================================================================
   🧩 Component kind meta
   High-level classification for design-system components and links.
============================================================================ */

export const COMPONENT_KIND_VALUES = [
    "surface",
    "control",
    "indicator",
    "layout",
    "feedback",
    "data",
    "design",
    "visualization",
    "genealogy",
    "content",
] as const;

type ComponentKind = (typeof COMPONENT_KIND_VALUES)[number];

export type ComponentKindMeta = MetaOption<ComponentKind>;

export const COMPONENT_KIND = [
    {
        value: "surface",
        label: "Surface",
        emoji: "🧱",
        description: "Container and framing components.",
    },
    {
        value: "control",
        label: "Control",
        emoji: "🕹️",
        description: "Interactive input and action components.",
    },
    {
        value: "indicator",
        label: "Indicator",
        emoji: "🚦",
        description: "Status, signal and state indicator components.",
    },
    {
        value: "layout",
        label: "Layout",
        emoji: "🧭",
        description: "Structure, flow and page composition components.",
    },
    {
        value: "feedback",
        label: "Feedback",
        emoji: "🔔",
        description: "Messaging, alerts and response-state components.",
    },
    {
        value: "data",
        label: "Data",
        emoji: "🧬",
        description: "Data display, records and structured content components.",
    },
    {
        value: "design",
        label: "Design",
        emoji: "🎨",
        description: "Design-system helpers, tokens and visual authoring components.",
    },
    {
        value: "content",
        label: "Content",
        emoji: "✍️",
        description: "Text, narrative and editorial content components.",
    },
    {
        value: "visualization",
        label: "Visualization",
        emoji: "📊",
        description: "Charts, graphics and visual exploration components.",
    },
    {
        value: "genealogy",
        label: "Genealogy",
        emoji: "🌳",
        description: "Genealogy-specific structures and lineage components.",
    },
] as const satisfies readonly ComponentKindMeta[];

/* ============================================================================
   Helpers
============================================================================ */

export function emojiForComponentKind(kind: ComponentKind): string {
    const meta = COMPONENT_KIND.find((item) => item.value === kind);
    return meta?.emoji ?? "✨";
}
