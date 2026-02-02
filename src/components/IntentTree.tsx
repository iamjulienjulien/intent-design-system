"use client";

// src/components/intent/IntentTree.tsx
// IntentTree
// - Intent-first hierarchical tree (SVG)
// - Built for genealogies / knowledge graphs "tree-ish" (Space Memoria)
// - Layout modes:
//   - "auto": internal simple tidy-ish layout (stable, dependency-free)
//   - "custom": consumer provides node positions (e.g. D3 hierarchy/tree)
// - Features:
//   - Zoom / pan (controlled/uncontrolled viewport)
//   - Collapsible nodes (controlled/uncontrolled)
//   - Selection (controlled/uncontrolled)
//   - Highly customizable node rendering (foreignObject) + link rendering
//   - Mini-map + Search + Lineage highlight + Scope modes + Fullscreen + Action toolbar
// - No dynamic Tailwind classes: stable hooks only

import * as React from "react";

import type { IntentInput, DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";
import { resolveIntent, getIntentLayoutProps, composeIntentClassName } from "../lib/intent/resolve";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function toKey(v: unknown): string {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "bigint") return String(v);
    return String(v ?? "");
}

function rafThrottle<T extends (...args: any[]) => void>(fn: T) {
    let raf = 0;
    let lastArgs: any[] | null = null;

    return (...args: any[]) => {
        lastArgs = args;
        if (raf) return;

        raf = window.requestAnimationFrame(() => {
            raf = 0;
            if (!lastArgs) return;
            fn(...lastArgs);
            lastArgs = null;
        });
    };
}

