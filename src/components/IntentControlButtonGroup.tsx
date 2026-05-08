"use client";

// src/components/intent/IntentControlButtonGroup.tsx
// IntentControlButtonGroup
// - Intent-first grouped buttons/links
// - Built on top of IntentControlButton / IntentControlLink
// - Supports toggleable items
// - Selection modes: none | single | multiple
// - Controlled / uncontrolled value
// - Horizontal / vertical layouts
// - Optional attached mode
// - Basic keyboard navigation (arrow keys + Home/End)
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import { resolveIntent, getIntentLayoutProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type IntentInput,
    type DocsPropRow,
    type ComponentIdentity,
} from "SYSTEM";

import { IntentControlButton, type IntentControlButtonProps } from "./IntentControlButton";
import { IntentControlLink, type IntentControlLinkProps } from "./IntentControlLink";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export type GroupSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: GroupSize) {
    switch (size) {
        case "xs":
            return "ids-btn-group-xs";
        case "sm":
            return "ids-btn-group-sm";
        case "lg":
            return "ids-btn-group-lg";
        case "xl":
            return "ids-btn-group-xl";
        default:
            return "ids-btn-group-md";
    }
}

function normalizeValue(
    value: IntentControlButtonGroupValue | undefined,
    selectionMode: IntentControlButtonGroupSelectionMode
): string | string[] | null {
    if (selectionMode === "multiple") {
        return Array.isArray(value) ? value : [];
    }

    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
}

