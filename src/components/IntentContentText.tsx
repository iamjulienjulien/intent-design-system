"use client";

// src/components/intent/IntentContentText.tsx
// IntentContentText
// - Intent-first text content component
// - Supports semantic / toned / glowed text rendering
// - Supports gradient text from glow meta when available
// - Lightweight typography helpers for narrative / labels / titles
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import { resolveIntent } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
    getGlowMeta,
} from "SYSTEM";
import { cn } from "HELPERS";

/* ============================================================================
   Types
============================================================================ */

export type IntentContentTextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export type IntentContentTextWeight = "regular" | "medium" | "semibold" | "bold";

export type IntentContentTextAlign = "left" | "center" | "right";
export type IntentContentTextWrap = "normal" | "pretty" | "nowrap";
export type IntentContentTextGradient = boolean | "auto" | "text";

export type IntentContentTextProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLElement>, "children" | "color"> & {
        children?: React.ReactNode;

        as?: keyof React.JSX.IntrinsicElements;
        inline?: boolean;

        size?: IntentContentTextSize;
        weight?: IntentContentTextWeight;
        align?: IntentContentTextAlign;
        wrap?: IntentContentTextWrap;

        truncate?: boolean;
        balance?: boolean;

        gradient?: IntentContentTextGradient;
        glowText?: boolean;
        muted?: boolean;

        selectable?: boolean;
        mono?: boolean;
        italic?: boolean;

        leadingIcon?: React.ReactNode;
        trailingIcon?: React.ReactNode;
    };

/* ============================================================================
   Docs
============================================================================ */

