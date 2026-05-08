"use client";

// src/components/intent/IntentGenealogyHierarchy.tsx
// IntentGenealogyHierarchy
// - Intent-first genealogy hierarchy (SVG)
// - Purpose-built for family trees (Space Memoria)
// - Visual target: rounded pastel cards + crisp orthogonal connectors (like the reference image)
// - Couples rendered side-by-side with a connector dot
// - Parent(s) -> children rendered with a shared trunk + sibling bar
// - No dynamic Tailwind classes: stable hooks only

import * as React from "react";

import { resolveIntent, getIntentLayoutProps, composeIntentClassName } from "CORE";
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

function toKey(v: unknown): string {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "bigint") return String(v);
    return String(v ?? "");
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

function isDefined<T>(v: T | null | undefined): v is T {
    return v !== null && v !== undefined;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentGenealogyViewport = {
    x: number;
    y: number;
    k: number;
};

export type IntentGenealogyNodeStyle = {
    fill?: string;
    stroke?: string;
    text?: string;
};

export type IntentGenealogyComputedNode<T> = {
    id: string;
    data: T;

    gen: number; // 0 = root generation row; negative = ancestors; positive = descendants

    x: number;
    y: number;

    // Relationships
    parentIds: string[];
    childIds: string[];
    spouseId: string | null;

    // Render grouping
    unitId: string; // couple unit id or self id
    unitIndex: number;
};

export type IntentGenealogyLink =
    | { kind: "spouse"; a: string; b: string }
    | {
          kind: "parent_child_group";
          parentUnitId: string;
          parentAnchor: { x: number; y: number };
          childIds: string[];
          childAnchors: Array<{ id: string; x: number; y: number }>;
      };

export type IntentGenealogyNodeRenderContext<T> = {
    node: IntentGenealogyComputedNode<T>;
    isSelected: boolean;
    select: () => void;
};

export type IntentGenealogyProps<T> = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /** Graph */
        root: T;
        getId: (node: T) => string | number;
        getParents?: (node: T) => Array<T | null | undefined> | null | undefined;
        getChildren?: (node: T) => Array<T | null | undefined> | null | undefined;

        /**
         * Couples.
         * If you don’t have explicit spouses, omit this and the component will still work.
         * - Should return partners for a node (typically 0..1).
         * - If multiple, first one is used for layout pairing.
         */
        getSpouses?: (node: T) => Array<T | null | undefined> | null | undefined;

        /** Labels */
        getLabel: (node: T) => React.ReactNode;
        getSubtitle?: (node: T) => React.ReactNode;
        getMeta?: (node: T) => React.ReactNode; // small right corner (like “id”)

        /** Styling per person (optional) */
        getNodeStyle?: (node: T) => IntentGenealogyNodeStyle | null | undefined;

        /** Scope */
        maxAncestors?: number; // default 3
        maxDescendants?: number; // default 3

        /** Layout */
        nodeWidth?: number; // default 170
        nodeHeight?: number; // default 52
        spouseGap?: number; // default 18 (gap inside a couple)
        unitGap?: number; // default 36 (gap between couple-units in a row)
        rowGap?: number; // default 64
        padding?: number; // default 36

        /** Connector geometry */
        trunkGap?: number; // default 18 (distance from parent bottom to sibling bar)
        childStem?: number; // default 14 (distance from sibling bar to child top)

        /** Viewport */
        zoomable?: boolean; // default true
        pannable?: boolean; // default true
        minZoom?: number; // default 0.4
        maxZoom?: number; // default 2.5
        viewport?: IntentGenealogyViewport; // controlled
        defaultViewport?: IntentGenealogyViewport; // uncontrolled
        onViewportChange?: (vp: IntentGenealogyViewport) => void;
        autoFit?: boolean; // default true

        /** Selection */
        selectable?: boolean; // default true
        selectedId?: string | null; // controlled
        defaultSelectedId?: string | null; // uncontrolled
        onSelectionChange?: (id: string | null, node?: T) => void;

        /** Rendering */
        renderNode?: (ctx: IntentGenealogyNodeRenderContext<T>) => React.ReactNode;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_GENEALOGY_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "root",
        description: { fr: "Personne racine (focus).", en: "Root person (focus)." },
        type: "T",
        required: true,
        fromSystem: false,
    },
    {
        name: "getId",
        description: { fr: "Id stable.", en: "Stable id." },
        type: "(node:T)=>string|number",
        required: true,
        fromSystem: false,
    },
    {
        name: "getParents / getChildren",
        description: { fr: "Accès parents/enfants.", en: "Parents/children accessors." },
        type: "(node:T)=>T[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "getSpouses",
        description: { fr: "Accès conjoint(s) (optionnel).", en: "Spouses accessor (optional)." },
        type: "(node:T)=>T[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "getLabel / getSubtitle / getMeta",
        description: { fr: "Texte carte.", en: "Card text." },
        type: "(node:T)=>ReactNode",
        required: true,
        fromSystem: false,
    },
    {
        name: "maxAncestors / maxDescendants",
        description: { fr: "Profondeur scope.", en: "Scope depth." },
        type: "number / number",
        required: false,
        default: "3 / 3",
        fromSystem: false,
    },
    {
        name: "nodeWidth / nodeHeight / spouseGap / unitGap / rowGap",
        description: { fr: "Géométrie layout.", en: "Layout geometry." },
        type: "number",
        required: false,
        default: "170 / 52 / 18 / 36 / 64",
        fromSystem: false,
    },
    {
        name: "zoomable / pannable / viewport",
        description: { fr: "Pan/zoom.", en: "Pan/zoom." },
        type: "boolean / boolean / viewport",
        required: false,
        default: "true / true / {x:0,y:0,k:1}",
        fromSystem: false,
    },
];

