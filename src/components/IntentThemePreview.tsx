"use client";

// src/components/intent/IntentThemePreview.tsx
// IntentThemePreview
// - Compact theme + intent preview grid (tokens visualizer)
// - Uses resolveIntent() to compute stable class hooks + CSS vars per tile
// - Supports glow layers like IntentSurface / controls
// - No dynamic Tailwind classes: only stable hooks + CSS tokens
// - Built for docs/playground: quickly sanity-check mode/variant/intent/toneStep/glow
// - ✅ scope="tones": preview all Tone values (intent="toned")

import * as React from "react";
import {
    AESTHETIC_GLOW_VALUES,
    isAestheticGlow,
    SYSTEM_PROPS_TABLE,
    type Glow,
    type Tone,
    type Intent,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
} from "SYSTEM";
import { resolveIntent, getIntentSurfaceProps } from "CORE";

// import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
// import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type PreviewDensity = "compact" | "comfortable";
type PreviewScope = "intents" | "glows" | "tones";

function densityClass(density: PreviewDensity) {
    return density === "compact" ? "ids-theme-preview-compact" : "ids-theme-preview-comfortable";
}

function scopeLabel(scope: PreviewScope) {
    if (scope === "glows") return "Aesthetic glows";
    if (scope === "tones") return "Tones";
    return "Intents";
}

const DEFAULT_INTENTS: Intent[] = [
    "informed",
    "empowered",
    "warned",
    "threatened",
    "themed",
    "toned",
    "glowed",
];

const DEFAULT_TONES: Tone[] = [
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
];

const DEFAULT_AESTHETIC_GLOWS: Glow[] = [
    "aurora",
    "ember",
    "cosmic",
    "mythic",
    "royal",
    "mono",
    // ✅ new ones you added earlier
    "boreal",
    "solstice",
    "nebula",
    "verdant",
    "nocturne",
] as any;

