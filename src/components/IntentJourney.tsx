"use client";

// src/components/intent/IntentJourney.tsx
// IntentJourney
// - Intent-first “journey” (stepper / timeline) for progress & navigation
// - Vertical or horizontal, optional descriptions/icons
// - Clickable steps + keyboard navigation
// - Stable hooks + resolver vars only

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import {
    resolveIntent,
    getIntentLayoutProps,
    composeIntentControlClassName,
} from "../lib/intent/resolve";

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

function isInteractive(tag: IntentJourneyStep["status"]) {
    return tag !== "disabled";
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentJourneyStepStatus = "done" | "current" | "upcoming" | "disabled";

export type IntentJourneyStep = {
    id: string;

    label: string;
    description?: string;

    leftIcon?: React.ReactNode;
    rightMeta?: React.ReactNode;

    status?: IntentJourneyStepStatus; // default "upcoming"

    /** If provided, overrides global disabled behavior for this step */
    disabled?: boolean;

    onSelect?: (step: IntentJourneyStep) => void;
};

export type IntentJourneySize = "xs" | "sm" | "md" | "lg";

export type IntentJourneyProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLElement>, "className" | "children"> & {
        className?: string;

        /** Data */
        steps: IntentJourneyStep[];

        /** Layout */
        orientation?: "vertical" | "horizontal"; // default "vertical"
        size?: IntentJourneySize; // default "md"
        compact?: boolean; // default false

        /** Active step (optional) */
        activeId?: string;
        defaultActiveId?: string;
        onActiveChange?: (id: string) => void;

        /** Behavior */
        clickable?: boolean; // default true
        showIndex?: boolean; // default true (shows 1..n when no leftIcon)
        ariaLabel?: string; // default "Journey"

        /** Rail */
        showRail?: boolean; // default true
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_JOURNEY_LOCAL_PROPS_TABLE: DocsPropRow[] = [
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
        name: "steps",
        description: { fr: "Étapes du parcours.", en: "Journey steps." },
        type: "IntentJourneyStep[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "orientation",
        description: { fr: "Orientation du parcours.", en: "Journey orientation." },
        type: `"vertical" | "horizontal"`,
        required: false,
        default: "vertical",
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille des items.", en: "Item size." },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "compact",
        description: { fr: "Réduit les espacements.", en: "Reduces spacing." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "activeId",
        description: { fr: "Étape active (contrôlé).", en: "Active step (controlled)." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultActiveId",
        description: {
            fr: "Étape active par défaut (non-contrôlé).",
            en: "Default active step (uncontrolled).",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "onActiveChange",
        description: {
            fr: "Callback quand l’étape active change.",
            en: "Callback when active step changes.",
        },
        type: "(id: string) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "clickable",
        description: { fr: "Rend les étapes cliquables.", en: "Makes steps clickable." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "showIndex",
        description: { fr: "Affiche l’index si pas d’icône.", en: "Shows index when no icon." },
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
        default: "Journey",
        fromSystem: false,
    },
    {
        name: "showRail",
        description: { fr: "Affiche la ligne de parcours.", en: "Shows the journey rail." },
        type: "boolean",
        required: false,
        default: "true",
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

export const IntentJourneyPropsTable: DocsPropRow[] = [
    ...INTENT_JOURNEY_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentJourneyIdentity: ComponentIdentity = {
    name: "IntentJourney",
    kind: "layout",
    description: {
        fr: "Stepper / timeline intent-first pour visualiser et naviguer une progression (étapes, états, navigation clavier).",
        en: "Intent-first stepper / timeline to visualize and navigate progress (steps, statuses, keyboard nav).",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-journey" },
    anatomy: {
        root: "<nav>",
        list: ".intent-journey-list",
        rail: ".intent-journey-rail",
        step: ".intent-journey-step",
        stepIcon: ".intent-journey-stepIcon",
        stepMain: ".intent-journey-stepMain",
        stepLabel: ".intent-journey-stepLabel",
        stepDescription: ".intent-journey-stepDescription",
        stepMeta: ".intent-journey-stepMeta",
    },
    classHooks: [
        "intent-journey",
        "intent-journey-list",
        "intent-journey-rail",
        "intent-journey-step",
        "is-vertical",
        "is-horizontal",
        "is-compact",
        "is-clickable",
        "is-disabled",
        "is-active",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentJourney(props: IntentJourneyProps) {
    const {
        className,

        steps,

        orientation = "vertical",
        size = "md",
        compact = false,

        activeId: activeIdProp,
        defaultActiveId,
        onActiveChange,

        clickable = true,
        showIndex = true,
        ariaLabel = "Journey",

        showRail = true,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...navProps
    } = props;

    const disabled = Boolean(dsDisabled);

    const [activeUncontrolled, setActiveUncontrolled] = React.useState<string | undefined>(
        defaultActiveId ?? steps[0]?.id
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

    // Step: control recipe (bg/ring/shadow) using vars
    const stepControlClassName = composeIntentControlClassName(resolved);

    const listRef = React.useRef<HTMLOListElement | null>(null);

    const interactive = clickable && !disabled;

    const stepCount = steps.length;

    const rootCls = cn(
        "intent-journey",
        orientation === "vertical" ? "is-vertical" : "is-horizontal",
        compact && "is-compact",
        interactive && "is-clickable",
        disabled && "is-disabled",
        `ids-journey-${size}`
    );

    // Keyboard navigation (roving-ish)
    React.useEffect(() => {
        if (!interactive) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const inJourney = Boolean(target?.closest?.(".intent-journey"));
            if (!inJourney) return;

            const keys = [
                "ArrowDown",
                "ArrowUp",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
                "Enter",
            ];
            if (!keys.includes(e.key)) return;

            const idx = Math.max(
                0,
                steps.findIndex((s) => s.id === activeId)
            );

            const isVertical = orientation === "vertical";
            const nextKey = isVertical ? "ArrowDown" : "ArrowRight";
            const prevKey = isVertical ? "ArrowUp" : "ArrowLeft";

            let nextIdx = idx;

            if (e.key === nextKey) nextIdx = idx + 1;
            if (e.key === prevKey) nextIdx = idx - 1;
            if (e.key === "Home") nextIdx = 0;
            if (e.key === "End") nextIdx = stepCount - 1;

            if (e.key === "Enter") {
                e.preventDefault();
                const current = steps[idx];
                if (!current) return;

                const status = current.status ?? "upcoming";
                const isStepDisabled = Boolean(current.disabled) || status === "disabled";
                if (isStepDisabled) return;

                current.onSelect?.(current);
                setActive(current.id);
                return;
            }

            if (nextIdx !== idx) {
                e.preventDefault();
                nextIdx = clamp(nextIdx, 0, Math.max(0, stepCount - 1));

                // Skip disabled steps
                const dir = nextIdx > idx ? 1 : -1;

                for (; nextIdx >= 0 && nextIdx < stepCount; nextIdx += dir) {
                    const s = steps[nextIdx];
                    if (!s) return;

                    const status = s.status ?? "upcoming";
                    const isStepDisabled = Boolean(s.disabled) || status === "disabled";
                    if (!isStepDisabled) break;
                }

                if (nextIdx < 0 || nextIdx >= stepCount) return;

                const next = steps[nextIdx];
                if (!next) return;

                setActive(next.id);

                // Focus the button
                const btn = listRef.current?.querySelector<HTMLElement>(
                    `[data-journey-step-id="${next.id}"]`
                );
                btn?.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [activeId, interactive, orientation, setActive, stepCount, steps]);

    return (
        <nav
            {...navProps}
            aria-label={ariaLabel}
            style={layoutProps.style}
            className={cn(layoutProps.className, rootCls)}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            <ol className="intent-journey-list" ref={listRef}>
                {steps.map((step, i) => {
                    const status: IntentJourneyStepStatus = step.status ?? "upcoming";
                    const isActive = step.id === activeId || status === "current";
                    const isDone = status === "done";
                    const isStepDisabled =
                        disabled || Boolean(step.disabled) || status === "disabled";
                    const canClick = interactive && !isStepDisabled && isInteractive(status);

                    const icon =
                        step.leftIcon ??
                        (showIndex ? (
                            <span className="intent-journey-stepIndex" aria-hidden="true">
                                {i + 1}
                            </span>
                        ) : null);

                    return (
                        <li
                            key={step.id}
                            className={cn(
                                "intent-journey-stepRow",
                                i === stepCount - 1 && "is-last"
                            )}
                        >
                            {showRail ? (
                                <div
                                    className={cn(
                                        "intent-journey-rail",
                                        isDone && "is-done",
                                        isActive && "is-active"
                                    )}
                                    aria-hidden="true"
                                />
                            ) : null}

                            <button
                                type="button"
                                className={cn(
                                    "intent-control intent-journey-step",
                                    stepControlClassName,
                                    isActive && "is-active",
                                    isDone && "is-done",
                                    isStepDisabled && "is-disabled"
                                )}
                                data-journey-step-id={step.id}
                                data-status={status}
                                aria-current={isActive ? "step" : undefined}
                                aria-disabled={isStepDisabled ? "true" : "false"}
                                disabled={!canClick}
                                onClick={() => {
                                    if (!canClick) return;
                                    step.onSelect?.(step);
                                    setActive(step.id);
                                }}
                            >
                                {icon ? (
                                    <span className="intent-journey-stepIcon">{icon}</span>
                                ) : null}

                                <span className="intent-journey-stepMain">
                                    <span className="intent-journey-stepLabel">{step.label}</span>
                                    {step.description ? (
                                        <span className="intent-journey-stepDescription">
                                            {step.description}
                                        </span>
                                    ) : null}
                                </span>

                                {step.rightMeta ? (
                                    <span className="intent-journey-stepMeta">
                                        {step.rightMeta}
                                    </span>
                                ) : null}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
