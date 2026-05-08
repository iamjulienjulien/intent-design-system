// src/components/intent/IntentSurfacePanel.tsx
// IntentSurfacePanel
// - Section container surface (bigger rhythm than Card)
// - Intent-first: resolveIntent() + getIntentSurfaceProps()
// - Supports header/footer slots, badges, actions
// - Optional "bleed" mode (content can reach edges) + padding scale
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

export type IntentSurfacePanelPadding = "none" | "xs" | "sm" | "md" | "lg";

export type IntentSurfacePanelComponentProps<T extends React.ElementType = "section"> =
    IntentInput & {
        as?: T;
        className?: string;
        children?: React.ReactNode;

        /** Layout */
        fullWidth?: boolean; // default false
        padded?: IntentSurfacePanelPadding; // default "md"
        bleed?: boolean; // default false (if true, content wrapper has no padding even if padded != none)

        /** Structure */
        header?: React.ReactNode;
        footer?: React.ReactNode;

        /** Header helpers */
        eyebrow?: React.ReactNode;
        title?: React.ReactNode;
        emoji?: React.ReactNode;
        subtitle?: React.ReactNode;
        badges?: React.ReactNode;
        actions?: React.ReactNode;

        /** Dividers between zones */
        divider?: boolean; // default true when header/footer exists
    } & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_SURFACE_PANEL_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: {
            fr: "Élément HTML rendu (polymorphique).",
            en: "Rendered HTML element (polymorphic).",
        },
        type: "T extends React.ElementType",
        required: false,
        default: "section",
        fromSystem: false,
    },
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles sur le root.",
            en: "Extra CSS classes on root.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "children",
        description: { fr: "Contenu principal du panel.", en: "Main panel content." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: { fr: "Étire le panel en largeur.", en: "Makes the panel full width." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "padded",
        description: { fr: "Padding interne du contenu.", en: "Inner content padding." },
        type: `"none" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "bleed",
        description: {
            fr: "Désactive le padding du wrapper contenu (utile si le contenu gère déjà ses espacements).",
            en: "Disables content wrapper padding (useful when content manages its own spacing).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "header",
        description: {
            fr: "Header custom (override du header auto).",
            en: "Custom header (overrides auto header).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "footer",
        description: { fr: "Footer du panel.", en: "Panel footer." },
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
        name: "badges",
        description: { fr: "Zone badges (header).", en: "Badges area (header)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "actions",
        description: { fr: "Zone actions (header).", en: "Actions area (header)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "divider",
        description: {
            fr: "Affiche des séparateurs entre header/content/footer.",
            en: "Shows dividers between zones.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du tag (id, style, onClick, aria-*, data-*…).",
            en: "Native props of the rendered tag (id, style, onClick, aria-*, data-*…).",
        },
        type: "React.ComponentPropsWithoutRef<T>",
        required: false,
        fromSystem: false,
    },
];

export const IntentSurfacePanelPropsTable: DocsPropRow[] = [
    ...INTENT_SURFACE_PANEL_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentSurfacePanelIdentity: ComponentIdentity = {
    name: "IntentSurfacePanel",
    kind: "surface",
    description: {
        fr: "Surface de section (Panel) intent-first: header/footer optionnels, padding adaptable, hooks stables.",
        en: "Intent-first section surface (Panel): optional header/footer, adjustable padding, stable hooks.",
    },
    since: "0.2.6",
    docs: { route: "/playground/components/intent-surface-panel" },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        header: ".intent-surface-panel-header",
        body: ".intent-surface-panel-body",
        footer: ".intent-surface-panel-footer",
        content: ".intent-surface-panel-content",
    },
    classHooks: [
        "intent-surface-panel",
        "intent-surface-panel--padded-none",
        "intent-surface-panel--padded-sm",
        "intent-surface-panel--padded-md",
        "intent-surface-panel--padded-lg",
        "intent-surface-panel--bleed",
        "intent-surface-panel-header",
        "intent-surface-panel-body",
        "intent-surface-panel-footer",
        "intent-surface-panel-divider",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentSurfacePanel<T extends React.ElementType = "section">(
    props: IntentSurfacePanelComponentProps<T>
) {
    const {
        as,
        className,
        children,

        fullWidth = false,
        padded = "md",
        bleed = false,

        header,
        footer,

        eyebrow,
        title,
        emoji,
        subtitle,
        badges,
        actions,

        divider = true,

        ...intentInput
    } = props;

    const Tag = (as ?? "section") as React.ElementType;

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

    const hasAutoHeader = Boolean(eyebrow || title || subtitle || badges || actions);
    const showHeader = Boolean(header) || hasAutoHeader;
    const showFooter = Boolean(footer);

    const paddedHook =
        padded === "none"
            ? "intent-surface-panel--padded-none"
            : padded === "sm"
              ? "intent-surface-panel--padded-sm"
              : padded === "lg"
                ? "intent-surface-panel--padded-lg"
                : "intent-surface-panel--padded-md";

    const rootCls = cn(
        "intent-surface-panel",
        paddedHook,
        bleed && "intent-surface-panel--bleed",
        fullWidth && "is-fullwidth"
    );

    return (
        <Tag
            {...(surfaceProps as any)}
            className={cn(surfaceProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
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

            <div className="intent-surface-panel-content">
                {showHeader ? (
                    <>
                        <div className="intent-surface-panel-header">
                            {header ? (
                                header
                            ) : (
                                <div className="intent-surface-panel-headerInner">
                                    <div className="intent-surface-panel-headerMain">
                                        {eyebrow ? (
                                            <div className="intent-surface-panel-eyebrow">
                                                {eyebrow}
                                            </div>
                                        ) : null}

                                        {title ? (
                                            <div className="intent-surface-panel-titleRow">
                                                <div className="intent-surface-panel-title">
                                                    {emoji !== "" && (
                                                        <span className="mr-2">{emoji}</span>
                                                    )}
                                                    {title}
                                                </div>
                                                {badges ? (
                                                    <div className="intent-surface-panel-badges">
                                                        {badges}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        {subtitle ? (
                                            <div className="intent-surface-panel-subtitle">
                                                {subtitle}
                                            </div>
                                        ) : null}
                                    </div>

                                    {actions ? (
                                        <div className="intent-surface-panel-actions">
                                            {actions}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {divider ? <div className="intent-surface-panel-divider" /> : null}
                    </>
                ) : null}

                <div className="intent-surface-panel-body">
                    <div className="intent-surface-panel-bodyInner">{children}</div>
                </div>

                {showFooter ? (
                    <>
                        {divider ? <div className="intent-surface-panel-divider" /> : null}
                        <div className="intent-surface-panel-footer">
                            <div className="intent-surface-panel-footerInner">{footer}</div>
                        </div>
                    </>
                ) : null}
            </div>
        </Tag>
    );
}
