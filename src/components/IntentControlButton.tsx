"use client";

// src/components/intent/IntentControlButton.tsx
// IntentControlButton
// - First Intent Control component (button)
// - Uses resolveIntent() to compute stable class hooks + CSS vars
// - Supports glow layers like IntentSurface
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentControlProps } from "../lib/intent/resolve";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: ButtonSize) {
    switch (size) {
        case "xs":
            return "ids-btn-xs";
        case "sm":
            return "ids-btn-sm";
        case "lg":
            return "ids-btn-lg";
        case "xl":
            return "ids-btn-xl";
        default:
            return "ids-btn-md";
    }
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlButtonProps = IntentInput &
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
        className?: string;
        children?: React.ReactNode;

        size?: ButtonSize; // default: "md"
        fullWidth?: boolean;

        loading?: boolean;
        pressed?: boolean;

        leftIcon?: React.ReactNode;
        rightIcon?: React.ReactNode;
    };

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentControlButton(props: IntentControlButtonProps) {
    const {
        className,
        children,

        size = "md",
        fullWidth = false,

        loading = false,
        pressed = false,

        leftIcon,
        rightIcon,

        // ✅ Pull DS props OUT so they never reach the DOM via {...buttonProps}
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: disabledProp,

        // ✅ Only real DOM props remain here
        ...buttonProps
    } = props;

    const disabled = Boolean(disabledProp) || loading;

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

    const surfaceProps = getIntentControlProps(resolved, className);

    /* ============================================================================
       ✨ Glow layers (same rules as IntentSurface)
    ============================================================================ */

    const hasGlow = Boolean(resolved.glowBackground);
    const v = resolved.variant;

    const glowAllowed = hasGlow && v !== "ghost";
    const isGlowed = resolved.intent === "glowed";

    // Variant rules:
    // - Normal intents: flat/elevated => fill, outlined/elevated => border
    // - glowed: aura exists even in outlined (fill allowed for all except ghost)
    const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
    const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolved.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    /* ============================================================================
       🧱 Control class hooks (stable)
    ============================================================================ */

    const rootCls = cn(
        "intent-control intent-control-button",
        "relative inline-flex items-center justify-center",
        "select-none whitespace-nowrap",
        "rounded-ids-2xl",
        "transition",
        sizeClass(size),
        fullWidth && "w-full",
        pressed && "is-pressed",
        loading && "is-loading",
        disabled && "is-disabled"
    );

    return (
        <button
            {...buttonProps}
            {...surfaceProps}
            className={cn(surfaceProps.className, rootCls)}
            disabled={disabled}
            type={buttonProps.type ?? "button"}
            aria-pressed={pressed || undefined}
            aria-busy={loading || undefined}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {/* Glow layers (under content) */}
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-fill")}
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <span
                            aria-hidden
                            className={cn("intent-glow-layer intent-glow-border")}
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            {/* Content */}
            <span className="relative z-10 inline-flex items-center gap-2">
                {loading ? (
                    <span aria-hidden className="intent-control-spinner" />
                ) : leftIcon ? (
                    <span className="intent-control-icon intent-control-icon-left">{leftIcon}</span>
                ) : null}

                <span className="intent-control-label">{children}</span>

                {rightIcon ? (
                    <span className="intent-control-icon intent-control-icon-right">
                        {rightIcon}
                    </span>
                ) : null}
            </span>
        </button>
    );
}
