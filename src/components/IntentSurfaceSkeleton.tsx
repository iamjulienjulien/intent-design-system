"use client";

// src/components/intent/IntentSurfaceSkeleton.tsx
// IntentSurfaceSkeleton
// - Loading placeholder for surfaces (widget / card / panel / generic)
// - Recreates common container anatomy: header / body / footer
// - Supports compact widget-like header with leading icon, title, subtitle, badges, actions
// - Supports lines, stat blocks, grid placeholders, and custom skeleton slots
// - Uses resolveIntent() + getIntentSurfaceProps() for consistent surface framing
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

function range(count: number) {
    return Array.from({ length: Math.max(0, count) }, (_, i) => i);
}

export type IntentSurfaceSkeletonPadding = "none" | "xs" | "sm" | "md";
export type IntentSurfaceSkeletonRadius = "lg" | "xl" | "2xl";
export type IntentSurfaceSkeletonHeaderAlign = "start" | "center";
export type IntentSurfaceSkeletonAnimation = "shimmer" | "pulse" | "none";
export type IntentSurfaceSkeletonPreset = "generic" | "widget" | "card" | "panel";
export type IntentSurfaceSkeletonLineWidth =
    | "full"
    | "11/12"
    | "10/12"
    | "9/12"
    | "8/12"
    | "7/12"
    | "6/12"
    | "5/12"
    | "4/12"
    | "3/12"
    | "2/12";