const INTENT_CONTENT_TEXT_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: {
            fr: "Balise HTML rendue par le composant.",
            en: "HTML tag rendered by the component.",
        },
        type: "keyof JSX.IntrinsicElements",
        required: false,
        default: '"span"',
        fromSystem: false,
    },
    {
        name: "inline",
        description: {
            fr: "Force le comportement inline ou block.",
            en: "Forces inline or block behavior.",
        },
        type: "boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille typographique du texte.",
            en: "Typography size of the text.",
        },
        type: '"xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"',
        required: false,
        default: '"md"',
        fromSystem: false,
    },
    {
        name: "weight",
        description: {
            fr: "Graisse typographique.",
            en: "Typography weight.",
        },
        type: '"regular" | "medium" | "semibold" | "bold"',
        required: false,
        default: '"medium"',
        fromSystem: false,
    },
    {
        name: "gradient",
        description: {
            fr: "Active un gradient de texte. auto l’active surtout en mode glowed si disponible.",
            en: "Enables gradient text. auto mainly enables it in glowed mode when available.",
        },
        type: 'boolean | "auto" | "text"',
        required: false,
        default: '"auto"',
        fromSystem: false,
    },
    {
        name: "glowText",
        description: {
            fr: "Ajoute un halo subtil autour du texte.",
            en: "Adds a subtle halo around the text.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "muted",
        description: {
            fr: "Adoucit visuellement le texte.",
            en: "Softens the text visually.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "truncate",
        description: {
            fr: "Tronque le texte sur une ligne.",
            en: "Truncates text on a single line.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "balance",
        description: {
            fr: "Utilise text-wrap balance pour les titres et accroches.",
            en: "Uses text-wrap balance for headings and hero copy.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "mono",
        description: {
            fr: "Utilise une police monospace.",
            en: "Uses a monospace font.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "italic",
        description: {
            fr: "Affiche le texte en italique.",
            en: "Displays text in italic.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "leadingIcon",
        description: {
            fr: "Icône affichée avant le contenu.",
            en: "Icon displayed before content.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "trailingIcon",
        description: {
            fr: "Icône affichée après le contenu.",
            en: "Icon displayed after content.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
];

export const IntentContentTextPropsTable: DocsPropRow[] = [
    ...INTENT_CONTENT_TEXT_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentContentTextIdentity: ComponentIdentity = {
    name: "IntentContentText",
    kind: "content",
    description: {
        fr: "Texte intent-first avec couleur résolue, gradient glow, halo et helpers typographiques.",
        en: "Intent-first text with resolved color, glow gradient, halo and typography helpers.",
    },
    since: "0.3.0",
    docs: { route: "/playground/components/intent-content-text" },
    anatomy: {
        root: "HTML element",
        leading: ".intent-content-text-leading",
        content: ".intent-content-text-content",
        trailing: ".intent-content-text-trailing",
    },
    classHooks: [
        "intent-content-text",
        "intent-content-text-inline",
        "intent-content-text-block",
        "intent-content-text-gradient",
        "intent-content-text-muted",
        "intent-content-text-glow",
        "intent-content-text-truncate",
        "intent-content-text-balance",
        "intent-content-text-nowrap",
        "intent-content-text-pretty",
        "intent-content-text-leading",
        "intent-content-text-content",
        "intent-content-text-trailing",
        "ids-content-text-xs",
        "ids-content-text-sm",
        "ids-content-text-md",
        "ids-content-text-lg",
        "ids-content-text-xl",
        "ids-content-text-2xl",
        "ids-content-text-3xl",
        "ids-content-text-regular",
        "ids-content-text-medium",
        "ids-content-text-semibold",
        "ids-content-text-bold",
    ],
};

/* ============================================================================
   Helpers
============================================================================ */

function sizeClass(size: IntentContentTextSize) {
    if (size === "xs") return "ids-content-text-xs";
    if (size === "sm") return "ids-content-text-sm";
    if (size === "lg") return "ids-content-text-lg";
    if (size === "xl") return "ids-content-text-xl";
    if (size === "2xl") return "ids-content-text-2xl";
    if (size === "3xl") return "ids-content-text-3xl";
    return "ids-content-text-md";
}

function weightClass(weight: IntentContentTextWeight) {
    if (weight === "regular") return "ids-content-text-regular";
    if (weight === "semibold") return "ids-content-text-semibold";
    if (weight === "bold") return "ids-content-text-bold";
    return "ids-content-text-medium";
}

function shouldUseGradient(
    gradient: IntentContentTextGradient,
    glowKey: string | null,
    intent: string
) {
    if (gradient === true || gradient === "text") return true;
    if (gradient === false) return false;
    return intent === "glowed" && Boolean(glowKey);
}

function resolveTextGradient(mode: "light" | "dark", glowKey: string | null): string | null {
    if (!glowKey) return null;

    const glowMeta = getGlowMeta(glowKey as any);
    const textGradient = glowMeta?.gradient?.text;

    if (!textGradient) return null;
    return mode === "light" ? textGradient.light : textGradient.dark;
}

function resolveTextGlowShadow(mode: "light" | "dark", glowKey: string | null, enabled: boolean) {
    if (!enabled) return undefined;

    const gradient = resolveTextGradient(mode, glowKey);
    if (!gradient) {
        return mode === "dark" ? "0 0 20px rgba(255,255,255,0.12)" : "0 0 16px rgba(15,23,42,0.12)";
    }

    const glowMeta = glowKey ? getGlowMeta(glowKey as any) : null;
    const stops = glowMeta?.gradient?.[mode];
    const first = stops?.[0]?.color;

    if (!first) {
        return mode === "dark" ? "0 0 20px rgba(255,255,255,0.12)" : "0 0 16px rgba(15,23,42,0.12)";
    }

    return `0 0 18px ${first}`;
}

/* ============================================================================
   Main
============================================================================ */

export function IntentContentText(props: IntentContentTextProps) {
    const {
        children,
        as = "span",
        inline,
        size = "md",
        weight = "medium",
        align = "left",
        wrap = "normal",
        truncate = false,
        balance = false,
        gradient = "auto",
        glowText = false,
        muted = false,
        selectable = true,
        mono = false,
        italic = false,
        leadingIcon,
        trailingIcon,
        className,
        style,
        intent,
        variant,
        tone,
        glow,
        intensity,
        toneStep,
        mode,
        disabled,
        ...rest
    } = props;

    const Component = as as React.ElementType;

    const intentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        // ...(variant !== undefined ? { variant } : {}), // ✅ IMPORTANT
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        ...(toneStep !== undefined ? { toneStep } : {}),
        // disabled,
    };

    const resolved = resolveIntent(intentInput);

    const isInline = inline ?? as === "span";
    const textGradient = resolveTextGradient(resolved.mode, resolved.glowKey);
    const useGradient =
        shouldUseGradient(gradient, resolved.glowKey, resolved.intent) && !!textGradient;
    const textShadow = resolveTextGlowShadow(resolved.mode, resolved.glowKey, glowText);

    const mergedStyle: React.CSSProperties = {
        ...(resolved.style as React.CSSProperties),
        ...(style ?? {}),
    };

    if (useGradient && textGradient) {
        mergedStyle.backgroundImage = textGradient;
        mergedStyle.backgroundClip = "text";
        (
            mergedStyle as React.CSSProperties & { WebkitBackgroundClip?: string }
        ).WebkitBackgroundClip = "text";
        (
            mergedStyle as React.CSSProperties & { WebkitTextFillColor?: string }
        ).WebkitTextFillColor = "transparent";
        mergedStyle.color = "transparent";
    }

    if (textShadow) {
        mergedStyle.textShadow = textShadow;
    }

    if (muted) {
        mergedStyle.opacity =
            typeof mergedStyle.opacity === "number" ? mergedStyle.opacity * 0.72 : 0.72;
    }

    const rootClassName = cn(
        "intent-content-text",
        resolved.classes.text,
        isInline
            ? "intent-content-text-inline inline-flex items-center gap-2"
            : "intent-content-text-block flex items-center gap-2",
        sizeClass(size),
        weightClass(weight),
        useGradient && "intent-content-text-gradient",
        muted && "intent-content-text-muted",
        glowText && "intent-content-text-glow",
        truncate && "intent-content-text-truncate truncate",
        balance && "intent-content-text-balance text-balance",
        wrap === "pretty" && "intent-content-text-pretty text-pretty",
        wrap === "nowrap" && "intent-content-text-nowrap whitespace-nowrap",
        align === "center" && "text-center justify-center",
        align === "right" && "text-right justify-end",
        mono && "font-mono",
        italic && "italic",
        !selectable && "select-none",
        disabled && "opacity-50 pointer-events-none",
        className
    );

    return (
        <Component
            {...rest}
            className={rootClassName}
            style={mergedStyle}
            data-intent={resolved.intent}
            data-mode={resolved.mode}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-gradient={useGradient ? "true" : "false"}
        >
            {leadingIcon ? (
                <span className="intent-content-text-leading" aria-hidden>
                    {leadingIcon}
                </span>
            ) : null}

            <span className="intent-content-text-content min-w-0">{children}</span>

            {trailingIcon ? (
                <span className="intent-content-text-trailing" aria-hidden>
                    {trailingIcon}
                </span>
            ) : null}
        </Component>
    );
}

export default IntentContentText;
