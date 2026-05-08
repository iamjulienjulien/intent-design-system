"use client";

// src/components/intent/IntentSurfaceWidget.tsx
// IntentSurfaceWidget
// - Compact dashboard/widget surface
// - Lighter header than Panel / Card
// - Left: emoji + title / subtitle
// - Right: badges / meta / actions
// - Optional collapsible + dismissible behaviors
// - Controlled / uncontrolled collapse and dismiss states
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

function useControllableState<T>({
    value,
    defaultValue,
    onChange,
}: {
    value: T | undefined;
    defaultValue: T;
    onChange?: (next: T) => void;
}) {
    const [internal, setInternal] = React.useState<T>(defaultValue);

    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;

    const setValue = React.useCallback(
        (next: T) => {
            if (!isControlled) {
                setInternal(next);
            }
            onChange?.(next);
        },
        [isControlled, onChange]
    );

    return [current, setValue] as const;
}

export type IntentSurfaceWidgetPadding = "none" | "xs" | "sm" | "md";
export type IntentSurfaceWidgetRadius = "lg" | "xl" | "2xl";
export type IntentSurfaceWidgetHeaderAlign = "start" | "center";

/* ============================================================================
   TYPES
============================================================================ */

export type IntentSurfaceWidgetComponentProps<T extends React.ElementType = "section"> =
    IntentInput & {
        as?: T;
        className?: string;
        children?: React.ReactNode;

        /** Layout */
        fullWidth?: boolean; // default false
        padded?: IntentSurfaceWidgetPadding; // default "sm"
        bleed?: boolean; // default false
        radius?: IntentSurfaceWidgetRadius; // default "xl"
        minBodyHeight?: number | string;

        /** Structure */
        header?: React.ReactNode; // override auto header
        footer?: React.ReactNode;

        /** Header helpers */
        emoji?: React.ReactNode;
        icon?: React.ReactNode; // alias / richer icon slot
        title?: React.ReactNode;
        subtitle?: React.ReactNode;
        eyebrow?: React.ReactNode;

        badges?: React.ReactNode;
        meta?: React.ReactNode;
        actions?: React.ReactNode;

        /** Header behavior */
        headerAlign?: IntentSurfaceWidgetHeaderAlign; // default "center"
        headerDivider?: boolean; // default true
        footerDivider?: boolean; // default true
        bodyScrollable?: boolean; // default false

        /** Interaction */
        interactive?: boolean; // default false
        pressed?: boolean; // default false

        /** Collapse */
        collapsible?: boolean; // default false
        collapsed?: boolean;
        defaultCollapsed?: boolean; // default false
        onCollapsedChange?: (collapsed: boolean) => void;
        keepMountedWhenCollapsed?: boolean; // default true
        collapseLabel?: string; // default "Réduire"
        expandLabel?: string; // default "Déplier"

        /** Dismiss */
        dismissible?: boolean; // default false
        dismissed?: boolean;
        defaultDismissed?: boolean; // default false
        onDismiss?: () => void;
        onDismissedChange?: (dismissed: boolean) => void;
        dismissLabel?: string; // default "Masquer le widget"

        /** A11y / ids */
        bodyId?: string;
        headerId?: string;
    } & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_SURFACE_WIDGET_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: { fr: "Élément HTML rendu.", en: "Rendered HTML element." },
        type: "T extends React.ElementType",
        required: false,
        default: "section",
        fromSystem: false,
    },
    {
        name: "className",
        description: { fr: "Classes CSS additionnelles.", en: "Extra CSS classes." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "children",
        description: { fr: "Contenu principal du widget.", en: "Main widget content." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: { fr: "Étire le widget en largeur.", en: "Makes widget full width." },
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
            fr: "Retire le padding du body.",
            en: "Removes body padding.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "radius",
        description: {
            fr: "Rayon du widget.",
            en: "Widget radius.",
        },
        type: `"lg" | "xl" | "2xl"`,
        required: false,
        default: "xl",
        fromSystem: false,
    },
    {
        name: "minBodyHeight",
        description: {
            fr: "Hauteur minimale du body.",
            en: "Minimum body height.",
        },
        type: "number | string",
        required: false,
        fromSystem: false,
    },
    {
        name: "header / footer",
        description: {
            fr: "Slots custom pour header et footer.",
            en: "Custom header and footer slots.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "emoji / icon / title / subtitle / eyebrow",
        description: {
            fr: "Helpers du header auto.",
            en: "Auto header helpers.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "badges / meta / actions",
        description: {
            fr: "Zones à droite du header.",
            en: "Right-side header zones.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "headerAlign",
        description: {
            fr: "Alignement vertical du header.",
            en: "Vertical header alignment.",
        },
        type: `"start" | "center"`,
        required: false,
        default: "center",
        fromSystem: false,
    },
    {
        name: "headerDivider / footerDivider",
        description: {
            fr: "Affiche les séparateurs du header / footer.",
            en: "Displays header / footer dividers.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "bodyScrollable",
        description: {
            fr: "Active un body scrollable.",
            en: "Enables scrollable body.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "interactive",
        description: {
            fr: "Ajoute un polish hover/focus.",
            en: "Adds hover/focus polish.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "pressed",
        description: {
            fr: "État actif / sélectionné.",
            en: "Active / selected state.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "collapsible",
        description: {
            fr: "Active le repli du widget.",
            en: "Enables widget collapsing.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "collapsed / defaultCollapsed / onCollapsedChange",
        description: {
            fr: "État contrôlé / non contrôlé du collapse.",
            en: "Controlled / uncontrolled collapse state.",
        },
        type: "boolean / (collapsed: boolean) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "keepMountedWhenCollapsed",
        description: {
            fr: "Garde le body monté quand le widget est replié.",
            en: "Keeps body mounted when collapsed.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "collapseLabel / expandLabel",
        description: {
            fr: "Labels aria pour le bouton collapse.",
            en: "Aria labels for collapse button.",
        },
        type: "string",
        required: false,
        default: `"Réduire" / "Déplier"`,
        fromSystem: false,
    },
    {
        name: "dismissible",
        description: {
            fr: "Active le masquage du widget.",
            en: "Enables widget dismiss.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "dismissed / defaultDismissed / onDismissedChange / onDismiss",
        description: {
            fr: "État contrôlé / non contrôlé du dismiss.",
            en: "Controlled / uncontrolled dismiss state.",
        },
        type: "boolean / () => void / (dismissed: boolean) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "dismissLabel",
        description: {
            fr: "Label aria du bouton dismiss.",
            en: "Aria label for dismiss button.",
        },
        type: "string",
        required: false,
        default: "Masquer le widget",
        fromSystem: false,
    },
    {
        name: "bodyId / headerId",
        description: {
            fr: "IDs optionnels pour accessibilité.",
            en: "Optional ids for accessibility.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du tag rendu.",
            en: "Native props of the rendered tag.",
        },
        type: "React.ComponentPropsWithoutRef<T>",
        required: false,
        fromSystem: false,
    },
];

export const IntentSurfaceWidgetPropsTable: DocsPropRow[] = [
    ...INTENT_SURFACE_WIDGET_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentSurfaceWidgetIdentity: ComponentIdentity = {
    name: "IntentSurfaceWidget",
    kind: "surface",
    description: {
        fr: "Surface widget compacte pour dashboards: header léger, badges/actions, collapse et dismiss optionnels.",
        en: "Compact dashboard widget surface: light header, badges/actions, optional collapse and dismiss.",
    },
    since: "0.2.8",
    docs: { route: "/playground/components/intent-surface-widget" },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        content: ".intent-surface-widget-content",
        header: ".intent-surface-widget-header",
        body: ".intent-surface-widget-body",
        footer: ".intent-surface-widget-footer",
        divider: ".intent-surface-widget-divider",
        chromeButton: ".intent-surface-widget-chromeButton",
    },
    classHooks: [
        "intent-surface-widget",
        "intent-surface-widget--padded-none",
        "intent-surface-widget--padded-xs",
        "intent-surface-widget--padded-sm",
        "intent-surface-widget--padded-md",
        "intent-surface-widget--bleed",
        "intent-surface-widget--interactive",
        "intent-surface-widget--radius-lg",
        "intent-surface-widget--radius-xl",
        "intent-surface-widget--radius-2xl",
        "intent-surface-widget--header-start",
        "intent-surface-widget--header-center",
        "is-collapsed",
        "is-pressed",
        "is-dismissed",
        "is-disabled",
        "intent-surface-widget-content",
        "intent-surface-widget-header",
        "intent-surface-widget-headerInner",
        "intent-surface-widget-headerMain",
        "intent-surface-widget-leading",
        "intent-surface-widget-emoji",
        "intent-surface-widget-titleWrap",
        "intent-surface-widget-eyebrow",
        "intent-surface-widget-titleRow",
        "intent-surface-widget-title",
        "intent-surface-widget-subtitle",
        "intent-surface-widget-headerSide",
        "intent-surface-widget-badges",
        "intent-surface-widget-meta",
        "intent-surface-widget-actions",
        "intent-surface-widget-chrome",
        "intent-surface-widget-chromeButton",
        "intent-surface-widget-divider",
        "intent-surface-widget-body",
        "intent-surface-widget-bodyInner",
        "intent-surface-widget-footer",
        "intent-surface-widget-footerInner",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentSurfaceWidget<T extends React.ElementType = "section">(
    props: IntentSurfaceWidgetComponentProps<T>
) {
    const {
        as,
        className,
        children,

        fullWidth = false,
        padded = "sm",
        bleed = false,
        radius = "xl",
        minBodyHeight,

        header,
        footer,

        emoji,
        icon,
        title,
        subtitle,
        eyebrow,

        badges,
        meta,
        actions,

        headerAlign = "center",
        headerDivider = true,
        footerDivider = true,
        bodyScrollable = false,

        interactive = false,
        pressed = false,

        collapsible = false,
        collapsed: collapsedProp,
        defaultCollapsed = false,
        onCollapsedChange,
        keepMountedWhenCollapsed = true,
        collapseLabel = "Réduire",
        expandLabel = "Déplier",

        dismissible = false,
        dismissed: dismissedProp,
        defaultDismissed = false,
        onDismiss,
        onDismissedChange,
        dismissLabel = "Masquer le widget",

        bodyId,
        headerId,

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

    const [collapsed, setCollapsed] = useControllableState<boolean>({
        value: collapsedProp,
        defaultValue: defaultCollapsed,
        onChange: onCollapsedChange,
    });

    const [dismissed, setDismissed] = useControllableState<boolean>({
        value: dismissedProp,
        defaultValue: defaultDismissed,
        onChange: onDismissedChange,
    });

    const reactId = React.useId();
    const resolvedBodyId = bodyId ?? `intent-surface-widget-body-${reactId}`;
    const resolvedHeaderId = headerId ?? `intent-surface-widget-header-${reactId}`;

    const Tag = (as ?? "section") as React.ElementType;

    const intentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
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

    const hasLeading = Boolean(emoji || icon);
    const hasAutoHeader = Boolean(
        hasLeading ||
        title ||
        subtitle ||
        eyebrow ||
        badges ||
        meta ||
        actions ||
        collapsible ||
        dismissible
    );

    const showHeader = Boolean(header) || hasAutoHeader;
    const showFooter = Boolean(footer);

    const paddedHook =
        padded === "none"
            ? "intent-surface-widget--padded-none"
            : padded === "xs"
              ? "intent-surface-widget--padded-xs"
              : padded === "md"
                ? "intent-surface-widget--padded-md"
                : "intent-surface-widget--padded-sm";

    const radiusHook =
        radius === "lg"
            ? "intent-surface-widget--radius-lg"
            : radius === "2xl"
              ? "intent-surface-widget--radius-2xl"
              : "intent-surface-widget--radius-xl";

    const alignHook =
        headerAlign === "start"
            ? "intent-surface-widget--header-start"
            : "intent-surface-widget--header-center";

    const rootCls = cn(
        "intent-surface-widget",
        paddedHook,
        radiusHook,
        alignHook,
        bleed && "intent-surface-widget--bleed",
        fullWidth && "is-fullwidth",
        interactive && "intent-surface-widget--interactive",
        pressed && "is-pressed",
        collapsed && "is-collapsed",
        dismissed && "is-dismissed",
        disabled && "is-disabled"
    );

    const renderBody = !collapsed || keepMountedWhenCollapsed;

    const handleToggleCollapsed = () => {
        if (disabled || !collapsible) return;
        setCollapsed(!collapsed);
    };

    const handleDismiss = () => {
        if (disabled || !dismissible) return;
        setDismissed(true);
        onDismiss?.();
    };

    if (dismissed) {
        return null;
    }

    return (
        <Tag
            {...(surfaceProps as any)}
            {...restNative}
            className={cn(surfaceProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            aria-labelledby={showHeader && !header && title ? resolvedHeaderId : undefined}
        >
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <div
                            className="intent-glow-layer intent-glow-fill"
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <div
                            className="intent-glow-layer intent-glow-border"
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            <div className="intent-surface-widget-content">
                {showHeader ? (
                    <>
                        <div className="intent-surface-widget-header">
                            {header ? (
                                header
                            ) : (
                                <div className="intent-surface-widget-headerInner">
                                    <div className="intent-surface-widget-headerMain">
                                        {hasLeading ? (
                                            <div className="intent-surface-widget-leading">
                                                <div className="intent-surface-widget-emoji">
                                                    {icon ?? emoji}
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="intent-surface-widget-titleWrap">
                                            {eyebrow ? (
                                                <div className="intent-surface-widget-eyebrow">
                                                    {eyebrow}
                                                </div>
                                            ) : null}

                                            {title ? (
                                                <div
                                                    id={resolvedHeaderId}
                                                    className="intent-surface-widget-titleRow"
                                                >
                                                    <div className="intent-surface-widget-title">
                                                        {title}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {subtitle ? (
                                                <div className="intent-surface-widget-subtitle">
                                                    {subtitle}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {badges || meta || actions || collapsible || dismissible ? (
                                        <div className="intent-surface-widget-headerSide">
                                            {badges ? (
                                                <div className="intent-surface-widget-badges">
                                                    {badges}
                                                </div>
                                            ) : null}

                                            {meta ? (
                                                <div className="intent-surface-widget-meta">
                                                    {meta}
                                                </div>
                                            ) : null}

                                            {actions ? (
                                                <div className="intent-surface-widget-actions">
                                                    {actions}
                                                </div>
                                            ) : null}

                                            {collapsible || dismissible ? (
                                                <div className="intent-surface-widget-chrome">
                                                    {collapsible ? (
                                                        <button
                                                            type="button"
                                                            className="intent-surface-widget-chromeButton"
                                                            onClick={handleToggleCollapsed}
                                                            aria-controls={resolvedBodyId}
                                                            aria-expanded={!collapsed}
                                                            aria-label={
                                                                collapsed
                                                                    ? expandLabel
                                                                    : collapseLabel
                                                            }
                                                            title={
                                                                collapsed
                                                                    ? expandLabel
                                                                    : collapseLabel
                                                            }
                                                            disabled={disabled}
                                                        >
                                                            <span aria-hidden="true">
                                                                {collapsed ? "▸" : "▾"}
                                                            </span>
                                                        </button>
                                                    ) : null}

                                                    {dismissible ? (
                                                        <button
                                                            type="button"
                                                            className="intent-surface-widget-chromeButton"
                                                            onClick={handleDismiss}
                                                            aria-label={dismissLabel}
                                                            title={dismissLabel}
                                                            disabled={disabled}
                                                        >
                                                            <span aria-hidden="true">✕</span>
                                                        </button>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {headerDivider ? <div className="intent-surface-widget-divider" /> : null}
                    </>
                ) : null}

                {renderBody ? (
                    <div
                        id={resolvedBodyId}
                        className="intent-surface-widget-body"
                        hidden={collapsed}
                        aria-hidden={collapsed}
                    >
                        <div
                            className={cn(
                                "intent-surface-widget-bodyInner",
                                bodyScrollable && "is-scrollable"
                            )}
                            style={
                                minBodyHeight !== undefined
                                    ? { minHeight: minBodyHeight }
                                    : undefined
                            }
                        >
                            {children}
                        </div>
                    </div>
                ) : null}

                {showFooter ? (
                    <>
                        {footerDivider ? <div className="intent-surface-widget-divider" /> : null}
                        <div className="intent-surface-widget-footer">
                            <div className="intent-surface-widget-footerInner">{footer}</div>
                        </div>
                    </>
                ) : null}
            </div>
        </Tag>
    );
}