function arraysEqual(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlButtonGroupSelectionMode = "none" | "single" | "multiple";
export type IntentControlButtonGroupOrientation = "horizontal" | "vertical";
export type IntentControlButtonGroupJustify = "start" | "center" | "end" | "stretch" | "between";
export type IntentControlButtonGroupValue = string | string[] | null;

type BaseItem = {
    value: string;
    label: React.ReactNode;
    disabled?: boolean;
    className?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
};

export type IntentControlButtonGroupButtonItem = BaseItem & {
    kind?: "button";
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export type IntentControlButtonGroupLinkItem = BaseItem & {
    kind: "link";
    href: string;
    target?: React.HTMLAttributeAnchorTarget;
    rel?: string;
    external?: boolean;
    internal?: boolean;
    onNavigate?: IntentControlLinkProps["onNavigate"];
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export type IntentControlButtonGroupItem =
    | IntentControlButtonGroupButtonItem
    | IntentControlButtonGroupLinkItem;

export type IntentControlButtonGroupProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        items: IntentControlButtonGroupItem[];

        value?: IntentControlButtonGroupValue;
        defaultValue?: IntentControlButtonGroupValue;
        onValueChange?: (
            value: IntentControlButtonGroupValue,
            item?: IntentControlButtonGroupItem
        ) => void;

        size?: GroupSize;
        fullWidth?: boolean;

        selectionMode?: IntentControlButtonGroupSelectionMode; // default "single"
        allowDeselect?: boolean; // default false (single only)
        readOnly?: boolean; // default false

        orientation?: IntentControlButtonGroupOrientation; // default "horizontal"
        attached?: boolean; // default false
        wrap?: boolean; // default false
        justify?: IntentControlButtonGroupJustify; // default "start"

        /**
         * If true, all items receive fullWidth-like behavior inside the group.
         * Especially useful with justify="stretch" or vertical layout.
         */
        equalWidth?: boolean; // default false

        activeIntent?: IntentInput["intent"];
        activeVariant?: IntentInput["variant"];
        activeTone?: IntentInput["tone"];
        activeGlow?: IntentInput["glow"];
        activeIntensity?: IntentInput["intensity"];
        activeMode?: IntentInput["mode"];

        /**
         * Style spécifique appliqué aux items actifs.
         * Si une clé n'est pas fournie, on retombe sur les props du groupe.
         * Prioritaire sur activeIntent / activeVariant / activeTone / activeGlow / activeIntensity / activeMode.
         */
        activeStyle?: Partial<IntentInput>;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_BUTTON_GROUP_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "items",
        description: {
            fr: "Liste des items du groupe (boutons ou liens).",
            en: "Group items (buttons or links).",
        },
        type: "IntentControlButtonGroupItem[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "value",
        description: {
            fr: "Valeur contrôlée: string | string[] | null selon le mode de sélection.",
            en: "Controlled value: string | string[] | null depending on selection mode.",
        },
        type: "string | string[] | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Valeur initiale non contrôlée.",
            en: "Initial uncontrolled value.",
        },
        type: "string | string[] | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback quand la sélection change.",
            en: "Called when selection changes.",
        },
        type: "(value, item?) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "selectionMode",
        description: {
            fr: "Mode de sélection: none, single ou multiple.",
            en: "Selection mode: none, single or multiple.",
        },
        type: `"none" | "single" | "multiple"`,
        required: false,
        default: "single",
        fromSystem: false,
    },
    {
        name: "allowDeselect",
        description: {
            fr: "Autorise la désélection en mode single.",
            en: "Allows deselection in single mode.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Empêche les changements de sélection tout en gardant le groupe focusable.",
            en: "Prevents selection changes while keeping the group focusable.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "orientation",
        description: {
            fr: "Orientation du groupe.",
            en: "Group orientation.",
        },
        type: `"horizontal" | "vertical"`,
        required: false,
        default: "horizontal",
        fromSystem: false,
    },
    {
        name: "attached",
        description: {
            fr: "Fusionne visuellement les boutons comme un groupe attaché.",
            en: "Visually merges buttons into an attached group.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "wrap",
        description: {
            fr: "Autorise le retour à la ligne en horizontal.",
            en: "Allows wrapping in horizontal layout.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "justify",
        description: {
            fr: "Alignement des items dans le groupe.",
            en: "Item alignment inside the group.",
        },
        type: `"start" | "center" | "end" | "between" | "stretch"`,
        required: false,
        default: "start",
        fromSystem: false,
    },
    {
        name: "equalWidth",
        description: {
            fr: "Donne une largeur homogène aux items.",
            en: "Gives items equal width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille propagée aux items.",
            en: "Size propagated to items.",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le groupe sur toute la largeur disponible.",
            en: "Stretches the group to full available width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "activeIntent / activeVariant / activeTone / activeGlow / activeIntensity / activeMode",
        description: {
            fr: "Style alternatif appliqué aux items actifs. Les valeurs manquantes héritent du style du groupe.",
            en: "Alternate style applied to active items. Missing values inherit from the group style.",
        },
        type: "IntentInput partial fields",
        required: false,
        fromSystem: false,
    },
    {
        name: "activeStyle",
        description: {
            fr: "Objet de style appliqué aux items actifs, prioritaire sur les props active*.",
            en: "Style object applied to active items, takes priority over active* props.",
        },
        type: "Partial<IntentInput>",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives du conteneur div.",
            en: "Native div props.",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'onChange'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlButtonGroupPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_BUTTON_GROUP_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlButtonGroupIdentity: ComponentIdentity = {
    name: "IntentControlButtonGroup",
    kind: "control",
    description: {
        fr: "Groupe de boutons/liens intent-first, avec états toggleables et sélection single/multiple.",
        en: "Intent-first button/link group with toggleable states and single/multiple selection.",
    },
    since: "0.2.11",
    docs: {
        route: "/playground/components/intent-control-button-group",
    },
    anatomy: {
        root: "<div>",
        item: ".intent-control-button-group-item",
        button: ".intent-control-button",
        link: ".intent-control-link",
    },
    classHooks: [
        "intent-control-button-group",
        "intent-control-button-group-item",
        "is-disabled",
        "is-readonly",
        "is-attached",
        "is-fullWidth",
        "is-equalWidth",
        "is-wrap",
        "is-single",
        "is-multiple",
        "is-none",
        "is-vertical",
        "is-horizontal",
        "justify-start",
        "justify-center",
        "justify-end",
        "justify-stretch",
        "ids-btn-group-xs",
        "ids-btn-group-sm",
        "ids-btn-group-md",
        "ids-btn-group-lg",
        "ids-btn-group-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlButtonGroup(props: IntentControlButtonGroupProps) {
    const {
        className,
        items,
        value: valueProp,
        defaultValue = null,
        onValueChange,

        size = "md",
        fullWidth = false,

        selectionMode = "single",
        allowDeselect = false,
        readOnly = false,

        orientation = "horizontal",
        attached = false,
        wrap = false,
        justify = "start",
        equalWidth = false,

        activeIntent,
        activeVariant,
        activeTone,
        activeGlow,
        activeIntensity,
        activeMode,
        activeStyle,

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

    const normalizedDefaultValue = React.useMemo(
        () => normalizeValue(defaultValue, selectionMode),
        [defaultValue, selectionMode]
    );

    const [uncontrolledValue, setUncontrolledValue] =
        React.useState<IntentControlButtonGroupValue>(normalizedDefaultValue);

    const rawValue = isControlled ? valueProp : uncontrolledValue;
    const normalizedValue = normalizeValue(rawValue, selectionMode);

    const selectedSet = React.useMemo(() => {
        if (selectionMode === "multiple") {
            return new Set(Array.isArray(normalizedValue) ? normalizedValue : []);
        }

        const single = typeof normalizedValue === "string" ? normalizedValue : null;
        return new Set(single ? [single] : []);
    }, [normalizedValue, selectionMode]);

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

    const itemRefs = React.useRef<Array<HTMLElement | null>>([]);

    const commitValue = React.useCallback(
        (next: IntentControlButtonGroupValue, item?: IntentControlButtonGroupItem) => {
            if (!isControlled) {
                setUncontrolledValue(next);
            }
            onValueChange?.(next, item);
        },
        [isControlled, onValueChange]
    );

    const toggleItem = React.useCallback(
        (item: IntentControlButtonGroupItem) => {
            if (disabled || readOnly || item.disabled) return;

            if (selectionMode === "none") {
                return;
            }

            if (selectionMode === "single") {
                const current = typeof normalizedValue === "string" ? normalizedValue : null;

                if (current === item.value) {
                    if (allowDeselect) commitValue(null, item);
                    return;
                }

                commitValue(item.value, item);
                return;
            }

            const current = Array.isArray(normalizedValue) ? normalizedValue : [];
            const exists = current.includes(item.value);

            const next = exists
                ? current.filter((v) => v !== item.value)
                : [...current, item.value];

            if (!arraysEqual(current, next)) {
                commitValue(next, item);
            }
        },
        [disabled, readOnly, selectionMode, normalizedValue, allowDeselect, commitValue]
    );

    const moveFocus = React.useCallback(
        (fromIndex: number, dir: 1 | -1) => {
            const len = items.length;
            if (len === 0) return;

            let idx = fromIndex;

            for (let step = 0; step < len; step++) {
                idx += dir;
                if (idx < 0) idx = len - 1;
                if (idx >= len) idx = 0;

                const item = items[idx];
                if (!item || item.disabled) continue;

                itemRefs.current[idx]?.focus();
                return;
            }
        },
        [items]
    );

    const rootCls = cn(
        "intent-control-button-group",
        sizeClass(size),
        fullWidth && "is-fullWidth",
        equalWidth && "is-equalWidth",
        attached && "is-attached",
        wrap && "is-wrap",
        disabled && "is-disabled",
        readOnly && "is-readonly",
        orientation === "vertical" ? "is-vertical" : "is-horizontal",
        selectionMode === "multiple"
            ? "is-multiple"
            : selectionMode === "none"
              ? "is-none"
              : "is-single",
        justify === "center"
            ? "justify-center"
            : justify === "end"
              ? "justify-end"
              : justify === "stretch"
                ? "justify-stretch"
                : justify === "between"
                  ? "justify-between"
                  : "justify-start"
    );

    const sharedIntentProps = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
    } satisfies Partial<IntentInput>;

    const sharedActiveIntentProps = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),

        ...(activeIntent !== undefined ? { intent: activeIntent } : {}),
        ...(activeVariant !== undefined ? { variant: activeVariant } : {}),
        ...(activeTone !== undefined ? { tone: activeTone } : {}),
        ...(activeGlow !== undefined ? { glow: activeGlow } : {}),
        ...(activeIntensity !== undefined ? { intensity: activeIntensity } : {}),
        ...(activeMode !== undefined ? { mode: activeMode } : {}),

        ...(activeStyle?.intent !== undefined ? { intent: activeStyle.intent } : {}),
        ...(activeStyle?.variant !== undefined ? { variant: activeStyle.variant } : {}),
        ...(activeStyle?.tone !== undefined ? { tone: activeStyle.tone } : {}),
        ...(activeStyle?.glow !== undefined ? { glow: activeStyle.glow } : {}),
        ...(activeStyle?.intensity !== undefined ? { intensity: activeStyle.intensity } : {}),
        ...(activeStyle?.mode !== undefined ? { mode: activeStyle.mode } : {}),
    } satisfies Partial<IntentInput>;

    return (
        <div
            {...divProps}
            style={layoutProps.style}
            className={cn(layoutProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
            role="group"
            aria-disabled={disabled || undefined}
            aria-readonly={readOnly || undefined}
        >
            {items.map((item, idx) => {
                const selected = selectedSet.has(item.value);
                const itemDisabled = disabled || Boolean(item.disabled);

                const commonClassName = cn(
                    "intent-control-button-group-item",
                    equalWidth && "is-equalWidth",
                    item.className
                );

                const commonHandlers = {
                    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
                        if (orientation === "horizontal") {
                            if (e.key === "ArrowRight") {
                                e.preventDefault();
                                moveFocus(idx, 1);
                                return;
                            }
                            if (e.key === "ArrowLeft") {
                                e.preventDefault();
                                moveFocus(idx, -1);
                                return;
                            }
                        } else {
                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                moveFocus(idx, 1);
                                return;
                            }
                            if (e.key === "ArrowUp") {
                                e.preventDefault();
                                moveFocus(idx, -1);
                                return;
                            }
                        }

                        if (e.key === "Home") {
                            e.preventDefault();
                            itemRefs.current[0]?.focus();
                            return;
                        }

                        if (e.key === "End") {
                            e.preventDefault();
                            itemRefs.current[items.length - 1]?.focus();
                        }
                    },
                };

                if (item.kind === "link") {
                    return (
                        <IntentControlLink
                            key={item.value}
                            ref={(node: HTMLAnchorElement | null) => {
                                itemRefs.current[idx] = node;
                            }}
                            {...(selected ? sharedActiveIntentProps : sharedIntentProps)}
                            size={size}
                            fullWidth={equalWidth || justify === "stretch"}
                            className={commonClassName}
                            disabled={itemDisabled}
                            leftIcon={item.leftIcon}
                            rightIcon={item.rightIcon}
                            href={item.href}
                            {...(item.target !== undefined ? { target: item.target } : {})}
                            {...(item.rel !== undefined ? { rel: item.rel } : {})}
                            {...(item.external !== undefined ? { external: item.external } : {})}
                            {...(item.internal !== undefined ? { internal: item.internal } : {})}
                            {...(item.onNavigate !== undefined
                                ? { onNavigate: item.onNavigate }
                                : {})}
                            aria-pressed={selectionMode !== "none" ? selected : undefined}
                            onClick={(e) => {
                                item.onClick?.(e);
                                if (e.defaultPrevented) return;

                                if (selectionMode !== "none") {
                                    toggleItem(item);
                                }
                            }}
                            {...commonHandlers}
                        >
                            {item.label}
                        </IntentControlLink>
                    );
                }

                return (
                    <IntentControlButton
                        key={item.value}
                        ref={(node: HTMLButtonElement | null) => {
                            itemRefs.current[idx] = node;
                        }}
                        {...(selected ? sharedActiveIntentProps : sharedIntentProps)}
                        size={size}
                        fullWidth={equalWidth || justify === "stretch"}
                        className={commonClassName}
                        disabled={itemDisabled}
                        pressed={selectionMode !== "none" ? selected : false}
                        leftIcon={item.leftIcon}
                        rightIcon={item.rightIcon}
                        onClick={(e) => {
                            item.onClick?.(e);
                            if (e.defaultPrevented) return;
                            toggleItem(item);
                        }}
                        {...commonHandlers}
                    >
                        {item.label}
                    </IntentControlButton>
                );
            })}
        </div>
    );
}
