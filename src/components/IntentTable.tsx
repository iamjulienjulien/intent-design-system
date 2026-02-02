"use client";

// src/components/intent/IntentTable.tsx
// IntentTable
// - Intent-first table for structured data
// - Generic columns renderer (no fetching, no pagination)
// - Supports compact/striped/hoverable, selection (controlled/uncontrolled), loading + empty state
// - Uses resolver vars + stable hooks only

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentLayoutProps, composeIntentClassName } from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function toKey(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "bigint") return String(value);
    return String(value ?? "");
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentTableAlign = "left" | "center" | "right";

export type IntentTableColumn<T> = {
    /** Stable column id */
    key: string;

    /** Header label */
    header: React.ReactNode;

    /** Cell renderer */
    cell: (row: T, rowIndex: number) => React.ReactNode;

    /** Optional: column metadata */
    description?: string;

    /** Layout */
    align?: IntentTableAlign;
    width?: number | string;

    /** Styling */
    className?: string;
    headerClassName?: string;
    cellClassName?: string;

    /** Behavior */
    sortable?: boolean; // reserved for future (Playground can display badge)
};

export type IntentTableRowTone<T> =
    | IntentInput
    | ((row: T, rowIndex: number) => IntentInput | null | undefined);

export type IntentTableProps<T> = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        /** Data */
        data: T[];
        columns: Array<IntentTableColumn<T>>;

        /** Key accessor (recommended). If missing, uses rowIndex (not ideal for selection). */
        keyField?: keyof T | ((row: T, rowIndex: number) => string | number);

        /** Row-level intent override (optional) */
        rowIntent?: IntentTableRowTone<T>;

        /** States */
        loading?: boolean;
        emptyLabel?: React.ReactNode;
        loadingLabel?: React.ReactNode;

        /** Layout flags */
        compact?: boolean;
        striped?: boolean;
        hoverable?: boolean;

        /** Header */
        stickyHeader?: boolean;

        /** Selection */
        selectable?: boolean;
        selectedKeys?: Array<string | number>; // controlled
        defaultSelectedKeys?: Array<string | number>; // uncontrolled
        onSelectionChange?: (keys: Array<string | number>) => void;

        /** Footer */
        footer?: React.ReactNode;

        /** Accessibility */
        caption?: React.ReactNode;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_TABLE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "data",
        description: { fr: "Données à afficher.", en: "Rows to render." },
        type: "T[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "columns",
        description: {
            fr: "Définition des colonnes (header + renderer).",
            en: "Columns definition (header + renderer).",
        },
        type: "IntentTableColumn<T>[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "keyField",
        description: {
            fr: "Clé unique ligne (champ ou fonction). Recommandé pour la sélection.",
            en: "Unique row key (field or function). Recommended for selection.",
        },
        type: "keyof T | (row: T, rowIndex: number) => string | number",
        required: false,
        fromSystem: false,
    },
    {
        name: "rowIntent",
        description: {
            fr: "Override intent/variant/tone par ligne (objet ou fonction).",
            en: "Per-row intent override (object or function).",
        },
        type: "IntentInput | ((row: T, rowIndex: number) => IntentInput | null | undefined)",
        required: false,
        fromSystem: false,
    },
    {
        name: "loading",
        description: { fr: "Affiche l’état de chargement.", en: "Shows loading state." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "emptyLabel",
        description: { fr: "Label quand data est vide.", en: "Empty state label." },
        type: "React.ReactNode",
        required: false,
        default: "No data",
        fromSystem: false,
    },
    {
        name: "loadingLabel",
        description: { fr: "Label pendant le chargement.", en: "Label during loading." },
        type: "React.ReactNode",
        required: false,
        default: "Loading…",
        fromSystem: false,
    },
    {
        name: "compact",
        description: { fr: "Densité réduite.", en: "Compact density." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "striped",
        description: { fr: "Zébrage des lignes.", en: "Striped rows." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "hoverable",
        description: { fr: "Hover sur les lignes.", en: "Row hover effect." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "stickyHeader",
        description: {
            fr: "Header sticky (scroll vertical).",
            en: "Sticky header (vertical scroll).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "selectable",
        description: { fr: "Active la sélection de lignes.", en: "Enables row selection." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "selectedKeys",
        description: { fr: "Sélection contrôlée.", en: "Controlled selected keys." },
        type: "Array<string | number>",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultSelectedKeys",
        description: {
            fr: "Sélection par défaut (non contrôlée).",
            en: "Default selection (uncontrolled).",
        },
        type: "Array<string | number>",
        required: false,
        default: "[]",
        fromSystem: false,
    },
    {
        name: "onSelectionChange",
        description: { fr: "Callback de sélection.", en: "Selection callback." },
        type: "(keys: Array<string | number>) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "footer",
        description: { fr: "Footer libre sous la table.", en: "Free footer under the table." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "caption",
        description: { fr: "Caption accessible (table).", en: "Accessible table caption." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: { fr: "Props natives du root div.", en: "Native props on root div." },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentTablePropsTable: DocsPropRow[] = [
    ...INTENT_TABLE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentTableIdentity: ComponentIdentity = {
    name: "IntentTable",
    kind: "data",
    description: {
        fr: "Table intent-first pour données structurées: colonnes render, états loading/empty, densité, zébrage, sélection.",
        en: "Intent-first table for structured data: render columns, loading/empty states, density, stripes, selection.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-table" },
    anatomy: {
        root: "<div>",
        scroller: ".intent-table-scroller",
        table: "table",
        caption: "caption",
        thead: "thead",
        th: "th",
        tbody: "tbody",
        tr: "tr.intent-table-row",
        td: "td",
        empty: ".intent-table-empty",
        loading: ".intent-table-loading",
        footer: ".intent-table-footer",
    },
    classHooks: [
        "intent-table",
        "intent-table-scroller",
        "intent-table-row",
        "is-compact",
        "is-striped",
        "is-hoverable",
        "is-sticky",
        "is-selectable",
        "is-selected",
        "is-loading",
        "is-empty",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentTable<T>(props: IntentTableProps<T>) {
    const {
        className,

        data,
        columns,
        keyField,
        rowIntent,

        loading = false,
        emptyLabel = "No data",
        loadingLabel = "Loading…",

        compact = false,
        striped = false,
        hoverable = true,
        stickyHeader = false,

        selectable = false,
        selectedKeys: selectedKeysProp,
        defaultSelectedKeys = [],
        onSelectionChange,

        footer,
        caption,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...divProps
    } = props;

    const disabled = Boolean(dsDisabled);

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

    // Root: layout vars only (let CSS recipe paint the surface)
    const layoutProps = getIntentLayoutProps(resolved, className);

    // Outer wrapper uses surface recipe (so variants are meaningful)
    const surfaceClass = composeIntentClassName(resolved);

    const isControlledSelection = selectedKeysProp !== undefined;

    const [selectedUncontrolled, setSelectedUncontrolled] =
        React.useState<Array<string | number>>(defaultSelectedKeys);

    const selectedKeys = isControlledSelection ? (selectedKeysProp ?? []) : selectedUncontrolled;

    const setSelectedKeys = React.useCallback(
        (next: Array<string | number>) => {
            if (!isControlledSelection) setSelectedUncontrolled(next);
            onSelectionChange?.(next);
        },
        [isControlledSelection, onSelectionChange]
    );

    const getRowKey = React.useCallback(
        (row: T, rowIndex: number) => {
            if (typeof keyField === "function") return toKey(keyField(row, rowIndex));
            if (typeof keyField === "string") return toKey((row as any)?.[keyField]);
            return String(rowIndex);
        },
        [keyField]
    );

    const isSelected = React.useCallback(
        (key: string) => selectedKeys.map(toKey).includes(key),
        [selectedKeys]
    );

    const toggleRow = React.useCallback(
        (key: string) => {
            const next = selectedKeys.map(toKey);
            const idx = next.indexOf(key);
            if (idx >= 0) next.splice(idx, 1);
            else next.push(key);
            setSelectedKeys(next);
        },
        [selectedKeys, setSelectedKeys]
    );

    const rootCls = cn(
        "intent-table flex-col",
        compact && "is-compact",
        striped && "is-striped",
        hoverable && "is-hoverable",
        stickyHeader && "is-sticky",
        selectable && "is-selectable",
        loading && "is-loading",
        !loading && data.length === 0 && "is-empty"
    );

    const renderRowIntent = React.useCallback(
        (row: T, rowIndex: number): IntentInput | null => {
            if (!rowIntent) return null;
            if (typeof rowIntent === "function") return rowIntent(row, rowIndex) ?? null;
            return rowIntent ?? null;
        },
        [rowIntent]
    );

    const columnsSafe = React.useMemo(() => {
        // Ensure stable & safe columns
        return columns.map((c) => ({
            align: "left" as IntentTableAlign,
            ...c,
        }));
    }, [columns]);

    const colCount = columnsSafe.length;

    return (
        <div
            {...divProps}
            style={layoutProps.style}
            className={cn(layoutProps.className, rootCls, surfaceClass)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            aria-busy={loading ? "true" : "false"}
        >
            <div className="intent-table-scroller" role="region" aria-label="Table">
                <table className="intent-table-table">
                    {caption ? <caption className="intent-table-caption">{caption}</caption> : null}

                    <thead className="intent-table-thead">
                        <tr>
                            {columnsSafe.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        "intent-table-th",
                                        col.headerClassName,
                                        col.align === "center" && "is-center",
                                        col.align === "right" && "is-right"
                                    )}
                                    style={
                                        col.width !== undefined
                                            ? ({ width: col.width } as React.CSSProperties)
                                            : undefined
                                    }
                                    scope="col"
                                >
                                    <span className="intent-table-thInner">
                                        {col.header}
                                        {col.sortable ? (
                                            <span
                                                className="intent-table-sortBadge"
                                                aria-hidden="true"
                                            >
                                                ↕
                                            </span>
                                        ) : null}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="intent-table-tbody">
                        {loading ? (
                            <tr>
                                <td colSpan={colCount}>
                                    <div className="intent-table-loading">
                                        <div className="intent-table-loadingLabel">
                                            {loadingLabel}
                                        </div>
                                        <div className="intent-table-skeleton" aria-hidden="true">
                                            {Array.from({
                                                length: clamp(compact ? 6 : 5, 3, 8),
                                            }).map((_, i) => (
                                                <div key={i} className="intent-table-skeletonRow" />
                                            ))}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={colCount}>
                                    <div className="intent-table-empty">{emptyLabel}</div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => {
                                const key = getRowKey(row, rowIndex);
                                const selected = selectable ? isSelected(key) : false;

                                const perRowIntent = renderRowIntent(row, rowIndex);
                                const rowResolved = perRowIntent
                                    ? resolveIntent({ ...intentInput, ...perRowIntent })
                                    : null;

                                return (
                                    <tr
                                        key={key}
                                        className={cn(
                                            "intent-table-row",
                                            selected && "is-selected",
                                            rowResolved ? "has-row-intent" : ""
                                        )}
                                        data-selected={selected ? "true" : "false"}
                                        data-row-intent={rowResolved?.intent ?? undefined}
                                        style={rowResolved?.style as any}
                                        onClick={
                                            selectable && !disabled
                                                ? () => toggleRow(key)
                                                : undefined
                                        }
                                        role={selectable ? "row" : undefined}
                                        aria-selected={
                                            selectable ? (selected ? "true" : "false") : undefined
                                        }
                                        tabIndex={selectable ? 0 : undefined}
                                        onKeyDown={
                                            selectable && !disabled
                                                ? (e) => {
                                                      if (e.key === "Enter" || e.key === " ") {
                                                          e.preventDefault();
                                                          toggleRow(key);
                                                      }
                                                  }
                                                : undefined
                                        }
                                    >
                                        {columnsSafe.map((col) => (
                                            <td
                                                key={col.key}
                                                className={cn(
                                                    "intent-table-td",
                                                    col.className,
                                                    col.cellClassName,
                                                    col.align === "center" && "is-center",
                                                    col.align === "right" && "is-right"
                                                )}
                                            >
                                                {col.cell(row, rowIndex)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {footer ? <div className="intent-table-footer w-full">{footer}</div> : null}
        </div>
    );
}
