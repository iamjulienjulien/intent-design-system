"use client";

// src/components/intent/IntentLoader.tsx
// IntentLoader
// - Intent-first animated loader / spinner
// - Supports multiple animation variants with a strong cosmic / space flavor
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Supports glow layers like IntentSurface / controls
// - Can be inline or block, centered, labeled, and progress-aware
// - No dynamic Tailwind classes: only stable hooks + CSS tokens

import * as React from "react";

import { resolveIntent, getIntentControlProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
} from "SYSTEM";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export type IntentLoaderSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
export type IntentLoaderSpeed = "verySlow" | "slow" | "normal" | "fast" | "veryFast";
export type IntentLoaderLayout = "inline" | "stacked";
export type IntentLoaderVariant =
    | "spinner"
    | "ring"
    | "orbit"
    | "planet"
    | "comet"
    | "stars"
    | "pulse"
    | "radar"
    | "warp"
    | "eclipse"
    | "constellation"
    | "galaxy"
    | "neural"
    | "analyzing"
    | "matrix"
    | "thinking"
    | "runes"
    | "sigil"
    | "alchemy"
    | "portal";

function sizeClass(size: IntentLoaderSize) {
    switch (size) {
        case "xs":
            return "ids-loader-xs";
        case "sm":
            return "ids-loader-sm";
        case "lg":
            return "ids-loader-lg";
        case "xl":
            return "ids-loader-xl";
        case "2xl":
            return "ids-loader-2xl";
        case "3xl":
            return "ids-loader-3xl";
        case "4xl":
            return "ids-loader-4xl";
        default:
            return "ids-loader-md";
    }
}

function speedClass(speed: IntentLoaderSpeed) {
    if (speed === "verySlow") return "ids-loader-verySlow";
    if (speed === "slow") return "ids-loader-slow";
    if (speed === "fast") return "ids-loader-fast";
    if (speed === "veryFast") return "ids-loader-veryFast";
    return "ids-loader-normal";
}