export type IntentSurfaceSkeletonComponentProps<T extends React.ElementType = "div"> =
    IntentInput & {
        as?: T;
        className?: string;

        /** Surface layout */
        fullWidth?: boolean; // default false
        padded?: IntentSurfaceSkeletonPadding; // default "sm"
        bleed?: boolean; // default false
        radius?: IntentSurfaceSkeletonRadius; // default "xl"
        minHeight?: number | string;

        /** Preset */
        preset?: IntentSurfaceSkeletonPreset; // default "generic"

        /** Structure */
        header?: boolean; // default true for widget/card/panel, false for generic
        footer?: boolean; // default false
        divider?: boolean; // default true
        headerAlign?: IntentSurfaceSkeletonHeaderAlign; // default "center"

        /** Header anatomy */
        leading?: boolean; // default depends on preset
        leadingShape?: "circle" | "square" | "rounded"; // default "circle"
        eyebrow?: boolean; // default false
        title?: boolean | undefined; // default true
        subtitle?: boolean; // default true
        badges?: number; // default 0
        actions?: number; // default 0
        meta?: boolean; // default false

        /** Body anatomy */
        lines?: number; // default depends on preset
        lineWidths?: IntentSurfaceSkeletonLineWidth[]; // optional per-line widths
        paragraph?: boolean; // shorthand preset-ish body mode
        stats?: number; // number of stat blocks
        statsColumns?: 1 | 2 | 3 | 4 | 5; // default 2
        cards?: number; // number of inner cards
        cardsColumns?: 1 | 2 | 3; // default 2
        chart?: boolean; // render a chart-ish block
        media?: boolean; // render media block on top of body
        mediaHeight?: number | string; // default 120
        bodyScrollable?: boolean; // default false

        /** Footer anatomy */
        footerLines?: number; // default 1
        footerActions?: number; // default 0

        /** Visual rhythm */
        compact?: boolean; // default false
        dense?: boolean; // default false

        /** Animation */
        animated?: boolean; // default true
        animation?: IntentSurfaceSkeletonAnimation; // default "shimmer"

        /** Accessibility */
        label?: string; // default "Chargement…"
        "aria-label"?: string;

        /** Custom slots */
        headerSlot?: React.ReactNode;
        bodySlot?: React.ReactNode;
        footerSlot?: React.ReactNode;
    } & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_SURFACE_SKELETON_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "as",
        description: { fr: "Élément HTML rendu.", en: "Rendered HTML element." },
        type: "T extends React.ElementType",
        required: false,
        default: "div",
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
        name: "fullWidth / padded / bleed / radius / minHeight",
        description: {
            fr: "Props de layout de la surface skeleton.",
            en: "Layout props for the skeleton surface.",
        },
        type: `boolean | "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number | string`,
        required: false,
        fromSystem: false,
    },
    {
        name: "preset",
        description: {
            fr: "Preset d’anatomie: generic, widget, card ou panel.",
            en: "Anatomy preset: generic, widget, card or panel.",
        },
        type: `"generic" | "widget" | "card" | "panel"`,
        required: false,
        default: "generic",
        fromSystem: false,
    },
    {
        name: "header / footer / divider / headerAlign",
        description: {
            fr: "Structure principale de la surface.",
            en: "Main surface structure.",
        },
        type: `boolean | "start" | "center"`,
        required: false,
        fromSystem: false,
    },
    {
        name: "leading / leadingShape / eyebrow / title / subtitle / badges / actions / meta",
        description: {
            fr: "Anatomie du header skeleton.",
            en: "Header skeleton anatomy.",
        },
        type: `boolean | number | "circle" | "square" | "rounded"`,
        required: false,
        fromSystem: false,
    },
    {
        name: "lines / lineWidths / paragraph / stats / statsColumns / cards / cardsColumns / chart / media / mediaHeight",
        description: {
            fr: "Anatomie du body skeleton.",
            en: "Body skeleton anatomy.",
        },
        type: `number | boolean | array | "1" | "2" | "3" | "4"`,
        required: false,
        fromSystem: false,
    },
    {
        name: "footerLines / footerActions",
        description: {
            fr: "Anatomie du footer skeleton.",
            en: "Footer skeleton anatomy.",
        },
        type: "number",
        required: false,
        fromSystem: false,
    },
    {
        name: "compact / dense",
        description: {
            fr: "Réduit les dimensions et espacements internes.",
            en: "Reduces internal sizes and spacing.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "animated / animation",
        description: {
            fr: "Animation du placeholder.",
            en: "Placeholder animation.",
        },
        type: `boolean | "shimmer" | "pulse" | "none"`,
        required: false,
        default: `true / "shimmer"`,
        fromSystem: false,
    },
    {
        name: "label / aria-label",
        description: {
            fr: "Label accessibilité pour le skeleton.",
            en: "Accessibility label for the skeleton.",
        },
        type: "string",
        required: false,
        default: "Chargement…",
        fromSystem: false,
    },
    {
        name: "headerSlot / bodySlot / footerSlot",
        description: {
            fr: "Slots custom pour remplacer les zones skeleton.",
            en: "Custom slots to replace skeleton zones.",
        },
        type: "React.ReactNode",
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

export const IntentSurfaceSkeletonPropsTable: DocsPropRow[] = [
    ...INTENT_SURFACE_SKELETON_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentSurfaceSkeletonIdentity: ComponentIdentity = {
    name: "IntentSurfaceSkeleton",
    kind: "surface",
    description: {
        fr: "Placeholder intent-first pour surfaces en chargement: widget, card, panel ou squelette libre.",
        en: "Intent-first loading placeholder for surfaces: widget, card, panel or free-form skeleton.",
    },
    since: "0.2.8",
    docs: { route: "/playground/components/intent-surface-skeleton" },
    anatomy: {
        root: "Tag (as)",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        content: ".intent-surface-skeleton-content",
        header: ".intent-surface-skeleton-header",
        body: ".intent-surface-skeleton-body",
        footer: ".intent-surface-skeleton-footer",
        divider: ".intent-surface-skeleton-divider",
        block: ".intent-surface-skeleton-block",
        line: ".intent-surface-skeleton-line",
    },
    classHooks: [
        "intent-surface-skeleton",
        "intent-surface-skeleton--padded-none",
        "intent-surface-skeleton--padded-xs",
        "intent-surface-skeleton--padded-sm",
        "intent-surface-skeleton--padded-md",
        "intent-surface-skeleton--bleed",
        "intent-surface-skeleton--radius-lg",
        "intent-surface-skeleton--radius-xl",
        "intent-surface-skeleton--radius-2xl",
        "intent-surface-skeleton--header-start",
        "intent-surface-skeleton--header-center",
        "intent-surface-skeleton--compact",
        "intent-surface-skeleton--dense",
        "intent-surface-skeleton--animated",
        "intent-surface-skeleton--animation-shimmer",
        "intent-surface-skeleton--animation-pulse",
        "intent-surface-skeleton-content",
        "intent-surface-skeleton-header",
        "intent-surface-skeleton-headerInner",
        "intent-surface-skeleton-headerMain",
        "intent-surface-skeleton-leading",
        "intent-surface-skeleton-titleWrap",
        "intent-surface-skeleton-headerSide",
        "intent-surface-skeleton-body",
        "intent-surface-skeleton-bodyInner",
        "intent-surface-skeleton-footer",
        "intent-surface-skeleton-footerInner",
        "intent-surface-skeleton-divider",
        "intent-surface-skeleton-block",
        "intent-surface-skeleton-line",
        "intent-surface-skeleton-statGrid",
        "intent-surface-skeleton-cardGrid",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
    ],
};

/* ============================================================================
   🧱 INTERNAL PRIMITIVES
============================================================================ */

function widthClass(width: IntentSurfaceSkeletonLineWidth | undefined) {
    if (!width || width === "full") return "is-w-full";
    if (width === "11/12") return "is-w-11-12";
    if (width === "10/12") return "is-w-10-12";
    if (width === "9/12") return "is-w-9-12";
    if (width === "8/12") return "is-w-8-12";
    if (width === "7/12") return "is-w-7-12";
    if (width === "6/12") return "is-w-6-12";
    if (width === "5/12") return "is-w-5-12";
    if (width === "4/12") return "is-w-4-12";
    if (width === "3/12") return "is-w-3-12";
    if (width === "2/12") return "is-w-2-12";
    return "is-w-full";
}

function SkeletonBlock({
    className,
    width,
    height,
    rounded = "md",
}: {
    className?: string;
    width?: string | number;
    height?: string | number;
    rounded?: "sm" | "md" | "lg" | "full";
}) {
    return (
        <div
            className={cn(
                "intent-surface-skeleton-block",
                rounded === "sm" && "is-rounded-sm",
                rounded === "lg" && "is-rounded-lg",
                rounded === "full" && "is-rounded-full",
                className
            )}
            style={{
                ...(width !== undefined ? { width } : {}),
                ...(height !== undefined ? { height } : {}),
            }}
        />
    );
}

function SkeletonLine({
    width,
    className,
}: {
    width?: IntentSurfaceSkeletonLineWidth;
    className?: string;
}) {
    return <div className={cn("intent-surface-skeleton-line", widthClass(width), className)} />;
}

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentSurfaceSkeleton<T extends React.ElementType = "div">(
    props: IntentSurfaceSkeletonComponentProps<T>
) {
    const {
        as,
        className,

        fullWidth = false,
        padded = "sm",
        bleed = false,
        radius = "xl",
        minHeight,

        preset = "generic",

        header: headerProp,
        footer: footerProp,
        divider = true,
        headerAlign = "center",

        leading: leadingProp,
        leadingShape = "circle",
        eyebrow: eyebrowProp,
        title: titleProp,
        subtitle: subtitleProp,
        badges: badgesProp,
        actions: actionsProp,
        meta: metaProp,

        lines: linesProp,
        lineWidths,
        paragraph = false,
        stats = 0,
        statsColumns = 2,
        cards = 0,
        cardsColumns = 2,
        chart = false,
        media = false,
        mediaHeight = 120,
        bodyScrollable = false,

        footerLines = 1,
        footerActions = 0,

        compact = false,
        dense = false,

        animated = true,
        animation = "shimmer",

        label = "Chargement…",
        "aria-label": ariaLabel,

        headerSlot,
        bodySlot,
        footerSlot,

        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...restNative
    } = props as any;

    const Tag = (as ?? "div") as React.ElementType;
    const disabled = Boolean(dsDisabled);

    const presetHeader =
        headerProp !== undefined
            ? headerProp
            : preset === "widget" || preset === "card" || preset === "panel";

    const presetFooter = footerProp !== undefined ? footerProp : false;

    const leading = leadingProp !== undefined ? leadingProp : preset === "widget";

    const eyebrow = eyebrowProp !== undefined ? eyebrowProp : false;
    const title = titleProp !== undefined ? titleProp : true;
    const subtitle =
        subtitleProp !== undefined
            ? subtitleProp
            : preset === "widget" || preset === "card" || preset === "panel";

    const meta = metaProp !== undefined ? metaProp : false;
    const badges = badgesProp ?? (preset === "widget" ? 1 : 0);
    const actions = actionsProp ?? (preset === "widget" ? 1 : 0);

    const lines =
        linesProp ??
        (paragraph
            ? 4
            : preset === "widget"
              ? 3
              : preset === "card"
                ? 4
                : preset === "panel"
                  ? 5
                  : 3);

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

    const paddedHook =
        padded === "none"
            ? "intent-surface-skeleton--padded-none"
            : padded === "xs"
              ? "intent-surface-skeleton--padded-xs"
              : padded === "md"
                ? "intent-surface-skeleton--padded-md"
                : "intent-surface-skeleton--padded-sm";

    const radiusHook =
        radius === "lg"
            ? "intent-surface-skeleton--radius-lg"
            : radius === "2xl"
              ? "intent-surface-skeleton--radius-2xl"
              : "intent-surface-skeleton--radius-xl";

    const alignHook =
        headerAlign === "start"
            ? "intent-surface-skeleton--header-start"
            : "intent-surface-skeleton--header-center";

    const animationHook =
        animated && animation === "pulse"
            ? "intent-surface-skeleton--animation-pulse"
            : animated && animation === "shimmer"
              ? "intent-surface-skeleton--animation-shimmer"
              : "";

    const rootCls = cn(
        "intent-surface-skeleton",
        paddedHook,
        radiusHook,
        alignHook,
        bleed && "intent-surface-skeleton--bleed",
        fullWidth && "is-fullwidth",
        compact && "intent-surface-skeleton--compact",
        dense && "intent-surface-skeleton--dense",
        animated && animation !== "none" && "intent-surface-skeleton--animated",
        animationHook,
        disabled && "is-disabled"
    );

    const showHeader = Boolean(presetHeader || headerSlot);
    const showFooter = Boolean(presetFooter || footerSlot);
    const showHeaderDivider = divider && showHeader;
    const showFooterDivider = divider && showFooter;

    const statsGridClass =
        statsColumns === 1
            ? "intent-surface-skeleton-statGrid--1"
            : statsColumns === 3
              ? "intent-surface-skeleton-statGrid--3"
              : statsColumns === 4
                ? "intent-surface-skeleton-statGrid--4"
                : statsColumns === 5
                  ? "intent-surface-skeleton-statGrid--5"
                  : "intent-surface-skeleton-statGrid--2";

    const cardsGridClass =
        cardsColumns === 1
            ? "intent-surface-skeleton-cardGrid--1"
            : cardsColumns === 3
              ? "intent-surface-skeleton-cardGrid--3"
              : "intent-surface-skeleton-cardGrid--2";

    return (
        <Tag
            {...(surfaceProps as any)}
            {...restNative}
            className={cn(surfaceProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            aria-busy="true"
            aria-live="polite"
            aria-label={ariaLabel ?? label}
            role="status"
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

            <div className="intent-surface-skeleton-content">
                {showHeader ? (
                    <>
                        <div className="intent-surface-skeleton-header">
                            {headerSlot ? (
                                headerSlot
                            ) : (
                                <div className="intent-surface-skeleton-headerInner">
                                    <div className="intent-surface-skeleton-headerMain">
                                        {leading ? (
                                            <div className="intent-surface-skeleton-leading">
                                                <SkeletonBlock
                                                    width={compact ? "1.7rem" : "1.95rem"}
                                                    height={compact ? "1.7rem" : "1.95rem"}
                                                    rounded={
                                                        leadingShape === "square"
                                                            ? "md"
                                                            : leadingShape === "rounded"
                                                              ? "lg"
                                                              : "full"
                                                    }
                                                />
                                            </div>
                                        ) : null}

                                        <div className="intent-surface-skeleton-titleWrap">
                                            {eyebrow ? (
                                                <SkeletonLine
                                                    width="3/12"
                                                    className="intent-surface-skeleton-eyebrowLine"
                                                />
                                            ) : null}

                                            {title ? (
                                                <SkeletonLine
                                                    width={subtitle ? "6/12" : "4/12"}
                                                    className="intent-surface-skeleton-titleLine"
                                                />
                                            ) : null}

                                            {subtitle ? (
                                                <SkeletonLine
                                                    width="8/12"
                                                    className="intent-surface-skeleton-subtitleLine"
                                                />
                                            ) : null}
                                        </div>
                                    </div>

                                    {badges || meta || actions ? (
                                        <div className="intent-surface-skeleton-headerSide">
                                            {range(badges).map((i) => (
                                                <SkeletonBlock
                                                    key={`badge-${i}`}
                                                    width={compact ? "3rem" : "3.4rem"}
                                                    height={compact ? "1.25rem" : "1.35rem"}
                                                    rounded="full"
                                                />
                                            ))}

                                            {meta ? (
                                                <SkeletonBlock
                                                    width={compact ? "2.4rem" : "3rem"}
                                                    height="0.8rem"
                                                    rounded="sm"
                                                />
                                            ) : null}

                                            {range(actions).map((i) => (
                                                <SkeletonBlock
                                                    key={`action-${i}`}
                                                    width={compact ? "1.7rem" : "1.9rem"}
                                                    height={compact ? "1.7rem" : "1.9rem"}
                                                    rounded="full"
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {showHeaderDivider ? (
                            <div className="intent-surface-skeleton-divider" />
                        ) : null}
                    </>
                ) : null}

                <div className="intent-surface-skeleton-body">
                    <div
                        className={cn(
                            "intent-surface-skeleton-bodyInner",
                            bodyScrollable && "is-scrollable"
                        )}
                        style={minHeight !== undefined ? { minHeight } : undefined}
                    >
                        {bodySlot ? (
                            bodySlot
                        ) : (
                            <div className="intent-surface-skeleton-stack">
                                {media ? (
                                    <SkeletonBlock
                                        className="intent-surface-skeleton-media"
                                        height={mediaHeight}
                                        rounded="lg"
                                    />
                                ) : null}

                                {chart ? (
                                    <div className="intent-surface-skeleton-chart">
                                        <div className="intent-surface-skeleton-chartBars">
                                            {range(7).map((i) => (
                                                <SkeletonBlock
                                                    key={`chart-${i}`}
                                                    className={cn(
                                                        "intent-surface-skeleton-chartBar",
                                                        i === 0 && "is-h-28",
                                                        i === 1 && "is-h-40",
                                                        i === 2 && "is-h-24",
                                                        i === 3 && "is-h-52",
                                                        i === 4 && "is-h-36",
                                                        i === 5 && "is-h-44",
                                                        i === 6 && "is-h-20"
                                                    )}
                                                    rounded="md"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {stats > 0 ? (
                                    <div
                                        className={cn(
                                            "intent-surface-skeleton-statGrid",
                                            statsGridClass
                                        )}
                                    >
                                        {range(stats).map((i) => (
                                            <div
                                                key={`stat-${i}`}
                                                className="intent-surface-skeleton-statCard"
                                            >
                                                <SkeletonLine width="4/12" />
                                                <SkeletonBlock
                                                    height={compact ? "1rem" : "1.25rem"}
                                                    width={compact ? "40%" : "48%"}
                                                    rounded="sm"
                                                />
                                                <SkeletonLine width="6/12" />
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                {cards > 0 ? (
                                    <div
                                        className={cn(
                                            "intent-surface-skeleton-cardGrid",
                                            cardsGridClass
                                        )}
                                    >
                                        {range(cards).map((i) => (
                                            <div
                                                key={`card-${i}`}
                                                className="intent-surface-skeleton-innerCard"
                                            >
                                                <SkeletonBlock
                                                    className="intent-surface-skeleton-innerMedia"
                                                    height={72}
                                                    rounded="lg"
                                                />
                                                <SkeletonLine width="6/12" />
                                                <SkeletonLine width="9/12" />
                                            </div>
                                        ))}
                                    </div>
                                ) : null}

                                {range(lines).map((i) => (
                                    <SkeletonLine
                                        key={`line-${i}`}
                                        width={
                                            lineWidths?.[i] ?? (i === lines - 1 ? "7/12" : "full")
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {showFooter ? (
                    <>
                        {showFooterDivider ? (
                            <div className="intent-surface-skeleton-divider" />
                        ) : null}
                        <div className="intent-surface-skeleton-footer">
                            <div className="intent-surface-skeleton-footerInner">
                                {footerSlot ? (
                                    footerSlot
                                ) : (
                                    <div className="intent-surface-skeleton-footerRow">
                                        <div className="intent-surface-skeleton-footerLines">
                                            {range(footerLines).map((i) => (
                                                <SkeletonLine
                                                    key={`footer-line-${i}`}
                                                    width={i === footerLines - 1 ? "5/12" : "7/12"}
                                                />
                                            ))}
                                        </div>

                                        {footerActions > 0 ? (
                                            <div className="intent-surface-skeleton-footerActions">
                                                {range(footerActions).map((i) => (
                                                    <SkeletonBlock
                                                        key={`footer-action-${i}`}
                                                        width="4.5rem"
                                                        height="1.8rem"
                                                        rounded="full"
                                                    />
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </Tag>
    );
}
