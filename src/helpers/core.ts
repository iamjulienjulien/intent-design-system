/* ============================================================================
   src/helpers/core.ts
   Intent Design System – Core helpers
   - Generic math / guards / string parsing helpers
   - No color-specific types here
============================================================================ */

export function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

/* ============================================================================
   Numbers
============================================================================ */

export function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export function clamp01(n: number) {
    return clamp(n, 0, 1);
}

export function clamp255(n: number) {
    return Math.max(0, Math.min(255, Math.round(n)));
}

export function round(n: number, digits = 3) {
    const p = 10 ** digits;
    return Math.round(n * p) / p;
}

export function roundAlpha(value: number) {
    return Number(value.toFixed(3));
}

export function isFiniteNumber(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n);
}

/* ============================================================================
   CSS parsing helpers
============================================================================ */

export function parseNumberOrPercent(x: string): { value: number; isPercent: boolean } | null {
    const s = x.trim();
    if (!s) return null;

    const isPercent = s.endsWith("%");
    const n = Number(isPercent ? s.slice(0, -1) : s);
    if (!Number.isFinite(n)) return null;

    return { value: n, isPercent };
}

export function splitCssArgs(args: string): string[] {
    return args
        .trim()
        .replace(/\s*\/\s*/g, " / ")
        .split(/[\s,]+/)
        .filter(Boolean);
}

/* ============================================================================
   Object / style helpers
============================================================================ */

export function onlyDefinedRecord<TValue extends string | number | boolean | null | undefined>(
    record: Record<string, TValue>
) {
    return Object.fromEntries(
        Object.entries(record).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
        )
    );
}
