"use client";

// src/components/intent/IntentControlLink.tsx
// IntentControlLink
// - Intent-aware link control
// - Same intent + glow rules as IntentControlButton
// - Semantic navigation (anchor), not an action
// - ✅ If internal=true, can use consumer-provided onNavigate(href, ctx) on normal click
// - No Next.js import in the package
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import { resolveIntent, getIntentControlProps } from "CORE";
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

type LinkSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: LinkSize) {
    switch (size) {
        case "xs":
            return "ids-link-xs";
        case "sm":
            return "ids-link-sm";
        case "lg":
            return "ids-link-lg";
        case "xl":
            return "ids-link-xl";
        default:
            return "ids-link-md";
    }
}

function isPlainLeftClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Only intercept “normal navigation” clicks.
    // Let the browser handle:
    // - modified clicks (cmd/ctrl/shift/alt)
    // - middle click
    // - non-left clicks
    if (e.defaultPrevented) return false;
    if (e.button !== 0) return false;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    return true;
}

function hrefToString(href: unknown): string | null {
    if (!href) return null;
    if (typeof href === "string") return href;
    if (typeof URL !== "undefined" && href instanceof URL) return href.toString();
    try {
        return String(href);
    } catch {
        return null;
    }
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlLinkNavigateContext = {
    event: React.MouseEvent<HTMLAnchorElement>;
    href: string;

    // NOTE: with exactOptionalPropertyTypes, optional means:
    // "if present, cannot be undefined"
    target?: string;
    rel?: string;
};

export type IntentControlLinkProps = IntentInput &
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
        className?: string;
        children?: React.ReactNode;

        size?: LinkSize; // default: "md"
        fullWidth?: boolean;

        leftIcon?: React.ReactNode;
        rightIcon?: React.ReactNode;

        external?: boolean; // convenience: target + rel

        /**
         * If true, the component will attempt to use onNavigate (if provided)
         * for client-side navigation on plain left click.
         */
        internal?: boolean; // default: false

        /**
         * Optional navigation handler (defined by the consumer app).
         * Typical Next.js usage:
         *   onNavigate={(href) => router.push(href)}
         *
         * Notes:
         * - Called only for "plain left click" (no modifiers) and target=_self.
         * - If it returns false, we fall back to the browser default navigation.
         */
        onNavigate?: (href: string, ctx: IntentControlLinkNavigateContext) => void | boolean;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_LINK_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "className",
        description: {
            fr: "Classes CSS additionnelles appliquées au root.",
            en: "Additional CSS classes applied to the root element.",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "children",
        description: {
            fr: "Contenu du lien (label).",
            en: "Link content (label).",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille du lien (affecte padding, hauteur, typo).",
            en: "Link size (affects padding, height, typography).",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le lien sur toute la largeur disponible.",
            en: "Stretches the link to full available width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "leftIcon",
        description: {
            fr: "Icône à gauche du label.",
            en: "Left icon.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "rightIcon",
        description: {
            fr: "Icône à droite du label.",
            en: "Right icon.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "external",
        description: {
            fr: "Convenience: force target=_blank + rel=noreferrer noopener.",
            en: "Convenience: forces target=_blank + rel=noreferrer noopener.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "internal",
        description: {
            fr: "Si true, tente d'utiliser onNavigate (si fourni) au clic normal.",
            en: "If true, tries to use onNavigate (if provided) on normal click.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "onNavigate",
        description: {
            fr: "Handler de navigation (fourni par l'app consommatrice).",
            en: "Navigation handler (provided by the consuming app).",
        },
        type: "(href: string, ctx) => void | boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Toutes les props natives du lien (href, target, rel, onClick, aria-*, data-*…).",
            en: "All native anchor props (href, target, rel, onClick, aria-*, data-*…).",
        },
        type: "Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlLinkPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_LINK_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlLinkIdentity: ComponentIdentity = {
    name: "IntentControlLink",
    kind: "control",
    description: {
        fr: "Lien intent-first (navigation) : hooks CSS stables + variables résolues via resolveIntent().",
        en: "Intent-first link (navigation): stable CSS hooks + resolved variables via resolveIntent().",
    },
    since: "0.2.0",
    docs: {
        route: "/playground/components/IntentControlLink",
    },
    anatomy: {
        root: "<a>",
        glowFillLayer: ".intent-glow-layer.intent-glow-fill",
        glowBorderLayer: ".intent-glow-layer.intent-glow-border",
        content: ".intent-control-label (wrapped in z-10)",
        leftIcon: ".intent-control-icon-left",
        rightIcon: ".intent-control-icon-right",
    },
    classHooks: [
        "intent-control",
        "intent-control-link",
        "intent-bg",
        "intent-ink",
        "intent-border",
        "intent-glow-layer",
        "intent-glow-fill",
        "intent-glow-border",
        "is-disabled",
        "ids-link-xs",
        "ids-link-sm",
        "ids-link-md",
        "ids-link-lg",
        "ids-link-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export const IntentControlLink = React.forwardRef<HTMLAnchorElement, IntentControlLinkProps>(
    function IntentControlLink(props, ref) {
        const {
            className,
            children,

            size = "md",
            fullWidth = false,

            leftIcon,
            rightIcon,
            external = false,
            internal = false,
            onNavigate,

            // ✅ Pull DS props OUT so they never reach the DOM
            intent,
            variant,
            tone,
            glow,
            intensity,
            toneStep,
            mode,
            disabled: disabledProp,

            // ✅ Only real anchor props remain here
            ...anchorProps
        } = props;

        const disabled = Boolean(disabledProp);

        const intentInput: IntentInput = {
            ...(intent !== undefined ? { intent } : {}),
            ...(variant !== undefined ? { variant } : {}),
            ...(tone !== undefined ? { tone } : {}),
            ...(glow !== undefined ? { glow } : {}),
            ...(intensity !== undefined ? { intensity } : {}),
            ...(toneStep !== undefined ? { toneStep } : {}),
            ...(mode !== undefined ? { mode } : {}),
            disabled,
        };

        const resolved = resolveIntent(intentInput);
        const controlProps = getIntentControlProps(resolved, className);

        /* ============================================================================
       ✨ Glow layers (same rules as IntentControlButton)
    ============================================================================ */

        const hasGlow = Boolean(resolved.glowBackground);
        const v = resolved.variant;

        const glowAllowed = hasGlow && v !== "ghost";
        const isGlowed = resolved.intent === "glowed";

        const allowFillGlow = glowAllowed && (isGlowed || v === "flat" || v === "elevated");
        const allowBorderGlow = glowAllowed && (v === "outlined" || v === "elevated");

        const readOpacity = (
            key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity"
        ) => {
            const raw = resolved.style?.[key] ?? "0";
            const n = Number(raw.toString());
            return Number.isFinite(n) ? n : 0;
        };

        /* ============================================================================
       🧱 Control class hooks (stable)
    ============================================================================ */

        const rootCls = cn(
            "intent-control intent-control-link",
            "relative inline-flex items-center",
            "select-none whitespace-nowrap",
            // "rounded-ids-2xl",
            "transition",
            sizeClass(size),
            fullWidth && "w-full",
            disabled && "is-disabled"
        );

        const computedTarget = external ? "_blank" : anchorProps.target;
        const computedRel = external ? "noreferrer noopener" : anchorProps.rel;

        function buildNavigateCtx(args: {
            e: React.MouseEvent<HTMLAnchorElement>;
            href: string;
            target?: React.HTMLAttributeAnchorTarget | undefined;
            rel?: string | undefined;
        }): IntentControlLinkNavigateContext {
            // IMPORTANT: with exactOptionalPropertyTypes, don't include optional keys if undefined
            const ctx: IntentControlLinkNavigateContext = { event: args.e, href: args.href };

            if (typeof args.target === "string") ctx.target = args.target;
            if (typeof args.rel === "string") ctx.rel = args.rel;

            return ctx;
        }

        return (
            <a
                ref={ref}
                {...anchorProps}
                {...controlProps}
                className={cn(controlProps.className, rootCls)}
                aria-disabled={disabled || undefined}
                data-intent={resolved.intent}
                data-variant={resolved.variant}
                data-intensity={resolved.intensity}
                data-mode={resolved.mode}
                target={computedTarget}
                rel={computedRel}
                onClick={(e) => {
                    if (disabled) {
                        e.preventDefault();
                        e.stopPropagation();
                        anchorProps.onClick?.(e);
                        return;
                    }

                    // Let consumer run first (they can preventDefault).
                    anchorProps.onClick?.(e);

                    // ✅ Consumer-driven navigation for internal links (no Next import)
                    const target = (computedTarget ?? "_self").toLowerCase();
                    const canIntercept =
                        internal &&
                        !external &&
                        Boolean(onNavigate) &&
                        (target === "_self" || target === "") &&
                        isPlainLeftClick(e);

                    if (!canIntercept) return;

                    const href = hrefToString((anchorProps as any).href);
                    if (!href) return;

                    // Don't intercept hash-only navigation; let browser handle it
                    if (href.startsWith("#")) return;

                    // If consumer already prevented default, respect it
                    if (e.defaultPrevented) return;

                    const ctx = buildNavigateCtx({
                        e,
                        href,
                        target: computedTarget,
                        rel: computedRel,
                    });

                    // Ask consumer to navigate; default behavior is to intercept (preventDefault),
                    // unless consumer explicitly returns false.
                    const res = onNavigate?.(href, ctx);
                    if (res === false) return;

                    e.preventDefault();
                }}
            >
                {/* Glow layers (under content) */}
                {glowAllowed ? (
                    <>
                        {allowFillGlow ? (
                            <span
                                aria-hidden
                                className="intent-glow-layer intent-glow-fill"
                                style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
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

                {/* Content */}
                <span className="relative z-10 inline-flex w-full justify-center items-center gap-2">
                    {leftIcon ? (
                        <span className="intent-control-icon intent-control-icon-left">
                            {leftIcon}
                        </span>
                    ) : null}

                    <span className="intent-control-label">{children}</span>

                    {rightIcon ? (
                        <span className="intent-control-icon intent-control-icon-right">
                            {rightIcon}
                        </span>
                    ) : null}
                </span>
            </a>
        );
    }
);
