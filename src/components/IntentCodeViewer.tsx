"use client";

// src/components/intent/IntentCodeViewer.tsx
// IntentCodeViewer
// - Intent-first code/data viewer (SyntaxHighlighter-like skin)
// - Accepts plain code or pre-highlighted HTML (Prism/Shiki/Highlight.js output)
// - Copy-to-clipboard, optional header/footer, optional line numbers (visual only)
// - Stable hooks + resolver vars only

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import {
    resolveIntent,
    getIntentLayoutProps,
    composeIntentClassName,
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

function safeText(v: unknown) {
    return typeof v === "string" ? v : "";
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentCodeViewerProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        /** Optional header */
        title?: React.ReactNode;
        meta?: React.ReactNode;

        /** Content (choose one) */
        code?: string;
        html?: string; // pre-highlighted HTML (Prism/Shiki/hljs). Rendered inside <code>.

        /** Presentation */
        language?: string; // default "text" (sets className "language-...")
        wrap?: boolean; // default false
        maxHeight?: number | string; // default "auto"

        /** Line numbers (visual only, best with monospaced fonts) */
        showLineNumbers?: boolean; // default false
        startLineNumber?: number; // default 1

        /** Actions */
        copyable?: boolean; // default true
        copyLabel?: string; // default "Copy"
        copiedLabel?: string; // default "Copied"
        onCopy?: (value: string) => void;

        /** Footer slot */
        footer?: React.ReactNode;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CODE_VIEWER_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "title",
        description: { fr: "Titre optionnel (header).", en: "Optional title (header)." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "meta",
        description: { fr: "Meta à droite du header.", en: "Right-side header meta." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "code",
        description: {
            fr: "Code brut (texte).",
            en: "Plain code (text).",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "html",
        description: {
            fr: "HTML déjà highlighté (Prism/Shiki/hljs).",
            en: "Pre-highlighted HTML (Prism/Shiki/hljs).",
        },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "language",
        description: { fr: "Langage (classe language-*).", en: "Language (language-* class)." },
        type: "string",
        required: false,
        default: "text",
        fromSystem: false,
    },
    {
        name: "wrap",
        description: { fr: "Retour à la ligne.", en: "Enable line wrap." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "maxHeight",
        description: { fr: "Hauteur max (scroll).", en: "Max height (scroll)." },
        type: "number | string",
        required: false,
        default: "auto",
        fromSystem: false,
    },
    {
        name: "showLineNumbers",
        description: { fr: "Affiche les numéros de ligne.", en: "Shows line numbers." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "startLineNumber",
        description: { fr: "Index de départ des lignes.", en: "First line index." },
        type: "number",
        required: false,
        default: "1",
        fromSystem: false,
    },
    {
        name: "copyable",
        description: { fr: "Affiche l’action Copier.", en: "Shows Copy action." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "copyLabel",
        description: { fr: "Label du bouton copier.", en: "Copy button label." },
        type: "string",
        required: false,
        default: "Copy",
        fromSystem: false,
    },
    {
        name: "copiedLabel",
        description: { fr: "Label après copie.", en: "Label after copy." },
        type: "string",
        required: false,
        default: "Copied",
        fromSystem: false,
    },
    {
        name: "onCopy",
        description: { fr: "Callback après copie.", en: "Callback after copy." },
        type: "(value: string) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "footer",
        description: { fr: "Footer slot.", en: "Footer slot." },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
];

export const IntentCodeViewerPropsTable: DocsPropRow[] = [
    ...INTENT_CODE_VIEWER_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentCodeViewerIdentity: ComponentIdentity = {
    name: "IntentCodeViewer",
    kind: "data",
    description: {
        fr: "Viewer de code/data intent-first. Skin type SyntaxHighlighter, tokens colorés via l’intent.",
        en: "Intent-first code/data viewer. SyntaxHighlighter-like skin, token colors derived from intent.",
    },
    since: "0.2.0",
    docs: { route: "/playground/components/intent-code-viewer" },
    anatomy: {
        root: "<div>",
        header: ".intent-code-header",
        title: ".intent-code-title",
        meta: ".intent-code-meta",
        actions: ".intent-code-actions",
        copy: ".intent-code-copy",
        body: ".intent-code-body",
        gutter: ".intent-code-gutter",
        pre: ".intent-code-pre",
        code: ".intent-code",
        footer: ".intent-code-footer",
    },
    classHooks: ["intent-code-viewer", "is-wrap", "has-header", "has-footer", "has-lines"],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentCodeViewer(props: IntentCodeViewerProps) {
    const {
        className,

        title,
        meta,

        code,
        html,

        language = "text",
        wrap = false,
        maxHeight = "auto",

        showLineNumbers = false,
        startLineNumber = 1,

        copyable = true,
        copyLabel = "Copy",
        copiedLabel = "Copied",
        onCopy,

        footer,

        // DS props (removed from DOM)
        intent,
        variant,
        tone,
        glow,
        intensity,
        mode,
        disabled: dsDisabled,

        ...divProps
    } = props;

    const disabled = Boolean(dsDisabled);

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

    // Surface: respects variant
    const surfaceClassName = composeIntentClassName(resolved);

    // Copy button: control recipe, but compact
    const controlClassName = composeIntentControlClassName(resolved);

    const hasHeader = Boolean(title) || Boolean(meta) || copyable;
    const hasFooter = Boolean(footer);

    const [copied, setCopied] = React.useState(false);

    const rawValue = safeText(code) || (html ? "" : "");
    const copyValue =
        safeText(code) ||
        safeText(
            // If html only, best-effort: strip tags is out of scope. User should provide `code`.
            ""
        );

    const lines = React.useMemo(() => {
        const text = safeText(code);
        if (!text) return [];
        // Preserve trailing newline line count behavior similar to most highlighters
        const split = text.replace(/\n$/, "\n ").split("\n");
        return split;
    }, [code]);

    const onCopyClick = React.useCallback(async () => {
        if (!copyable || disabled) return;

        const value = copyValue || rawValue;
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            onCopy?.(value);
            window.setTimeout(() => setCopied(false), 900);
        } catch {
            // no-op (clipboard may be blocked)
        }
    }, [copyable, disabled, copyValue, rawValue, onCopy]);

    return (
        <div
            {...divProps}
            style={layoutProps.style}
            className={cn(
                layoutProps.className,
                "intent-surface intent-code-viewer",
                surfaceClassName,
                wrap && "is-wrap",
                hasHeader && "has-header",
                hasFooter && "has-footer",
                showLineNumbers && "has-lines"
            )}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {hasHeader ? (
                <div className="intent-code-header">
                    <div className="intent-code-titleRow">
                        {title ? <div className="intent-code-title">{title}</div> : null}
                        {meta ? <div className="intent-code-meta">{meta}</div> : null}
                    </div>

                    <div className="intent-code-actions">
                        {copyable ? (
                            <button
                                type="button"
                                className={cn("intent-control intent-code-copy", controlClassName)}
                                onClick={onCopyClick}
                                disabled={disabled}
                            >
                                {copied ? copiedLabel : copyLabel}
                            </button>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <div className="intent-code-body" style={{ maxHeight }}>
                {showLineNumbers ? (
                    <div className="intent-code-gutter" aria-hidden="true">
                        {(lines.length ? lines : [""]).map((_, i) => (
                            <div key={i} className="intent-code-lineNo">
                                {startLineNumber + i}
                            </div>
                        ))}
                    </div>
                ) : null}

                <pre className="intent-code-pre">
                    <code
                        className={cn("intent-code", `language-${language}`)}
                        {...(html
                            ? { dangerouslySetInnerHTML: { __html: html } }
                            : { children: code ?? "" })}
                    />
                </pre>
            </div>

            {footer ? <div className="intent-code-footer">{footer}</div> : null}
        </div>
    );
}