export const IntentGenealogyHierarchyPropsTable: DocsPropRow[] = [
    ...INTENT_GENEALOGY_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentGenealogyHierarchyIdentity: ComponentIdentity = {
    name: "IntentGenealogyHierarchy",
    emoji: "🧬",
    kind: "genealogy",
    description: {
        fr: "Arbre généalogique intent-first (SVG) avec couples, trunk + barre de fratrie, pan/zoom.",
        en: "Intent-first genealogy tree (SVG) with couples, trunk + sibling bar, pan/zoom.",
    },
    since: "0.2.10",
    docs: { route: "/playground/components/intent-genealogy-hierarchy" },
    anatomy: {
        root: "<div>",
        svg: "svg.intent-genealogy-svg",
        stage: "g.intent-genealogy-stage",
        links: "g.intent-genealogy-links",
        nodes: "g.intent-genealogy-nodes",
        node: "g.intent-genealogy-node",
        card: ".intent-genealogy-card",
        spouseLink: "path.intent-genealogy-spouse",
        familyLink: "path.intent-genealogy-family",
        dot: "circle.intent-genealogy-dot",
    },
    classHooks: [
        "intent-genealogy",
        "intent-genealogy-svg",
        "intent-genealogy-stage",
        "intent-genealogy-links",
        "intent-genealogy-nodes",
        "intent-genealogy-node",
        "intent-genealogy-card",
        "intent-genealogy-spouse",
        "intent-genealogy-family",
        "intent-genealogy-dot",
        "is-zoomable",
        "is-pannable",
        "is-selected",
    ],
};

/* ============================================================================
   🧠 GRAPH BUILD (root-centered scope)
============================================================================ */

type RawNode<T> = {
    id: string;
    data: T;
    gen: number;
};

type GraphPack<T> = {
    nodesById: Map<string, RawNode<T>>;
    parentsById: Map<string, string[]>;
    childrenById: Map<string, string[]>;
    spouseById: Map<string, string | null>;
    rootId: string;
};

function buildGenealogyGraph<T>(args: {
    root: T;
    getId: (node: T) => string | number;
    getParents?: (node: T) => Array<T | null | undefined> | null | undefined;
    getChildren?: (node: T) => Array<T | null | undefined> | null | undefined;
    getSpouses?: (node: T) => Array<T | null | undefined> | null | undefined;
    maxAncestors: number;
    maxDescendants: number;
}): GraphPack<T> {
    const { root, getId, getParents, getChildren, getSpouses, maxAncestors, maxDescendants } = args;

    const nodesById = new Map<string, RawNode<T>>();
    const parentsById = new Map<string, string[]>();
    const childrenById = new Map<string, string[]>();
    const spouseById = new Map<string, string | null>();

    const rootId = toKey(getId(root));

    function upsert(node: T, id: string, gen: number) {
        const prev = nodesById.get(id);
        if (!prev) {
            nodesById.set(id, { id, data: node, gen });
            return;
        }
        // Keep the closest gen to 0 (more stable when reached multiple ways)
        if (Math.abs(gen) < Math.abs(prev.gen)) nodesById.set(id, { ...prev, gen });
    }

    // BFS both directions with gen tracking
    type Q = { node: T; id: string; gen: number };
    const q: Q[] = [{ node: root, id: rootId, gen: 0 }];

    while (q.length) {
        const cur = q.shift()!;
        upsert(cur.node, cur.id, cur.gen);

        // spouses (no gen change)
        if (getSpouses) {
            const spouses = (getSpouses(cur.node) ?? []).filter(isDefined);
            const s0 = spouses[0] ? toKey(getId(spouses[0])) : null;
            spouseById.set(cur.id, s0);
            if (spouses[0]) {
                const sNode = spouses[0]!;
                const sid = toKey(getId(sNode));
                spouseById.set(sid, cur.id); // best effort symmetry
                upsert(sNode, sid, cur.gen);
            }
        } else if (!spouseById.has(cur.id)) {
            spouseById.set(cur.id, null);
        }

        // parents (gen - 1)
        if (getParents && cur.gen > -maxAncestors) {
            const ps = (getParents(cur.node) ?? []).filter(isDefined);
            const pids = ps.map((p) => toKey(getId(p)));
            parentsById.set(cur.id, pids);

            for (const p of ps) {
                const pid = toKey(getId(p));
                const kids = childrenById.get(pid) ?? [];
                if (!kids.includes(cur.id)) childrenById.set(pid, [...kids, cur.id]);
                q.push({ node: p, id: pid, gen: cur.gen - 1 });
            }
        } else if (!parentsById.has(cur.id)) {
            parentsById.set(cur.id, []);
        }

        // children (gen + 1)
        if (getChildren && cur.gen < maxDescendants) {
            const kids = (getChildren(cur.node) ?? []).filter(isDefined);
            const kidsIds = kids.map((c) => toKey(getId(c)));
            childrenById.set(cur.id, kidsIds);

            for (const c of kids) {
                const cid = toKey(getId(c));
                const ps = parentsById.get(cid) ?? [];
                if (!ps.includes(cur.id)) parentsById.set(cid, [...ps, cur.id]);
                q.push({ node: c, id: cid, gen: cur.gen + 1 });
            }
        } else if (!childrenById.has(cur.id)) {
            childrenById.set(cur.id, []);
        }
    }

    // normalize missing maps
    for (const id of nodesById.keys()) {
        if (!parentsById.has(id)) parentsById.set(id, []);
        if (!childrenById.has(id)) childrenById.set(id, []);
        if (!spouseById.has(id)) spouseById.set(id, null);
    }

    return { nodesById, parentsById, childrenById, spouseById, rootId };
}

/* ============================================================================
   📐 LAYOUT (couple-units per row + centered rows)
============================================================================ */

type Unit = { unitId: string; ids: string[]; gen: number };

function computeLayout<T>(args: {
    pack: GraphPack<T>;
    nodeWidth: number;
    nodeHeight: number;
    spouseGap: number;
    unitGap: number;
    rowGap: number;
    padding: number;
}): {
    nodes: IntentGenealogyComputedNode<T>[];
    spouseLinks: IntentGenealogyLink[];
    familyLinks: IntentGenealogyLink[];
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
} {
    const { pack, nodeWidth, nodeHeight, spouseGap, unitGap, rowGap, padding } = args;
    const { nodesById, parentsById, childrenById, spouseById } = pack;

    // group by gen
    const byGen = new Map<number, string[]>();
    for (const n of nodesById.values()) {
        const arr = byGen.get(n.gen) ?? [];
        arr.push(n.id);
        byGen.set(n.gen, arr);
    }

    // Build "units" (couple units) per gen
    const unitsByGen = new Map<number, Unit[]>();
    const seenInGen = new Map<number, Set<string>>();

    function mark(gen: number, id: string) {
        const s = seenInGen.get(gen) ?? new Set<string>();
        s.add(id);
        seenInGen.set(gen, s);
    }

    const spouseLinks: IntentGenealogyLink[] = [];

    for (const [gen, ids] of byGen.entries()) {
        const units: Unit[] = [];
        const seen = seenInGen.get(gen) ?? new Set<string>();

        const sorted = ids.slice().sort(); // stable-ish
        for (const id of sorted) {
            if (seen.has(id)) continue;

            const sid = spouseById.get(id) ?? null;
            const hasSpouseSameGen = sid ? nodesById.get(sid)?.gen === gen : false;

            if (sid && hasSpouseSameGen && !seen.has(sid)) {
                const a = id < sid ? id : sid;
                const b = id < sid ? sid : id;
                const unitId = `u:${a}+${b}`;
                units.push({ unitId, ids: [a, b], gen });
                mark(gen, a);
                mark(gen, b);
                spouseLinks.push({ kind: "spouse", a, b });
            } else {
                units.push({ unitId: `u:${id}`, ids: [id], gen });
                mark(gen, id);
            }
        }

        unitsByGen.set(gen, units);
    }

    // Lay rows: centered per gen
    const computed = new Map<string, IntentGenealogyComputedNode<T>>();

    const gens = Array.from(unitsByGen.keys()).sort((a, b) => a - b);
    const cardW = nodeWidth;
    const unitW = (u: Unit) => (u.ids.length === 2 ? cardW * 2 + spouseGap : cardW);

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const gen of gens) {
        const units = unitsByGen.get(gen) ?? [];
        const totalW =
            units.reduce((sum, u) => sum + unitW(u), 0) + Math.max(0, units.length - 1) * unitGap;

        // left origin for this row (centered around x=0)
        let xCursor = -totalW / 2;

        const y = gen * (nodeHeight + rowGap);

        units.forEach((u, unitIndex) => {
            const wU = unitW(u);

            if (u.ids.length === 2) {
                const a = u.ids[0]!;
                const b = u.ids[1]!;

                const ax = xCursor;
                const bx = xCursor + cardW + spouseGap;

                const aRaw = pack.nodesById.get(a)!;
                const bRaw = pack.nodesById.get(b)!;

                computed.set(a, {
                    id: a,
                    data: aRaw.data,
                    gen,
                    x: ax,
                    y,
                    parentIds: parentsById.get(a) ?? [],
                    childIds: childrenById.get(a) ?? [],
                    spouseId: b,
                    unitId: u.unitId,
                    unitIndex,
                });

                computed.set(b, {
                    id: b,
                    data: bRaw.data,
                    gen,
                    x: bx,
                    y,
                    parentIds: parentsById.get(b) ?? [],
                    childIds: childrenById.get(b) ?? [],
                    spouseId: a,
                    unitId: u.unitId,
                    unitIndex,
                });

                minX = Math.min(minX, ax, bx);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, bx + cardW);
                maxY = Math.max(maxY, y + nodeHeight);
            } else {
                const id = u.ids[0]!;
                const raw = pack.nodesById.get(id)!;

                computed.set(id, {
                    id,
                    data: raw.data,
                    gen,
                    x: xCursor,
                    y,
                    parentIds: parentsById.get(id) ?? [],
                    childIds: childrenById.get(id) ?? [],
                    spouseId: spouseById.get(id) ?? null,
                    unitId: u.unitId,
                    unitIndex,
                });

                minX = Math.min(minX, xCursor);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, xCursor + cardW);
                maxY = Math.max(maxY, y + nodeHeight);
            }

            xCursor += wU + unitGap;
        });
    }

    const nodes = Array.from(computed.values());

    // Family links: group children by parentUnitId (use couple midpoint if 2 parents exist on same gen)
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    // index units -> anchor point
    const unitAnchor = new Map<string, { x: number; y: number }>();
    for (const n of nodes) {
        if (unitAnchor.has(n.unitId)) continue;

        const members = nodes.filter((x) => x.unitId === n.unitId);
        if (members.length === 2) {
            const a = members[0]!;
            const b = members[1]!;
            const x = (a.x + nodeWidth / 2 + (b.x + nodeWidth / 2)) / 2;
            const y = a.y + nodeHeight; // bottom
            unitAnchor.set(n.unitId, { x, y });
        } else {
            unitAnchor.set(n.unitId, { x: n.x + nodeWidth / 2, y: n.y + nodeHeight });
        }
    }

    // parentUnit -> children (unique, stable)
    const childrenByUnit = new Map<string, Set<string>>();

    for (const child of nodes) {
        // choose parent unit:
        // - if child has 2 parents that are spouses in same gen, use that couple unit
        // - else use first parent unit found
        const pids = child.parentIds ?? [];
        let chosenUnit: string | null = null;

        if (pids.length >= 2) {
            const p0 = nodeById.get(pids[0]!) ?? null;
            const p1 = nodeById.get(pids[1]!) ?? null;
            if (p0 && p1 && p0.unitId === p1.unitId) chosenUnit = p0.unitId;
        }

        if (!chosenUnit) {
            const p = pids.map((pid) => nodeById.get(pid)).find(Boolean) ?? null;
            chosenUnit = p ? (p as IntentGenealogyComputedNode<T>).unitId : null;
        }

        if (!chosenUnit) continue;

        const set = childrenByUnit.get(chosenUnit) ?? new Set<string>();
        set.add(child.id);
        childrenByUnit.set(chosenUnit, set);
    }

    const familyLinks: IntentGenealogyLink[] = [];
    for (const [unitId, set] of childrenByUnit.entries()) {
        const kids = Array.from(set)
            .map((id) => nodeById.get(id))
            .filter(Boolean) as Array<IntentGenealogyComputedNode<T>>;
        if (!kids.length) continue;

        const anchor = unitAnchor.get(unitId);
        if (!anchor) continue;

        const childAnchors = kids
            .slice()
            .sort((a, b) => a.x - b.x)
            .map((k) => ({ id: k.id, x: k.x + nodeWidth / 2, y: k.y }));

        familyLinks.push({
            kind: "parent_child_group",
            parentUnitId: unitId,
            parentAnchor: anchor,
            childIds: childAnchors.map((c) => c.id),
            childAnchors,
        });
    }

    // padded bounds
    const b = {
        minX: minX - padding,
        minY: minY - padding,
        maxX: maxX + padding,
        maxY: maxY + padding,
    };

    return { nodes, spouseLinks, familyLinks, bounds: b };
}

