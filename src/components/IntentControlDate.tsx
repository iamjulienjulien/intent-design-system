"use client";

// src/components/intent/IntentControlDate.tsx
// IntentControlDate
// - Intent-first date input (single or split)
// - Single mode: native <input type="date"> (default) OR text input for custom formatting
// - Split mode: 3 inputs (day/month/year) with smart focus, paste parsing, and real date validation
// - Works standalone (frame) or inside IntentControlField (insideField=true => naked)
// - Uses resolveIntent() to compute stable hooks + CSS vars
// - No dynamic Tailwind classes: only stable hooks + CSS tokens

import * as React from "react";

import { resolveIntent, getIntentLayoutProps, getIntentControlProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
    type Tone,
} from "SYSTEM";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type DateSize = "xs" | "sm" | "md" | "lg" | "xl";
type DateMode = "single" | "split";
type DateOrder = "DMY" | "MDY" | "YMD";
type DatePart = "day" | "month" | "year";

function sizeClass(size: DateSize) {
    return `ids-control-${size}`;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
}

function clampInt(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function onlyDigits(s: string) {
    return s.replace(/[^\d]/g, "");
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function isLeapYear(y: number) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number) {
    // m: 1..12
    if (m === 2) return isLeapYear(y) ? 29 : 28;
    if (m === 4 || m === 6 || m === 9 || m === 11) return 30;
    return 31;
}

function isValidISODate(iso: string) {
    // strict YYYY-MM-DD
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return false;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return false;
    if (mo < 1 || mo > 12) return false;
    const dim = daysInMonth(y, mo);
    if (d < 1 || d > dim) return false;
    return true;
}

function compareISODate(a: string, b: string) {
    // works lexicographically for YYYY-MM-DD
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

function parseLooseDateToParts(raw: string, order: DateOrder): DateParts | null {
    const s = raw.trim();

    // 1) YYYY-MM-DD
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (iso) {
        return pickParts({ year: iso[1], month: iso[2], day: iso[3] });
    }

    // 2) D/M/Y or D.M.Y etc
    const sep = /^(\d{1,4})\D+(\d{1,2})\D+(\d{1,4})$/.exec(s);
    if (sep) {
        const a = sep[1];
        const b = sep[2];
        const c = sep[3];

        if (order === "DMY") return pickParts({ day: a, month: b, year: c });
        if (order === "MDY") return pickParts({ month: a, day: b, year: c });
        return pickParts({ year: a, month: b, day: c });
    }

    // 3) digits only: try to infer
    const digits = onlyDigits(s);
    if (digits.length === 8) {
        if (order === "YMD") {
            return pickParts({
                year: digits.slice(0, 4),
                month: digits.slice(4, 6),
                day: digits.slice(6, 8),
            });
        }
        if (order === "DMY") {
            return pickParts({
                day: digits.slice(0, 2),
                month: digits.slice(2, 4),
                year: digits.slice(4, 8),
            });
        }
        return pickParts({
            month: digits.slice(0, 2),
            day: digits.slice(2, 4),
            year: digits.slice(4, 8),
        });
    }

    return null;
}

function partsToISO(parts: { day?: string; month?: string; year?: string }) {
    const y = parts.year ? onlyDigits(parts.year) : "";
    const m = parts.month ? onlyDigits(parts.month) : "";
    const d = parts.day ? onlyDigits(parts.day) : "";
    if (y.length !== 4 || m.length < 1 || d.length < 1) return null;

    const yy = Number(y);
    const mm = clampInt(Number(m), 1, 12);
    const dim = daysInMonth(yy, mm);
    const dd = clampInt(Number(d), 1, dim);

    const iso = `${y}-${pad2(mm)}-${pad2(dd)}`;
    return iso;
}

function pickParts(p: {
    day?: string | undefined;
    month?: string | undefined;
    year?: string | undefined;
}): DateParts {
    const next: DateParts = {};
    if (p.day !== undefined) next.day = p.day;
    if (p.month !== undefined) next.month = p.month;
    if (p.year !== undefined) next.year = p.year;
    return next;
}

function normalizePartsForInputs(p: DateParts): Required<DateParts> {
    return {
        day: p.day ?? "",
        month: p.month ?? "",
        year: p.year ?? "",
    };
}

export type DateParts = {
    day?: string;
    month?: string;
    year?: string;
};

type DateChangeMeta = {
    mode: DateMode;
    isComplete: boolean;
    isValid: boolean;
    parts: DateParts;
};

/* ============================================================================
   🧩 TYPES
============================================================================ */

type BaseProps = IntentInput & {
    className?: string;

    /** Visual / layout */
    size?: DateSize; // default: "md"
    fullWidth?: boolean; // default false

    /** Slots (works both standalone or inside IntentControlField) */
    leading?: React.ReactNode;
    trailing?: React.ReactNode;

    /** State */
    invalid?: boolean; // default false
    readOnly?: boolean; // default false

    /**
     * When used inside IntentControlField, you generally want the field to own padding.
     * - insideField=true => no internal padding, no bg/ring, inherits frame spacing
     * - standalone => provides the usual control "frame" look + padding
     */
    insideField?: boolean; // default false

    /** Mode */
    dateMode?: DateMode; // default "single"

    /**
     * Single mode:
     * - native (default): input type="date"
     * - text: input type="text" with your own placeholders/format
     */
    singleVariant?: "native" | "text"; // default "native"

    /**
     * Split mode only:
     * - "all" (default) renders the 3 inputs
     * - "day" | "month" | "year" renders only one input (solo mode)
     *
     * Useful to compose 3 separate fields in a form (day / month / year).
     */
    splitPart?: "all" | "day" | "month" | "year"; // default "all"

    /** Split mode: order + separator */
    order?: DateOrder; // default "DMY"
    separator?: string; // default "/"

    /** Labels for a11y (split) */
    dayLabel?: string; // default "Jour"
    monthLabel?: string; // default "Mois"
    yearLabel?: string; // default "Année"

    /**
     * Value model:
     * - value is ISO string "YYYY-MM-DD" or null/undefined
     * - onValueChange fires for both modes
     */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null, meta: DateChangeMeta) => void;

    /**
     * Optional controlled split parts (advanced).
     * If provided, split inputs use these strings as their sources.
     */
    parts?: DateParts;
    defaultParts?: DateParts;
    onPartsChange?: (parts: DateParts) => void;

    /** Constraints (ISO "YYYY-MM-DD") */
    min?: string;
    max?: string;

    /** Optional tone for auto “toned” fallback inside Intents usage */
    tonedFallbackTone?: Tone; // default "emerald"
};

export type IntentControlDateProps = BaseProps &
    Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        | "className"
        | "size"
        | "disabled"
        | "children"
        | "value"
        | "defaultValue"
        | "onChange"
        | "min"
        | "max"
    > & {
        as?: "input"; // default
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_DATE_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "dateMode",
        description: {
            fr: "Mode: input unique ou inputs séparés.",
            en: "Mode: single input or split inputs.",
        },
        type: `"single" | "split"`,
        required: false,
        default: "single",
        fromSystem: false,
    },
    {
        name: "singleVariant",
        description: {
            fr: "En mode single: natif (type=date) ou texte (type=text).",
            en: "In single mode: native (type=date) or text (type=text).",
        },
        type: `"native" | "text"`,
        required: false,
        default: "native",
        fromSystem: false,
    },
    {
        name: "order",
        description: { fr: "Ordre des inputs (split).", en: "Inputs order (split)." },
        type: `"DMY" | "MDY" | "YMD"`,
        required: false,
        default: "DMY",
        fromSystem: false,
    },
    {
        name: "separator",
        description: {
            fr: "Séparateur visuel entre inputs (split).",
            en: "Visual separator (split).",
        },
        type: "string",
        required: false,
        default: "/",
        fromSystem: false,
    },
    {
        name: "value",
        description: { fr: "Valeur ISO (YYYY-MM-DD).", en: "ISO value (YYYY-MM-DD)." },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale ISO si uncontrolled.",
            en: "Initial ISO value if uncontrolled.",
        },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback valeur ISO (ou null) + meta (validité, parts…).",
            en: "ISO value callback (or null) + meta (validity, parts…).",
        },
        type: "(value: string | null, meta: DateChangeMeta) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "parts",
        description: {
            fr: "Parts contrôlées (split, avancé).",
            en: "Controlled parts (split, advanced).",
        },
        type: "{ day?: string; month?: string; year?: string }",
        required: false,
        fromSystem: false,
    },
    {
        name: "splitPart",
        description: {
            fr: 'En mode split: "all" affiche jour/mois/année. "day" | "month" | "year" permet d’utiliser le composant en mode solo (un seul champ).',
            en: 'In split mode: "all" renders day/month/year. "day" | "month" | "year" enables solo mode (single field only).',
        },
        type: `"all" | "day" | "month" | "year"`,
        required: false,
        default: "all",
        fromSystem: false,
    },
    {
        name: "defaultParts",
        description: {
            fr: "Parts initiales (split, uncontrolled).",
            en: "Initial parts (split, uncontrolled).",
        },
        type: "{ day?: string; month?: string; year?: string }",
        required: false,
        fromSystem: false,
    },
    {
        name: "onPartsChange",
        description: { fr: "Callback parts (split).", en: "Parts callback (split)." },
        type: "(parts: DateParts) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "min / max",
        description: { fr: "Bornes ISO (YYYY-MM-DD).", en: "ISO bounds (YYYY-MM-DD)." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode naked pour être wrappé par IntentControlField (le frame appartient au Field).",
            en: "Naked mode meant to be wrapped by IntentControlField (frame owned by Field).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille (hauteur/typo/padding si standalone).",
            en: "Size (height/typo/padding standalone).",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "leading / trailing",
        description: {
            fr: "Slots gauche/droite (standalone).",
            en: "Leading/trailing slots (standalone).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "invalid / readOnly",
        description: {
            fr: "États invalid/readonly (hooks + aria).",
            en: "invalid/readonly states (hooks + aria).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives d’input (name, placeholder, autoComplete…).",
            en: "Native input props (name, placeholder, autoComplete…).",
        },
        type: "Omit<InputHTMLAttributes, ...>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlDatePropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_DATE_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlDateIdentity: ComponentIdentity = {
    name: "IntentControlDate",
    kind: "control",
    description: {
        fr: "Contrôle de date intent-first: input unique (natif ou texte) ou 3 inputs séparés (jour/mois/année) avec validation et paste.",
        en: "Intent-first date control: single input (native or text) or split inputs (day/month/year) with validation and paste.",
    },
    since: "0.3.2",
    docs: { route: "/playground/components/intent-control-date" },
    anatomy: {
        root: "<div> (standalone only)",
        input: "<input> (single) or inputs group (split)",
        leading: ".intent-control-date-leading (standalone only)",
        trailing: ".intent-control-date-trailing (standalone only)",
        splitWrap: ".intent-control-date-split",
        part: ".intent-control-date-part",
        sep: ".intent-control-date-sep",
    },
    classHooks: [
        "intent-control",
        "intent-control-date",
        "intent-control-date-standalone",
        "intent-control-date-naked",
        "intent-control-date-el",
        "intent-control-date-leading",
        "intent-control-date-trailing",
        "intent-control-date-split",
        "intent-control-date-part",
        "intent-control-date-sep",
        "is-invalid",
        "is-disabled",
        "is-readonly",
        "is-split",
        "is-single",
        "ids-control-xs",
        "ids-control-sm",
        "ids-control-md",
        "ids-control-lg",
        "ids-control-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export const IntentControlDate = React.forwardRef<HTMLInputElement, IntentControlDateProps>(
    function IntentControlDate(props, forwardedRef) {
        const {
            className,

            size = "md",
            fullWidth = false,

            leading,
            trailing,

            invalid = false,
            readOnly = false,
            insideField = false,

            dateMode = "single",
            singleVariant = "native",

            splitPart = "all",

            order = "DMY",
            separator = "/",

            dayLabel = "Jour",
            monthLabel = "Mois",
            yearLabel = "Année",

            value: valueProp,
            defaultValue,
            onValueChange,

            parts: partsProp,
            defaultParts,
            onPartsChange,

            min,
            max,

            tonedFallbackTone = "emerald",

            // DS props (removed from DOM)
            intent,
            variant,
            tone,
            glow,
            intensity,
            mode,
            toneStep,
            disabled: disabledProp,

            as = "input",

            // native input props (shared)
            ...nativeProps
        } = props as any;

        const disabled = Boolean(disabledProp);

        // Small safety: if intent="toned" but tone is missing, provide a fallback
        const safeTone = intent === "toned" && tone == null ? tonedFallbackTone : tone;

        const intentInput: IntentInput = {
            ...(intent !== undefined ? { intent } : {}),
            ...(variant !== undefined ? { variant } : {}),
            ...(safeTone !== undefined ? { tone: safeTone } : {}),
            ...(glow !== undefined ? { glow } : {}),
            ...(intensity !== undefined ? { intensity } : {}),
            ...(mode !== undefined ? { mode } : {}),
            ...(toneStep !== undefined ? { toneStep } : {}),
            disabled,
        };

        const resolved = resolveIntent(intentInput);
        const layoutProps = getIntentLayoutProps(resolved);
        const controlProps = getIntentControlProps(resolved);

        const elSingleRef = React.useRef<HTMLInputElement | null>(null);
        const dayRef = React.useRef<HTMLInputElement | null>(null);
        const monthRef = React.useRef<HTMLInputElement | null>(null);
        const yearRef = React.useRef<HTMLInputElement | null>(null);

        React.useEffect(() => {
            // forward the "main" ref:
            // - single => single input
            // - split  => day input (first)
            const node = dateMode === "split" ? dayRef.current : elSingleRef.current;
            setRef(forwardedRef, node as any);
        }, [forwardedRef, dateMode]);

        /* ============================================================================
           State model (value + parts)
        ============================================================================ */

        const isControlledValue = valueProp !== undefined;
        const [uncontrolledValue, setUncontrolledValue] = React.useState<string | null>(
            defaultValue ?? null
        );

        const value = isControlledValue ? (valueProp ?? null) : uncontrolledValue;

        const initialPartsFromValue = React.useMemo<DateParts>(() => {
            if (value && isValidISODate(value)) {
                const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
                if (m) return pickParts({ year: m[1], month: m[2], day: m[3] });
            }
            return {};
        }, [value]);

        const isControlledParts = partsProp !== undefined;

        const [uncontrolledParts, setUncontrolledParts] = React.useState<Required<DateParts>>(
            () => {
                const base = defaultParts ?? initialPartsFromValue;
                return normalizePartsForInputs(base);
            }
        );

        const parts: Required<DateParts> = isControlledParts
            ? normalizePartsForInputs(partsProp ?? {})
            : uncontrolledParts;

        // keep uncontrolled parts in sync when value changes externally (common case)
        React.useEffect(() => {
            if (dateMode !== "split") return;
            if (isControlledParts) return;
            if (!value || !isValidISODate(value)) return;

            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
            if (!m) return;

            const next = normalizePartsForInputs(pickParts({ year: m[1], month: m[2], day: m[3] }));

            setUncontrolledParts((prev) => {
                const same =
                    prev.year === next.year && prev.month === next.month && prev.day === next.day;
                return same ? prev : next;
            });
        }, [value, dateMode, isControlledParts]);

        function emitValue(nextISO: string | null, nextParts: DateParts) {
            const isComplete =
                Boolean(nextParts.year && onlyDigits(nextParts.year).length === 4) &&
                Boolean(nextParts.month && onlyDigits(nextParts.month).length >= 1) &&
                Boolean(nextParts.day && onlyDigits(nextParts.day).length >= 1);

            const isValid = nextISO ? isValidISODate(nextISO) : false;

            // min/max validation (if iso is valid)
            let boundedValid = isValid;
            if (
                boundedValid &&
                nextISO &&
                min &&
                isValidISODate(min) &&
                compareISODate(nextISO, min) < 0
            )
                boundedValid = false;
            if (
                boundedValid &&
                nextISO &&
                max &&
                isValidISODate(max) &&
                compareISODate(nextISO, max) > 0
            )
                boundedValid = false;

            const meta: DateChangeMeta = {
                mode: dateMode,
                isComplete,
                isValid: boundedValid,
                parts: nextParts,
            };

            if (!isControlledValue) setUncontrolledValue(nextISO);
            onValueChange?.(nextISO, meta);
        }

        function setParts(next: DateParts) {
            const normalized = normalizePartsForInputs(next);

            if (!isControlledParts) setUncontrolledParts(normalized);
            onPartsChange?.(normalized);

            const iso = partsToISO(normalized);
            emitValue(iso, normalized);
        }

        /* ============================================================================
           Split mode: input behaviors
        ============================================================================ */

        const orderKeys: Array<keyof DateParts> = React.useMemo(() => {
            if (order === "YMD") return ["year", "month", "day"];
            if (order === "MDY") return ["month", "day", "year"];
            return ["day", "month", "year"];
        }, [order]);

        const renderKeys: Array<keyof DateParts> = React.useMemo(() => {
            if (dateMode !== "split") return [];
            if (splitPart === "all") return orderKeys;
            return [splitPart];
        }, [dateMode, splitPart, orderKeys]);

        function isDateComplete(p: DateParts) {
            return (
                Boolean(p.year && onlyDigits(p.year).length === 4) &&
                Boolean(p.month && onlyDigits(p.month).length >= 1) &&
                Boolean(p.day && onlyDigits(p.day).length >= 1)
            );
        }

        function buildMeta(
            mode: DateMode,
            iso: string | null,
            p: DateParts,
            min?: string,
            max?: string
        ) {
            const complete = isDateComplete(p);
            const validISO = iso ? isValidISODate(iso) : false;

            let boundedValid = validISO;
            if (boundedValid && iso && min && isValidISODate(min) && compareISODate(iso, min) < 0)
                boundedValid = false;
            if (boundedValid && iso && max && isValidISODate(max) && compareISODate(iso, max) > 0)
                boundedValid = false;

            const meta: DateChangeMeta = {
                mode,
                isComplete: complete,
                isValid: boundedValid,
                parts: p,
            };

            return meta;
        }

        function partRef(k: keyof DateParts) {
            if (k === "day") return dayRef;
            if (k === "month") return monthRef;
            return yearRef;
        }

        function focusNext(k: keyof DateParts) {
            const idx = renderKeys.indexOf(k);
            const next = renderKeys[idx + 1];
            if (!next) return;
            partRef(next).current?.focus();
            partRef(next).current?.select?.();
        }

        function focusPrev(k: keyof DateParts) {
            const idx = renderKeys.indexOf(k);
            const prev = renderKeys[idx - 1];
            if (!prev) return;
            partRef(prev).current?.focus();
            partRef(prev).current?.select?.();
        }

        function handleSplitKeyDown(k: keyof DateParts, e: React.KeyboardEvent<HTMLInputElement>) {
            if (disabled) return;

            if (e.key === "Backspace") {
                const cur = (e.currentTarget.value ?? "").trim();
                if (!cur) {
                    e.preventDefault();
                    focusPrev(k);
                }
            }

            if (e.key === "ArrowLeft") {
                const pos = e.currentTarget.selectionStart ?? 0;
                if (pos === 0) {
                    e.preventDefault();
                    focusPrev(k);
                }
            }

            if (e.key === "ArrowRight") {
                const pos = e.currentTarget.selectionStart ?? 0;
                const len = (e.currentTarget.value ?? "").length;
                if (pos >= len) {
                    e.preventDefault();
                    focusNext(k);
                }
            }
        }

        function handleSplitPaste(e: React.ClipboardEvent<HTMLInputElement>) {
            if (disabled || readOnly) return;

            const text = e.clipboardData.getData("text") || "";
            const parsed = parseLooseDateToParts(text, order);
            if (!parsed) return;

            e.preventDefault();

            const normalized = normalizePartsForInputs({
                day: parsed.day ? onlyDigits(parsed.day).slice(0, 2) : "",
                month: parsed.month ? onlyDigits(parsed.month).slice(0, 2) : "",
                year: parsed.year ? onlyDigits(parsed.year).slice(0, 4) : "",
            });

            if (splitPart !== "all") {
                const k = splitPart as DatePart; // "day" | "month" | "year"
                setParts({ ...parts, [k]: normalized[k] });
                return;
            }

            // all: remplit tout
            setParts(normalized);

            // focus last field for quick finishing
            yearRef.current?.focus();
            yearRef.current?.select?.();
        }

        function handleSplitChange(k: keyof DateParts, raw: string) {
            if (disabled) return;

            const digits = onlyDigits(raw);

            let next: DateParts = { ...parts };

            if (k === "year") next.year = digits.slice(0, 4);
            if (k === "month") next.month = digits.slice(0, 2);
            if (k === "day") next.day = digits.slice(0, 2);

            setParts(next);

            // Auto-advance rules
            if (k === "day" || k === "month") {
                if (digits.length >= 2) focusNext(k);
            } else if (k === "year") {
                // optional: if 4 digits, stop
                // no auto-advance
            }
        }

        /* ============================================================================
           Single mode: value behaviors
        ============================================================================ */

        function handleSingleChange(next: string) {
            if (disabled) return;

            const iso = next ? String(next) : "";
            const nextISO = iso ? iso : null;

            const nextParts =
                nextISO && isValidISODate(nextISO)
                    ? pickParts({
                          year: nextISO.slice(0, 4),
                          month: nextISO.slice(5, 7),
                          day: nextISO.slice(8, 10),
                      })
                    : {};

            emitValue(nextISO, nextParts);
        }

        function handleSingleTextChange(raw: string) {
            if (disabled) return;

            const parsed = parseLooseDateToParts(raw, order);
            if (!parsed) {
                // don't force null on every keystroke; only emit null + partial parts
                emitValue(null, {});
                return;
            }

            const nextParts: DateParts = normalizePartsForInputs({
                day: parsed.day ? onlyDigits(parsed.day).slice(0, 2) : "",
                month: parsed.month ? onlyDigits(parsed.month).slice(0, 2) : "",
                year: parsed.year ? onlyDigits(parsed.year).slice(0, 4) : "",
            });

            const iso = partsToISO(nextParts);
            emitValue(iso, nextParts);
        }

        /* ============================================================================
           Class hooks (stable)
        ============================================================================ */

        const rootModeHook = dateMode === "split" ? "is-split" : "is-single";

        const elCls = cn(
            "intent-control-date-el",
            sizeClass(size),
            fullWidth && "w-full",
            invalid && "is-invalid",
            disabled && "is-disabled",
            readOnly && "is-readonly",
            insideField ? "intent-control-date-naked" : "intent-control-date-standalone",
            className
        );

        const splitPartHook = dateMode === "split" ? `split-part split-part-${splitPart}` : null;

        const standaloneRootCls = cn(
            "intent-control intent-control-date",
            "relative inline-flex items-stretch",
            sizeClass(size),
            rootModeHook,
            splitPartHook,
            fullWidth && "w-full",
            invalid && "is-invalid",
            disabled && "is-disabled",
            readOnly && "is-readonly"
        );

        const commonAria = {
            "aria-invalid": invalid || undefined,
            "aria-disabled": disabled || undefined,
            "aria-readonly": readOnly || undefined,
        };

        /* ============================================================================
           insideField: naked rendering
        ============================================================================ */

        if (insideField) {
            if (dateMode === "split") {
                const renderPart = (k: keyof DateParts) => {
                    const v = (parts[k] ?? "") as string;
                    const isYear = k === "year";
                    const maxLen = isYear ? 4 : 2;

                    const ariaLabel =
                        k === "day" ? dayLabel : k === "month" ? monthLabel : yearLabel;

                    return (
                        <input
                            key={k}
                            ref={(n) => {
                                if (k === "day") dayRef.current = n;
                                if (k === "month") monthRef.current = n;
                                if (k === "year") yearRef.current = n;
                            }}
                            inputMode="numeric"
                            pattern="\d*"
                            autoComplete="off"
                            spellCheck={false}
                            className={cn(layoutProps.className, elCls, "intent-control-date-part")}
                            value={v}
                            onChange={(e) => handleSplitChange(k, e.target.value)}
                            onKeyDown={(e) => handleSplitKeyDown(k, e)}
                            onPaste={handleSplitPaste}
                            disabled={disabled}
                            readOnly={readOnly}
                            aria-label={ariaLabel}
                            maxLength={maxLen}
                            {...commonAria}
                        />
                    );
                };

                // order + separators
                return (
                    <div
                        {...layoutProps}
                        className={cn(
                            layoutProps.className,
                            "intent-control-date-split",
                            rootModeHook,
                            splitPartHook
                        )}
                        role="group"
                        aria-disabled={disabled || undefined}
                        aria-readonly={readOnly || undefined}
                    >
                        {renderKeys.map((k, idx) => (
                            <React.Fragment key={String(k)}>
                                {renderPart(k)}
                                {splitPart === "all" && idx < renderKeys.length - 1 ? (
                                    <span className="intent-control-date-sep" aria-hidden>
                                        {separator}
                                    </span>
                                ) : null}
                            </React.Fragment>
                        ))}
                    </div>
                );
            }

            // single (naked)
            if (singleVariant === "native") {
                return (
                    <input
                        {...(nativeProps as React.InputHTMLAttributes<HTMLInputElement>)}
                        {...layoutProps}
                        ref={(n) => {
                            elSingleRef.current = n;
                            setRef(forwardedRef, n as any);
                        }}
                        className={cn(layoutProps.className, elCls)}
                        type="date"
                        value={value ?? ""}
                        onChange={(e) => handleSingleChange(e.target.value)}
                        disabled={disabled}
                        readOnly={readOnly}
                        min={min}
                        max={max}
                        {...commonAria}
                    />
                );
            }

            return (
                <input
                    {...(nativeProps as React.InputHTMLAttributes<HTMLInputElement>)}
                    {...layoutProps}
                    ref={(n) => {
                        elSingleRef.current = n;
                        setRef(forwardedRef, n as any);
                    }}
                    className={cn(layoutProps.className, elCls)}
                    type="text"
                    placeholder={
                        (nativeProps as any).placeholder ??
                        (order === "YMD" ? "YYYY-MM-DD" : "DD/MM/YYYY")
                    }
                    value={value ?? ""}
                    onChange={(e) => handleSingleTextChange(e.target.value)}
                    disabled={disabled}
                    readOnly={readOnly}
                    {...commonAria}
                />
            );
        }

        /* ============================================================================
           Standalone: root frame + slots
        ============================================================================ */

        const rootProps = {
            ...layoutProps,
            ...controlProps,
            className: cn(layoutProps.className, controlProps.className, standaloneRootCls),
            "data-intent": resolved.intent,
            "data-variant": resolved.variant,
            "data-intensity": resolved.intensity,
            "data-mode": resolved.mode,
            "data-tonestep": resolved.toneStep,
        } as const;

        return (
            <div {...(rootProps as any)}>
                {leading ? (
                    <span className="intent-control-date-leading" aria-hidden>
                        {leading}
                    </span>
                ) : null}

                {dateMode === "split" ? (
                    <div className="intent-control-date-split" role="group" {...commonAria}>
                        {orderKeys.map((k, idx) => {
                            const v = (parts[k] ?? "") as string;
                            const isYear = k === "year";
                            const maxLen = isYear ? 4 : 2;
                            const ariaLabel =
                                k === "day" ? dayLabel : k === "month" ? monthLabel : yearLabel;

                            return (
                                <React.Fragment key={String(k)}>
                                    <input
                                        ref={(n) => {
                                            if (k === "day") dayRef.current = n;
                                            if (k === "month") monthRef.current = n;
                                            if (k === "year") yearRef.current = n;
                                        }}
                                        inputMode="numeric"
                                        pattern="\d*"
                                        autoComplete="off"
                                        spellCheck={false}
                                        className={cn(elCls, "intent-control-date-part")}
                                        value={v}
                                        onChange={(e) => handleSplitChange(k, e.target.value)}
                                        onKeyDown={(e) => handleSplitKeyDown(k, e)}
                                        onPaste={handleSplitPaste}
                                        disabled={disabled}
                                        readOnly={readOnly}
                                        aria-label={ariaLabel}
                                        maxLength={maxLen}
                                    />
                                    {splitPart === "all" && idx < renderKeys.length - 1 ? (
                                        <span className="intent-control-date-sep" aria-hidden>
                                            {separator}
                                        </span>
                                    ) : null}
                                </React.Fragment>
                            );
                        })}
                    </div>
                ) : singleVariant === "native" ? (
                    <input
                        {...(nativeProps as React.InputHTMLAttributes<HTMLInputElement>)}
                        ref={(n) => {
                            elSingleRef.current = n;
                            setRef(forwardedRef, n as any);
                        }}
                        className={cn(elCls, "intent-control-date-part")}
                        type="date"
                        value={value ?? ""}
                        onChange={(e) => handleSingleChange(e.target.value)}
                        disabled={disabled}
                        readOnly={readOnly}
                        min={min}
                        max={max}
                        {...commonAria}
                    />
                ) : (
                    <input
                        {...(nativeProps as React.InputHTMLAttributes<HTMLInputElement>)}
                        ref={(n) => {
                            elSingleRef.current = n;
                            setRef(forwardedRef, n as any);
                        }}
                        className={cn(elCls, "intent-control-date-part")}
                        type="text"
                        placeholder={
                            (nativeProps as any).placeholder ??
                            (order === "YMD" ? "YYYY-MM-DD" : "DD/MM/YYYY")
                        }
                        value={value ?? ""}
                        onChange={(e) => handleSingleTextChange(e.target.value)}
                        disabled={disabled}
                        readOnly={readOnly}
                        {...commonAria}
                    />
                )}

                {trailing ? (
                    <span className="intent-control-date-trailing" aria-hidden>
                        {trailing}
                    </span>
                ) : null}
            </div>
        );
    }
);
