// src/components/intent/IntentSurfaceCard.tsx
// IntentSurfaceCard
// - Item surface (smaller rhythm than Panel)
// - Intent-first: resolveIntent() + getIntentSurfaceProps()
// - Supports optional media/header/footer slots (common “item card” anatomy)
// - Optional interactive mode (hover/focus polish) + pressed/selected state
// - Padding scale + bleed mode
// - Stable hooks only (no dynamic Tailwind classes)

import * as React from "react";
import { resolveIntent, getIntentSurfaceProps } from "CORE";
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

export type IntentSurfaceCardPadding = "none" | "xs" | "sm" | "md" | "lg";

export type IntentSurfaceCardComponentProps<T extends React.ElementType = "article"> =
    IntentInput & {
        as?: T;
        className?: string;
        children?: React.ReactNode;

        /** Layout */
        fullWidth?: boolean; // default false
        padded?: IntentSurfaceCardPadding; // default "sm"
        bleed?: boolean; // default false (if true, body wrapper has no padding even if padded != none)

        /** Structure */
        media?: React.ReactNode; // top area (image/video/cover)
        header?: React.ReactNode; // override auto header
        footer?: React.ReactNode;

        /** Header helpers (small item rhythm) */
        eyebrow?: React.ReactNode; // small overline
        title?: React.ReactNode; // primary label
        emoji?: React.ReactNode;
        subtitle?: React.ReactNode; // secondary line
        meta?: React.ReactNode; // right-side meta (date, status)
        actions?: React.ReactNode; // right-side actions (icon buttons)

        /** Dividers between zones */
        divider?: boolean; // default true when header/footer/media exists

        /** Interaction */
        interactive?: boolean; // default false (adds hover/focus polish + cursor)
        pressed?: boolean; // default false (selected/active item)
        disabled?: boolean; // (also in IntentInput, but kept here for ergonomics)
    } & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children" | "title">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_SURFACE_CARD_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: { fr: "Élément HTML rendu (polymorphique).", en: "Rendered HTML element." },
        type: "T extends React.ElementType",
        required: false,
        default: "article",
        fromSystem: false,
    },
    {
        name: "className",
        description: { fr: "Classes CSS additionnelles sur le root.", en: "Extra CSS classes." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "children",
        description: { fr: "Contenu principal de la card.", en: "Main card content." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: { fr: "Étire la card en largeur.", en: "Makes the card full width." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "padded",
        description: { fr: "Padding interne.", en: "Inner padding." },
        type: `"none" | "xs" | "sm" | "md"`,
        required: false,
        default: "sm",
        fromSystem: false,
    },
    {
        name: "bleed",
        description: {
            fr: "Désactive le padding du body (utile si le contenu gère déjà ses espacements).",
            en: "Disables body padding (useful when content manages spacing).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "media",
        description: { fr: "Zone media en haut (cover).", en: "Top media area (cover)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "header",
        description: { fr: "Header custom (override du header auto).", en: "Custom header." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "footer",
        description: { fr: "Footer de la card.", en: "Card footer." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "eyebrow / title / subtitle",
        description: {
            fr: "Header auto: eyebrow, titre, sous-titre.",
            en: "Auto header: eyebrow, title, subtitle.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "meta",
        description: { fr: "Zone meta (header, à droite).", en: "Meta area (right side)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "actions",
        description: { fr: "Zone actions (header, à droite).", en: "Actions area (right side)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "divider",
        description: { fr: "Séparateurs entre zones.", en: "Dividers between zones." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "interactive",
        description: {
            fr: "Ajoute un polish hover/focus (item cliquable).",
            en: "Adds hover/focus polish (clickable item).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "pressed",
        description: {
            fr: "État sélectionné/actif (ex: item courant).",
            en: "Selected/active state.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du tag (id, style, onClick, aria-*, data-*…).",
            en: "Native props of the rendered tag.",
        },
        type: "React.ComponentPropsWithoutRef<T>",
        required: false,
        fromSystem: false,
    },
];

export const IntentSurfaceCardPropsTable: DocsPropRow[] = [
    ...INTENT_SURFACE_CARD_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentSurfaceCardIdentity: ComponentIdentity = {
    name: "IntentSurfaceCard",
    kind: "surface",
    description: {
        fr: "Surface item (Card) intent-first: media/header/footer optionnels, padding adaptable, mode interactif.",
        en: "Intent-first item surface (Card): optional media/header/footer, adjustable padding, interactive mode.",
    },
    since: "0.2.7",
    docs: { route: "/playground/components/intent-surface-card" },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        content: ".intent-surface-card-content",
        media: ".intent-surface-card-media",
        header: ".intent-surface-card-header",
        body: ".intent-surface-card-body",
        footer: ".intent-surface-card-footer",
        divider: ".intent-surface-card-divider",
    },
    classHooks: [
        "intent-surface-card",
        "intent-surface-card--padded-none",
        "intent-surface-card--padded-xs",
        "intent-surface-card--padded-sm",
        "intent-surface-card--padded-md",
        "intent-surface-card--bleed",
        "intent-surface-card--interactive",
        "is-pressed",
        "intent-surface-card-content",
        "intent-surface-card-media",
        "intent-surface-card-header",
        "intent-surface-card-body",
        "intent-surface-card-footer",
        "intent-surface-card-divider",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentSurfaceCard<T extends React.ElementType = "article">(
    props: IntentSurfaceCardComponentProps<T>
) {
    const {
        as,
        className,
        children,

        fullWidth = false,
        padded = "sm",
        bleed = false,

        media,
        header,
        footer,

        eyebrow,
        title,
        emoji = "",
        subtitle,
        meta,
        actions,

        divider = true,

        interactive = false,
        pressed = false,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...restNative
    } = props as any;

    const disabled = Boolean(dsDisabled);

    const Tag = (as ?? "article") as React.ElementType;

    const intentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
        ...restNative,
    };

    const resolved = resolveIntent(intentInput);
    const surfaceProps = getIntentSurfaceProps(resolved, className);

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

    const hasAutoHeader = Boolean(eyebrow || title || subtitle || meta || actions);
    const showHeader = Boolean(header) || hasAutoHeader;
    const showFooter = Boolean(footer);
    const showMedia = Boolean(media);

    const paddedHook =
        padded === "none"
            ? "intent-surface-card--padded-none"
            : padded === "xs"
              ? "intent-surface-card--padded-xs"
              : padded === "md"
                ? "intent-surface-card--padded-md"
                : "intent-surface-card--padded-sm";

    const rootCls = cn(
        "intent-surface-card items-start!",
        paddedHook,
        bleed && "intent-surface-card--bleed",
        fullWidth && "is-fullwidth",
        interactive && "intent-surface-card--interactive",
        pressed && "is-pressed",
        disabled && "is-disabled"
    );

    const showTopDivider = divider && showHeader && showMedia;
    const showHeaderDivider = divider && showHeader;
    const showFooterDivider = divider && showFooter;

    return (
        <Tag
            {...(surfaceProps as any)}
            className={cn(surfaceProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            {...restNative}
        >
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

            <div className="intent-surface-card-content">
                {showMedia ? (
                    <>
                        <div className="intent-surface-card-media">{media}</div>
                        {showTopDivider ? <div className="intent-surface-card-divider" /> : null}
                    </>
                ) : null}

                {showHeader ? (
                    <>
                        <div className="intent-surface-card-header">
                            {header ? (
                                header
                            ) : (
                                <div className="intent-surface-card-headerInner">
                                    <div className="intent-surface-card-headerMain">
                                        {eyebrow ? (
                                            <div className="intent-surface-card-eyebrow">
                                                {eyebrow}
                                            </div>
                                        ) : null}

                                        {title ? (
                                            <div className="intent-surface-card-titleRow">
                                                <div className="intent-surface-card-title">
                                                    {emoji !== "" && (
                                                        <span className="intent-surface-card-emoji">
                                                            {emoji}
                                                        </span>
                                                    )}
                                                    {title}
                                                </div>
                                            </div>
                                        ) : null}

                                        {subtitle ? (
                                            <div className="intent-surface-card-subtitle">
                                                {subtitle}
                                            </div>
                                        ) : null}
                                    </div>

                                    {meta || actions ? (
                                        <div className="intent-surface-card-headerSide">
                                            {meta ? (
                                                <div className="intent-surface-card-meta">
                                                    {meta}
                                                </div>
                                            ) : null}
                                            {actions ? (
                                                <div className="intent-surface-card-actions">
                                                    {actions}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {showHeaderDivider ? <div className="intent-surface-card-divider" /> : null}
                    </>
                ) : null}

                <div className="intent-surface-card-body">
                    <div className="intent-surface-card-bodyInner">{children}</div>
                </div>

                {showFooter ? (
                    <>
                        {showFooterDivider ? <div className="intent-surface-card-divider" /> : null}
                        <div className="intent-surface-card-footer">
                            <div className="intent-surface-card-footerInner">{footer}</div>
                        </div>
                    </>
                ) : null}
            </div>
        </Tag>
    );
}
