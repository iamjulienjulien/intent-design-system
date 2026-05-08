"use client";

// src/components/ui/IntentStepper.tsx
// IntentStepper
// - Intent-first horizontal stepper for multi-step forms / workflows
// - Supports controlled current step
// - Optional clickable steps
// - Statuses: complete / current / upcoming / error / locked
// - Optional progress bar
// - Uses resolveIntent() for wrapper + step items
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import { resolveIntent, getIntentControlProps } from "CORE";
import {
    SYSTEM_PROPS_TABLE,
    type ComponentIdentity,
    type DocsPropRow,
    type IntentInput,
} from "SYSTEM";

/* ============================================================================
   Helpers
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type IntentStepperSize = "xs" | "sm" | "md" | "lg";

function sizeClass(size: IntentStepperSize) {
    switch (size) {
        case "xs":
            return "intent-stepper-xs";
        case "sm":
            return "intent-stepper-sm";
        case "lg":
            return "intent-stepper-lg";
        default:
            return "intent-stepper-md";
    }
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

/* ============================================================================
   Types
============================================================================ */

export type IntentStepperStepStatus = "complete" | "current" | "upcoming" | "error" | "locked";

export type IntentStepperStep = {
    id: string;
    label: React.ReactNode;
    description?: React.ReactNode;
    meta?: React.ReactNode;

    /**
     * Optional explicit status.
     * If omitted, status is inferred from currentStep.
     */
    status?: IntentStepperStepStatus;

    /**
     * Optional custom icon inside the bullet.
     * If omitted, component uses default markers.
     */
    icon?: React.ReactNode;

    disabled?: boolean;
};

type StepIntentOverrides = Partial<Omit<IntentInput, "disabled">>;

export type IntentStepperProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> & {
        className?: string;

        steps: IntentStepperStep[];

        /**
         * Controlled current step id.
         */
        currentStep: string;

        /**
         * Optional click navigation.
         */
        onStepChange?: (stepId: string, step: IntentStepperStep, index: number) => void;

        clickable?: boolean; // default false
        readOnly?: boolean; // default false

        /**
         * Layout
         */
        size?: IntentStepperSize; // default "md"
        fullWidth?: boolean; // default true
        compact?: boolean; // default false
        showDescriptions?: boolean; // default true
        showProgressBar?: boolean; // default true
        showStepNumbers?: boolean; // default false

        /**
         * Step style overrides
         */
        currentStepIntent?: StepIntentOverrides;
        completeStepIntent?: StepIntentOverrides;
        upcomingStepIntent?: StepIntentOverrides;
        errorStepIntent?: StepIntentOverrides;
        lockedStepIntent?: StepIntentOverrides;
    };
