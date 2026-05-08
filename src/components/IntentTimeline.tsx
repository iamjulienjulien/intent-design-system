"use client";

// src/components/intent/IntentTimeline.tsx
// IntentTimeline
// - Intent-first linear timeline for events (Space Memoria friendly)
// - Vertical / horizontal, rail + markers + “event cards”
// - Optional grouping headers, expand/collapse bodies, selection, keyboard nav
// - Stable hooks + resolver vars only (no dynamic Tailwind classes)

import * as React from "react";
import { resolveIntent, getIntentLayoutProps, composeIntentControlClassName } from "CORE";
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

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function toDate(value?: string | number | Date | null) {
    if (value == null) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function isItemInteractive(status: IntentTimelineItemStatus) {
    return status !== "disabled";
}

function defaultFormatTime(d: Date, locale: string) {
    // Compact but human
    return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(d);
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentTimelineOrientation = "vertical" | "horizontal";
export type IntentTimelineSize = "xs" | "sm" | "md" | "lg";
export type IntentTimelineDensity = "tight" | "normal" | "airy";
export type IntentTimelineLayout = "stacked" | "split" | "alternate";

export type IntentTimelineMarkerVariant = "dot" | "icon" | "index" | "pill" | "avatar";
export type IntentTimelineConnectorStyle = "solid" | "dashed";

export type IntentTimelineItemStatus =
    | "past"
    | "current"
    | "future"
    | "draft"
    | "cancelled"
    | "disabled";

export type IntentTimelineItem = {
    id: string;

    /** Main content */
    title: string;
    subtitle?: string;
    description?: string;

    /** Optional “expanded body” (rich content) */
    body?: React.ReactNode;

    /** Date/time displayed on the gutter */
    at?: string | number | Date | null;

    /** Marker content */
    markerIcon?: React.ReactNode;
    markerText?: string; // e.g. "Naissance"
    avatarSrc?: string; // used with markerVariant="avatar"
    avatarAlt?: string;

    /** Right side goodies */
    meta?: React.ReactNode; // chips, badges, counters...
    trailing?: React.ReactNode; // e.g. actions
    media?: React.ReactNode; // e.g. thumbnail

    /** Status */
    status?: IntentTimelineItemStatus; // default "past"

    /** Optional grouping key (e.g. day/year). If set, timeline can render headers. */
    groupId?: string;

    /** Optional per-item overrides */
    disabled?: boolean;

    /** If provided, item becomes a link */
    href?: string;
    target?: React.HTMLAttributeAnchorTarget;
    rel?: string;

    /** Selection hook */
    onSelect?: (item: IntentTimelineItem) => void;

    /** Expand/collapse hook */
    onToggleExpand?: (item: IntentTimelineItem, nextExpanded: boolean) => void;

    /** Optional per-item intent overrides (rare, but powerful for “warnings”, “threatened”, etc.) */
    intent?: IntentInput["intent"];
    variant?: IntentInput["variant"];
    tone?: IntentInput["tone"];
    glow?: IntentInput["glow"];
    intensity?: IntentInput["intensity"];
    mode?: IntentInput["mode"];
};

export type IntentTimelineGroup = {
    id: string;
    label: string;
    hint?: string;
    left?: React.ReactNode;
    right?: React.ReactNode;
};

export type IntentTimelineProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLElement>, "className" | "children"> & {
        className?: string;

        /** Data */
        items: IntentTimelineItem[];

        /** Optional groups (used when items have groupId) */
        groups?: IntentTimelineGroup[];
        showGroupHeaders?: boolean; // default true

        /** Layout */
        orientation?: IntentTimelineOrientation; // default "vertical"
        layout?: IntentTimelineLayout; // default "stacked" (vertical only; horizontal treats as stacked)
        size?: IntentTimelineSize; // default "md"
        density?: IntentTimelineDensity; // default "normal"
        compact?: boolean; // default false
        reverse?: boolean; // default false (render items bottom-up or right-to-left)

        /** Marker + connector */
        markerVariant?: IntentTimelineMarkerVariant; // default "dot"
        showIndex?: boolean; // default true (for markerVariant="index")
        showConnector?: boolean; // default true
        connectorStyle?: IntentTimelineConnectorStyle; // default "solid"
        connectorStartCap?: boolean; // default true
        connectorEndCap?: boolean; // default true

        /** Time */
        showTime?: boolean; // default true
        timeLocale?: string; // default "fr-FR"
        formatTime?: (d: Date, item: IntentTimelineItem) => string;

        /** Selection (active item) */
        activeId?: string;
        defaultActiveId?: string;
        onActiveChange?: (id: string) => void;

        /** Interactions */
        clickable?: boolean; // default true
        allowLinkNavigation?: boolean; // default true (href uses <a>, otherwise behaves like select)
        ariaLabel?: string; // default "Timeline"

        /** Expand/collapse */
        collapsible?: boolean; // default false (if true, items with body can expand)
        expandedIds?: string[];
        defaultExpandedIds?: string[];
        allowMultiExpand?: boolean; // default true
        onExpandedChange?: (ids: string[]) => void;

        /** Rendering hooks */
        renderHeader?: (group: IntentTimelineGroup) => React.ReactNode;
        renderTitle?: (item: IntentTimelineItem) => React.ReactNode;
        renderSubtitle?: (item: IntentTimelineItem) => React.ReactNode;
        renderDescription?: (item: IntentTimelineItem) => React.ReactNode;
        renderMeta?: (item: IntentTimelineItem) => React.ReactNode;
        renderMarker?: (item: IntentTimelineItem, index: number) => React.ReactNode;
        renderBody?: (item: IntentTimelineItem, expanded: boolean) => React.ReactNode;

        /** Empty */
        empty?: React.ReactNode;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_TIMELINE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "items",
        description: { fr: "Événements affichés dans la timeline.", en: "Timeline events." },
        type: "IntentTimelineItem[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "groups",
        description: {
            fr: "Groupes optionnels (utilisés si groupId est renseigné sur les items).",
            en: "Optional groups (used when items have groupId).",
        },
        type: "IntentTimelineGroup[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "showGroupHeaders",
        description: { fr: "Affiche les en-têtes de groupe.", en: "Shows group headers." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },

    {
        name: "orientation",
        description: { fr: "Orientation de la timeline.", en: "Timeline orientation." },
        type: `"vertical" | "horizontal"`,
        required: false,
        default: "vertical",
        fromSystem: false,
    },
    {
        name: "layout",
        description: {
            fr: "Mise en page (vertical): stacked/split/alternate.",
            en: "Layout (vertical): stacked/split/alternate.",
        },
        type: `"stacked" | "split" | "alternate"`,
        required: false,
        default: "stacked",
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille globale.", en: "Global size." },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "density",
        description: { fr: "Densité des espacements.", en: "Spacing density." },
        type: `"tight" | "normal" | "airy"`,
        required: false,
        default: "normal",
        fromSystem: false,
    },
    {
        name: "compact",
        description: {
            fr: "Réduit la description et les paddings.",
            en: "Reduces description and paddings.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "reverse",
        description: { fr: "Inverse l’ordre de rendu.", en: "Reverses rendering order." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },

    {
        name: "markerVariant",
        description: { fr: "Style du marqueur.", en: "Marker style." },
        type: `"dot" | "icon" | "index" | "pill" | "avatar"`,
        required: false,
        default: "dot",
        fromSystem: false,
    },
    {
        name: "showIndex",
        description: {
            fr: "Affiche l’index (markerVariant=index).",
            en: "Shows index (markerVariant=index).",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "showConnector",
        description: { fr: "Affiche la ligne de connexion.", en: "Shows connector line." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "connectorStyle",
        description: { fr: "Style de ligne.", en: "Connector style." },
        type: `"solid" | "dashed"`,
        required: false,
        default: "solid",
        fromSystem: false,
    },
    {
        name: "connectorStartCap",
        description: { fr: "Cap au début de la ligne.", en: "Start cap on connector." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "connectorEndCap",
        description: { fr: "Cap à la fin de la ligne.", en: "End cap on connector." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },

    {
        name: "showTime",
        description: { fr: "Affiche la date/heure.", en: "Shows date/time." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "timeLocale",
        description: { fr: "Locale du format de date.", en: "Locale for date formatting." },
        type: "string",
        required: false,
        default: "fr-FR",
        fromSystem: false,
    },
    {
        name: "formatTime",
        description: { fr: "Formatter de date custom.", en: "Custom date formatter." },
        type: "(d: Date, item: IntentTimelineItem) => string",
        required: false,
        fromSystem: false,
    },

    {
        name: "activeId",
        description: { fr: "Item actif (contrôlé).", en: "Active item (controlled)." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultActiveId",
        description: { fr: "Item actif par défaut.", en: "Default active item." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "onActiveChange",
        description: { fr: "Callback quand l’actif change.", en: "Callback when active changes." },
        type: "(id: string) => void",
        required: false,
        fromSystem: false,
    },

    {
        name: "clickable",
        description: { fr: "Rend les items interactifs.", en: "Makes items interactive." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "allowLinkNavigation",
        description: {
            fr: "Autorise la navigation via href.",
            en: "Allows navigation when href is provided.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "ariaLabel",
        description: { fr: "Label ARIA du composant.", en: "ARIA label for the component." },
        type: "string",
        required: false,
        default: "Timeline",
        fromSystem: false,
    },

    {
        name: "collapsible",
        description: {
            fr: "Active l’extension des items (body).",
            en: "Enables expand/collapse (body).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "expandedIds",
        description: { fr: "Items étendus (contrôlé).", en: "Expanded items (controlled)." },
        type: "string[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultExpandedIds",
        description: { fr: "Items étendus par défaut.", en: "Default expanded items." },
        type: "string[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "allowMultiExpand",
        description: {
            fr: "Autorise plusieurs items ouverts.",
            en: "Allows multiple expanded items.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "onExpandedChange",
        description: {
            fr: "Callback quand l’extension change.",
            en: "Callback when expanded ids change.",
        },
        type: "(ids: string[]) => void",
        required: false,
        fromSystem: false,
    },

    {
        name: "render*",
        description: { fr: "Hooks de rendu optionnels.", en: "Optional render hooks." },
        type: "renderHeader/renderTitle/renderSubtitle/renderDescription/renderMeta/renderMarker/renderBody",
        required: false,
        fromSystem: false,
    },
    {
        name: "empty",
        description: { fr: "Rendu quand items est vide.", en: "Render when items is empty." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },

    {
        name: "(native props)",
        description: { fr: "Props natives sur le root.", en: "Native props on root." },
        type: "Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentTimelinePropsTable: DocsPropRow[] = [
    ...INTENT_TIMELINE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentTimelineIdentity: ComponentIdentity = {
    name: "IntentTimeline",
    kind: "layout",
    description: {
        fr: "Timeline intent-first pour afficher une suite d’événements (dates, marqueurs, cartes, groupes, expansion, navigation clavier).",
        en: "Intent-first timeline to display a sequence of events (time gutter, markers, cards, groups, expansion, keyboard nav).",
    },
    since: "0.2.6",
    docs: { route: "/playground/components/intent-timeline" },
    anatomy: {
        root: "<section>",
        list: ".intent-timeline-list",
        groupHeader: ".intent-timeline-groupHeader",
        itemRow: ".intent-timeline-itemRow",
        gutter: ".intent-timeline-gutter",
        time: ".intent-timeline-time",
        rail: ".intent-timeline-rail",
        marker: ".intent-timeline-marker",
        card: ".intent-timeline-card",
        title: ".intent-timeline-title",
        subtitle: ".intent-timeline-subtitle",
        description: ".intent-timeline-description",
        body: ".intent-timeline-body",
        meta: ".intent-timeline-meta",
        trailing: ".intent-timeline-trailing",
    },
    classHooks: [
        "intent-timeline",
        "intent-timeline-list",
        "intent-timeline-groupHeader",
        "intent-timeline-itemRow",
        "intent-timeline-gutter",
        "intent-timeline-rail",
        "intent-timeline-marker",
        "intent-timeline-card",
        "is-vertical",
        "is-horizontal",
        "is-compact",
        "is-clickable",
        "is-disabled",
        "is-active",
        "is-expanded",
        "is-alternate-left",
        "is-alternate-right",
        "ids-timeline-xs",
        "ids-timeline-sm",
        "ids-timeline-md",
        "ids-timeline-lg",
        "ids-density-tight",
        "ids-density-normal",
        "ids-density-airy",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentTimeline(props: IntentTimelineProps) {
    const {
        className,

        items: itemsProp,
        groups,
        showGroupHeaders = true,

        orientation = "vertical",
        layout = "stacked",
        size = "md",
        density = "normal",
        compact = false,
        reverse = false,

        markerVariant = "dot",
        showIndex = true,
        showConnector = true,
        connectorStyle = "solid",
        connectorStartCap = true,
        connectorEndCap = true,

        showTime = true,
        timeLocale = "fr-FR",
        formatTime,

        activeId: activeIdProp,
        defaultActiveId,
        onActiveChange,

        clickable = true,
        allowLinkNavigation = true,
        ariaLabel = "Timeline",

        collapsible = false,
        expandedIds: expandedIdsProp,
        defaultExpandedIds,
        allowMultiExpand = true,
        onExpandedChange,

        renderHeader,
        renderTitle,
        renderSubtitle,
        renderDescription,
        renderMeta,
        renderMarker,
        renderBody,

        empty,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...rootProps
    } = props;

    const disabled = Boolean(dsDisabled);

    const items = React.useMemo(() => {
        const list = [...itemsProp];
        return reverse ? list.reverse() : list;
    }, [itemsProp, reverse]);

    const [activeUncontrolled, setActiveUncontrolled] = React.useState<string | undefined>(
        defaultActiveId ?? items[0]?.id
    );
    const isControlled = activeIdProp !== undefined;
    const activeId = isControlled ? activeIdProp : activeUncontrolled;

    const setActive = React.useCallback(
        (id: string) => {
            if (!isControlled) setActiveUncontrolled(id);
            onActiveChange?.(id);
        },
        [isControlled, onActiveChange]
    );

    const [expandedUncontrolled, setExpandedUncontrolled] = React.useState<string[]>(
        defaultExpandedIds ?? []
    );
    const expandedIds = expandedIdsProp ?? expandedUncontrolled;
    const isExpandedControlled = expandedIdsProp !== undefined;

    const setExpandedIds = React.useCallback(
        (next: string[]) => {
            if (!isExpandedControlled) setExpandedUncontrolled(next);
            onExpandedChange?.(next);
        },
        [isExpandedControlled, onExpandedChange]
    );

    const toggleExpanded = React.useCallback(
        (id: string) => {
            const has = expandedIds.includes(id);
            let next = expandedIds;

            if (has) {
                next = expandedIds.filter((x) => x !== id);
            } else {
                next = allowMultiExpand ? [...expandedIds, id] : [id];
            }

            setExpandedIds(next);
            return !has;
        },
        [allowMultiExpand, expandedIds, setExpandedIds]
    );

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

    // Root: vars only
    const layoutProps = getIntentLayoutProps(resolved, className);

    // Card: control recipe (bg/ring/shadow) using vars
    const cardControlClassName = composeIntentControlClassName(resolved);

    const listRef = React.useRef<HTMLOListElement | null>(null);

    const interactive = clickable && !disabled;

    const rootCls = cn(
        "intent-timeline",
        orientation === "vertical" ? "is-vertical" : "is-horizontal",
        compact && "is-compact",
        interactive && "is-clickable",
        disabled && "is-disabled",
        `ids-timeline-${size}`,
        `ids-density-${density}`,
        layout !== "stacked" && orientation === "vertical"
            ? `ids-layout-${layout}`
            : "ids-layout-stacked",
        connectorStyle === "dashed" && "is-connector-dashed"
    );

    const groupById = React.useMemo(() => {
        const map = new Map<string, IntentTimelineGroup>();
        (groups ?? []).forEach((g) => map.set(g.id, g));
        return map;
    }, [groups]);

    const format = React.useCallback(
        (item: IntentTimelineItem) => {
            if (!showTime) return null;
            const d = toDate(item.at);
            if (!d) return null;
            if (formatTime) return formatTime(d, item);
            return defaultFormatTime(d, timeLocale);
        },
        [formatTime, showTime, timeLocale]
    );

    // Keyboard navigation (roving-ish): arrows + Home/End + Enter + Space (expand)
    React.useEffect(() => {
        if (!interactive) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const inTimeline = Boolean(target?.closest?.(".intent-timeline"));
            if (!inTimeline) return;

            const keys = [
                "ArrowDown",
                "ArrowUp",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
                "Enter",
                " ",
            ];
            if (!keys.includes(e.key)) return;

            const count = items.length;
            const idx = Math.max(
                0,
                items.findIndex((it) => it.id === activeId)
            );
            const isVertical = orientation === "vertical";

            const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
            const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

            let nextIdx = idx;

            if (e.key === nextKey) nextIdx = idx + 1;
            if (e.key === prevKey) nextIdx = idx - 1;
            if (e.key === "Home") nextIdx = 0;
            if (e.key === "End") nextIdx = count - 1;

            // Activate/select
            if (e.key === "Enter") {
                e.preventDefault();
                const current = items[idx];
                if (!current) return;

                const status = current.status ?? "past";
                const isItemDisabled =
                    disabled || Boolean(current.disabled) || status === "disabled";
                if (isItemDisabled) return;

                if (collapsible && current.body) {
                    const nextExpanded = toggleExpanded(current.id);
                    current.onToggleExpand?.(current, nextExpanded);
                } else {
                    current.onSelect?.(current);
                }

                setActive(current.id);
                return;
            }

            // Space toggles expansion (when allowed)
            if (e.key === " ") {
                if (!collapsible) return;
                const current = items[idx];
                if (!current?.body) return;

                e.preventDefault();
                const status = current.status ?? "past";
                const isItemDisabled =
                    disabled || Boolean(current.disabled) || status === "disabled";
                if (isItemDisabled) return;

                const nextExpanded = toggleExpanded(current.id);
                current.onToggleExpand?.(current, nextExpanded);
                return;
            }

            if (nextIdx !== idx) {
                e.preventDefault();
                nextIdx = clamp(nextIdx, 0, Math.max(0, count - 1));

                // Skip disabled items
                const dir = nextIdx > idx ? 1 : -1;
                for (; nextIdx >= 0 && nextIdx < count; nextIdx += dir) {
                    const it = items[nextIdx];
                    if (!it) return;

                    const status = it.status ?? "past";
                    const isItemDisabled =
                        disabled || Boolean(it.disabled) || status === "disabled";
                    if (!isItemDisabled && isItemInteractive(status)) break;
                }

                if (nextIdx < 0 || nextIdx >= count) return;

                const next = items[nextIdx];
                if (!next) return;

                setActive(next.id);

                const el = listRef.current?.querySelector<HTMLElement>(
                    `[data-timeline-item-id="${next.id}"]`
                );
                el?.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [
        activeId,
        collapsible,
        disabled,
        interactive,
        items,
        orientation,
        setActive,
        toggleExpanded,
    ]);

    // Build a render stream with optional group headers
    const stream = React.useMemo(() => {
        type Row =
            | { kind: "group"; group: IntentTimelineGroup }
            | { kind: "item"; item: IntentTimelineItem; index: number };

        const out: Row[] = [];

        if (!items.length) return out;

        let lastGroupId: string | null = null;

        items.forEach((item, index) => {
            const gid = item.groupId ?? null;

            if (showGroupHeaders && gid && gid !== lastGroupId) {
                const group = groupById.get(gid) ?? { id: gid, label: gid };
                out.push({ kind: "group", group });
                lastGroupId = gid;
            }

            out.push({ kind: "item", item, index });
        });

        return out;
    }, [groupById, items, showGroupHeaders]);

    if (!items.length) {
        return (
            <section
                {...rootProps}
                aria-label={ariaLabel}
                style={layoutProps.style}
                className={cn(layoutProps.className, rootCls)}
                data-intent={resolved.intent}
                data-variant={resolved.variant}
                data-intensity={resolved.intensity}
                data-mode={resolved.mode}
            >
                {empty ?? <div className="intent-timeline-empty">—</div>}
            </section>
        );
    }

    return (
        <section
            {...rootProps}
            aria-label={ariaLabel}
            style={layoutProps.style}
            className={cn(layoutProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            <ol className="intent-timeline-list" ref={listRef}>
                {stream.map((row, rowIndex) => {
                    if (row.kind === "group") {
                        const g = row.group;
                        return (
                            <li
                                key={`g:${g.id}:${rowIndex}`}
                                className="intent-timeline-groupHeader"
                            >
                                {renderHeader ? (
                                    renderHeader(g)
                                ) : (
                                    <div className="intent-timeline-groupHeaderInner">
                                        <div className="intent-timeline-groupLeft">
                                            {g.left}
                                            <div className="intent-timeline-groupText">
                                                <div className="intent-timeline-groupLabel">
                                                    {g.label}
                                                </div>
                                                {g.hint ? (
                                                    <div className="intent-timeline-groupHint">
                                                        {g.hint}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="intent-timeline-groupRight">{g.right}</div>
                                    </div>
                                )}
                            </li>
                        );
                    }

                    const item = row.item;
                    const i = row.index;

                    const status: IntentTimelineItemStatus = item.status ?? "past";
                    const isActive = item.id === activeId || status === "current";
                    const isItemDisabled =
                        disabled || Boolean(item.disabled) || status === "disabled";
                    const canInteract = interactive && !isItemDisabled && isItemInteractive(status);

                    const hasBody = Boolean(item.body);
                    const expanded = collapsible && hasBody ? expandedIds.includes(item.id) : false;

                    const timeLabel = format(item);

                    const odd = i % 2 === 1;
                    const isAlternate = orientation === "vertical" && layout === "alternate";
                    const alternateSide = isAlternate ? (odd ? "right" : "left") : null;

                    const marker =
                        renderMarker?.(item, i) ??
                        (() => {
                            if (markerVariant === "avatar") {
                                return item.avatarSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        className="intent-timeline-markerAvatar"
                                        src={item.avatarSrc}
                                        alt={item.avatarAlt ?? ""}
                                        loading="lazy"
                                    />
                                ) : (
                                    <span
                                        className="intent-timeline-markerDot"
                                        aria-hidden="true"
                                    />
                                );
                            }

                            if (markerVariant === "pill") {
                                return (
                                    <span className="intent-timeline-markerPill" aria-hidden="true">
                                        {item.markerText ?? item.markerIcon ?? "•"}
                                    </span>
                                );
                            }

                            if (markerVariant === "index") {
                                return showIndex ? (
                                    <span
                                        className="intent-timeline-markerIndex"
                                        aria-hidden="true"
                                    >
                                        {i + 1}
                                    </span>
                                ) : (
                                    <span
                                        className="intent-timeline-markerDot"
                                        aria-hidden="true"
                                    />
                                );
                            }

                            if (markerVariant === "icon") {
                                return item.markerIcon ? (
                                    <span className="intent-timeline-markerIcon" aria-hidden="true">
                                        {item.markerIcon}
                                    </span>
                                ) : (
                                    <span
                                        className="intent-timeline-markerDot"
                                        aria-hidden="true"
                                    />
                                );
                            }

                            // dot
                            return (
                                <span className="intent-timeline-markerDot" aria-hidden="true" />
                            );
                        })();

                    const titleNode = renderTitle ? renderTitle(item) : item.title;
                    const subtitleNode = renderSubtitle ? renderSubtitle(item) : item.subtitle;
                    const descNode = renderDescription ? renderDescription(item) : item.description;
                    const metaNode = renderMeta ? renderMeta(item) : item.meta;

                    // Per-item intent override (optional)
                    const itemResolved =
                        item.intent ||
                        item.variant ||
                        item.tone ||
                        item.glow ||
                        item.intensity ||
                        item.mode
                            ? resolveIntent({
                                  intent: item.intent ?? resolved.intent,
                                  variant: item.variant ?? resolved.variant,
                                  //   tone: item.tone ?? resolved.tone,
                                  //   glow: item.glow ?? resolved.glow,
                                  intensity: item.intensity ?? resolved.intensity,
                                  mode: item.mode ?? resolved.mode,
                                  disabled: isItemDisabled,
                              })
                            : resolved;

                    const itemControlClassName =
                        itemResolved === resolved
                            ? cardControlClassName
                            : composeIntentControlClassName(itemResolved);

                    const content = (
                        <>
                            {/* Gutter (time) */}
                            <div className="intent-timeline-gutter">
                                {showTime ? (
                                    <div
                                        className="intent-timeline-time"
                                        title={timeLabel ?? undefined}
                                    >
                                        {timeLabel ?? "—"}
                                    </div>
                                ) : (
                                    <div className="intent-timeline-time" aria-hidden="true" />
                                )}
                            </div>

                            {/* Rail + marker */}
                            <div className="intent-timeline-railWrap" aria-hidden="true">
                                {showConnector ? (
                                    <div
                                        className={cn(
                                            "intent-timeline-rail",
                                            connectorStartCap && "has-startCap",
                                            connectorEndCap && "has-endCap"
                                        )}
                                    />
                                ) : null}
                                <div
                                    className={cn(
                                        "intent-timeline-marker",
                                        isActive && "is-active",
                                        status === "cancelled" && "is-cancelled",
                                        status === "draft" && "is-draft"
                                    )}
                                >
                                    {marker}
                                </div>
                            </div>

                            {/* Card */}
                            <div
                                className={cn(
                                    "intent-control intent-timeline-card",
                                    itemControlClassName,
                                    isActive && "is-active",
                                    expanded && "is-expanded",
                                    isItemDisabled && "is-disabled",
                                    alternateSide === "left" && "is-alternate-left",
                                    alternateSide === "right" && "is-alternate-right"
                                )}
                                data-timeline-item-id={item.id}
                                data-status={status}
                                data-mode={itemResolved.mode}
                                data-intent={itemResolved.intent}
                                data-variant={itemResolved.variant}
                                data-intensity={itemResolved.intensity}
                                aria-current={isActive ? "true" : undefined}
                            >
                                <div className="intent-timeline-cardInner">
                                    <div className="intent-timeline-main">
                                        <div className="intent-timeline-titleRow">
                                            <div className="intent-timeline-title">{titleNode}</div>
                                            {metaNode ? (
                                                <div className="intent-timeline-meta">
                                                    {metaNode}
                                                </div>
                                            ) : null}
                                        </div>

                                        {subtitleNode ? (
                                            <div className="intent-timeline-subtitle">
                                                {subtitleNode}
                                            </div>
                                        ) : null}

                                        {descNode ? (
                                            <div className="intent-timeline-description">
                                                {descNode}
                                            </div>
                                        ) : null}

                                        {item.media ? (
                                            <div className="intent-timeline-media">
                                                {item.media}
                                            </div>
                                        ) : null}

                                        {collapsible && hasBody ? (
                                            <div className="intent-timeline-body">
                                                {renderBody
                                                    ? renderBody(item, expanded)
                                                    : expanded
                                                      ? item.body
                                                      : null}
                                            </div>
                                        ) : hasBody ? (
                                            <div className="intent-timeline-body">
                                                {renderBody ? renderBody(item, true) : item.body}
                                            </div>
                                        ) : null}
                                    </div>

                                    {item.trailing ? (
                                        <div className="intent-timeline-trailing">
                                            {item.trailing}
                                        </div>
                                    ) : null}
                                </div>

                                {collapsible && hasBody ? (
                                    <div className="intent-timeline-expandHint" aria-hidden="true">
                                        {expanded ? "▲" : "▼"}
                                    </div>
                                ) : null}
                            </div>
                        </>
                    );

                    const onActivate = () => {
                        if (!canInteract) return;

                        setActive(item.id);

                        if (collapsible && item.body) {
                            const nextExpanded = toggleExpanded(item.id);
                            item.onToggleExpand?.(item, nextExpanded);
                            return;
                        }

                        item.onSelect?.(item);
                    };

                    // Link mode (when href) vs button-ish mode
                    if (item.href && allowLinkNavigation) {
                        // Still allow “select-like” tracking via onSelect + active
                        return (
                            <li
                                key={item.id}
                                className={cn("intent-timeline-itemRow", isActive && "is-active")}
                            >
                                <a
                                    href={item.href}
                                    target={item.target}
                                    rel={item.rel}
                                    className={cn(
                                        "intent-timeline-rowLink",
                                        isItemDisabled && "is-disabled"
                                    )}
                                    aria-disabled={isItemDisabled ? "true" : "false"}
                                    onClick={(e) => {
                                        if (!canInteract) {
                                            e.preventDefault();
                                            return;
                                        }
                                        item.onSelect?.(item);
                                        setActive(item.id);
                                    }}
                                >
                                    {content}
                                </a>
                            </li>
                        );
                    }

                    return (
                        <li
                            key={item.id}
                            className={cn("intent-timeline-itemRow", isActive && "is-active")}
                        >
                            <button
                                type="button"
                                className={cn(
                                    "intent-timeline-rowButton",
                                    isItemDisabled && "is-disabled"
                                )}
                                disabled={!canInteract}
                                aria-disabled={isItemDisabled ? "true" : "false"}
                                onClick={onActivate}
                            >
                                {content}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
