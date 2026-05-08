"use client";

// src/components/intent/IntentControlSegmented.tsx
// IntentControlSegmented
// - Segmented control (button-group) with intent-first visuals
// - Single-select (default) or multi-select (toggle group)
// - Uses resolveIntent() for group vars + per-segment visuals via getIntentControlProps()
// - Adds a sliding pill indicator (single only)
// - Glow layers now work like IntentControlButton
// - Sizes aligned with other control components
// - No dynamic Tailwind classes: only stable hooks + CSS tokens

import * as React from "react";

import { resolveIntent, getIntentControlProps, getIntentLayoutProps } from "CORE";
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

type SegmentedSize = "xs" | "sm" | "md" | "lg" | "xl";

function segHookClass(size: SegmentedSize) {
    switch (size) {
        case "xs":
            return "ids-seg-xs";
        case "sm":
            return "ids-seg-sm";
        case "lg":
            return "ids-seg-lg";
        case "xl":
            return "ids-seg-xl";
        default:
            return "ids-seg-md";
    }
}

function asArray(v: string | string[] | null | undefined): string[] {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

function uniq(arr: string[]) {
    return Array.from(new Set(arr));
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlSegmentedOption = {
    value: string;
    label: React.ReactNode;
    disabled?: boolean;
    text?: string;
};

export type IntentControlSegmentedProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        options: IntentControlSegmentedOption[];

        value?: string | null | string[];
        defaultValue?: string | null | string[];

        onValueChange?: (
            value: string | null | string[],
            meta?: { option?: IntentControlSegmentedOption }
        ) => void;

        multiple?: boolean; // default false
        allowEmpty?: boolean; // default true (single only)

        size?: SegmentedSize; // default md
        fullWidth?: boolean; // default false
        equal?: boolean; // default false

        inactiveVariant?: "ghost" | "outlined" | "flat" | "elevated"; // default ghost
        activeVariant?: "ghost" | "outlined" | "flat" | "elevated"; // default elevated

        inactiveIntent?: IntentInput["intent"];
        activeIntent?: IntentInput["intent"];

        inactiveTone?: IntentInput["tone"];
        activeTone?: IntentInput["tone"];

        inactiveGlow?: IntentInput["glow"];
        activeGlow?: IntentInput["glow"];

        inactiveIntensity?: IntentInput["intensity"];
        activeIntensity?: IntentInput["intensity"];

        ariaLabel?: string; // default "Segmented control"
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_SEGMENTED_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "options",
        description: {
            fr: "Segments rendus (value/label, disabled optionnel).",
            en: "Rendered segments (value/label, optional disabled).",
        },
        type: "IntentControlSegmentedOption[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Valeur contrôlée: string|null (single) ou string[] (multiple).",
            en: "Controlled value: string|null (single) or string[] (multiple).",
        },
        type: "string | null | string[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale non contrôlée.",
            en: "Initial uncontrolled value.",
        },
        type: "string | null | string[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback appelé quand la sélection change.",
            en: "Callback fired when selection changes.",
        },
        type: "(value: string | null | string[]) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "multiple",
        description: {
            fr: "Active le multi-select (toggle group).",
            en: "Enables multi-select (toggle group).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "allowEmpty",
        description: {
            fr: "En single: autorise aucune sélection (value=null).",
            en: "In single: allows no selection (value=null).",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille du segmented control (padding/hauteur/typo).",
            en: "Segmented control size (padding/height/typography).",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le groupe sur toute la largeur.",
            en: "Stretches the group to full width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "equal",
        description: {
            fr: "Force tous les segments à avoir la même largeur.",
            en: "Forces all segments to have the same width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "inactiveVariant",
        description: {
            fr: "Variant des segments inactifs.",
            en: "Variant for inactive segments.",
        },
        type: `"ghost" | "outlined" | "flat" | "elevated"`,
        required: false,
        default: "ghost",
        fromSystem: false,
    },
    {
        name: "activeVariant",
        description: {
            fr: "Variant des segments actifs.",
            en: "Variant for active segments.",
        },
        type: `"ghost" | "outlined" | "flat" | "elevated"`,
        required: false,
        default: "elevated",
        fromSystem: false,
    },
    {
        name: "inactiveIntent",
        description: {
            fr: "Intent des segments inactifs. Fallback sur l’intent du groupe.",
            en: "Intent for inactive segments. Falls back to group intent.",
        },
        type: "IntentName",
        required: false,
        fromSystem: false,
    },
    {
        name: "activeIntent",
        description: {
            fr: "Intent des segments actifs. Fallback sur l’intent du groupe.",
            en: "Intent for active segments. Falls back to group intent.",
        },
        type: "IntentName",
        required: false,
        fromSystem: false,
    },
    {
        name: "inactiveTone",
        description: {
            fr: "Tone des segments inactifs. Fallback sur le tone du groupe.",
            en: "Tone for inactive segments. Falls back to group tone.",
        },
        type: "ToneName",
        required: false,
        fromSystem: false,
    },
    {
        name: "activeTone",
        description: {
            fr: "Tone des segments actifs. Fallback sur le tone du groupe.",
            en: "Tone for active segments. Falls back to group tone.",
        },
        type: "ToneName",
        required: false,
        fromSystem: false,
    },
    {
        name: "inactiveGlow",
        description: {
            fr: "Glow des segments inactifs. Fallback sur le glow du groupe.",
            en: "Glow for inactive segments. Falls back to group glow.",
        },
        type: "GlowName | boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "activeGlow",
        description: {
            fr: "Glow des segments actifs. Fallback sur le glow du groupe.",
            en: "Glow for active segments. Falls back to group glow.",
        },
        type: "GlowName | boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "inactiveIntensity",
        description: {
            fr: "Intensity des segments inactifs. Fallback sur l’intensity du groupe.",
            en: "Intensity for inactive segments. Falls back to group intensity.",
        },
        type: "Intensity",
        required: false,
        fromSystem: false,
    },
    {
        name: "activeIntensity",
        description: {
            fr: "Intensity des segments actifs. Fallback sur l’intensity du groupe.",
            en: "Intensity for active segments. Falls back to group intensity.",
        },
        type: "Intensity",
        required: false,
        fromSystem: false,
    },
    {
        name: "ariaLabel",
        description: {
            fr: "Label ARIA du groupe.",
            en: "ARIA label for the group.",
        },
        type: "string",
        required: false,
        default: "Segmented control",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du div root (id, data-*, style...).",
            en: "Native div props for root (id, data-*, style...).",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'onChange'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlSegmentedPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_SEGMENTED_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlSegmentedIdentity: ComponentIdentity = {
    name: "IntentControlSegmented",
    kind: "control",
    description: {
        fr: "Segmented control intent-first : groupe de boutons toggle (single/multi) pour choisir un état, sans navigation.",
        en: "Intent-first segmented control: toggle button group (single/multi) for state selection (not navigation).",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-control-segmented" },
    anatomy: {
        root: "<div role='group'>",
        segment: "<button>",
        segmentLabel: ".intent-seg-label",
        pill: ".intent-seg-pill",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
    },
    classHooks: [
        "intent-control",
        "intent-control-segmented",
        "intent-seg",
        "intent-seg-btn",
        "intent-seg-label",
        "intent-seg-pill",
        "is-multiple",
        "is-disabled",
        "is-selected",
        "is-option-disabled",
        "is-equal",
        "ids-seg-xs",
        "ids-seg-sm",
        "ids-seg-md",
        "ids-seg-lg",
        "ids-seg-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlSegmented(props: IntentControlSegmentedProps) {
    const {
        className,
        options,

        value: valueProp,
        defaultValue,

        onValueChange,

        multiple = false,
        allowEmpty = true,

        size = "md",
        fullWidth = false,
        equal = false,

        inactiveVariant = "ghost",
        activeVariant = "elevated",

        inactiveIntent,
        activeIntent,

        inactiveTone,
        activeTone,

        inactiveGlow,
        activeGlow,

        inactiveIntensity,
        activeIntensity,

        ariaLabel = "Segmented control",

        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        ...divProps
    } = props;

    const disabled = Boolean(disabledProp);
    const isControlled = valueProp !== undefined;

    const initialUncontrolled = React.useMemo(() => {
        if (defaultValue !== undefined) return defaultValue;
        return multiple ? ([] as string[]) : (null as string | null);
    }, [defaultValue, multiple]);

    const [uncontrolled, setUncontrolled] = React.useState<string | null | string[]>(
        initialUncontrolled
    );

    const value = (isControlled ? valueProp : uncontrolled) ?? (multiple ? [] : null);
    const selected = multiple ? uniq(asArray(value as any)) : (value as string | null);

    const groupIntentInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const resolvedGroup = resolveIntent(groupIntentInput);
    const layoutProps = getIntentLayoutProps(resolvedGroup);
    const controlProps = getIntentControlProps(resolvedGroup, className);

    const hasGroupGlow = Boolean(resolvedGroup.glowBackground);
    const groupVariant = resolvedGroup.variant;

    const groupGlowAllowed = hasGroupGlow && groupVariant !== "ghost";
    const isGroupGlowed = resolvedGroup.intent === "glowed";

    const allowGroupFillGlow =
        groupGlowAllowed &&
        (isGroupGlowed || groupVariant === "flat" || groupVariant === "elevated");

    const allowGroupBorderGlow =
        groupGlowAllowed && (groupVariant === "outlined" || groupVariant === "elevated");

    const readGroupOpacity = (
        key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity"
    ) => {
        const raw = resolvedGroup.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    function emit(
        next: string | null | string[],
        meta?: { option?: IntentControlSegmentedOption }
    ) {
        if (!isControlled) setUncontrolled(next);
        onValueChange?.(next, meta);
    }

    function toggleOption(opt: IntentControlSegmentedOption) {
        if (disabled || opt.disabled) return;

        if (multiple) {
            const cur = asArray(selected as any);
            const exists = cur.includes(opt.value);
            const next = exists ? cur.filter((v) => v !== opt.value) : [...cur, opt.value];
            emit(uniq(next), { option: opt });
            return;
        }

        const cur = selected as string | null;
        if (cur === opt.value) {
            if (!allowEmpty) return;
            emit(null, { option: opt });
            return;
        }

        emit(opt.value, { option: opt });
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(e.key)) return;

        const t = e.target as HTMLElement | null;
        if (!t) return;

        const btn = t.closest("button[data-ids-seg]") as HTMLButtonElement | null;
        if (!btn) return;

        const all = Array.from(
            e.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-ids-seg]")
        );

        const enabled = all.filter((b) => !b.disabled);
        if (enabled.length === 0) return;

        const idx = enabled.indexOf(btn);
        if (idx < 0) return;

        e.preventDefault();

        let next: HTMLButtonElement | undefined;

        if (e.key === "Home") next = enabled[0];
        else if (e.key === "End") next = enabled[enabled.length - 1];
        else if (e.key === "ArrowLeft") next = enabled[(idx - 1 + enabled.length) % enabled.length];
        else if (e.key === "ArrowRight") next = enabled[(idx + 1) % enabled.length];

        next?.focus();
    }

    /* ============================================================================
       🟣 Sliding pill (single only)
    ============================================================================ */

    const rootRef = React.useRef<HTMLDivElement | null>(null);

    const [pill, setPill] = React.useState<{ x: number; w: number; visible: boolean }>({
        x: 0,
        w: 0,
        visible: false,
    });

    const selectedKey = !multiple ? (selected as string | null) : null;

    const measurePill = React.useCallback(() => {
        if (multiple) {
            setPill((p) => ({ ...p, visible: false }));
            return;
        }

        const root = rootRef.current;
        if (!root || !selectedKey) {
            setPill((p) => ({ ...p, visible: false }));
            return;
        }

        const btn = root.querySelector<HTMLButtonElement>(
            `button[data-ids-seg][data-value="${CSS.escape(selectedKey)}"]`
        );

        if (!btn) {
            setPill((p) => ({ ...p, visible: false }));
            return;
        }

        const r = root.getBoundingClientRect();
        const b = btn.getBoundingClientRect();

        setPill({
            x: b.left - r.left,
            w: b.width,
            visible: true,
        });
    }, [multiple, selectedKey]);

    React.useLayoutEffect(() => {
        measurePill();
    }, [
        measurePill,
        options,
        size,
        fullWidth,
        equal,
        inactiveVariant,
        activeVariant,
        inactiveIntent,
        activeIntent,
        inactiveTone,
        activeTone,
        inactiveGlow,
        activeGlow,
        inactiveIntensity,
        activeIntensity,
    ]);

    React.useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const ro = new ResizeObserver(() => measurePill());
        ro.observe(root);

        return () => ro.disconnect();
    }, [measurePill]);

    const rootCls = cn(
        "intent-control intent-control-segmented",
        "intent-seg",
        segHookClass(size),
        "relative inline-flex",
        fullWidth && "w-full",
        multiple && "is-multiple",
        disabled && "is-disabled",
        equal && "is-equal"
    );

    return (
        <div
            {...divProps}
            ref={(node) => {
                rootRef.current = node;
                const maybeRef = (divProps as any).ref;
                if (typeof maybeRef === "function") maybeRef(node);
                else if (maybeRef && typeof maybeRef === "object") maybeRef.current = node;
            }}
            {...layoutProps}
            {...controlProps}
            className={cn(layoutProps.className, controlProps.className, rootCls)}
            role="group"
            aria-label={ariaLabel}
            aria-disabled={disabled || undefined}
            data-intent={resolvedGroup.intent}
            data-variant={resolvedGroup.variant}
            data-intensity={resolvedGroup.intensity}
            data-mode={resolvedGroup.mode}
            onKeyDown={(e) => {
                (divProps as any).onKeyDown?.(e);
                if (e.defaultPrevented) return;
                onKeyDown(e);
            }}
        >
            {groupGlowAllowed ? (
                <>
                    {allowGroupFillGlow ? (
                        <span
                            aria-hidden
                            className="intent-glow-layer intent-glow-fill"
                            style={{ opacity: readGroupOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowGroupBorderGlow ? (
                        <span
                            aria-hidden
                            className="intent-glow-layer intent-glow-border"
                            style={{
                                opacity: readGroupOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            {!multiple ? (
                <span
                    aria-hidden
                    className={cn("intent-seg-pill", pill.visible ? "is-visible" : "is-hidden")}
                    style={{
                        transform: `translate3d(${pill.x}px, 0, 0)`,
                        width: `${pill.w}px`,
                    }}
                />
            ) : null}

            {options.map((opt) => {
                const isSelected = multiple
                    ? (selected as string[]).includes(opt.value)
                    : (selected as string | null) === opt.value;

                const segDisabled = disabled || Boolean(opt.disabled);

                const segIntent = isSelected
                    ? (activeIntent ?? intent)
                    : (inactiveIntent ?? intent);
                const segTone = isSelected ? (activeTone ?? tone) : (inactiveTone ?? tone);
                const segGlow = isSelected ? (activeGlow ?? glow) : (inactiveGlow ?? glow);
                const segIntensity = isSelected
                    ? (activeIntensity ?? intensity)
                    : (inactiveIntensity ?? intensity);

                const segResolved = resolveIntent({
                    ...(segIntent !== undefined ? { intent: segIntent } : {}),
                    ...(segTone !== undefined ? { tone: segTone } : {}),
                    ...(segGlow !== undefined ? { glow: segGlow } : {}),
                    ...(segIntensity !== undefined ? { intensity: segIntensity } : {}),
                    ...(mode !== undefined ? { mode } : {}),
                    variant: isSelected ? activeVariant : inactiveVariant,
                    disabled: segDisabled,
                });

                const segProps = getIntentControlProps(segResolved);

                const hasGlow = Boolean(segResolved.glowBackground);
                const segVariant = segResolved.variant;
                const glowAllowed = hasGlow && segVariant !== "ghost";
                const isGlowed = segResolved.intent === "glowed";
                const allowFillGlow =
                    glowAllowed && (isGlowed || segVariant === "flat" || segVariant === "elevated");
                const allowBorderGlow =
                    glowAllowed && (segVariant === "outlined" || segVariant === "elevated");

                const readOpacity = (
                    key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity"
                ) => {
                    const raw = segResolved.style?.[key] ?? "0";
                    const n = Number(raw.toString());
                    return Number.isFinite(n) ? n : 0;
                };

                const btnCls = cn(
                    "intent-seg-btn",
                    "relative inline-flex items-center justify-center",
                    "select-none whitespace-nowrap transition",
                    fullWidth && "flex-1",
                    equal && "is-equal",
                    isSelected && "is-selected",
                    segDisabled && "is-option-disabled"
                );

                const pressed = multiple ? isSelected : undefined;

                return (
                    <button
                        key={opt.value}
                        type="button"
                        {...segProps}
                        className={cn(segProps.className, btnCls)}
                        disabled={segDisabled}
                        data-ids-seg
                        data-value={opt.value}
                        aria-pressed={pressed}
                        aria-checked={!multiple ? isSelected : undefined}
                        role={multiple ? "button" : "radio"}
                        onClick={() => toggleOption(opt)}
                    >
                        {glowAllowed ? (
                            <>
                                {allowFillGlow ? (
                                    <span
                                        aria-hidden
                                        className="intent-glow-layer intent-glow-fill"
                                        style={{
                                            opacity: readOpacity("--intent-glow-fill-opacity"),
                                        }}
                                    />
                                ) : null}

                                {allowBorderGlow ? (
                                    <span
                                        aria-hidden
                                        className="intent-glow-layer intent-glow-border"
                                        style={{
                                            opacity: readOpacity("--intent-glow-border-opacity"),
                                            borderRadius: "inherit",
                                        }}
                                    />
                                ) : null}
                            </>
                        ) : null}

                        <span className="relative z-10 intent-seg-label">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