// function isAestheticGlow(glow: Glow): boolean {
//     return (
//         glow === "aurora" ||
//         glow === "ember" ||
//         glow === "cosmic" ||
//         glow === "mythic" ||
//         glow === "royal" ||
//         glow === "mono" ||
//         glow === "boreal" ||
//         glow === "solstice" ||
//         glow === "nebula" ||
//         glow === "verdant" ||
//         glow === "nocturne"
//     );
// }

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentThemePreviewProps<T extends React.ElementType = "div"> = IntentInput & {
    as?: T;
    className?: string;

    /**
     * Which set to preview:
     * - intents: a tile per intent (informed..glowed)
     * - glows: tiles for aesthetic glows (intent="glowed")
     * - tones: tiles for all Tone values (intent="toned")
     */
    scope?: PreviewScope; // default: "intents"

    /**
     * Which intents are displayed when scope="intents".
     */
    intents?: Intent[];

    /**
     * Which glows are displayed when scope="glows" (intent="glowed").
     */
    glows?: Glow[];

    /**
     * Which tones are displayed when scope="tones" (intent="toned").
     */
    tones?: Tone[];

    /**
     * Tile layout controls
     */
    columns?: 2 | 3 | 4 | 5 | 6; // default: 4
    density?: PreviewDensity; // default: "comfortable"
    showMeta?: boolean; // default: true

    /**
     * Caption shown above the grid
     */
    title?: React.ReactNode;

    /**
     * Optional helper text under title
     */
    description?: React.ReactNode;

    /**
     * Accessibility
     */
    role?: React.AriaRole;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "color">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_THEME_PREVIEW_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: {
            fr: "Élément HTML rendu (polymorphique).",
            en: "Rendered HTML element (polymorphic).",
        },
        type: "T extends React.ElementType",
        required: false,
        default: "div",
        fromSystem: false,
    },
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles appliquées au root.",
            en: "Additional CSS classes applied to the root element.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "scope",
        description: {
            fr: "Ensemble à prévisualiser: intents / glows (aesthetic) / tones (palette).",
            en: "What to preview: intents / glows (aesthetic) / tones (palette).",
        },
        type: `"intents" | "glows" | "tones"`,
        required: false,
        default: "intents",
        fromSystem: false,
    },
    {
        name: "intents",
        description: {
            fr: "Liste d’intents affichés (scope=intents).",
            en: "Intents displayed (scope=intents).",
        },
        type: "Intent[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "glows",
        description: {
            fr: "Liste de glows affichés (scope=glows).",
            en: "Glows displayed (scope=glows).",
        },
        type: "Glow[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "tones",
        description: {
            fr: "Liste de tones affichés (scope=tones).",
            en: "Tones displayed (scope=tones).",
        },
        type: "Tone[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "columns",
        description: { fr: "Nombre de colonnes du grid.", en: "Grid columns count." },
        type: "2 | 3 | 4 | 5 | 6",
        required: false,
        default: "4",
        fromSystem: false,
    },
    {
        name: "density",
        description: { fr: "Densité du rendu des tuiles.", en: "Tile density." },
        type: `"compact" | "comfortable"`,
        required: false,
        default: "comfortable",
        fromSystem: false,
    },
    {
        name: "showMeta",
        description: {
            fr: "Affiche les métas (variant/mode/intensity/tonestep).",
            en: "Shows meta lines (variant/mode/intensity/tonestep).",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "title",
        description: { fr: "Titre au-dessus du grid.", en: "Title above the grid." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "description",
        description: {
            fr: "Texte optionnel sous le titre.",
            en: "Optional helper text under title.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "role",
        description: { fr: "Rôle ARIA (par défaut: region).", en: "ARIA role (default: region)." },
        type: "React.AriaRole",
        required: false,
        default: "region",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du tag rendu (id, style, aria-*, data-*…).",
            en: "All native props of the rendered tag (id, style, aria-*, data-*…).",
        },
        type: "Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'color'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentThemePreviewPropsTable: DocsPropRow[] = [
    ...INTENT_THEME_PREVIEW_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentThemePreviewIdentity: ComponentIdentity = {
    name: "IntentThemePreview",
    kind: "design",
    description: {
        fr: "Prévisualiseur de thème: grille de tuiles intent-first pour valider intents, glows, modes, variants, intensities et toneStep.",
        en: "Theme previewer: grid of intent-first tiles to validate intents, glows, modes, variants, intensities and toneStep.",
    },
    since: "0.3.1",
    docs: { route: "/playground/components/IntentThemePreview" },
    anatomy: {
        root: "Tag (as)",
        header: ".intent-theme-preview-header",
        title: ".intent-theme-preview-title",
        description: ".intent-theme-preview-description",
        grid: ".intent-theme-preview-grid",
        tile: ".intent-theme-preview-tile",
        tileGlowFill: ".intent-glow-layer.intent-glow-fill",
        tileGlowBorder: ".intent-glow-layer.intent-glow-border",
        swatch: ".intent-theme-preview-swatch",
        tileTitle: ".intent-theme-preview-tile-title",
        tileMeta: ".intent-theme-preview-tile-meta",
    },
    classHooks: [
        "intent-theme-preview",
        "intent-theme-preview-header",
        "intent-theme-preview-grid",
        "intent-theme-preview-tile",
        "intent-theme-preview-swatch",
        "ids-theme-preview-compact",
        "ids-theme-preview-comfortable",
        "has-intent-glow",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentThemePreview<T extends React.ElementType = "div">(
    props: IntentThemePreviewProps<T>
) {
    const {
        as,
        className,

        scope = "intents",
        intents = DEFAULT_INTENTS,
        glows = AESTHETIC_GLOW_VALUES,
        tones = DEFAULT_TONES,

        columns = 4,
        density = "comfortable",
        showMeta = true,

        title,
        description,

        role = "region",

        // ✅ DS props pulled OUT
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        toneStep,
        disabled: disabledProp,

        ...restProps
    } = props;

    const disabled = Boolean(disabledProp);

    const Tag = (as ?? "div") as React.ElementType;

    const rootCls = cn(
        "intent-theme-preview",
        densityClass(density),
        disabled && "is-disabled",
        className
    );

    const gridStyle: React.CSSProperties = {
        ...(columns ? ({ ["--ids-theme-preview-cols" as any]: String(columns) } as any) : {}),
    };

    const computedTitle = title ?? (
        <span>
            Theme preview <span className="opacity-60">({scopeLabel(scope)})</span>
        </span>
    );

    const computedDescription =
        description ??
        "Sanity-check: mode / variant / intensity / toneStep, and glow/tone surfaces at a glance.";

    const baseInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        ...(toneStep !== undefined ? { toneStep } : {}),
        disabled,
    };

    const tiles =
        scope === "glows"
            ? glows
                  .filter((g) => isAestheticGlow(g))
                  .map((g) => ({
                      key: `glow:${g}`,
                      label: String(g),
                      input: {
                          ...baseInput,
                          intent: "glowed",
                          glow: g,
                      } as IntentInput,
                  }))
            : scope === "tones"
              ? tones.map((t) => ({
                    key: `tone:${t}`,
                    label: String(t),
                    input: {
                        ...baseInput,
                        intent: "toned",
                        tone: t,
                        // canonical rule: toned ignores glow={true}; force it off for clarity
                        ...(baseInput.glow === true ? { glow: undefined } : {}),
                    } as IntentInput,
                }))
              : intents.map((i) => ({
                    key: `intent:${i}`,
                    label: String(i),
                    input: {
                        ...baseInput,
                        intent: i,
                        // ✅ ensure toned works in scope=intents
                        ...(i === "toned" ? { tone: (baseInput.tone ?? "purple") as Tone } : {}),
                        // If user passes glow string but scope=intents, keep it only for glowed.
                        ...(i === "glowed"
                            ? typeof baseInput.glow === "string"
                                ? { glow: baseInput.glow }
                                : { glow: baseInput.glow ?? "aurora" }
                            : {}),
                    } as IntentInput,
                }));

    return (
        <Tag
            {...(restProps as Omit<React.ComponentPropsWithoutRef<T>, "className">)}
            className={rootCls}
            role={role}
            aria-disabled={disabled || undefined}
        >
            <div className="intent-theme-preview-header">
                <div className="intent-theme-preview-title">{computedTitle}</div>
                {computedDescription ? (
                    <div className="intent-theme-preview-description">{computedDescription}</div>
                ) : null}
            </div>

            <div className="intent-theme-preview-grid" style={gridStyle}>
                {tiles.map((t) => (
                    <ThemeTile key={t.key} label={t.label} input={t.input} showMeta={showMeta} />
                ))}
            </div>
        </Tag>
    );
}

/* ============================================================================
   🧩 Tile (internal)
============================================================================ */

function ThemeTile({
    label,
    input,
    showMeta,
}: {
    label: string;
    input: IntentInput;
    showMeta: boolean;
}) {
    const resolved = resolveIntent(input);
    const surfaceProps = getIntentSurfaceProps(resolved, "intent-theme-preview-tile");

    const v = resolved.variant;
    const hasGlow = Boolean(resolved.glowBackground);
    const glowAllowed = hasGlow && v !== "ghost";
    const isGlowed = resolved.intent === "glowed";

    const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
    const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolved.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    const meta = showMeta
        ? `mode=${resolved.mode} · variant=${resolved.variant} · intensity=${resolved.intensity} · toneStep=${resolved.toneStep ?? 500}`
        : "";

    return (
        <div
            {...surfaceProps}
            className={cn(surfaceProps.className, "intent-theme-preview-tile")}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            data-tonestep={resolved.toneStep}
        >
            {/* Glow layers (under content) */}
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-fill")}
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-border")}
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            <div className="relative z-10">
                <div className="intent-theme-preview-swatch" aria-hidden />
                <div className="intent-theme-preview-tile-title">{label}</div>
                {showMeta ? <div className="intent-theme-preview-tile-meta">{meta}</div> : null}
            </div>
        </div>
    );
}