/* ============================================================================
   🔗 PATHS
============================================================================ */

function elbowPath(points: Array<{ x: number; y: number }>) {
    const p0 = points[0];
    if (!p0 || points.length < 2) return "";

    let d = `M ${p0.x} ${p0.y}`;
    for (let i = 1; i < points.length; i++) {
        const p = points[i]!;
        d += ` L ${p.x} ${p.y}`;
    }
    return d;
}

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentGenealogyHierarchy<T>(props: IntentGenealogyProps<T>) {
    const {
        className,

        root,
        getId,
        getParents,
        getChildren,
        getSpouses,

        getLabel,
        getSubtitle,
        getMeta,

        getNodeStyle,

        maxAncestors = 3,
        maxDescendants = 3,

        nodeWidth = 170,
        nodeHeight = 52,
        spouseGap = 18,
        unitGap = 36,
        rowGap = 64,
        padding = 36,

        trunkGap = 18,
        childStem = 14,

        zoomable = true,
        pannable = true,
        minZoom = 0.4,
        maxZoom = 2.5,
        viewport: viewportProp,
        defaultViewport = { x: 0, y: 0, k: 1 },
        onViewportChange,
        autoFit = true,

        selectable = true,
        selectedId: selectedIdProp,
        defaultSelectedId = null,
        onSelectionChange,

        renderNode,

        // DS props
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
       Controlled/uncontrolled selection
    -------------------------------------------- */

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

    /* --------------------------------------------
       Graph + layout
    -------------------------------------------- */

    const pack = React.useMemo(() => {
        if (!root) return null;

        return buildGenealogyGraph({
            root,
            getId,
            ...(getParents ? { getParents } : {}),
            ...(getChildren ? { getChildren } : {}),
            ...(getSpouses ? { getSpouses } : {}),
            maxAncestors,
            maxDescendants,
        });
    }, [root, getId, getParents, getChildren, getSpouses, maxAncestors, maxDescendants]);

    const layout = React.useMemo(() => {
        if (!pack) return null;
        return computeLayout({
            pack,
            nodeWidth,
            nodeHeight,
            spouseGap,
            unitGap,
            rowGap,
            padding,
        });
    }, [pack, nodeWidth, nodeHeight, spouseGap, unitGap, rowGap, padding]);

    const nodeById = React.useMemo(() => {
        const m = new Map<string, IntentGenealogyComputedNode<T>>();
        if (!layout) return m;
        for (const n of layout.nodes) m.set(n.id, n);
        return m;
    }, [layout]);

    /* --------------------------------------------
       Viewport (pan/zoom)
    -------------------------------------------- */

    const viewportControlled = viewportProp !== undefined;
    const [viewportUncontrolled, setViewportUncontrolled] =
        React.useState<IntentGenealogyViewport>(defaultViewport);
    const viewport = viewportControlled ? (viewportProp ?? defaultViewport) : viewportUncontrolled;

    const setViewport = React.useCallback(
        (next: IntentGenealogyViewport) => {
            const clampedVp = { x: next.x, y: next.y, k: clamp(next.k, minZoom, maxZoom) };
            if (!viewportControlled) setViewportUncontrolled(clampedVp);
            onViewportChange?.(clampedVp);
        },
        [viewportControlled, onViewportChange, minZoom, maxZoom]
    );

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const [svgSize, setSvgSize] = React.useState<{ w: number; h: number }>({ w: 1, h: 1 });

    React.useLayoutEffect(() => {
        const el = rootRef.current; // ✅ observe le container plutôt que le svg
        if (!el) return;

        let raf = 0;

        const update = () => {
            // ⚠️ éviter les boucles sync ResizeObserver → setState
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const r = el.getBoundingClientRect();
                const w = Math.max(1, Math.round(r.width));
                const h = Math.max(1, Math.round(r.height));

                setSvgSize((prev) => {
                    // ✅ si rien ne change, pas de re-render
                    if (prev.w === w && prev.h === h) return prev;
                    return { w, h };
                });
            });
        };

        update();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", update);
            return () => {
                window.removeEventListener("resize", update);
                if (raf) cancelAnimationFrame(raf);
            };
        }

        const ro = new ResizeObserver(() => update());
        ro.observe(el);

        return () => {
            ro.disconnect();
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    const fitToContent = React.useCallback(() => {
        if (!layout) return;

        const w = svgSize.w || 1;
        const h = svgSize.h || 1;

        const b = layout.bounds;
        const contentW = Math.max(1, b.maxX - b.minX);
        const contentH = Math.max(1, b.maxY - b.minY);

        const k = clamp(Math.min(w / contentW, h / contentH), minZoom, maxZoom);
        const cx = (b.minX + b.maxX) / 2;
        const cy = (b.minY + b.maxY) / 2;

        const x = w / 2 - cx * k;
        const y = h / 2 - cy * k;

        setViewport({ x, y, k });
    }, [layout, svgSize.w, svgSize.h, minZoom, maxZoom, setViewport]);

    React.useEffect(() => {
        if (!autoFit) return;
        if (!layout) return;
        fitToContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoFit, layout?.nodes.length]);

    // wheel zoom (simple, crisp)
    const onWheel = React.useCallback(
        (e: WheelEvent) => {
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
        },
        [zoomable, disabled, viewport.x, viewport.y, viewport.k, minZoom, maxZoom, setViewport]
    );

    React.useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        svg.addEventListener("wheel", onWheel, { passive: false });
        return () => svg.removeEventListener("wheel", onWheel as any);
    }, [onWheel]);

    // pointer pan
    const dragRef = React.useRef<{
        active: boolean;
        sx: number;
        sy: number;
        bx: number;
        by: number;
        pid: number | null;
    }>({
        active: false,
        sx: 0,
        sy: 0,
        bx: 0,
        by: 0,
        pid: null,
    });

    function onPointerDown(e: React.PointerEvent) {
        if (!pannable || disabled) return;

        const t = e.target as HTMLElement;
        if (t?.closest?.(".intent-genealogy-node")) return;

        dragRef.current.active = true;
        dragRef.current.sx = e.clientX;
        dragRef.current.sy = e.clientY;
        dragRef.current.bx = viewport.x;
        dragRef.current.by = viewport.y;
        dragRef.current.pid = e.pointerId;

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: React.PointerEvent) {
        if (!dragRef.current.active) return;
        if (disabled) return;

        const dx = e.clientX - dragRef.current.sx;
        const dy = e.clientY - dragRef.current.sy;

        setViewport({ x: dragRef.current.bx + dx, y: dragRef.current.by + dy, k: viewport.k });
    }

    function onPointerUp(e: React.PointerEvent) {
        if (!dragRef.current.active) return;
        dragRef.current.active = false;
        try {
            (e.currentTarget as HTMLElement).releasePointerCapture(
                dragRef.current.pid ?? e.pointerId
            );
        } catch {
            // ignore
        }
        dragRef.current.pid = null;
    }

    /* --------------------------------------------
       Rendering helpers
    -------------------------------------------- */

    function resolveCardStyle(node: T, i: number): Required<IntentGenealogyNodeStyle> {
        const user = getNodeStyle?.(node) ?? null;

        // gentle default palette (like the reference)
        const palette = [
            {
                fill: "rgba(186, 230, 253, 0.55)",
                stroke: "rgba(14, 116, 144, 0.35)",
                text: "rgba(7, 49, 66, 0.92)",
            }, // cyan
            {
                fill: "rgba(253, 186, 203, 0.52)",
                stroke: "rgba(190, 18, 60, 0.30)",
                text: "rgba(76, 5, 23, 0.92)",
            }, // rose
            {
                fill: "rgba(187, 247, 208, 0.50)",
                stroke: "rgba(22, 163, 74, 0.28)",
                text: "rgba(8, 55, 24, 0.92)",
            }, // green
            {
                fill: "rgba(254, 215, 170, 0.48)",
                stroke: "rgba(154, 52, 18, 0.26)",
                text: "rgba(70, 23, 8, 0.92)",
            }, // amber
        ];

        const d = palette[i % palette.length]!;
        return {
            fill: user?.fill ?? d.fill,
            stroke: user?.stroke ?? d.stroke,
            text: user?.text ?? d.text,
        };
    }

    function renderDefaultNode(ctx: IntentGenealogyNodeRenderContext<T>, i: number) {
        const n = ctx.node;
        const label = getLabel(n.data);
        const sub = getSubtitle?.(n.data) ?? null;
        const meta = getMeta?.(n.data) ?? null;

        const style = resolveCardStyle(n.data, i);

        return (
            <div
                className="intent-genealogy-card"
                style={{ background: style.fill, borderColor: style.stroke, color: style.text }}
            >
                <div className="intent-genealogy-cardTop">
                    <div className="intent-genealogy-cardTitle">{label}</div>
                    {meta ? <div className="intent-genealogy-cardMeta">{meta}</div> : null}
                </div>
                {sub ? <div className="intent-genealogy-cardSub">{sub}</div> : null}
            </div>
        );
    }

    if (!root || !pack || !layout) {
        const rootCls = cn("intent-genealogy", surfaceClass);
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
                <div className="intent-genealogy-empty">No genealogy</div>
            </div>
        );
    }

    const rootCls = cn(
        "intent-genealogy",
        surfaceClass,
        zoomable && "is-zoomable",
        pannable && "is-pannable"
    );

    // Links rendering: spouse + family
    const spousePaths = layout.spouseLinks
        .map((l) => {
            if (l.kind !== "spouse") return null;
            const a = nodeById.get(l.a);
            const b = nodeById.get(l.b);
            if (!a || !b) return null;

            const ax = a.x + nodeWidth;
            const ay = a.y + nodeHeight / 2;

            const bx = b.x;
            const by = b.y + nodeHeight / 2;

            const midx = (ax + bx) / 2;
            const midy = (ay + by) / 2;

            // small straight line + dot
            const d = elbowPath([
                { x: ax, y: ay },
                { x: bx, y: by },
            ]);

            return { key: `sp_${l.a}_${l.b}`, d, dot: { x: midx, y: midy } };
        })
        .filter(isDefined);

    const familyPaths = layout.familyLinks
        .map((l) => {
            if (l.kind !== "parent_child_group") return null;
            const parent = l.parentAnchor;

            const kids = l.childAnchors;
            if (!kids.length) return null;

            const junctionY = parent.y + trunkGap;
            const minX = Math.min(...kids.map((k) => k.x));
            const maxX = Math.max(...kids.map((k) => k.x));

            const dParts: string[] = [];

            // parent trunk down to sibling bar
            dParts.push(
                elbowPath([
                    { x: parent.x, y: parent.y },
                    { x: parent.x, y: junctionY },
                ])
            );

            // sibling bar
            dParts.push(
                elbowPath([
                    { x: minX, y: junctionY },
                    { x: maxX, y: junctionY },
                ])
            );

            // stems to each child
            for (const k of kids) {
                const topY = k.y - childStem; // little stem above the card
                dParts.push(
                    elbowPath([
                        { x: k.x, y: junctionY },
                        { x: k.x, y: topY },
                        { x: k.x, y: k.y },
                    ])
                );
            }

            return { key: `fam_${l.parentUnitId}`, d: dParts.join(" ") };
        })
        .filter(isDefined);

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
            <svg
                ref={svgRef}
                className="intent-genealogy-svg"
                width="100%"
                height="100%"
                role="img"
                aria-label="Genealogy"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                <g
                    className="intent-genealogy-stage"
                    transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.k})`}
                >
                    <g className="intent-genealogy-links">
                        {familyPaths.map((p) => (
                            <path key={p.key} className="intent-genealogy-family" d={p.d} />
                        ))}

                        {spousePaths.map((p) => (
                            <React.Fragment key={p.key}>
                                <path className="intent-genealogy-spouse" d={p.d} />
                                <circle
                                    className="intent-genealogy-dot"
                                    cx={p.dot.x}
                                    cy={p.dot.y}
                                    r={3.5}
                                />
                            </React.Fragment>
                        ))}
                    </g>

                    <g className="intent-genealogy-nodes">
                        {layout.nodes
                            .slice()
                            .sort((a, b) => a.gen - b.gen || a.x - b.x)
                            .map((n, i) => {
                                const key = n.id;
                                const isSelected = selectedId ? toKey(selectedId) === key : false;

                                const ctx: IntentGenealogyNodeRenderContext<T> = {
                                    node: n,
                                    isSelected,
                                    select: () => {
                                        if (!selectable || disabled) return;
                                        const next = isSelected ? null : key;
                                        setSelectedId(next, next ? n.data : undefined);
                                    },
                                };

                                return (
                                    <g
                                        key={key}
                                        className={cn(
                                            "intent-genealogy-node",
                                            isSelected && "is-selected"
                                        )}
                                        transform={`translate(${n.x} ${n.y})`}
                                        onClick={() => (selectable ? ctx.select() : undefined)}
                                    >
                                        <rect
                                            className="intent-genealogy-hit"
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
                                            <div className="intent-genealogy-fo">
                                                {renderNode
                                                    ? renderNode(ctx)
                                                    : renderDefaultNode(ctx, i)}
                                            </div>
                                        </foreignObject>
                                    </g>
                                );
                            })}
                    </g>
                </g>
            </svg>
        </div>
    );
}