function layoutClass(layout: IntentLoaderLayout) {
    return layout === "inline" ? "ids-loader-inline" : "ids-loader-stacked";
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentLoaderProps<T extends React.ElementType = "div"> = IntentInput & {
    as?: T;
    className?: string;

    /**
     * Controls animation state.
     * When false, animation pauses.
     */
    loading?: boolean;

    /**
     * If true and loading is false, hides the component.
     */
    hideWhenIdle?: boolean;

    /**
     * Main visual variant.
     */
    loaderVariant?: IntentLoaderVariant;

    /**
     * Size preset.
     */
    size?: IntentLoaderSize;

    /**
     * Animation speed preset.
     */
    speed?: IntentLoaderSpeed;

    /**
     * Layout of visual + text.
     */
    layout?: IntentLoaderLayout;

    /**
     * Main label under / next to the loader.
     */
    label?: React.ReactNode;

    /**
     * Optional secondary caption.
     */
    caption?: React.ReactNode;

    /**
     * Optional progress from 0 to 100.
     * Used by supported variants + text display.
     */
    progress?: number | null;

    /**
     * If true, shows the progress number.
     */
    showProgress?: boolean;

    /**
     * If true, centers content.
     */
    centered?: boolean;

    /**
     * Stretch to full width.
     */
    fullWidth?: boolean;

    /**
     * Adds a faint frame to the loader body.
     */
    framed?: boolean;

    /**
     * Optional icon or emoji in the center for some variants.
     */
    centerIcon?: React.ReactNode;

    /**
     * Accessibility
     */
    role?: React.AriaRole;
    ariaLabel?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children" | "color">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_LOADER_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "loading",
        description: {
            fr: "Active ou met en pause l’animation.",
            en: "Enables or pauses the animation.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "hideWhenIdle",
        description: {
            fr: "Cache complètement le loader quand loading=false.",
            en: "Fully hides the loader when loading=false.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "loaderVariant",
        description: {
            fr: "Variante visuelle du loader.",
            en: "Visual loader variant.",
        },
        type: `"spinner" | "ring" | "orbit" | "planet" | "comet" | "stars" | "pulse" | "radar" | "warp" | "eclipse" | "constellation" | "galaxy" | "neural" | "analyzing" | "matrix" | "thinking" | "runes" | "sigil" | "alchemy" | "portal"`,
        required: false,
        default: "orbit",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille générale du loader.",
            en: "Overall loader size.",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "speed",
        description: {
            fr: "Vitesse d’animation.",
            en: "Animation speed.",
        },
        type: `"verySlow" | "slow" | "normal" | "fast" | "veryFast"`,
        required: false,
        default: "normal",
        fromSystem: false,
    },
    {
        name: "layout",
        description: {
            fr: "Disposition inline ou empilée.",
            en: "Inline or stacked layout.",
        },
        type: `"inline" | "stacked"`,
        required: false,
        default: "stacked",
        fromSystem: false,
    },
    {
        name: "label",
        description: {
            fr: "Label principal affiché avec le loader.",
            en: "Primary label displayed with the loader.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "caption",
        description: {
            fr: "Texte secondaire sous le label.",
            en: "Secondary text under the label.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "progress",
        description: {
            fr: "Progression optionnelle de 0 à 100.",
            en: "Optional progress from 0 to 100.",
        },
        type: "number | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "showProgress",
        description: {
            fr: "Affiche la valeur de progression.",
            en: "Displays the progress value.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "centered",
        description: {
            fr: "Centre visuellement le loader et son texte.",
            en: "Visually centers the loader and its text.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le composant sur toute la largeur disponible.",
            en: "Stretches the component to full available width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "framed",
        description: {
            fr: "Ajoute un cadre subtil autour du loader.",
            en: "Adds a subtle frame around the loader.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "centerIcon",
        description: {
            fr: "Icône ou emoji affiché au centre de certaines variantes.",
            en: "Icon or emoji displayed in the center of some variants.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "role",
        description: {
            fr: "Rôle ARIA du composant.",
            en: "ARIA role of the component.",
        },
        type: "React.AriaRole",
        required: false,
        default: "status",
        fromSystem: false,
    },
    {
        name: "ariaLabel",
        description: {
            fr: "Libellé ARIA explicite pour l’état de chargement.",
            en: "Explicit ARIA label for loading state.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du tag rendu (id, style, aria-*, data-*…).",
            en: "All native props of the rendered tag (id, style, aria-*, data-*…).",
        },
        type: "Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children' | 'color'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentLoaderPropsTable: DocsPropRow[] = [
    ...INTENT_LOADER_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentLoaderIdentity: ComponentIdentity = {
    name: "IntentLoader",
    kind: "feedback",
    description: {
        fr: "Loader intent-first à variantes cosmiques: spinner, orbites, comètes, radar, warp, galaxies et plus encore.",
        en: "Intent-first loader with cosmic variants: spinner, orbits, comets, radar, warp, galaxies and more.",
    },
    since: "0.3.0",
    docs: { route: "/playground/components/intent-loader" },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        inner: ".intent-loader-inner",
        visual: ".intent-loader-visual",
        content: ".intent-loader-content",
        label: ".intent-loader-label",
        caption: ".intent-loader-caption",
        progress: ".intent-loader-progress",
    },
    classHooks: [
        "intent-control",
        "intent-loader",
        "intent-loader-inner",
        "intent-loader-visual",
        "intent-loader-content",
        "intent-loader-label",
        "intent-loader-caption",
        "intent-loader-progress",
        "intent-loader-frame",
        "intent-loader-variant-spinner",
        "intent-loader-variant-ring",
        "intent-loader-variant-orbit",
        "intent-loader-variant-planet",
        "intent-loader-variant-comet",
        "intent-loader-variant-stars",
        "intent-loader-variant-pulse",
        "intent-loader-variant-radar",
        "intent-loader-variant-warp",
        "intent-loader-variant-eclipse",
        "intent-loader-variant-constellation",
        "intent-loader-variant-galaxy",
        "intent-loader-variant-neural",
        "intent-loader-variant-analyzing",
        "intent-loader-variant-matrix",
        "intent-loader-variant-thinking",
        "intent-loader-variant-runes",
        "intent-loader-variant-sigil",
        "intent-loader-variant-alchemy",
        "intent-loader-variant-portal",
        "ids-loader-xs",
        "ids-loader-sm",
        "ids-loader-md",
        "ids-loader-lg",
        "ids-loader-xl",
        "ids-loader-slow",
        "ids-loader-normal",
        "ids-loader-fast",
        "ids-loader-verySlow",
        "ids-loader-veryFast",
        "ids-loader-inline",
        "ids-loader-stacked",
        "is-loading",
        "is-idle",
        "is-centered",
        "is-framed",
    ],
};

/* ============================================================================
   Visuals
============================================================================ */

function LoaderVisual({
    variant,
    centerIcon,
    progress,
}: {
    variant: IntentLoaderVariant;
    centerIcon?: React.ReactNode;
    progress?: number | null;
}) {
    const safeProgress =
        typeof progress === "number" && Number.isFinite(progress)
            ? Math.max(0, Math.min(100, progress))
            : null;

    if (variant === "spinner") {
        return (
            <span className="intent-loader-art intent-loader-art-spinner" aria-hidden>
                <span className="intent-loader-spinner-ring" />
            </span>
        );
    }

    if (variant === "ring") {
        return (
            <span className="intent-loader-art intent-loader-art-ring" aria-hidden>
                <span className="intent-loader-ring-track" />
                <span
                    className="intent-loader-ring-fill"
                    style={
                        safeProgress !== null
                            ? ({
                                  ["--ids-loader-progress" as string]: `${safeProgress}%`,
                              } as React.CSSProperties)
                            : undefined
                    }
                />
                {centerIcon ? <span className="intent-loader-centerIcon">{centerIcon}</span> : null}
            </span>
        );
    }

    if (variant === "orbit") {
        return (
            <span className="intent-loader-art intent-loader-art-orbit" aria-hidden>
                <span className="intent-loader-core" />
                <span className="intent-loader-orbit intent-loader-orbit-a">
                    <span className="intent-loader-orbiter" />
                </span>
                <span className="intent-loader-orbit intent-loader-orbit-b">
                    <span className="intent-loader-orbiter" />
                </span>
                <span className="intent-loader-orbit intent-loader-orbit-c">
                    <span className="intent-loader-orbiter" />
                </span>
                {centerIcon ? <span className="intent-loader-centerIcon">{centerIcon}</span> : null}
            </span>
        );
    }

    if (variant === "planet") {
        return (
            <span className="intent-loader-art intent-loader-art-planet" aria-hidden>
                <span className="intent-loader-planet" />
                <span className="intent-loader-planet-ring" />
                <span className="intent-loader-moonOrbit">
                    <span className="intent-loader-moon" />
                </span>
            </span>
        );
    }

    if (variant === "comet") {
        return (
            <span className="intent-loader-art intent-loader-art-comet" aria-hidden>
                <span className="intent-loader-comet-path" />
                <span className="intent-loader-cometHead" />
                <span className="intent-loader-cometTail" />
            </span>
        );
    }

    if (variant === "stars") {
        return (
            <span className="intent-loader-art intent-loader-art-stars" aria-hidden>
                <span className="intent-loader-star intent-loader-star-a" />
                <span className="intent-loader-star intent-loader-star-b" />
                <span className="intent-loader-star intent-loader-star-c" />
                <span className="intent-loader-star intent-loader-star-d" />
                <span className="intent-loader-star intent-loader-star-e" />
            </span>
        );
    }

    if (variant === "pulse") {
        return (
            <span className="intent-loader-art intent-loader-art-pulse" aria-hidden>
                <span className="intent-loader-pulseCore" />
                <span className="intent-loader-pulseWave intent-loader-pulseWave-a" />
                <span className="intent-loader-pulseWave intent-loader-pulseWave-b" />
                <span className="intent-loader-pulseWave intent-loader-pulseWave-c" />
            </span>
        );
    }

    if (variant === "radar") {
        return (
            <span className="intent-loader-art intent-loader-art-radar" aria-hidden>
                <span className="intent-loader-radar-grid intent-loader-radar-grid-a" />
                <span className="intent-loader-radar-grid intent-loader-radar-grid-b" />
                <span className="intent-loader-radar-grid intent-loader-radar-grid-c" />
                <span className="intent-loader-radar-sweep" />
                <span className="intent-loader-radar-blip intent-loader-radar-blip-a" />
                <span className="intent-loader-radar-blip intent-loader-radar-blip-b" />
            </span>
        );
    }

    if (variant === "warp") {
        return (
            <span className="intent-loader-art intent-loader-art-warp" aria-hidden>
                <span className="intent-loader-warpLine intent-loader-warpLine-a" />
                <span className="intent-loader-warpLine intent-loader-warpLine-b" />
                <span className="intent-loader-warpLine intent-loader-warpLine-c" />
                <span className="intent-loader-warpLine intent-loader-warpLine-d" />
                <span className="intent-loader-warpLine intent-loader-warpLine-e" />
                <span className="intent-loader-warpCore" />
            </span>
        );
    }

    if (variant === "eclipse") {
        return (
            <span className="intent-loader-art intent-loader-art-eclipse" aria-hidden>
                <span className="intent-loader-eclipseSun" />
                <span className="intent-loader-eclipseMoon" />
                <span className="intent-loader-eclipseHalo" />
            </span>
        );
    }

    if (variant === "constellation") {
        return (
            <span className="intent-loader-art intent-loader-art-constellation" aria-hidden>
                <span className="intent-loader-node intent-loader-node-a" />
                <span className="intent-loader-node intent-loader-node-b" />
                <span className="intent-loader-node intent-loader-node-c" />
                <span className="intent-loader-node intent-loader-node-d" />
                <span className="intent-loader-node intent-loader-node-e" />
                <span className="intent-loader-link intent-loader-link-a" />
                <span className="intent-loader-link intent-loader-link-b" />
                <span className="intent-loader-link intent-loader-link-c" />
                <span className="intent-loader-link intent-loader-link-d" />
            </span>
        );
    }

    if (variant === "neural") {
        return (
            <span className="intent-loader-art intent-loader-art-neural" aria-hidden>
                <span className="intent-loader-neural-node intent-loader-neural-node-a" />
                <span className="intent-loader-neural-node intent-loader-neural-node-b" />
                <span className="intent-loader-neural-node intent-loader-neural-node-c" />
                <span className="intent-loader-neural-node intent-loader-neural-node-d" />
                <span className="intent-loader-neural-link intent-loader-neural-link-a" />
                <span className="intent-loader-neural-link intent-loader-neural-link-b" />
                <span className="intent-loader-neural-link intent-loader-neural-link-c" />
                <span className="intent-loader-neural-pulse intent-loader-neural-pulse-a" />
                <span className="intent-loader-neural-pulse intent-loader-neural-pulse-b" />
            </span>
        );
    }

    if (variant === "analyzing") {
        return (
            <span className="intent-loader-art intent-loader-art-analyzing" aria-hidden>
                <span className="intent-loader-scanFrame" />
                <span className="intent-loader-scanLine" />
                <span className="intent-loader-scanDot intent-loader-scanDot-a" />
                <span className="intent-loader-scanDot intent-loader-scanDot-b" />
                <span className="intent-loader-scanDot intent-loader-scanDot-c" />
            </span>
        );
    }

    if (variant === "matrix") {
        return (
            <span className="intent-loader-art intent-loader-art-matrix" aria-hidden>
                <span className="intent-loader-matrixCol intent-loader-matrixCol-a" />
                <span className="intent-loader-matrixCol intent-loader-matrixCol-b" />
                <span className="intent-loader-matrixCol intent-loader-matrixCol-c" />
                <span className="intent-loader-matrixCol intent-loader-matrixCol-d" />
                <span className="intent-loader-matrixGlow" />
            </span>
        );
    }

    if (variant === "thinking") {
        return (
            <span className="intent-loader-art intent-loader-art-thinking" aria-hidden>
                <span className="intent-loader-thinkingCore" />
                <span className="intent-loader-thinkingRing intent-loader-thinkingRing-a" />
                <span className="intent-loader-thinkingRing intent-loader-thinkingRing-b" />
                <span className="intent-loader-thinkingRing intent-loader-thinkingRing-c" />
            </span>
        );
    }

    if (variant === "runes") {
        return (
            <span className="intent-loader-art intent-loader-art-runes" aria-hidden>
                <span className="intent-loader-rune intent-loader-rune-a">✦</span>
                <span className="intent-loader-rune intent-loader-rune-b">✧</span>
                <span className="intent-loader-rune intent-loader-rune-c">✶</span>
                <span className="intent-loader-rune intent-loader-rune-d">✷</span>
                <span className="intent-loader-runeCore" />
            </span>
        );
    }

    if (variant === "sigil") {
        return (
            <span className="intent-loader-art intent-loader-art-sigil" aria-hidden>
                <span className="intent-loader-sigilOuter" />
                <span className="intent-loader-sigilInner" />
                <span className="intent-loader-sigilMark intent-loader-sigilMark-a" />
                <span className="intent-loader-sigilMark intent-loader-sigilMark-b" />
                <span className="intent-loader-sigilMark intent-loader-sigilMark-c" />
                <span className="intent-loader-sigilMark intent-loader-sigilMark-d" />
            </span>
        );
    }

    if (variant === "alchemy") {
        return (
            <span className="intent-loader-art intent-loader-art-alchemy" aria-hidden>
                <span className="intent-loader-alchemyTriangle intent-loader-alchemyTriangle-a" />
                <span className="intent-loader-alchemyTriangle intent-loader-alchemyTriangle-b" />
                <span className="intent-loader-alchemyCircle" />
                <span className="intent-loader-alchemySpark intent-loader-alchemySpark-a" />
                <span className="intent-loader-alchemySpark intent-loader-alchemySpark-b" />
            </span>
        );
    }

    if (variant === "portal") {
        return (
            <span className="intent-loader-art intent-loader-art-portal" aria-hidden>
                <span className="intent-loader-portalRing intent-loader-portalRing-a" />
                <span className="intent-loader-portalRing intent-loader-portalRing-b" />
                <span className="intent-loader-portalRing intent-loader-portalRing-c" />
                <span className="intent-loader-portalCore" />
            </span>
        );
    }

    return (
        <span className="intent-loader-art intent-loader-art-galaxy" aria-hidden>
            <span className="intent-loader-galaxyCore" />
            <span className="intent-loader-galaxyArm intent-loader-galaxyArm-a" />
            <span className="intent-loader-galaxyArm intent-loader-galaxyArm-b" />
            <span className="intent-loader-galaxyDust intent-loader-galaxyDust-a" />
            <span className="intent-loader-galaxyDust intent-loader-galaxyDust-b" />
            <span className="intent-loader-galaxyDust intent-loader-galaxyDust-c" />
            {centerIcon ? <span className="intent-loader-centerIcon">{centerIcon}</span> : null}
        </span>
    );
}

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentLoader<T extends React.ElementType = "div">(props: IntentLoaderProps<T>) {
    const {
        as,
        className,
        loading = true,
        hideWhenIdle = false,
        loaderVariant = "orbit",
        size = "md",
        speed = "normal",
        layout = "stacked",
        label,
        caption,
        progress = null,
        showProgress = false,
        centered = false,
        fullWidth = false,
        framed = false,
        centerIcon,
        role = "status",
        ariaLabel,

        intent,
        variant: dsVariant,
        tone,
        glow,
        intensity,
        mode,
        toneStep,
        disabled: disabledProp,

        ...restProps
    } = props;

    const disabled = Boolean(disabledProp);

    if (!loading && hideWhenIdle) return null;

    const intentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(dsVariant !== undefined ? { variant: dsVariant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        ...(toneStep !== undefined ? { toneStep } : {}),
        disabled,
    };

    const resolved = resolveIntent(intentInput);
    const controlProps = getIntentControlProps(resolved, className);

    const hasGlow = Boolean(resolved.glowBackground);
    const v = resolved.variant;
    const glowAllowed = hasGlow && v !== "ghost";
    const isGlowed = resolved.intent === "glowed";
    const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
    const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolved.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    const Tag = (as ?? "div") as React.ElementType;

    const safeProgress =
        typeof progress === "number" && Number.isFinite(progress)
            ? Math.max(0, Math.min(100, progress))
            : null;

    const rootCls = cn(
        "intent-control intent-loader",
        sizeClass(size),
        speedClass(speed),
        layoutClass(layout),
        `intent-loader-variant-${loaderVariant}`,
        fullWidth && "w-full",
        centered && "is-centered",
        framed && "is-framed",
        loading ? "is-loading" : "is-idle",
        disabled && "is-disabled"
    );

    const domProps = { ...(restProps as Record<string, unknown>) };

    delete domProps.loaderVariant;
    delete domProps.intent;
    delete domProps.variant;
    delete domProps.tone;
    delete domProps.glow;
    delete domProps.intensity;
    delete domProps.mode;
    delete domProps.toneStep;
    delete domProps.disabled;

    return (
        <Tag
            {...(domProps as Omit<React.ComponentPropsWithoutRef<T>, "className">)}
            {...controlProps}
            className={cn(controlProps.className, rootCls)}
            role={role}
            aria-live="polite"
            aria-busy={loading || undefined}
            aria-label={ariaLabel ?? (typeof label === "string" ? label : "Loading")}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            data-tonestep={resolved.toneStep}
        >
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <span
                            aria-hidden
                            className="intent-glow-layer intent-glow-fill"
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            aria-hidden
                            className="intent-glow-layer intent-glow-border"
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            <div className="intent-loader-inner relative z-10">
                <div className="intent-loader-visual">
                    <LoaderVisual
                        variant={loaderVariant}
                        centerIcon={centerIcon}
                        progress={safeProgress}
                    />
                </div>

                {label || caption || (showProgress && safeProgress !== null) ? (
                    <div className="intent-loader-content">
                        {label ? <div className="intent-loader-label">{label}</div> : null}
                        {caption ? <div className="intent-loader-caption">{caption}</div> : null}
                        {showProgress && safeProgress !== null ? (
                            <div className="intent-loader-progress">{safeProgress}%</div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </Tag>
    );
}

export default IntentLoader;