function safeString(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return String(v);
    try {
        return String(v);
    } catch {
        return "";
    }
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentTreeTagKey =
    | "king"
    | "queen"
    | "prince"
    | "princess"
    | "lord"
    | "lady"
    | "bastard"
    | "heir"
    | "consort"
    | "founder"
    | "dragonrider";

export type IntentTreeTagDef = {
    key: IntentTreeTagKey;
    emoji: string;
    label: { fr: string; en: string };
};

export const INTENT_TREE_TAGS: Record<IntentTreeTagKey, IntentTreeTagDef> = {
    king: { key: "king", emoji: "👑", label: { fr: "Roi", en: "King" } },
    queen: { key: "queen", emoji: "👑", label: { fr: "Reine", en: "Queen" } },
    prince: { key: "prince", emoji: "🤴", label: { fr: "Prince", en: "Prince" } },
    princess: { key: "princess", emoji: "👸", label: { fr: "Princesse", en: "Princess" } },
    lord: { key: "lord", emoji: "🛡️", label: { fr: "Lord", en: "Lord" } },
    lady: { key: "lady", emoji: "🛡️", label: { fr: "Lady", en: "Lady" } },
    bastard: { key: "bastard", emoji: "🩸", label: { fr: "Bâtard", en: "Bastard" } },
    heir: { key: "heir", emoji: "🧬", label: { fr: "Héritier", en: "Heir" } },
    consort: { key: "consort", emoji: "💍", label: { fr: "Consort", en: "Consort" } },
    founder: { key: "founder", emoji: "🔥", label: { fr: "Fondateur", en: "Founder" } },
    dragonrider: {
        key: "dragonrider",
        emoji: "🐉",
        label: { fr: "Dragonnier", en: "Dragonrider" },
    },
};

export type IntentTreeDates = {
    born?: string; // libre (ex: "282 AC")
    died?: string;
};

export type IntentTreeNodeMeta = {
    tone?: string;
    dates?: IntentTreeDates;
    tags?: IntentTreeTagKey[];
};

export type IntentTreeScopeMode = "desc" | "asc" | "siblings" | "full";

export type IntentTreeToolbarAction =
    | "fit"
    | "reset"
    | "zoom_in"
    | "zoom_out"
    | "fullscreen"
    | "expand_all"
    | "collapse_all"
    | "toggle_grid";

export type IntentTreeToolbarPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type IntentTreeOrientation = "vertical" | "horizontal";
export type IntentTreeLinkStyle = "curve" | "elbow" | "straight";

export type IntentTreeViewport = {
    x: number; // translate X
    y: number; // translate Y
    k: number; // scale
};

export type IntentTreeNodeRenderContext<T> = {
    node: IntentTreeComputedNode<T>;
    depth: number;
    index: number;
    isSelected: boolean;
    isCollapsed: boolean;
    hasChildren: boolean;

    // actions
    toggleCollapse: () => void;
    select: () => void;

    // tree-level props useful for custom UI
    orientation: IntentTreeOrientation;
};

export type IntentTreeLinkRenderContext<T> = {
    source: IntentTreeComputedNode<T>;
    target: IntentTreeComputedNode<T>;
    pathD: string;
    selected: boolean;
};

export type IntentTreeNodeIntent<T> = IntentInput | ((node: T) => IntentInput | null | undefined);

export type IntentTreeNode<T> = T;

export type IntentTreeComputedNode<T> = {
    id: string;
    parentId: string | null;
    data: T;

    depth: number;
    order: number;

    x: number;
    y: number;

    childrenIds: string[];
};

export type IntentTreeLayoutMode = "auto" | "custom";

export type IntentTreeProps<T> = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /** Root node of the hierarchy */
        root: IntentTreeNode<T>;

        /** How to access children */
        getChildren: (node: T) => T[] | null | undefined;

        /** Stable id accessor (required for collapse/selection correctness) */
        getId: (node: T) => string | number;

        /** Optional label accessor (used by default node renderer) */
        getLabel?: (node: T) => React.ReactNode;

        /** Optional secondary label (default renderer) */
        getSubtitle?: (node: T) => React.ReactNode;

        /** Layout */
        layout?: IntentTreeLayoutMode; // default "auto"
        orientation?: IntentTreeOrientation; // default "vertical"
        linkStyle?: IntentTreeLinkStyle; // default "curve"

        /** Sizing (auto layout + default renderer) */
        nodeWidth?: number; // default 220
        nodeHeight?: number; // default 64
        levelGap?: number; // default 90 (distance between depths)
        siblingGap?: number; // default 28 (distance between siblings)
        padding?: number; // default 40 (viewport padding)

        /**
         * Custom layout: provide node positions.
         * Coordinates are in the tree's internal coordinate system (before viewport transform).
         */
        getNodePosition?: (args: {
            node: T;
            id: string;
            depth: number;
            order: number;
            parentId: string | null;
        }) => { x: number; y: number };

        /** Collapse / expand */
        collapsible?: boolean; // default true
        collapsedIds?: string[]; // controlled
        defaultCollapsedIds?: string[]; // uncontrolled
        onCollapsedChange?: (collapsedIds: string[]) => void;

        /** Selection */
        selectable?: boolean; // default true
        selectedId?: string | null; // controlled
        defaultSelectedId?: string | null; // uncontrolled
        onSelectionChange?: (selectedId: string | null, node?: T) => void;

        /** Node intent (per-node styling overrides) */
        nodeIntent?: IntentTreeNodeIntent<T>;

        /** Rendering */
        renderNode?: (ctx: IntentTreeNodeRenderContext<T>) => React.ReactNode;
        renderLink?: (ctx: IntentTreeLinkRenderContext<T>) => React.ReactNode;

        /** Viewport (zoom/pan) */
        zoomable?: boolean; // default true
        pannable?: boolean; // default true
        minZoom?: number; // default 0.25
        maxZoom?: number; // default 2.5

        viewport?: IntentTreeViewport; // controlled
        defaultViewport?: IntentTreeViewport; // uncontrolled
        onViewportChange?: (vp: IntentTreeViewport) => void;

        /** Commands */
        autoFit?: boolean; // default true (fit content on mount + on root change)

        /** UX */
        showGrid?: boolean; // controlled-ish (if provided, no internal toggle)
        gridSize?: number; // default 40
        emptyLabel?: React.ReactNode; // default "No nodes"

        /** Scope modes */
        scopeMode?: IntentTreeScopeMode; // default "full"
        scopeDepth?: number; // default Infinity

        /** Lineage highlight */
        lineageHighlight?: boolean; // default true
        highlightAncestors?: boolean; // default true
        highlightDescendants?: boolean; // default true
        highlightSiblings?: boolean; // default true

        /** Search */
        searchable?: boolean; // default true
        searchPlaceholder?: string; // default "Search…"
        searchMinChars?: number; // default 2
        getSearchText?: (node: T) => string;
        onSearchSelect?: (id: string, node: T) => void;

        /** Mini-map */
        miniMap?: boolean; // default true
        miniMapWidth?: number; // default 220
        miniMapHeight?: number; // default 140
        miniMapPadding?: number; // default 12

        /** Fullscreen */
        fullscreenable?: boolean; // default true

        /** Toolbar */
        toolbar?: boolean; // default true
        toolbarActions?: IntentTreeToolbarAction[]; // default set
        toolbarPosition?: IntentTreeToolbarPosition; // default "top-left"

        /** Node meta accessors */
        getTone?: (node: T) => string | null | undefined;
        getDates?: (node: T) => IntentTreeDates | null | undefined;
        getTags?: (node: T) => IntentTreeTagKey[] | null | undefined;

        /** Locale (tags labels) */
        locale?: "fr" | "en"; // default "fr"
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_TREE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "root",
        description: { fr: "Racine de l’arbre.", en: "Tree root." },
        type: "T",
        required: true,
        fromSystem: false,
    },
    {
        name: "getChildren",
        description: { fr: "Accès aux enfants.", en: "Children accessor." },
        type: "(node: T) => T[] | null | undefined",
        required: true,
        fromSystem: false,
    },
    {
        name: "getId",
        description: { fr: "Id stable par nœud.", en: "Stable node id." },
        type: "(node: T) => string | number",
        required: true,
        fromSystem: false,
    },
    {
        name: "getLabel",
        description: { fr: "Label (renderer par défaut).", en: "Label (default renderer)." },
        type: "(node: T) => React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "getSubtitle",
        description: {
            fr: "Sous-label (renderer par défaut).",
            en: "Subtitle (default renderer).",
        },
        type: "(node: T) => React.ReactNode",
        required: false,
        fromSystem: false,
    },

    {
        name: "layout",
        description: { fr: "Mode de layout: auto ou custom.", en: "Layout mode: auto or custom." },
        type: `"auto" | "custom"`,
        required: false,
        default: "auto",
        fromSystem: false,
    },
    {
        name: "orientation",
        description: {
            fr: "Orientation: vertical/horizontal.",
            en: "Orientation: vertical/horizontal.",
        },
        type: `"vertical" | "horizontal"`,
        required: false,
        default: "vertical",
        fromSystem: false,
    },
    {
        name: "linkStyle",
        description: { fr: "Style des liens.", en: "Link style." },
        type: `"curve" | "elbow" | "straight"`,
        required: false,
        default: "curve",
        fromSystem: false,
    },

    {
        name: "nodeWidth",
        description: { fr: "Largeur node (default renderer + auto layout).", en: "Node width." },
        type: "number",
        required: false,
        default: "220",
        fromSystem: false,
    },
    {
        name: "nodeHeight",
        description: { fr: "Hauteur node (default renderer + auto layout).", en: "Node height." },
        type: "number",
        required: false,
        default: "64",
        fromSystem: false,
    },
    {
        name: "levelGap",
        description: { fr: "Distance entre niveaux.", en: "Depth gap." },
        type: "number",
        required: false,
        default: "90",
        fromSystem: false,
    },
    {
        name: "siblingGap",
        description: { fr: "Distance entre siblings.", en: "Sibling gap." },
        type: "number",
        required: false,
        default: "28",
        fromSystem: false,
    },
    {
        name: "padding",
        description: { fr: "Padding autour du contenu.", en: "Content padding." },
        type: "number",
        required: false,
        default: "40",
        fromSystem: false,
    },

    {
        name: "getNodePosition",
        description: {
            fr: "Position custom (ex: D3 tree).",
            en: "Custom position function (e.g. D3 tree).",
        },
        type: "(args) => {x:number;y:number}",
        required: false,
        fromSystem: false,
    },

    {
        name: "collapsible",
        description: { fr: "Active collapse/expand.", en: "Enable collapse/expand." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "collapsedIds",
        description: { fr: "Ids collapsés (controlled).", en: "Collapsed ids (controlled)." },
        type: "string[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultCollapsedIds",
        description: { fr: "Ids collapsés init (uncontrolled).", en: "Default collapsed ids." },
        type: "string[]",
        required: false,
        default: "[]",
        fromSystem: false,
    },
    {
        name: "onCollapsedChange",
        description: { fr: "Callback collapse.", en: "Collapse callback." },
        type: "(ids: string[]) => void",
        required: false,
        fromSystem: false,
    },

    {
        name: "selectable",
        description: { fr: "Active sélection.", en: "Enable selection." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "selectedId",
        description: { fr: "Sélection (controlled).", en: "Selected id (controlled)." },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultSelectedId",
        description: { fr: "Sélection init (uncontrolled).", en: "Default selected id." },
        type: "string | null",
        required: false,
        default: "null",
        fromSystem: false,
    },
    {
        name: "onSelectionChange",
        description: { fr: "Callback sélection.", en: "Selection callback." },
        type: "(id: string | null, node?: T) => void",
        required: false,
        fromSystem: false,
    },

    {
        name: "nodeIntent",
        description: { fr: "Override intent par node.", en: "Per-node intent override." },
        type: "IntentInput | ((node:T)=>IntentInput|null)",
        required: false,
        fromSystem: false,
    },

    {
        name: "renderNode",
        description: { fr: "Renderer node custom.", en: "Custom node renderer." },
        type: "(ctx) => React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "renderLink",
        description: { fr: "Renderer lien custom.", en: "Custom link renderer." },
        type: "(ctx) => React.ReactNode",
        required: false,
        fromSystem: false,
    },

    {
        name: "zoomable",
        description: { fr: "Zoom (wheel/pinch).", en: "Enable zoom." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "pannable",
        description: { fr: "Pan (drag).", en: "Enable pan." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "minZoom",
        description: { fr: "Zoom min.", en: "Min zoom." },
        type: "number",
        required: false,
        default: "0.25",
        fromSystem: false,
    },
    {
        name: "maxZoom",
        description: { fr: "Zoom max.", en: "Max zoom." },
        type: "number",
        required: false,
        default: "2.5",
        fromSystem: false,
    },

    {
        name: "viewport",
        description: { fr: "Viewport (controlled).", en: "Viewport (controlled)." },
        type: "{x:number;y:number;k:number}",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultViewport",
        description: { fr: "Viewport init (uncontrolled).", en: "Default viewport." },
        type: "{x:0,y:0,k:1}",
        required: false,
        default: "{x:0,y:0,k:1}",
        fromSystem: false,
    },
    {
        name: "onViewportChange",
        description: { fr: "Callback viewport.", en: "Viewport callback." },
        type: "(vp) => void",
        required: false,
        fromSystem: false,
    },

    {
        name: "autoFit",
        description: { fr: "Fit contenu au mount.", en: "Fit content on mount." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },

    {
        name: "showGrid",
        description: { fr: "Affiche grille de repère.", en: "Show grid." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "gridSize",
        description: { fr: "Taille grille.", en: "Grid size." },
        type: "number",
        required: false,
        default: "40",
        fromSystem: false,
    },

    {
        name: "scopeMode",
        description: {
            fr: "Mode scope: asc/desc/fratrie/full.",
            en: "Scope mode: asc/desc/siblings/full.",
        },
        type: `"asc" | "desc" | "siblings" | "full"`,
        required: false,
        default: "full",
        fromSystem: false,
    },
    {
        name: "scopeDepth",
        description: { fr: "Limite de profondeur pour asc/desc.", en: "Depth limit for asc/desc." },
        type: "number",
        required: false,
        default: "Infinity",
        fromSystem: false,
    },

    {
        name: "searchable",
        description: { fr: "Active la recherche.", en: "Enable search." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "miniMap",
        description: { fr: "Active la mini-map.", en: "Enable mini-map." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "fullscreenable",
        description: { fr: "Active le fullscreen.", en: "Enable fullscreen." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },

    {
        name: "emptyLabel",
        description: { fr: "Label si arbre vide.", en: "Empty label." },
        type: "React.ReactNode",
        required: false,
        default: "No nodes",
        fromSystem: false,
    },
];

export const IntentTreePropsTable: DocsPropRow[] = [
    ...INTENT_TREE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentTreeIdentity: ComponentIdentity = {
    name: "IntentTree",
    kind: "data",
    description: {
        fr: "Visualisation hiérarchique intent-first (SVG): zoom/pan, collapse, sélection, rendu nodes/links custom. Pensé pour Space Memoria.",
        en: "Intent-first hierarchical visualization (SVG): zoom/pan, collapse, selection, custom nodes/links. Designed for Space Memoria.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-tree" },
    anatomy: {
        root: "<div>",
        viewport: "svg.intent-tree-svg",
        stage: "g.intent-tree-stage",
        links: "g.intent-tree-links",
        nodes: "g.intent-tree-nodes",
        node: "g.intent-tree-node",
        nodeHit: "rect.intent-tree-nodeHit",
        link: "path.intent-tree-link",
        grid: "g.intent-tree-grid",
        toolbar: "div.intent-tree-toolbar",
        search: "div.intent-tree-search",
        minimap: "div.intent-tree-minimap",
    },
    classHooks: [
        "intent-tree",
        "intent-tree-svg",
        "intent-tree-stage",
        "intent-tree-grid",
        "intent-tree-links",
        "intent-tree-link",
        "intent-tree-nodes",
        "intent-tree-node",
        "intent-tree-nodeCard",
        "intent-tree-nodeLabel",
        "intent-tree-nodeSubtitle",
        "intent-tree-toolbar",
        "intent-tree-toolbarBtn",
        "intent-tree-search",
        "intent-tree-searchInput",
        "intent-tree-searchMenu",
        "intent-tree-searchItem",
        "intent-tree-minimap",
        "intent-tree-minimapSvg",
        "intent-tree-minimapNode",
        "intent-tree-minimapLink",
        "intent-tree-minimapCamera",
        "is-zoomable",
        "is-pannable",
        "is-collapsible",
        "is-selectable",
        "is-selected",
        "is-collapsed",
        "is-horizontal",
        "is-vertical",
        "is-fullscreen",
        "is-dimmed",
        "is-ancestor",
        "is-descendant",
        "is-sibling",
    ],
};

/* ============================================================================
   🌳 TREE BUILD
============================================================================ */

export type FlatNode<T> = {
    id: string;
    parentId: string | null;
    depth: number;
    data: T;
};

function isDefined<T>(v: T | null | undefined): v is T {
    return v !== null && v !== undefined;
}

function flattenTree<T>(args: {
    root: T;
    getChildren: (node: T) => Array<T | null | undefined> | null | undefined;
    getId: (node: T) => string | number;
    collapsedSet: ReadonlySet<string | number>;
}): { nodes: FlatNode<T>[]; orderById: Map<string, number>; childrenById: Map<string, string[]> } {
    const { root, getChildren, getId, collapsedSet } = args;

    const collapsedKeys = new Set<string>(Array.from(collapsedSet, (x) => toKey(x)));

    const nodes: FlatNode<T>[] = [];
    const childrenById = new Map<string, string[]>();

    const stack: Array<{ node: T; parentId: string | null; depth: number }> = [
        { node: root, parentId: null, depth: 0 },
    ];

    while (stack.length) {
        const cur = stack.pop();
        if (!cur) break;

        const id = toKey(getId(cur.node));
        nodes.push({ id, parentId: cur.parentId, data: cur.node, depth: cur.depth });

        const isCollapsed = collapsedKeys.has(id);

        const rawChildren = isCollapsed ? [] : (getChildren(cur.node) ?? []);
        const children = rawChildren.filter(isDefined);

        const childIds = children.map((c) => toKey(getId(c)));
        childrenById.set(id, childIds);

        for (let i = children.length - 1; i >= 0; i--) {
            stack.push({ node: children[i]!, parentId: id, depth: cur.depth + 1 });
        }
    }

    const orderById = new Map<string, number>();
    nodes.forEach((n, idx) => orderById.set(n.id, idx));

    return { nodes, orderById, childrenById };
}

function computeAutoLayout<T>(args: {
    flat: FlatNode<T>[];
    orderById: Map<string, number>;
    childrenById: Map<string, string[]>;
    orientation: IntentTreeOrientation;
    nodeWidth: number;
    nodeHeight: number;
    levelGap: number;
    siblingGap: number;
}): IntentTreeComputedNode<T>[] {
    const {
        flat,
        orderById,
        childrenById,
        orientation,
        nodeWidth,
        nodeHeight,
        levelGap,
        siblingGap,
    } = args;

    const byDepth = new Map<number, FlatNode<T>[]>();
    for (const n of flat) {
        const arr = byDepth.get(n.depth) ?? [];
        arr.push(n);
        byDepth.set(n.depth, arr);
    }

    for (const [d, arr] of byDepth.entries()) {
        arr.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
        byDepth.set(d, arr);
    }

    const computed: IntentTreeComputedNode<T>[] = [];
    for (const n of flat) {
        const siblings = byDepth.get(n.depth) ?? [];
        const idx = siblings.findIndex((x) => x.id === n.id);
        const order = idx >= 0 ? idx : 0;

        const primary =
            n.depth * (orientation === "vertical" ? nodeHeight + levelGap : nodeWidth + levelGap);
        const secondary =
            order * (orientation === "vertical" ? nodeWidth + siblingGap : nodeHeight + siblingGap);

        const x = orientation === "vertical" ? secondary : primary;
        const y = orientation === "vertical" ? primary : secondary;

        computed.push({
            id: n.id,
            parentId: n.parentId,
            data: n.data,
            depth: n.depth,
            order,
            x,
            y,
            childrenIds: childrenById.get(n.id) ?? [],
        });
    }

    return computed;
}

function computeCustomLayout<T>(args: {
    flat: FlatNode<T>[];
    orderById: Map<string, number>;
    childrenById: Map<string, string[]>;
    getNodePosition: NonNullable<IntentTreeProps<T>["getNodePosition"]>;
}): IntentTreeComputedNode<T>[] {
    const { flat, orderById, childrenById, getNodePosition } = args;

    return flat.map((n) => {
        const order = orderById.get(n.id) ?? 0;
        const pos = getNodePosition({
            node: n.data,
            id: n.id,
            depth: n.depth,
            order,
            parentId: n.parentId,
        });

        return {
            id: n.id,
            parentId: n.parentId,
            data: n.data,
            depth: n.depth,
            order,
            x: pos.x,
            y: pos.y,
            childrenIds: childrenById.get(n.id) ?? [],
        };
    });
}

function boundsOf(nodes: Array<{ x: number; y: number }>, pad: number) {
    if (nodes.length === 0) return { minX: -pad, minY: -pad, maxX: pad, maxY: pad };
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const n of nodes) {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
    }

    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

/* ============================================================================
   🔗 LINKS
============================================================================ */

function linkPath(args: {
    sx: number;
    sy: number;
    tx: number;
    ty: number;
    style: IntentTreeLinkStyle;
}): string {
    const { sx, sy, tx, ty, style } = args;

    if (style === "straight") return `M ${sx} ${sy} L ${tx} ${ty}`;

    if (style === "elbow") {
        const mx = (sx + tx) / 2;
        return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx} ${ty}`;
    }

    const dx = tx - sx;
    const c1x = sx + dx * 0.5;
    const c2x = sx + dx * 0.5;
    return `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${ty}, ${tx} ${ty}`;
}

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentTree<T>(props: IntentTreeProps<T>) {
    const {
        className,

        root,
        getChildren,
        getId,
        getLabel,
        getSubtitle,

        layout = "auto",
        orientation = "vertical",
        linkStyle = "curve",

        nodeWidth = 220,
        nodeHeight = 64,
        levelGap = 90,
        siblingGap = 28,
        padding = 40,

        getNodePosition,

        collapsible = true,
        collapsedIds: collapsedIdsProp,
        defaultCollapsedIds = [],
        onCollapsedChange,

        selectable = true,
        selectedId: selectedIdProp,
        defaultSelectedId = null,
        onSelectionChange,

        nodeIntent,

        renderNode,
        renderLink,

        zoomable = true,
        pannable = true,
        minZoom = 0.25,
        maxZoom = 2.5,

        viewport: viewportProp,
        defaultViewport = { x: 0, y: 0, k: 1 },
        onViewportChange,

        autoFit = true,

        showGrid: showGridProp,
        gridSize = 40,
        emptyLabel = "No nodes",

        scopeMode = "full",
        scopeDepth = Number.POSITIVE_INFINITY,

        lineageHighlight = true,
        highlightAncestors = true,
        highlightDescendants = true,
        highlightSiblings = true,

        searchable = true,
        searchPlaceholder = "Search…",
        searchMinChars = 2,
        getSearchText,
        onSearchSelect,

        miniMap = true,
        miniMapWidth = 220,
        miniMapHeight = 140,
        miniMapPadding = 12,

        fullscreenable = true,

        toolbar = true,
        toolbarActions = [
            "fit",
            "reset",
            "zoom_in",
            "zoom_out",
            "fullscreen",
            "expand_all",
            "collapse_all",
            "toggle_grid",
        ],
        toolbarPosition = "top-left",

        getTone,
        getDates,
        getTags,

        locale = "fr",

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
    const layoutProps = getIntentLayoutProps(resolved, className);
    const surfaceClass = composeIntentClassName(resolved);

    /* --------------------------------------------
       Controlled/uncontrolled: grid toggle
    -------------------------------------------- */

    const showGridControlled = showGridProp !== undefined;
    const [showGridUncontrolled, setShowGridUncontrolled] = React.useState<boolean>(false);
    const showGrid = showGridControlled ? Boolean(showGridProp) : showGridUncontrolled;

    /* --------------------------------------------
       Controlled/uncontrolled: collapse + selection
    -------------------------------------------- */

    const collapsedControlled = collapsedIdsProp !== undefined;
    const [collapsedUncontrolled, setCollapsedUncontrolled] =
        React.useState<string[]>(defaultCollapsedIds);
    const collapsedIds = collapsedControlled ? (collapsedIdsProp ?? []) : collapsedUncontrolled;

    const setCollapsedIds = React.useCallback(
        (next: string[]) => {
            if (!collapsedControlled) setCollapsedUncontrolled(next);
            onCollapsedChange?.(next);
        },
        [collapsedControlled, onCollapsedChange]
    );

    const selectedControlled = selectedIdProp !== undefined;
    const [selectedUncontrolled, setSelectedUncontrolled] = React.useState<string | null>(
        defaultSelectedId
    );
    const selectedId = selectedControlled ? (selectedIdProp ?? null) : selectedUncontrolled;

    const setSelectedId = React.useCallback(
        (next: string | null, node?: T) => {
            if (!selectedControlled) setSelectedUncontrolled(next);
            onSelectionChange?.(next, node);
        },
        [selectedControlled, onSelectionChange]
    );

    const collapsedSet = React.useMemo(() => new Set(collapsedIds.map(toKey)), [collapsedIds]);

    /* --------------------------------------------
       Flatten + layout
    -------------------------------------------- */

    const flatPack = React.useMemo(() => {
        if (!root) return null;
        return flattenTree({ root, getChildren, getId, collapsedSet });
    }, [root, getChildren, getId, collapsedSet]);

    const computedNodes = React.useMemo(() => {
        if (!flatPack) return [] as IntentTreeComputedNode<T>[];

        const { nodes: flat, orderById, childrenById } = flatPack;

        if (layout === "custom" && getNodePosition) {
            return computeCustomLayout({ flat, orderById, childrenById, getNodePosition });
        }

        return computeAutoLayout({
            flat,
            orderById,
            childrenById,
            orientation,
            nodeWidth,
            nodeHeight,
            levelGap,
            siblingGap,
        });
    }, [
        flatPack,
        layout,
        getNodePosition,
        orientation,
        nodeWidth,
        nodeHeight,
        levelGap,
        siblingGap,
    ]);

    const nodeById = React.useMemo(() => {
        const m = new Map<string, IntentTreeComputedNode<T>>();
        for (const n of computedNodes) m.set(n.id, n);
        return m;
    }, [computedNodes]);

    const links = React.useMemo(() => {
        const out: Array<{ source: IntentTreeComputedNode<T>; target: IntentTreeComputedNode<T> }> =
            [];
        for (const n of computedNodes) {
            if (!n.parentId) continue;
            const p = nodeById.get(n.parentId);
            if (!p) continue;
            out.push({ source: p, target: n });
        }
        return out;
    }, [computedNodes, nodeById]);

    /* --------------------------------------------
       Parent/children indexes (for lineage + scope)
    -------------------------------------------- */

    const parentById = React.useMemo(() => {
        const m = new Map<string, string | null>();
        for (const n of computedNodes) m.set(n.id, n.parentId);
        return m;
    }, [computedNodes]);

    const childrenById = React.useMemo(() => {
        const m = new Map<string, string[]>();
        for (const n of computedNodes) m.set(n.id, n.childrenIds ?? []);
        return m;
    }, [computedNodes]);

    function collectAncestors(id: string | null, limitSteps: number): Set<string> {
        const out = new Set<string>();
        if (!id) return out;

        let cur: string | null = id;
        let steps = 0;

        while (cur && steps < limitSteps) {
            const p: string | null = parentById.get(cur) ?? null;
            if (!p) break;

            out.add(p);
            cur = p;
            steps++;
        }

        return out;
    }

    function collectDescendants(id: string | null, limitSteps: number): Set<string> {
        const out = new Set<string>();
        if (!id) return out;

        const stack: Array<{ id: string; depth: number }> = [{ id, depth: 0 }];
        while (stack.length) {
            const cur = stack.pop()!;
            if (cur.depth >= limitSteps) continue;

            const kids = childrenById.get(cur.id) ?? [];
            for (const k of kids) {
                out.add(k);
                stack.push({ id: k, depth: cur.depth + 1 });
            }
        }

        return out;
    }

    function collectSiblings(id: string | null): Set<string> {
        const out = new Set<string>();
        if (!id) return out;

        const p = parentById.get(id) ?? null;
        if (!p) return out;

        const sibs = childrenById.get(p) ?? [];
        for (const s of sibs) if (s !== id) out.add(s);

        return out;
    }

    function collectSiblingsChildren(siblings: Set<string>): Set<string> {
        const out = new Set<string>();
        for (const s of siblings) {
            const kids = childrenById.get(s) ?? [];
            for (const k of kids) out.add(k);
        }
        return out;
    }

    /* --------------------------------------------
       Viewport: controlled/uncontrolled + svg size
    -------------------------------------------- */

    const viewportControlled = viewportProp !== undefined;
    const [viewportUncontrolled, setViewportUncontrolled] =
        React.useState<IntentTreeViewport>(defaultViewport);
    const viewport = viewportControlled ? (viewportProp ?? defaultViewport) : viewportUncontrolled;

    const setViewport = React.useCallback(
        (next: IntentTreeViewport) => {
            const clampedVp = {
                x: next.x,
                y: next.y,
                k: clamp(next.k, minZoom, maxZoom),
            };

            if (!viewportControlled) setViewportUncontrolled(clampedVp);
            onViewportChange?.(clampedVp);
        },
        [viewportControlled, onViewportChange, minZoom, maxZoom]
    );

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const svgRef = React.useRef<SVGSVGElement | null>(null);

    const [svgSize, setSvgSize] = React.useState<{ w: number; h: number }>({ w: 1, h: 1 });

    React.useLayoutEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const update = () => {
            const rect = svg.getBoundingClientRect();
            setSvgSize({ w: rect.width || 1, h: rect.height || 1 });
        };

        update();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", update);
            return () => window.removeEventListener("resize", update);
        }

        const ro = new ResizeObserver(() => update());
        ro.observe(svg);

        return () => ro.disconnect();
    }, []);

    /* --------------------------------------------
       Auto-fit + center helper
    -------------------------------------------- */

    const fitToContent = React.useCallback(() => {
        const w = svgSize.w || 1;
        const h = svgSize.h || 1;

        const b = boundsOf(
            computedNodes.map((n) => ({ x: n.x, y: n.y })),
            padding
        );

        const contentW = Math.max(1, b.maxX - b.minX + nodeWidth);
        const contentH = Math.max(1, b.maxY - b.minY + nodeHeight);

        const k = clamp(Math.min(w / contentW, h / contentH), minZoom, maxZoom);

        const cx = (b.minX + b.maxX + nodeWidth) / 2;
        const cy = (b.minY + b.maxY + nodeHeight) / 2;

        const x = w / 2 - cx * k;
        const y = h / 2 - cy * k;

        setViewport({ x, y, k });
    }, [
        computedNodes,
        padding,
        nodeWidth,
        nodeHeight,
        minZoom,
        maxZoom,
        setViewport,
        svgSize.w,
        svgSize.h,
    ]);

    const centerOnNode = React.useCallback(
        (id: string, kOverride?: number) => {
            const node = nodeById.get(id);
            if (!node) return;

            const w = svgSize.w || 1;
            const h = svgSize.h || 1;

            const k = clamp(kOverride ?? viewport.k, minZoom, maxZoom);

            const cx = node.x + nodeWidth / 2;
            const cy = node.y + nodeHeight / 2;

            const x = w / 2 - cx * k;
            const y = h / 2 - cy * k;

            setViewport({ x, y, k });
        },
        [
            nodeById,
            nodeWidth,
            nodeHeight,
            svgSize.w,
            svgSize.h,
            viewport.k,
            minZoom,
            maxZoom,
            setViewport,
        ]
    );

    React.useEffect(() => {
        if (!autoFit) return;
        if (!root) return;
        fitToContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFit, root, collapsedIds.join("|")]);

    /* --------------------------------------------
       Fullscreen
    -------------------------------------------- */

    const [isFullscreen, setIsFullscreen] = React.useState(false);

    async function toggleFullscreen() {
        if (!fullscreenable || disabled) return;
        const el = rootRef.current;
        if (!el) return;

        try {
            if (!document.fullscreenElement) {
                await el.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            // ignore
        }
    }

    React.useEffect(() => {
        function onFs() {
            setIsFullscreen(Boolean(document.fullscreenElement));
        }
        document.addEventListener("fullscreenchange", onFs);
        return () => document.removeEventListener("fullscreenchange", onFs);
    }, []);

    /* --------------------------------------------
       Pan / Zoom interactions
    -------------------------------------------- */

    const dragRef = React.useRef<{
        active: boolean;
        startX: number;
        startY: number;
        baseX: number;
        baseY: number;
        pointerId: number | null;
    }>({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0, pointerId: null });

    const onWheel = React.useMemo(
        () =>
            rafThrottle((e: WheelEvent) => {
                if (!zoomable || disabled) return;
                e.preventDefault();

                const svg = svgRef.current;
                if (!svg) return;

                const rect = svg.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;

                const delta = -e.deltaY;
                const factor = delta > 0 ? 1.08 : 0.92;

                const nextK = clamp(viewport.k * factor, minZoom, maxZoom);

                const wx = (mx - viewport.x) / viewport.k;
                const wy = (my - viewport.y) / viewport.k;

                const nextX = mx - wx * nextK;
                const nextY = my - wy * nextK;

                setViewport({ x: nextX, y: nextY, k: nextK });
            }),
        [zoomable, disabled, viewport, minZoom, maxZoom, setViewport]
    );

    React.useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const handler = (e: WheelEvent) => onWheel(e);
        svg.addEventListener("wheel", handler, { passive: false });

        return () => svg.removeEventListener("wheel", handler as any);
    }, [onWheel]);

    function onPointerDown(e: React.PointerEvent) {
        if (!pannable || disabled) return;

        const target = e.target as HTMLElement;
        if (target?.closest?.(".intent-tree-node")) return;
        if (target?.closest?.(".intent-tree-toolbar")) return;
        if (target?.closest?.(".intent-tree-minimap")) return;

        dragRef.current.active = true;
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
        dragRef.current.baseX = viewport.x;
        dragRef.current.baseY = viewport.y;
        dragRef.current.pointerId = e.pointerId;

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: React.PointerEvent) {
        if (!dragRef.current.active) return;
        if (disabled) return;

        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        setViewport({
            x: dragRef.current.baseX + dx,
            y: dragRef.current.baseY + dy,
            k: viewport.k,
        });
    }

    function onPointerUp(e: React.PointerEvent) {
        if (!dragRef.current.active) return;
        dragRef.current.active = false;

        try {
            (e.currentTarget as HTMLElement).releasePointerCapture(
                dragRef.current.pointerId ?? e.pointerId
            );
        } catch {
            // ignore
        }
        dragRef.current.pointerId = null;
    }

    /* --------------------------------------------
       Collapse + selection actions
    -------------------------------------------- */

    const toggleCollapse = React.useCallback(
        (id: string) => {
            if (!collapsible || disabled) return;
            const key = toKey(id);
            const next = new Set(collapsedIds.map(toKey));
            if (next.has(key)) next.delete(key);
            else next.add(key);
            setCollapsedIds(Array.from(next));
        },
        [collapsible, disabled, collapsedIds, setCollapsedIds]
    );

    const selectNode = React.useCallback(
        (id: string, node: T) => {
            if (!selectable || disabled) return;
            const key = toKey(id);
            const next = selectedId === key ? null : key;
            setSelectedId(next, next ? node : undefined);
        },
        [selectable, disabled, selectedId, setSelectedId]
    );

    /* --------------------------------------------
       Scope + lineage sets
    -------------------------------------------- */

    const selectedKey = selectedId ? toKey(selectedId) : null;

    const ancestorsSet = React.useMemo(
        () => (selectedKey ? collectAncestors(selectedKey, scopeDepth) : new Set<string>()),
        [selectedKey, scopeDepth, parentById]
    );

    const descendantsSet = React.useMemo(
        () => (selectedKey ? collectDescendants(selectedKey, scopeDepth) : new Set<string>()),
        [selectedKey, scopeDepth, childrenById]
    );

    const siblingsSet = React.useMemo(
        () => (selectedKey ? collectSiblings(selectedKey) : new Set<string>()),
        [selectedKey, parentById, childrenById]
    );

    const siblingsChildrenSet = React.useMemo(
        () => collectSiblingsChildren(siblingsSet),
        [siblingsSet, childrenById]
    );

    const scopeSet = React.useMemo(() => {
        if (!selectedKey) return null;
        if (scopeMode === "full") return null;

        const out = new Set<string>();
        out.add(selectedKey);

        if (scopeMode === "asc") {
            for (const a of ancestorsSet) out.add(a);
            return out;
        }

        if (scopeMode === "desc") {
            for (const d of descendantsSet) out.add(d);
            return out;
        }

        // siblings (B): parent + siblings + children of siblings + selected
        if (scopeMode === "siblings") {
            const p = parentById.get(selectedKey) ?? null;
            if (p) out.add(p);

            for (const s of siblingsSet) out.add(s);
            for (const c of siblingsChildrenSet) out.add(c);

            return out;
        }

        return null;
    }, [
        scopeMode,
        selectedKey,
        ancestorsSet,
        descendantsSet,
        siblingsSet,
        siblingsChildrenSet,
        parentById,
    ]);

    const scopedNodes = React.useMemo(() => {
        if (!scopeSet) return computedNodes;
        return computedNodes.filter((n) => scopeSet.has(n.id));
    }, [computedNodes, scopeSet]);

    const scopedNodeById = React.useMemo(() => {
        const m = new Map<string, IntentTreeComputedNode<T>>();
        for (const n of scopedNodes) m.set(n.id, n);
        return m;
    }, [scopedNodes]);

    const scopedLinks = React.useMemo(() => {
        if (!scopeSet) return links;
        return links.filter((l) => scopeSet.has(l.source.id) && scopeSet.has(l.target.id));
    }, [links, scopeSet]);

    function classifyNode(id: string) {
        if (!selectedKey || !lineageHighlight) {
            return { isAncestor: false, isDescendant: false, isSibling: false, isDimmed: false };
        }

        const isAncestor = highlightAncestors && ancestorsSet.has(id);
        const isDescendant = highlightDescendants && descendantsSet.has(id);
        const isSibling = highlightSiblings && siblingsSet.has(id);

        const isCore = id === selectedKey;
        const isRelated = isCore || isAncestor || isDescendant || isSibling;

        return {
            isAncestor,
            isDescendant,
            isSibling,
            isDimmed: !isRelated,
        };
    }

    function isNodeRelated(id: string) {
        if (!selectedKey || !lineageHighlight) return true;
        if (id === selectedKey) return true;
        if (highlightAncestors && ancestorsSet.has(id)) return true;
        if (highlightDescendants && descendantsSet.has(id)) return true;
        if (highlightSiblings && siblingsSet.has(id)) return true;
        return false;
    }

    /* --------------------------------------------
       Search (typeahead)
    -------------------------------------------- */

    const [query, setQuery] = React.useState("");
    const [searchOpen, setSearchOpen] = React.useState(false);

    function defaultSearchText(node: T): string {
        const parts: string[] = [];

        const label = getLabel ? safeString(getLabel(node)) : "";
        const sub = getSubtitle ? safeString(getSubtitle(node)) : "";
        if (label) parts.push(label);
        if (sub) parts.push(sub);

        const tags = getTags?.(node) ?? null;
        if (tags?.length) {
            for (const t of tags) {
                const def = INTENT_TREE_TAGS[t];
                if (def) parts.push(def.label[locale]);
            }
        }

        const d = getDates?.(node) ?? null;
        if (d?.born) parts.push(d.born);
        if (d?.died) parts.push(d.died);

        return parts.join(" ").toLowerCase();
    }

    const searchIndex = React.useMemo(() => {
        return computedNodes.map((n) => ({
            id: n.id,
            node: n.data,
            text: (getSearchText ? getSearchText(n.data) : defaultSearchText(n.data)).toLowerCase(),
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedNodes, getSearchText, getLabel, getSubtitle, getTags, getDates, locale]);

    const results = React.useMemo(() => {
        if (!searchable) return [];
        const q = query.trim().toLowerCase();
        if (q.length < searchMinChars) return [];
        return searchIndex.filter((r) => r.text.includes(q)).slice(0, 12);
    }, [query, searchable, searchMinChars, searchIndex]);

    function commitSearch(id: string) {
        const n = nodeById.get(id);
        if (!n) return;

        setSelectedId(id, n.data);
        centerOnNode(id, Math.max(viewport.k, 1));
        onSearchSelect?.(id, n.data);

        setSearchOpen(false);
    }

    React.useEffect(() => {
        if (!searchOpen) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setSearchOpen(false);
        }

        function onDocDown(e: MouseEvent) {
            const t = e.target as HTMLElement | null;
            if (!t) return;
            if (t.closest?.(".intent-tree-search")) return;
            setSearchOpen(false);
        }

        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("mousedown", onDocDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("mousedown", onDocDown);
        };
    }, [searchOpen]);

    /* --------------------------------------------
       Per-node intent override (nodeIntent + getTone)
    -------------------------------------------- */

    function resolveNodeIntent(node: T): IntentInput | null {
        const base = (() => {
            if (!nodeIntent) return null;
            if (typeof nodeIntent === "function") return nodeIntent(node) ?? null;
            return nodeIntent ?? null;
        })();

        const t = getTone?.(node);
        if (!t) return base;

        return {
            ...(base ?? {}),
            intent: base?.intent ?? "toned",
            tone: t as any,
        };
    }

    /* --------------------------------------------
       Default node renderer (tone/dates/tags)
    -------------------------------------------- */

    function renderDefaultNode(ctx: IntentTreeNodeRenderContext<T>) {
        const node = ctx.node.data;

        const label = getLabel ? getLabel(node) : ctx.node.id;
        const subtitle = getSubtitle ? getSubtitle(node) : null;

        const dates = getDates?.(node) ?? null;
        const tags = getTags?.(node) ?? [];

        const showCaret = collapsible && ctx.hasChildren;

        return (
            <div className="intent-tree-nodeCard">
                <div className="intent-tree-nodeTop">
                    <div className="intent-tree-nodeTitleWrap">
                        <div className="intent-tree-nodeLabel">{label}</div>
                        {subtitle ? (
                            <div className="intent-tree-nodeSubtitle">{subtitle}</div>
                        ) : null}
                    </div>

                    {showCaret ? (
                        <button
                            type="button"
                            className="intent-tree-nodeToggle"
                            onClick={(e) => {
                                e.stopPropagation();
                                ctx.toggleCollapse();
                            }}
                            aria-label={ctx.isCollapsed ? "Expand" : "Collapse"}
                        >
                            {ctx.isCollapsed ? "▸" : "▾"}
                        </button>
                    ) : (
                        <span className="intent-tree-nodeTogglePlaceholder" aria-hidden />
                    )}
                </div>

                <div className="intent-tree-nodeBottom">
                    {dates?.born || dates?.died ? (
                        <div className="intent-tree-nodeDates">
                            <span className="intent-tree-nodeDate">
                                {dates?.born ? `🍼 ${dates.born}` : ""}
                            </span>
                            <span className="intent-tree-nodeDate">
                                {dates?.died ? `⚰️ ${dates.died}` : ""}
                            </span>
                        </div>
                    ) : (
                        <div className="intent-tree-nodeDatesPlaceholder" aria-hidden />
                    )}

                    {tags.length ? (
                        <div className="intent-tree-nodeTags">
                            {tags.slice(0, 3).map((k) => {
                                const def = INTENT_TREE_TAGS[k];
                                if (!def) return null;
                                const text = def.label[locale];
                                return (
                                    <span key={k} className="intent-tree-nodeTag" title={text}>
                                        <span className="intent-tree-nodeTagEmoji" aria-hidden>
                                            {def.emoji}
                                        </span>
                                        <span className="intent-tree-nodeTagLabel">{text}</span>
                                    </span>
                                );
                            })}
                            {tags.length > 3 ? (
                                <span className="intent-tree-nodeTagMore">+{tags.length - 3}</span>
                            ) : null}
                        </div>
                    ) : (
                        <div className="intent-tree-nodeTagsPlaceholder" aria-hidden />
                    )}
                </div>
            </div>
        );
    }

    /* --------------------------------------------
       Empty
    -------------------------------------------- */

    const rootCls = cn(
        "intent-tree",
        surfaceClass,
        zoomable && "is-zoomable",
        pannable && "is-pannable",
        collapsible && "is-collapsible",
        selectable && "is-selectable",
        orientation === "horizontal" ? "is-horizontal" : "is-vertical",
        isFullscreen && "is-fullscreen"
    );

    if (!root || computedNodes.length === 0) {
        return (
            <div
                {...divProps}
                style={layoutProps.style}
                className={cn(layoutProps.className, rootCls, className)}
                data-intent={resolved.intent}
                data-variant={resolved.variant}
                data-intensity={resolved.intensity}
                data-mode={resolved.mode}
            >
                <div className="intent-tree-empty">{emptyLabel}</div>
            </div>
        );
    }

    /* --------------------------------------------
       Grid (optional)
    -------------------------------------------- */

    const grid = React.useMemo(() => {
        if (!showGrid) return null;

        const span = 4000;
        const step = Math.max(8, gridSize);

        const lines: React.ReactNode[] = [];
        for (let x = -span; x <= span; x += step) {
            lines.push(<line key={`vx-${x}`} x1={x} y1={-span} x2={x} y2={span} />);
        }
        for (let y = -span; y <= span; y += step) {
            lines.push(<line key={`hy-${y}`} x1={-span} y1={y} x2={span} y2={y} />);
        }

        return <g className="intent-tree-grid">{lines}</g>;
    }, [showGrid, gridSize]);

    /* --------------------------------------------
       Mini-map math
    -------------------------------------------- */

    const contentBounds = React.useMemo(() => {
        const b = boundsOf(
            computedNodes.map((n) => ({ x: n.x, y: n.y })),
            padding
        );
        return b;
    }, [computedNodes, padding]);

    const mini = React.useMemo(() => {
        const w = miniMapWidth;
        const h = miniMapHeight;

        const contentW = Math.max(1, contentBounds.maxX - contentBounds.minX + nodeWidth);
        const contentH = Math.max(1, contentBounds.maxY - contentBounds.minY + nodeHeight);

        const k = Math.min(
            (w - miniMapPadding * 2) / contentW,
            (h - miniMapPadding * 2) / contentH
        );

        const tx = miniMapPadding - contentBounds.minX * k;
        const ty = miniMapPadding - contentBounds.minY * k;

        return { w, h, k, tx, ty };
    }, [miniMapWidth, miniMapHeight, miniMapPadding, contentBounds, nodeWidth, nodeHeight]);

    const cameraRect = React.useMemo(() => {
        const w = svgSize.w || 1;
        const h = svgSize.h || 1;

        const worldLeft = (0 - viewport.x) / viewport.k;
        const worldTop = (0 - viewport.y) / viewport.k;
        const worldRight = (w - viewport.x) / viewport.k;
        const worldBottom = (h - viewport.y) / viewport.k;

        const x = worldLeft * mini.k + mini.tx;
        const y = worldTop * mini.k + mini.ty;
        const cw = (worldRight - worldLeft) * mini.k;
        const ch = (worldBottom - worldTop) * mini.k;

        return { x, y, w: cw, h: ch };
    }, [svgSize.w, svgSize.h, viewport.x, viewport.y, viewport.k, mini.k, mini.tx, mini.ty]);

    function onMiniMapClick(e: React.MouseEvent<SVGSVGElement>) {
        if (disabled) return;

        const bb = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const mx = e.clientX - bb.left;
        const my = e.clientY - bb.top;

        const wx = (mx - mini.tx) / mini.k;
        const wy = (my - mini.ty) / mini.k;

        const W = svgSize.w || 1;
        const H = svgSize.h || 1;

        const x = W / 2 - wx * viewport.k;
        const y = H / 2 - wy * viewport.k;

        setViewport({ x, y, k: viewport.k });
    }

    /* --------------------------------------------
       Toolbar actions
    -------------------------------------------- */

    function doZoomIn() {
        setViewport({
            x: viewport.x,
            y: viewport.y,
            k: clamp(viewport.k * 1.12, minZoom, maxZoom),
        });
    }

    function doZoomOut() {
        setViewport({
            x: viewport.x,
            y: viewport.y,
            k: clamp(viewport.k / 1.12, minZoom, maxZoom),
        });
    }

    function collapseAll() {
        const ids = computedNodes.filter((n) => (n.childrenIds?.length ?? 0) > 0).map((n) => n.id);
        setCollapsedIds(ids);
    }

    function expandAll() {
        setCollapsedIds([]);
    }

    function toggleGrid() {
        if (showGridControlled) return;
        setShowGridUncontrolled((v) => !v);
    }

    function ToolbarButton(props: {
        children: React.ReactNode;
        onClick: () => void;
        disabled?: boolean;
        title?: string;
        kind?: string;
    }) {
        return (
            <button
                type="button"
                className={cn("intent-tree-toolbarBtn", props.kind ? `is-${props.kind}` : "")}
                onClick={props.onClick}
                disabled={props.disabled}
                title={props.title}
            >
                {props.children}
            </button>
        );
    }

    /* --------------------------------------------
       Render
    -------------------------------------------- */

    return (
        <div
            {...divProps}
            ref={rootRef}
            style={layoutProps.style}
            className={cn(layoutProps.className, rootCls, className)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {toolbar ? (
                <div className={cn("intent-tree-toolbar", `is-pos-${toolbarPosition}`)}>
                    {toolbarActions.includes("fit") ? (
                        <ToolbarButton
                            onClick={() => fitToContent()}
                            disabled={disabled}
                            title="Fit"
                        >
                            Fit
                        </ToolbarButton>
                    ) : null}

                    {toolbarActions.includes("reset") ? (
                        <ToolbarButton
                            onClick={() => setViewport({ x: 0, y: 0, k: 1 })}
                            disabled={disabled}
                            title="Reset"
                        >
                            Reset
                        </ToolbarButton>
                    ) : null}

                    {toolbarActions.includes("zoom_in") ? (
                        <ToolbarButton
                            onClick={() => doZoomIn()}
                            disabled={disabled || !zoomable}
                            title="Zoom in"
                        >
                            +
                        </ToolbarButton>
                    ) : null}

                    {toolbarActions.includes("zoom_out") ? (
                        <ToolbarButton
                            onClick={() => doZoomOut()}
                            disabled={disabled || !zoomable}
                            title="Zoom out"
                        >
                            −
                        </ToolbarButton>
                    ) : null}

                    {toolbarActions.includes("toggle_grid") ? (
                        <ToolbarButton
                            onClick={() => toggleGrid()}
                            disabled={disabled || showGridControlled}
                            title="Grid"
                        >
                            Grid
                        </ToolbarButton>
                    ) : null}

                    {toolbarActions.includes("expand_all") ? (
                        <ToolbarButton
                            onClick={() => expandAll()}
                            disabled={disabled || !collapsible}
                            title="Expand all"
                        >
                            Expand
                        </ToolbarButton>
                    ) : null}

                    {toolbarActions.includes("collapse_all") ? (
                        <ToolbarButton
                            onClick={() => collapseAll()}
                            disabled={disabled || !collapsible}
                            title="Collapse all"
                        >
                            Collapse
                        </ToolbarButton>
                    ) : null}

                    {toolbarActions.includes("fullscreen") ? (
                        <ToolbarButton
                            onClick={() => toggleFullscreen()}
                            disabled={disabled}
                            title="Fullscreen"
                        >
                            {isFullscreen ? "⤢" : "⤢"}
                        </ToolbarButton>
                    ) : null}

                    {searchable ? (
                        <div className={cn("intent-tree-search", searchOpen && "is-open")}>
                            <input
                                className="intent-tree-searchInput"
                                value={query}
                                placeholder={searchPlaceholder}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSearchOpen(true);
                                }}
                                onFocus={() => setSearchOpen(true)}
                            />

                            {searchOpen && results.length ? (
                                <div className="intent-tree-searchMenu" role="listbox">
                                    {results.map((r) => (
                                        <button
                                            type="button"
                                            key={r.id}
                                            className="intent-tree-searchItem"
                                            onClick={() => commitSearch(r.id)}
                                        >
                                            <span className="intent-tree-searchItemLabel">
                                                {getLabel ? safeString(getLabel(r.node)) : r.id}
                                            </span>
                                            {getSubtitle ? (
                                                <span className="intent-tree-searchItemSub">
                                                    {safeString(getSubtitle(r.node))}
                                                </span>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className="intent-tree-toolbarMeta" aria-hidden>
                        k={viewport.k.toFixed(2)}
                    </div>
                </div>
            ) : null}

            {miniMap ? (
                <div className="intent-tree-minimap">
                    <svg
                        className="intent-tree-minimapSvg"
                        width={mini.w}
                        height={mini.h}
                        role="img"
                        aria-label="Mini map"
                        onClick={onMiniMapClick}
                    >
                        <g>
                            {links.map(({ source, target }) => {
                                const sx = (source.x + nodeWidth / 2) * mini.k + mini.tx;
                                const sy = (source.y + nodeHeight / 2) * mini.k + mini.ty;
                                const tx = (target.x + nodeWidth / 2) * mini.k + mini.tx;
                                const ty = (target.y + nodeHeight / 2) * mini.k + mini.ty;

                                const dim = !isNodeRelated(source.id) && !isNodeRelated(target.id);

                                return (
                                    <line
                                        key={`m_${source.id}_${target.id}`}
                                        className={cn(
                                            "intent-tree-minimapLink",
                                            dim && "is-dimmed"
                                        )}
                                        x1={sx}
                                        y1={sy}
                                        x2={tx}
                                        y2={ty}
                                    />
                                );
                            })}

                            {computedNodes.map((n) => {
                                const dim = !isNodeRelated(n.id);
                                const sel = selectedKey === n.id;

                                return (
                                    <rect
                                        key={`mn_${n.id}`}
                                        className={cn(
                                            "intent-tree-minimapNode",
                                            sel && "is-selected",
                                            dim && "is-dimmed"
                                        )}
                                        x={n.x * mini.k + mini.tx}
                                        y={n.y * mini.k + mini.ty}
                                        width={Math.max(2, nodeWidth * mini.k)}
                                        height={Math.max(2, nodeHeight * mini.k)}
                                        rx={3}
                                        ry={3}
                                    />
                                );
                            })}

                            <rect
                                className="intent-tree-minimapCamera"
                                x={cameraRect.x}
                                y={cameraRect.y}
                                width={cameraRect.w}
                                height={cameraRect.h}
                                rx={6}
                                ry={6}
                            />
                        </g>
                    </svg>
                </div>
            ) : null}

            <svg
                ref={svgRef}
                className="intent-tree-svg"
                width="100%"
                height="100%"
                role="img"
                aria-label="Tree"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                <g
                    className="intent-tree-stage"
                    transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.k})`}
                >
                    {grid}

                    <g className="intent-tree-links">
                        {scopedLinks.map(({ source, target }) => {
                            const sx = source.x + nodeWidth / 2;
                            const sy = source.y + nodeHeight;
                            const tx = target.x + nodeWidth / 2;
                            const ty = target.y;

                            const a =
                                orientation === "vertical"
                                    ? { sx, sy, tx, ty }
                                    : {
                                          sx: source.x + nodeWidth,
                                          sy: source.y + nodeHeight / 2,
                                          tx: target.x,
                                          ty: target.y + nodeHeight / 2,
                                      };

                            const d = linkPath({ ...a, style: linkStyle });

                            const isSelected =
                                selectedKey !== null &&
                                (selectedKey === source.id || selectedKey === target.id);

                            const dim = !isNodeRelated(source.id) && !isNodeRelated(target.id);

                            if (renderLink) {
                                return (
                                    <React.Fragment key={`${source.id}__${target.id}`}>
                                        {renderLink({
                                            source,
                                            target,
                                            pathD: d,
                                            selected: isSelected,
                                        })}
                                    </React.Fragment>
                                );
                            }

                            return (
                                <path
                                    key={`${source.id}__${target.id}`}
                                    className={cn(
                                        "intent-tree-link",
                                        isSelected && "is-selected",
                                        dim && "is-dimmed"
                                    )}
                                    d={d}
                                />
                            );
                        })}
                    </g>

                    <g className="intent-tree-nodes">
                        {scopedNodes.map((n, index) => {
                            const key = n.id;
                            const isCollapsed = collapsedSet.has(key);
                            const hasChildren = (n.childrenIds?.length ?? 0) > 0;
                            const isSelected = selectedKey === key;

                            const lineage = classifyNode(key);

                            const perNodeIntent = resolveNodeIntent(n.data);
                            const nodeResolved = perNodeIntent
                                ? resolveIntent({ ...intentInput, ...perNodeIntent })
                                : null;

                            const ctx: IntentTreeNodeRenderContext<T> = {
                                node: n,
                                depth: n.depth,
                                index,
                                isSelected,
                                isCollapsed,
                                hasChildren,
                                orientation,
                                toggleCollapse: () => toggleCollapse(key),
                                select: () => selectNode(key, n.data),
                            };

                            return (
                                <g
                                    key={key}
                                    className={cn(
                                        "intent-tree-node",
                                        isSelected && "is-selected",
                                        isCollapsed && "is-collapsed",
                                        lineage.isAncestor && "is-ancestor",
                                        lineage.isDescendant && "is-descendant",
                                        lineage.isSibling && "is-sibling",
                                        lineage.isDimmed && "is-dimmed",
                                        nodeResolved ? "has-node-intent" : ""
                                    )}
                                    transform={`translate(${n.x} ${n.y})`}
                                    data-node-id={key}
                                    data-node-depth={n.depth}
                                    data-node-selected={isSelected ? "true" : "false"}
                                    data-node-collapsed={isCollapsed ? "true" : "false"}
                                    data-node-intent={nodeResolved?.intent ?? undefined}
                                    style={nodeResolved?.style as any}
                                    onClick={() => (selectable ? ctx.select() : undefined)}
                                >
                                    <rect
                                        className="intent-tree-nodeHit"
                                        x={0}
                                        y={0}
                                        width={nodeWidth}
                                        height={nodeHeight}
                                        rx={18}
                                        ry={18}
                                    />

                                    <foreignObject
                                        x={0}
                                        y={0}
                                        width={nodeWidth}
                                        height={nodeHeight}
                                        requiredExtensions="http://www.w3.org/1999/xhtml"
                                    >
                                        <div
                                            className="intent-tree-nodeFo"
                                            onDoubleClick={(e) => {
                                                if (!collapsible) return;
                                                e.stopPropagation();
                                                if (hasChildren) ctx.toggleCollapse();
                                            }}
                                        >
                                            {renderNode ? renderNode(ctx) : renderDefaultNode(ctx)}
                                        </div>
                                    </foreignObject>

                                    {collapsible && hasChildren ? (
                                        <circle
                                            className="intent-tree-nodeBadge"
                                            cx={nodeWidth - 14}
                                            cy={14}
                                            r={6}
                                        />
                                    ) : null}
                                </g>
                            );
                        })}
                    </g>
                </g>
            </svg>
        </div>
    );
}
