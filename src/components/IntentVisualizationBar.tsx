"use client";

// src/components/intent/IntentVisualizationBar.tsx
// IntentVisualizationBar
// - Intent-first bar chart (SVG, no deps)
// - Respects Intent DS: stable hooks, vars from resolveIntent()
// - Supports per-bar intent override
// - Accessible (title/desc, aria-label per bar)
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import {
    resolveIntent,
    getIntentLayoutProps,
    // getIntentControlProps not needed: visualization is not a "control frame"
} from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

function roundTo(n: number, digits = 0) {
    const p = Math.pow(10, digits);
    return Math.round(n * p) / p;
}

function escapeAttr(s: string) {
    // for aria labels / title strings, React handles escaping, but keep safe anyway
    return String(s);
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentVisualizationBarDatum = {
    id: string;
    label: string;
    value: number;

    /** Optional semantic override (per bar) */
    intent?: IntentInput["intent"];

    meta?: {
        description?: string;
        hint?: string;
    };
};

export type IntentVisualizationBarProps = IntentInput & {
    className?: string;

    data: IntentVisualizationBarDatum[];

    orientation?: "vertical" | "horizontal"; // default: "vertical"

    /** Scale */
    min?: number; // default 0
    max?: number; // default auto (max of data)

    /** Labels / axis */
    showValues?: boolean; // default true
    showAxis?: boolean; // default true

    /** Layout */
    width?: number | string; // default "100%"
    height?: number; // default 220
    barRadius?: number; // default 12
    gap?: number; // default 10
    padding?: number; // default 12
    axisThickness?: number; // default 1

    /** Formatting */
    valueFormatter?: (v: number, d: IntentVisualizationBarDatum) => string;

    /** Interaction */
    onBarClick?: (datum: IntentVisualizationBarDatum) => void;

    /** A11y */
    ariaLabel?: string; // default "Bar chart"
    title?: string;
    description?: string;
};

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_VIS_BAR_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "data",
        description: { fr: "Données du graphe.", en: "Chart data." },
        type: "IntentVisualizationBarDatum[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "orientation",
        description: { fr: "Orientation des barres.", en: "Bar orientation." },
        type: `"vertical" | "horizontal"`,
        required: false,
        default: "vertical",
        fromSystem: false,
    },
    {
        name: "min",
        description: { fr: "Minimum de l’échelle.", en: "Scale minimum." },
        type: "number",
        required: false,
        default: "0",
        fromSystem: false,
    },
    {
        name: "max",
        description: {
            fr: "Maximum de l’échelle (auto si absent).",
            en: "Scale maximum (auto if omitted).",
        },
        type: "number",
        required: false,
        fromSystem: false,
    },
    {
        name: "showValues",
        description: { fr: "Affiche la valeur.", en: "Shows values." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "showAxis",
        description: { fr: "Affiche l’axe de base.", en: "Shows baseline axis." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "height",
        description: { fr: "Hauteur SVG.", en: "SVG height." },
        type: "number",
        required: false,
        default: "220",
        fromSystem: false,
    },
    {
        name: "barRadius",
        description: { fr: "Arrondi des barres.", en: "Bar corner radius." },
        type: "number",
        required: false,
        default: "12",
        fromSystem: false,
    },
    {
        name: "gap",
        description: { fr: "Espace entre barres.", en: "Gap between bars." },
        type: "number",
        required: false,
        default: "10",
        fromSystem: false,
    },
    {
        name: "padding",
        description: { fr: "Padding interne du canvas.", en: "Inner canvas padding." },
        type: "number",
        required: false,
        default: "12",
        fromSystem: false,
    },
    {
        name: "valueFormatter",
        description: { fr: "Formatage des valeurs.", en: "Value formatter." },
        type: "(v, d) => string",
        required: false,
        fromSystem: false,
    },
    {
        name: "onBarClick",
        description: { fr: "Click sur une barre.", en: "Bar click handler." },
        type: "(datum) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "ariaLabel",
        description: { fr: "Label ARIA global.", en: "Global ARIA label." },
        type: "string",
        required: false,
        default: "Bar chart",
        fromSystem: false,
    },
];

export const IntentVisualizationBarPropsTable: DocsPropRow[] = [
    ...INTENT_VIS_BAR_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentVisualizationBarIdentity: ComponentIdentity = {
    name: "IntentVisualizationBar",
    kind: "visualization",
    description: {
        fr: "Graphique en barres intent-first (SVG). Supporte intent global + override par barre. Accessible, stable hooks.",
        en: "Intent-first bar chart (SVG). Global intent + per-bar override. Accessible, stable hooks.",
    },
    since: "0.3.0",
    docs: { route: "/playground/components/intent-visualization-bar" },
    anatomy: {
        root: "<div>",
        svg: "svg.intent-visualization-canvas",
        axis: "g.intent-visualization-axis",
        bars: "g.intent-visualization-bars",
        bar: "rect.intent-visualization-bar",
        label: "text.intent-visualization-label",
        value: "text.intent-visualization-value",
    },
    classHooks: [
        "intent-visualization",
        "intent-visualization-bar",
        "intent-visualization-canvas",
        "intent-visualization-axis",
        "intent-visualization-bars",
        "intent-visualization-bar",
        "intent-visualization-label",
        "intent-visualization-value",
        "is-clickable",
        "is-empty",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentVisualizationBar(props: IntentVisualizationBarProps) {
    const {
        className,

        data,

        orientation = "vertical",

        min = 0,
        max,

        showValues = true,
        showAxis = true,

        width = "100%",
        height = 220,
        barRadius = 12,
        gap = 10,
        padding = 12,
        axisThickness = 1,

        valueFormatter = (v) => String(v),

        onBarClick,

        ariaLabel = "Bar chart",
        title,
        description,

        // DS props
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,
    } = props;

    const disabled = Boolean(disabledProp);
    const clickable = Boolean(onBarClick) && !disabled;

    const baseInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const baseResolved = resolveIntent(baseInput);
    const baseLayout = getIntentLayoutProps(baseResolved);

    const safeData = Array.isArray(data) ? data : [];
    const isEmpty = safeData.length === 0;

    const computedMax = React.useMemo(() => {
        if (typeof max === "number") return max;
        let m = 0;
        for (const d of safeData) m = Math.max(m, d.value);
        return m;
    }, [max, safeData]);

    const span = Math.max(1e-9, computedMax - min);

    // chart geometry
    const W = 1000; // internal viewBox width (scales nicely)
    const H = Math.max(120, height);

    const innerPad = clamp(padding, 0, 80);
    const innerW = W - innerPad * 2;
    const innerH = H - innerPad * 2;

    const baselineY = innerPad + innerH;
    const baselineX = innerPad;

    const barsCount = Math.max(1, safeData.length);

    // Vertical layout: each bar gets a slot width
    const slot =
        orientation === "vertical"
            ? (innerW - gap * (barsCount - 1)) / barsCount
            : (innerH - gap * (barsCount - 1)) / barsCount;

    const barThickness = Math.max(10, slot);

    const ids = React.useMemo(() => {
        // stable-ish id: based on title+count (no random, no Date.now)
        const seed = `${title ?? ""}-${safeData.length}-${orientation}`;
        return {
            titleId: `ids-vis-bar-title-${seed.replace(/[^a-z0-9_-]/gi, "")}`,
            descId: `ids-vis-bar-desc-${seed.replace(/[^a-z0-9_-]/gi, "")}`,
        };
    }, [title, safeData.length, orientation]);

    return (
        <div
            {...baseLayout}
            className={cn(
                baseLayout.className,
                "intent-visualization intent-visualization-bar",
                clickable && "is-clickable",
                isEmpty && "is-empty",
                className
            )}
            data-intent={baseResolved.intent}
            data-variant={baseResolved.variant}
            data-intensity={baseResolved.intensity}
            data-mode={baseResolved.mode}
            aria-label={ariaLabel}
        >
            <svg
                className="intent-visualization-canvas"
                width={width}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-labelledby={
                    title || description
                        ? `${title ? ids.titleId : ""} ${description ? ids.descId : ""}`.trim()
                        : undefined
                }
            >
                {title ? <title id={ids.titleId}>{escapeAttr(title)}</title> : null}
                {description ? <desc id={ids.descId}>{escapeAttr(description)}</desc> : null}

                {/* Axis */}
                {showAxis ? (
                    <g className="intent-visualization-axis" aria-hidden>
                        {orientation === "vertical" ? (
                            <line
                                x1={innerPad}
                                y1={baselineY}
                                x2={innerPad + innerW}
                                y2={baselineY}
                                stroke="currentColor"
                                strokeWidth={axisThickness}
                                opacity={0.25}
                            />
                        ) : (
                            <line
                                x1={baselineX}
                                y1={innerPad}
                                x2={baselineX}
                                y2={innerPad + innerH}
                                stroke="currentColor"
                                strokeWidth={axisThickness}
                                opacity={0.25}
                            />
                        )}
                    </g>
                ) : null}

                {/* Bars */}
                <g className="intent-visualization-bars" role="list" aria-label="bars">
                    {isEmpty
                        ? null
                        : safeData.map((d, i) => {
                              const v = d.value;
                              const t = clamp((v - min) / span, 0, 1);

                              // per-bar intent override: resolve with same DS input, only intent replaced
                              const barInput: IntentInput = d.intent
                                  ? { ...baseInput, intent: d.intent }
                                  : baseInput;
                              const barResolved = d.intent ? resolveIntent(barInput) : baseResolved;
                              const barLayout = d.intent
                                  ? getIntentLayoutProps(barResolved)
                                  : baseLayout;

                              if (orientation === "vertical") {
                                  const x = innerPad + i * (barThickness + gap);
                                  const h = Math.max(0, t * innerH);
                                  const y = baselineY - h;
                                  const r = clamp(
                                      barRadius,
                                      0,
                                      Math.min(24, barThickness / 2, h / 2)
                                  );

                                  const labelY = baselineY + 18;
                                  const valueY = y - 8;

                                  const barAria = `${d.label} — ${valueFormatter(v, d)}`;

                                  return (
                                      <g
                                          key={d.id}
                                          style={barLayout.style as any}
                                          role="listitem"
                                          aria-label={barAria}
                                          data-intent={barResolved.intent}
                                      >
                                          <rect
                                              className={cn("intent-visualization-bar")}
                                              x={x}
                                              y={y}
                                              width={barThickness}
                                              height={h}
                                              rx={r}
                                              ry={r}
                                              tabIndex={clickable ? 0 : undefined}
                                              onClick={
                                                  clickable ? () => onBarClick?.(d) : undefined
                                              }
                                              onKeyDown={
                                                  clickable
                                                      ? (e) => {
                                                            if (
                                                                e.key === "Enter" ||
                                                                e.key === " "
                                                            ) {
                                                                e.preventDefault();
                                                                onBarClick?.(d);
                                                            }
                                                        }
                                                      : undefined
                                              }
                                          />
                                          <text
                                              className="intent-visualization-label"
                                              x={x + barThickness / 2}
                                              y={labelY}
                                              textAnchor="middle"
                                          >
                                              {d.label}
                                          </text>
                                          {showValues ? (
                                              <text
                                                  className="intent-visualization-value"
                                                  x={x + barThickness / 2}
                                                  y={Math.max(innerPad + 12, valueY)}
                                                  textAnchor="middle"
                                              >
                                                  {valueFormatter(v, d)}
                                              </text>
                                          ) : null}
                                      </g>
                                  );
                              }

                              // horizontal
                              const y = innerPad + i * (barThickness + gap);
                              const w = Math.max(0, t * innerW);
                              const x = baselineX;
                              const r = clamp(barRadius, 0, Math.min(24, barThickness / 2, w / 2));

                              const labelX = baselineX - 10;
                              const valueX = x + w + 8;

                              const barAria = `${d.label} — ${valueFormatter(v, d)}`;

                              return (
                                  <g
                                      key={d.id}
                                      style={barLayout.style as any}
                                      role="listitem"
                                      aria-label={barAria}
                                      data-intent={barResolved.intent}
                                  >
                                      <rect
                                          className="intent-visualization-bar"
                                          x={x}
                                          y={y}
                                          width={w}
                                          height={barThickness}
                                          rx={r}
                                          ry={r}
                                          tabIndex={clickable ? 0 : undefined}
                                          onClick={clickable ? () => onBarClick?.(d) : undefined}
                                          onKeyDown={
                                              clickable
                                                  ? (e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            onBarClick?.(d);
                                                        }
                                                    }
                                                  : undefined
                                          }
                                      />
                                      <text
                                          className="intent-visualization-label"
                                          x={labelX}
                                          y={y + barThickness / 2 + 4}
                                          textAnchor="end"
                                      >
                                          {d.label}
                                      </text>

                                      {showValues ? (
                                          <text
                                              className="intent-visualization-value"
                                              x={Math.min(innerPad + innerW, valueX)}
                                              y={y + barThickness / 2 + 4}
                                              textAnchor="start"
                                          >
                                              {valueFormatter(v, d)}
                                          </text>
                                      ) : null}
                                  </g>
                              );
                          })}
                </g>
            </svg>
        </div>
    );
}
