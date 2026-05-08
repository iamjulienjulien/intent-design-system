import * as React from "react";
import { resolveIntent, getIntentSurfaceProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
} from "SYSTEM";
import { cn } from "HELPERS";

/* ============================================================================
   🏷️ LOCAL TYPE
============================================================================ */

export type IntentSurfaceComponentProps<T extends React.ElementType = "div"> = IntentInput & {
    as?: T;
    className?: string;
    children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_SURFACE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "children",
        description: {
            fr: "Contenu rendu à l’intérieur de la surface.",
            en: "Content rendered inside the surface.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du tag rendu (id, style, onClick, aria-*, data-*…).",
            en: "All native props of the rendered tag (id, style, onClick, aria-*, data-*…).",
        },
        type: "React.ComponentPropsWithoutRef<T>",
        required: false,
        fromSystem: false,
    },
];

export const IntentSurfacePropsTable: DocsPropRow[] = [
    ...INTENT_SURFACE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentSurfaceIdentity: ComponentIdentity = {
    name: "IntentSurface",
    kind: "surface",
    description: {
        fr: "Surface intent-first appliquant les variables CSS et hooks visuels via resolveIntent().",
        en: "Intent-first surface applying CSS variables and visual hooks via resolveIntent().",
    },
    since: "0.1.0",
    docs: {
        route: "/playground/components/IntentSurface",
    },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        content: "children wrapper (.relative.z-10)",
    },
    classHooks: [
        "intent-surface",
        "intent-bg",
        "intent-ink",
        "intent-border",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentSurface<T extends React.ElementType = "div">(
    props: IntentSurfaceComponentProps<T>
) {
    const {
        as,
        className,
        children,
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

    const Tag = (as ?? "div") as React.ElementType;

    const disabled = Boolean(disabledProp);

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
    const surfaceProps = getIntentSurfaceProps(resolved, className);

    const hasGlow = Boolean(resolved.glowBackground);
    const variant = resolved.variant;

    const glowAllowed = hasGlow && variant !== "ghost";
    const isGlowed = resolved.intent === "glowed";

    const allowFillGlow = glowAllowed && (isGlowed || variant === "flat" || variant === "elevated");
    const allowBorderGlow = glowAllowed && (variant === "outlined" || variant === "elevated");

    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolved.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    return (
        <Tag {...surfaceProps} {...restProps}>
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <div
                            className={cn("intent-glow-layer intent-glow-fill")}
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <div
                            className={cn("intent-glow-layer intent-glow-border")}
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            <div className="relative z-10 w-full">{children}</div>
        </Tag>
    );
}
