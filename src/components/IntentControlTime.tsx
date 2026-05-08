"use client";

// src/components/intent/IntentControlTime.tsx
// IntentControlTime
// - Intent-first time input (single or split)
// - Single mode: native <input type="time"> (default) OR text input for custom formatting
// - Split mode: 2 inputs (hour/minute) with smart focus + paste parsing + strict HH:MM validation
// - Split supports solo mode via splitPart: "all" | "hour" | "minute"
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

type TimeSize = "xs" | "sm" | "md" | "lg" | "xl";
type TimeMode = "single" | "split";
type TimePart = "hour" | "minute";

function sizeClass(size: TimeSize) {
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

function isValidTime(iso: string) {
    // strict HH:MM (00-23 : 00-59)
    const m = /^(\d{2}):(\d{2})$/.exec(iso);
    if (!m) return false;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false;
    if (hh < 0 || hh > 23) return false;
    if (mm < 0 || mm > 59) return false;
    return true;
}

function compareTime(a: string, b: string) {
    // works lexicographically for HH:MM
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

export type TimeParts = {
    hour?: string;
    minute?: string;
};

function pickParts(p: { hour?: string | undefined; minute?: string | undefined }): TimeParts {
    const next: TimeParts = {};
    if (p.hour !== undefined) next.hour = p.hour;
    if (p.minute !== undefined) next.minute = p.minute;
    return next;
}

function normalizePartsForInputs(p: TimeParts): Required<TimeParts> {
    return {
        hour: p.hour ?? "",
        minute: p.minute ?? "",
    };
}

function partsToTime(parts: { hour?: string; minute?: string }) {
    const h = parts.hour ? onlyDigits(parts.hour) : "";
    const m = parts.minute ? onlyDigits(parts.minute) : "";
    if (h.length < 1 || m.length < 1) return null;

    const hh = clampInt(Number(h), 0, 23);
    const mm = clampInt(Number(m), 0, 59);

    return `${pad2(hh)}:${pad2(mm)}`;
}

function parseLooseTimeToParts(raw: string): TimeParts | null {
    const s = raw.trim();

    // 1) HH:MM
    const hm = /^(\d{1,2}):(\d{1,2})$/.exec(s);
    if (hm) return pickParts({ hour: hm[1], minute: hm[2] });

    // 2) HHhMM / HHh / HH (common FR inputs)
    const hhmmH = /^(\d{1,2})\s*[hH]\s*(\d{1,2})$/.exec(s);
    if (hhmmH) return pickParts({ hour: hhmmH[1], minute: hhmmH[2] });

    const hhOnlyH = /^(\d{1,2})\s*[hH]\s*$/.exec(s);
    if (hhOnlyH) return pickParts({ hour: hhOnlyH[1], minute: "" });

    // 3) digits only:
    const digits = onlyDigits(s);
    if (digits.length === 4) {
        return pickParts({ hour: digits.slice(0, 2), minute: digits.slice(2, 4) });
    }
    if (digits.length === 3) {
        // e.g. 930 => 09:30
        return pickParts({ hour: digits.slice(0, 1), minute: digits.slice(1, 3) });
    }
    if (digits.length === 2) {
        // e.g. 09 => hour only
        return pickParts({ hour: digits, minute: "" });
    }

    return null;
}

type TimeChangeMeta = {
    mode: TimeMode;
    isComplete: boolean;
    isValid: boolean;
    parts: TimeParts;
};

/* ============================================================================
   🧩 TYPES
============================================================================ */

type BaseProps = IntentInput & {
    className?: string;

    /** Visual / layout */
    size?: TimeSize; // default: "md"
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
    timeMode?: TimeMode; // default "single"

    /**
     * Single mode:
     * - native (default): input type="time"
     * - text: input type="text" with your own placeholders/format
     */
    singleVariant?: "native" | "text"; // default "native"

    /**
     * Split mode only:
     * - "all" (default) renders hour+minute
     * - "hour" | "minute" renders only one input (solo mode)
     *
     * Useful to compose 2 separate fields in a form (hour / minute).
     */
    splitPart?: "all" | "hour" | "minute"; // default "all"

    /** Split mode: separator */
    separator?: string; // default ":"

    /** Labels for a11y (split) */
    hourLabel?: string; // default "Heure"
    minuteLabel?: string; // default "Minute"

    /**
     * Value model:
     * - value is "HH:MM" or null/undefined
     * - onValueChange fires for both modes
     */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null, meta: TimeChangeMeta) => void;

    /**
     * Optional controlled split parts (advanced).
     * If provided, split inputs use these strings as their sources.
     */
    parts?: TimeParts;
    defaultParts?: TimeParts;
    onPartsChange?: (parts: TimeParts) => void;

    /** Constraints ("HH:MM") */
    min?: string;
    max?: string;

    /** Optional tone for auto “toned” fallback inside Intents usage */
    tonedFallbackTone?: Tone; // default "emerald"
};

export type IntentControlTimeProps = BaseProps &
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

const INTENT_CONTROL_TIME_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "timeMode",
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
            fr: "En mode single: natif (type=time) ou texte (type=text).",
            en: "In single mode: native (type=time) or text (type=text).",
        },
        type: `"native" | "text"`,
        required: false,
        default: "native",
        fromSystem: false,
    },
    {
        name: "splitPart",
        description: {
            fr: 'En mode split: "all" affiche heure+minute. "hour" | "minute" permet le mode solo (un seul champ).',
            en: 'In split mode: "all" renders hour+minute. "hour" | "minute" enables solo mode (single field only).',
        },
        type: `"all" | "hour" | "minute"`,
        required: false,
        default: "all",
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
        default: ":",
        fromSystem: false,
    },
    {
        name: "value",
        description: { fr: "Valeur (HH:MM).", en: "Value (HH:MM)." },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale si uncontrolled.",
            en: "Initial value if uncontrolled.",
        },
        type: "string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback valeur (ou null) + meta (validité, parts…).",
            en: "Value callback (or null) + meta (validity, parts…).",
        },
        type: "(value: string | null, meta: TimeChangeMeta) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "parts",
        description: {
            fr: "Parts contrôlées (split, avancé).",
            en: "Controlled parts (split, advanced).",
        },
        type: "{ hour?: string; minute?: string }",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultParts",
        description: {
            fr: "Parts initiales (split, uncontrolled).",
            en: "Initial parts (split, uncontrolled).",
        },
        type: "{ hour?: string; minute?: string }",
        required: false,
        fromSystem: false,
    },
    {
        name: "onPartsChange",
        description: { fr: "Callback parts (split).", en: "Parts callback (split)." },
        type: "(parts: TimeParts) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "min / max",
        description: { fr: "Bornes (HH:MM).", en: "Bounds (HH:MM)." },
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

export const IntentControlTimePropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_TIME_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlTimeIdentity: ComponentIdentity = {
    name: "IntentControlTime",
    kind: "control",
    description: {
        fr: "Contrôle de temps intent-first: input unique (natif ou texte) ou 2 inputs séparés (heure/minute) avec validation et paste.",
        en: "Intent-first time control: single input (native or text) or split inputs (hour/minute) with validation and paste.",
    },
    since: "0.3.3",
    docs: { route: "/playground/components/intent-control-time" },
    anatomy: {
        root: "<div> (standalone only)",
        input: "<input> (single) or inputs group (split)",
        leading: ".intent-control-time-leading (standalone only)",
        trailing: ".intent-control-time-trailing (standalone only)",
        splitWrap: ".intent-control-time-split",
        part: ".intent-control-time-part",
        sep: ".intent-control-time-sep",
    },
    classHooks: [
        "intent-control",
        "intent-control-time",
        "intent-control-time-standalone",
        "intent-control-time-naked",
        "intent-control-time-el",
        "intent-control-time-leading",
        "intent-control-time-trailing",
        "intent-control-time-split",
        "intent-control-time-part",
        "intent-control-time-sep",
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

export const IntentControlTime = React.forwardRef<HTMLInputElement, IntentControlTimeProps>(
    function IntentControlTime(props, forwardedRef) {
        const {
            className,

            size = "md",
            fullWidth = false,

            leading,
            trailing,

            invalid = false,
            readOnly = false,
            insideField = false,

            timeMode = "single",
            singleVariant = "native",

            splitPart = "all",
            separator = ":",

            hourLabel = "Heure",
            minuteLabel = "Minute",

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
        const hourRef = React.useRef<HTMLInputElement | null>(null);
        const minuteRef = React.useRef<HTMLInputElement | null>(null);

        React.useEffect(() => {
            // forward the "main" ref:
            // - single => single input
            // - split  => hour input (first)
            const node = timeMode === "split" ? hourRef.current : elSingleRef.current;
            setRef(forwardedRef, node as any);
        }, [forwardedRef, timeMode]);

        /* ============================================================================
           State model (value + parts)
        ============================================================================ */

        const isControlledValue = valueProp !== undefined;
        const [uncontrolledValue, setUncontrolledValue] = React.useState<string | null>(
            defaultValue ?? null
        );

        const value = isControlledValue ? (valueProp ?? null) : uncontrolledValue;

        const initialPartsFromValue = React.useMemo<TimeParts>(() => {
            if (value && isValidTime(value)) {
                const m = /^(\d{2}):(\d{2})$/.exec(value);
                if (m) return pickParts({ hour: m[1], minute: m[2] });
            }
            return {};
        }, [value]);

        const isControlledParts = partsProp !== undefined;

        const [uncontrolledParts, setUncontrolledParts] = React.useState<Required<TimeParts>>(
            () => {
                const base = defaultParts ?? initialPartsFromValue;
                return normalizePartsForInputs(base);
            }
        );

        const parts: Required<TimeParts> = isControlledParts
            ? normalizePartsForInputs(partsProp ?? {})
            : uncontrolledParts;

        // keep uncontrolled parts in sync when value changes externally (common case)
        React.useEffect(() => {
            if (timeMode !== "split") return;
            if (isControlledParts) return;
            if (!value || !isValidTime(value)) return;

            const m = /^(\d{2}):(\d{2})$/.exec(value);
            if (!m) return;

            const next = normalizePartsForInputs(pickParts({ hour: m[1], minute: m[2] }));

            setUncontrolledParts((prev) => {
                const same = prev.hour === next.hour && prev.minute === next.minute;
                return same ? prev : next;
            });
        }, [value, timeMode, isControlledParts]);

        function emitValue(nextTime: string | null, nextParts: TimeParts) {
            const isComplete =
                Boolean(nextParts.hour && onlyDigits(nextParts.hour).length >= 1) &&
                Boolean(nextParts.minute && onlyDigits(nextParts.minute).length >= 1);

            const isValid = nextTime ? isValidTime(nextTime) : false;

            // min/max validation (if value is valid)
            let boundedValid = isValid;
            if (
                boundedValid &&
                nextTime &&
                min &&
                isValidTime(min) &&
                compareTime(nextTime, min) < 0
            )
                boundedValid = false;
            if (
                boundedValid &&
                nextTime &&
                max &&
                isValidTime(max) &&
                compareTime(nextTime, max) > 0
            )
                boundedValid = false;

            const meta: TimeChangeMeta = {
                mode: timeMode,
                isComplete,
                isValid: boundedValid,
                parts: nextParts,
            };

            if (!isControlledValue) setUncontrolledValue(nextTime);
            onValueChange?.(nextTime, meta);
        }

        function setParts(next: TimeParts) {
            const normalized = normalizePartsForInputs(next);

            if (!isControlledParts) setUncontrolledParts(normalized);
            onPartsChange?.(normalized);

            const t = partsToTime(normalized);
            emitValue(t, normalized);
        }

        /* ============================================================================
           Split mode: input behaviors
        ============================================================================ */

        const renderKeys: Array<keyof TimeParts> = React.useMemo(() => {
            if (timeMode !== "split") return [];
            if (splitPart === "all") return ["hour", "minute"];
            return [splitPart];
        }, [timeMode, splitPart]);

        function partRef(k: keyof TimeParts) {
            return k === "hour" ? hourRef : minuteRef;
        }

        function focusNext(k: keyof TimeParts) {
            const idx = renderKeys.indexOf(k);
            const next = renderKeys[idx + 1];
            if (!next) return;
            partRef(next).current?.focus();
            partRef(next).current?.select?.();
        }

        function focusPrev(k: keyof TimeParts) {
            const idx = renderKeys.indexOf(k);
            const prev = renderKeys[idx - 1];
            if (!prev) return;
            partRef(prev).current?.focus();
            partRef(prev).current?.select?.();
        }

        function handleSplitKeyDown(k: keyof TimeParts, e: React.KeyboardEvent<HTMLInputElement>) {
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
            const parsed = parseLooseTimeToParts(text);
            if (!parsed) return;

            e.preventDefault();

            const normalized = normalizePartsForInputs({
                hour: parsed.hour ? onlyDigits(parsed.hour).slice(0, 2) : "",
                minute: parsed.minute ? onlyDigits(parsed.minute).slice(0, 2) : "",
            });

            if (splitPart !== "all") {
                const k = splitPart as TimePart;
                setParts({ ...parts, [k]: normalized[k] });
                return;
            }

            // all: remplit tout
            setParts(normalized);

            // focus last field for quick finishing
            minuteRef.current?.focus();
            minuteRef.current?.select?.();
        }

        function handleSplitChange(k: keyof TimeParts, raw: string) {
            if (disabled) return;

            const digits = onlyDigits(raw);
            let next: TimeParts = { ...parts };

            if (k === "hour") next.hour = digits.slice(0, 2);
            if (k === "minute") next.minute = digits.slice(0, 2);

            setParts(next);

            // Auto-advance rules
            if (k === "hour") {
                if (digits.length >= 2) focusNext(k);
            }
        }

        /* ============================================================================
           Single mode: value behaviors
        ============================================================================ */

        function handleSingleChange(next: string) {
            if (disabled) return;

            const t = next ? String(next) : "";
            const nextTime = t ? t : null;

            const nextParts =
                nextTime && isValidTime(nextTime)
                    ? pickParts({
                          hour: nextTime.slice(0, 2),
                          minute: nextTime.slice(3, 5),
                      })
                    : {};

            emitValue(nextTime, nextParts);
        }

        function handleSingleTextChange(raw: string) {
            if (disabled) return;

            const parsed = parseLooseTimeToParts(raw);
            if (!parsed) {
                emitValue(null, {});
                return;
            }

            const nextParts: TimeParts = normalizePartsForInputs({
                hour: parsed.hour ? onlyDigits(parsed.hour).slice(0, 2) : "",
                minute: parsed.minute ? onlyDigits(parsed.minute).slice(0, 2) : "",
            });

            const t = partsToTime(nextParts);
            emitValue(t, nextParts);
        }

        /* ============================================================================
           Class hooks (stable)
        ============================================================================ */

        const rootModeHook = timeMode === "split" ? "is-split" : "is-single";

        const elCls = cn(
            "intent-control-time-el",
            sizeClass(size),
            fullWidth && "w-full",
            invalid && "is-invalid",
            disabled && "is-disabled",
            readOnly && "is-readonly",
            insideField ? "intent-control-time-naked" : "intent-control-time-standalone",
            className
        );

        const splitPartHook = timeMode === "split" ? `split-part split-part-${splitPart}` : null;

        const standaloneRootCls = cn(
            "intent-control intent-control-time",
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
            if (timeMode === "split") {
                const renderPart = (k: keyof TimeParts) => {
                    const v = (parts[k] ?? "") as string;
                    const ariaLabel = k === "hour" ? hourLabel : minuteLabel;

                    return (
                        <input
                            key={k}
                            ref={(n) => {
                                if (k === "hour") hourRef.current = n;
                                if (k === "minute") minuteRef.current = n;
                            }}
                            inputMode="numeric"
                            pattern="\d*"
                            autoComplete="off"
                            spellCheck={false}
                            className={cn(layoutProps.className, elCls, "intent-control-time-part")}
                            value={v}
                            onChange={(e) => handleSplitChange(k, e.target.value)}
                            onKeyDown={(e) => handleSplitKeyDown(k, e)}
                            onPaste={handleSplitPaste}
                            disabled={disabled}
                            readOnly={readOnly}
                            aria-label={ariaLabel}
                            maxLength={2}
                            {...commonAria}
                        />
                    );
                };

                return (
                    <div
                        {...layoutProps}
                        className={cn(
                            layoutProps.className,
                            "intent-control-time-split",
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
                                    <span className="intent-control-time-sep" aria-hidden>
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
                        type="time"
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
                    placeholder={(nativeProps as any).placeholder ?? "HH:MM"}
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
                    <span className="intent-control-time-leading" aria-hidden>
                        {leading}
                    </span>
                ) : null}

                {timeMode === "split" ? (
                    <div className="intent-control-time-split" role="group" {...commonAria}>
                        {renderKeys.map((k, idx) => {
                            const v = (parts[k] ?? "") as string;
                            const ariaLabel = k === "hour" ? hourLabel : minuteLabel;

                            return (
                                <React.Fragment key={String(k)}>
                                    <input
                                        ref={(n) => {
                                            if (k === "hour") hourRef.current = n;
                                            if (k === "minute") minuteRef.current = n;
                                        }}
                                        inputMode="numeric"
                                        pattern="\d*"
                                        autoComplete="off"
                                        spellCheck={false}
                                        className={cn(elCls, "intent-control-time-part")}
                                        value={v}
                                        onChange={(e) => handleSplitChange(k, e.target.value)}
                                        onKeyDown={(e) => handleSplitKeyDown(k, e)}
                                        onPaste={handleSplitPaste}
                                        disabled={disabled}
                                        readOnly={readOnly}
                                        aria-label={ariaLabel}
                                        maxLength={2}
                                    />
                                    {splitPart === "all" && idx < renderKeys.length - 1 ? (
                                        <span className="intent-control-time-sep" aria-hidden>
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
                        className={cn(elCls, "intent-control-time-part")}
                        type="time"
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
                        className={cn(elCls, "intent-control-time-part")}
                        type="text"
                        placeholder={(nativeProps as any).placeholder ?? "HH:MM"}
                        value={value ?? ""}
                        onChange={(e) => handleSingleTextChange(e.target.value)}
                        disabled={disabled}
                        readOnly={readOnly}
                        {...commonAria}
                    />
                )}

                {trailing ? (
                    <span className="intent-control-time-trailing" aria-hidden>
                        {trailing}
                    </span>
                ) : null}
            </div>
        );
    }
);