/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_STEPPER_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "steps",
        description: {
            fr: "Liste des étapes du stepper (label, description, meta, icon, status, disabled).",
            en: "Stepper steps list (label, description, meta, icon, status, disabled).",
        },
        type: "IntentStepperStep[]",
        required: true,
        fromSystem: false,
    },
    {
        name: "currentStep",
        description: {
            fr: "Identifiant contrôlé de l’étape courante.",
            en: "Controlled identifier of the current step.",
        },
        type: "string",
        required: true,
        fromSystem: false,
    },
    {
        name: "onStepChange",
        description: {
            fr: "Callback appelé lors d’un changement d’étape par clic.",
            en: "Callback called when a step changes via click.",
        },
        type: "(stepId: string, step: IntentStepperStep, index: number) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "clickable",
        description: {
            fr: "Autorise la navigation par clic sur les étapes.",
            en: "Enables click navigation on steps.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Désactive les interactions tout en conservant l’affichage actif.",
            en: "Disables interactions while keeping the active visual state.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille visuelle du composant.",
            en: "Visual size of the component.",
        },
        type: `"xs" | "sm" | "md" | "lg"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le stepper sur toute la largeur disponible.",
            en: "Stretches the stepper to the full available width.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "compact",
        description: {
            fr: "Réduit les espacements internes pour une version plus compacte.",
            en: "Reduces inner spacing for a more compact layout.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "showDescriptions",
        description: {
            fr: "Affiche les descriptions secondaires sous les labels.",
            en: "Displays secondary descriptions under step labels.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "showProgressBar",
        description: {
            fr: "Affiche la barre de progression horizontale derrière les étapes.",
            en: "Displays the horizontal progress bar behind the steps.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "showStepNumbers",
        description: {
            fr: "Affiche les numéros d’étapes dans les marqueurs quand aucun icon custom n’est fourni.",
            en: "Displays step numbers inside markers when no custom icon is provided.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "currentStepIntent",
        description: {
            fr: "Overrides intent/tone/variant/glow/intensity pour l’étape courante.",
            en: "Intent/tone/variant/glow/intensity overrides for the current step.",
        },
        type: "Partial<Omit<IntentInput, 'disabled'>>",
        required: false,
        fromSystem: false,
    },
    {
        name: "completeStepIntent",
        description: {
            fr: "Overrides visuels pour les étapes complétées.",
            en: "Visual overrides for completed steps.",
        },
        type: "Partial<Omit<IntentInput, 'disabled'>>",
        required: false,
        fromSystem: false,
    },
    {
        name: "upcomingStepIntent",
        description: {
            fr: "Overrides visuels pour les étapes à venir.",
            en: "Visual overrides for upcoming steps.",
        },
        type: "Partial<Omit<IntentInput, 'disabled'>>",
        required: false,
        fromSystem: false,
    },
    {
        name: "errorStepIntent",
        description: {
            fr: "Overrides visuels pour les étapes en erreur.",
            en: "Visual overrides for error steps.",
        },
        type: "Partial<Omit<IntentInput, 'disabled'>>",
        required: false,
        fromSystem: false,
    },
    {
        name: "lockedStepIntent",
        description: {
            fr: "Overrides visuels pour les étapes verrouillées.",
            en: "Visual overrides for locked steps.",
        },
        type: "Partial<Omit<IntentInput, 'disabled'>>",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du div root (id, style, aria-*, data-*…).",
            en: "All native props of the root div (id, style, aria-*, data-*…).",
        },
        type: "Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentStepperPropsTable: DocsPropRow[] = [
    ...INTENT_STEPPER_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentStepperIdentity: ComponentIdentity = {
    name: "IntentStepper",
    emoji: "🪜",
    kind: "layout",
    description: {
        fr: "Stepper horizontal intent-first pour formulaires et workflows multi-étapes.",
        en: "Intent-first horizontal stepper for multi-step forms and workflows.",
    },
    since: "0.3.0",
    docs: {
        route: "/playground/components/intent-stepper",
    },
    anatomy: {
        root: ".intent-stepper",
        inner: ".intent-stepper-inner",
        progress: ".intent-stepper-progress",
        progressTrack: ".intent-stepper-progress-track",
        progressFill: ".intent-stepper-progress-fill",
        list: ".intent-stepper-list",
        step: ".intent-stepper-step",
        stepButton: ".intent-stepper-stepButton",
        marker: ".intent-stepper-marker",
        text: ".intent-stepper-text",
        labelRow: ".intent-stepper-labelRow",
        label: ".intent-stepper-label",
        meta: ".intent-stepper-meta",
        description: ".intent-stepper-description",
        connector: ".intent-stepper-connector",
    },
    classHooks: [
        "intent-stepper",
        "intent-stepper-inner",
        "intent-stepper-progress",
        "intent-stepper-progress-track",
        "intent-stepper-progress-fill",
        "intent-stepper-list",
        "intent-stepper-step",
        "intent-stepper-stepButton",
        "intent-stepper-marker",
        "intent-stepper-text",
        "intent-stepper-labelRow",
        "intent-stepper-label",
        "intent-stepper-meta",
        "intent-stepper-description",
        "intent-stepper-connector",
        "intent-stepper-xs",
        "intent-stepper-sm",
        "intent-stepper-md",
        "intent-stepper-lg",
        "is-compact",
        "is-disabled",
        "is-readonly",
        "is-clickable",
        "is-current",
        "is-complete",
        "is-upcoming",
        "is-error",
        "is-locked",
    ],
};
/* ============================================================================
   Status
============================================================================ */

function inferStepStatus(
    step: IntentStepperStep,
    index: number,
    currentIndex: number
): IntentStepperStepStatus {
    if (step.status) return step.status;
    if (step.disabled) return "locked";
    if (index < currentIndex) return "complete";
    if (index === currentIndex) return "current";
    return "upcoming";
}

function defaultMarker(
    status: IntentStepperStepStatus,
    index: number,
    showStepNumbers: boolean
): React.ReactNode {
    if (status === "complete") return "✓";
    if (status === "error") return "!";
    if (status === "locked") return "•";
    if (showStepNumbers) return String(index + 1);
    return "•";
}

/* ============================================================================
   Main
============================================================================ */

export function IntentStepper(props: IntentStepperProps) {
    const {
        className,
        steps,
        currentStep,
        onStepChange,
        clickable = false,
        readOnly = false,
        size = "md",
        fullWidth = true,
        compact = false,
        showDescriptions = true,
        showProgressBar = true,
        showStepNumbers = false,

        currentStepIntent,
        completeStepIntent,
        upcomingStepIntent,
        errorStepIntent,
        lockedStepIntent,

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

    const wrapperInput: IntentInput = {
        ...(intent !== undefined ? { intent } : {}),
        ...(variant !== undefined ? { variant } : {}),
        ...(tone !== undefined ? { tone } : {}),
        ...(glow !== undefined ? { glow } : {}),
        ...(intensity !== undefined ? { intensity } : {}),
        ...(mode !== undefined ? { mode } : {}),
        disabled,
    };

    const resolvedWrapper = resolveIntent(wrapperInput);
    const wrapperProps = getIntentControlProps(resolvedWrapper);

    const currentIndexRaw = steps.findIndex((step) => step.id === currentStep);
    const currentIndex = currentIndexRaw >= 0 ? currentIndexRaw : 0;

    const progressPercent =
        steps.length <= 1 ? 0 : clamp((currentIndex / (steps.length - 1)) * 100, 0, 100);

    function getIntentOverridesByStatus(
        status: IntentStepperStepStatus
    ): StepIntentOverrides | undefined {
        if (status === "complete") return completeStepIntent;
        if (status === "current") return currentStepIntent;
        if (status === "error") return errorStepIntent;
        if (status === "locked") return lockedStepIntent;
        return upcomingStepIntent;
    }

    function resolveStepIntent(status: IntentStepperStepStatus) {
        const overrides = getIntentOverridesByStatus(status);

        const input: IntentInput = {
            ...(intent !== undefined ? { intent } : {}),
            ...(variant !== undefined ? { variant } : {}),
            ...(tone !== undefined ? { tone } : {}),
            ...(glow !== undefined ? { glow } : {}),
            ...(intensity !== undefined ? { intensity } : {}),
            ...(mode !== undefined ? { mode } : {}),
            disabled: false,

            ...(overrides?.intent !== undefined ? { intent: overrides.intent } : {}),
            ...(overrides?.variant !== undefined ? { variant: overrides.variant } : {}),
            ...(overrides?.tone !== undefined ? { tone: overrides.tone } : {}),
            ...(overrides?.glow !== undefined ? { glow: overrides.glow } : {}),
            ...(overrides?.intensity !== undefined ? { intensity: overrides.intensity } : {}),
            ...(overrides?.mode !== undefined ? { mode: overrides.mode } : {}),
        };

        return resolveIntent(input);
    }

    function handleStepClick(
        step: IntentStepperStep,
        index: number,
        status: IntentStepperStepStatus
    ) {
        if (disabled || readOnly) return;
        if (!clickable || !onStepChange) return;
        if (step.disabled || status === "locked") return;
        onStepChange(step.id, step, index);
    }

    return (
        <div
            {...divProps}
            {...wrapperProps}
            className={cn(
                "intent-stepper",
                sizeClass(size),
                fullWidth && "w-full",
                compact && "is-compact",
                disabled && "is-disabled",
                readOnly && "is-readonly",
                wrapperProps.className,
                className
            )}
            data-intent={resolvedWrapper.intent}
            data-variant={resolvedWrapper.variant}
            data-intensity={resolvedWrapper.intensity}
            data-mode={resolvedWrapper.mode}
            aria-disabled={disabled || undefined}
        >
            <div className="intent-stepper-inner">
                {showProgressBar ? (
                    <div className="intent-stepper-progress" aria-hidden>
                        <div className="intent-stepper-progress-track" />
                        <div
                            className="intent-stepper-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                ) : null}

                <ol className="intent-stepper-list" role="list">
                    {steps.map((step, index) => {
                        const status = inferStepStatus(step, index, currentIndex);
                        const resolvedStep = resolveStepIntent(status);
                        const isCurrent = status === "current";
                        const isClickable =
                            clickable &&
                            !disabled &&
                            !readOnly &&
                            !step.disabled &&
                            status !== "locked" &&
                            Boolean(onStepChange);

                        const markerContent =
                            step.icon ?? defaultMarker(status, index, showStepNumbers);

                        return (
                            <li
                                key={step.id}
                                className={cn(
                                    "intent-stepper-step",
                                    `is-${status}`,
                                    isCurrent && "is-current",
                                    isClickable && "is-clickable",
                                    step.disabled && "is-disabled"
                                )}
                            >
                                <button
                                    type="button"
                                    className={cn(
                                        "intent-stepper-stepButton",
                                        resolvedStep.classes.surface,
                                        resolvedStep.classes.text,
                                        resolvedStep.classes.ring
                                    )}
                                    style={resolvedStep.style as React.CSSProperties}
                                    onClick={() => handleStepClick(step, index, status)}
                                    disabled={!isClickable}
                                    aria-current={isCurrent ? "step" : undefined}
                                >
                                    <span className="intent-stepper-marker" aria-hidden>
                                        {markerContent}
                                    </span>

                                    <span className="intent-stepper-text">
                                        <span className="intent-stepper-labelRow">
                                            <span className="intent-stepper-label">
                                                {step.label}
                                            </span>

                                            {step.meta ? (
                                                <span className="intent-stepper-meta">
                                                    {step.meta}
                                                </span>
                                            ) : null}
                                        </span>

                                        {showDescriptions && step.description ? (
                                            <span className="intent-stepper-description">
                                                {step.description}
                                            </span>
                                        ) : null}
                                    </span>
                                </button>

                                {index < steps.length - 1 ? (
                                    <span className="intent-stepper-connector" aria-hidden />
                                ) : null}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
}

export default IntentStepper;
