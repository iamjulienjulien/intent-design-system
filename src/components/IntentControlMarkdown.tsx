"use client";

// src/components/intent/IntentControlMarkdown.tsx
// IntentControlMarkdown
// - Intent-first Markdown editor (textarea-based) with toolbar + preview modes
// - Dependency-free for markdown rendering: use renderPreview() prop to plug react-markdown/MDX/etc.
// - Standalone: renders a control "frame" (bg/ring/shadow) + toolbar + body
// - Inside IntentControlField: set insideField=true (field owns the frame visuals)
// - Uses resolveIntent() to compute stable CSS vars + hooks
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentLayoutProps, getIntentControlProps } from "../lib/intent/resolve";

import type { DocsPropRow, ComponentIdentity } from "../lib/intent/types";
import { SYSTEM_PROPS_TABLE } from "../lib/intent/props";

/* ============================================================================
   🧰 HELPERS
============================================================================ */

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type MarkdownSize = "xs" | "sm" | "md" | "lg" | "xl";
type MarkdownView = "edit" | "preview" | "split";

function sizeClass(size: MarkdownSize) {
    switch (size) {
        case "xs":
            return "ids-md-xs";
        case "sm":
            return "ids-md-sm";
        case "lg":
            return "ids-md-lg";
        case "xl":
            return "ids-md-xl";
        default:
            return "ids-md-md";
    }
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function isMac() {
    if (typeof navigator === "undefined") return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function modKey(e: React.KeyboardEvent) {
    return isMac() ? e.metaKey : e.ctrlKey;
}

type Selection = { start: number; end: number };

/** Safely reads selection from a textarea */
function getSel(el: HTMLTextAreaElement): Selection {
    return { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
}

/** Replace selected text and restore selection */
function applyText(
    el: HTMLTextAreaElement,
    nextValue: string,
    nextSel: Selection,
    onChange: (next: string) => void
) {
    onChange(nextValue);
    // restore selection after React update
    window.setTimeout(() => {
        try {
            el.focus();
            el.setSelectionRange(nextSel.start, nextSel.end);
        } catch {
            // noop
        }
    }, 0);
}

/** Wrap selection with prefix/suffix */
function wrapSelection(
    el: HTMLTextAreaElement,
    value: string,
    onChange: (v: string) => void,
    pre: string,
    post = pre
) {
    const { start, end } = getSel(el);
    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const after = value.slice(end);

    const next = `${before}${pre}${sel}${post}${after}`;
    const nextStart = start + pre.length;
    const nextEnd = end + pre.length;

    applyText(el, next, { start: nextStart, end: nextEnd }, onChange);
}

/** Insert at cursor (or replace selection) */
function insertText(
    el: HTMLTextAreaElement,
    value: string,
    onChange: (v: string) => void,
    insert: string
) {
    const { start, end } = getSel(el);
    const before = value.slice(0, start);
    const after = value.slice(end);

    const next = `${before}${insert}${after}`;
    const caret = start + insert.length;

    applyText(el, next, { start: caret, end: caret }, onChange);
}

/** Toggle line prefix for selection */
function toggleLinePrefix(
    el: HTMLTextAreaElement,
    value: string,
    onChange: (v: string) => void,
    prefix: string
) {
    const { start, end } = getSel(el);

    // Expand selection to full lines
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = (() => {
        const idx = value.indexOf("\n", end);
        return idx === -1 ? value.length : idx;
    })();

    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");

    const allHave = lines.every((l) => l.startsWith(prefix) || l.trim() === "");
    const nextLines = lines.map((l) => {
        if (!l.trim()) return l;
        return allHave ? l.replace(prefix, "") : `${prefix}${l}`;
    });

    const nextBlock = nextLines.join("\n");
    const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);

    // Keep selection roughly stable
    const delta = nextBlock.length - block.length;
    applyText(el, next, { start: start, end: clamp(end + delta, 0, next.length) }, onChange);
}

/** Indent / unindent selected lines with spaces */
function indentLines(
    el: HTMLTextAreaElement,
    value: string,
    onChange: (v: string) => void,
    dir: 1 | -1,
    indent = "    "
) {
    const { start, end } = getSel(el);

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = (() => {
        const idx = value.indexOf("\n", end);
        return idx === -1 ? value.length : idx;
    })();

    const block = value.slice(lineStart, lineEnd);
    const lines = block.split("\n");

    const nextLines = lines.map((l) => {
        if (!l.trim()) return l;
        if (dir === 1) return indent + l;
        // dir === -1
        if (l.startsWith(indent)) return l.slice(indent.length);
        if (l.startsWith("\t")) return l.slice(1);
        if (l.startsWith("  ")) return l.slice(2);
        if (l.startsWith(" ")) return l.slice(1);
        return l;
    });

    const nextBlock = nextLines.join("\n");
    const next = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);

    const delta = nextBlock.length - block.length;
    applyText(el, next, { start: start, end: clamp(end + delta, 0, next.length) }, onChange);
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlMarkdownTool =
    | "bold"
    | "italic"
    | "strike"
    | "code"
    | "codeblock"
    | "link"
    | "quote"
    | "ul"
    | "ol"
    | "h1"
    | "h2"
    | "h3"
    | "hr"
    | "undo"
    | "redo"
    | "view"; // cycles edit/preview/split

export type IntentControlMarkdownProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /** Controlled markdown */
        value?: string;

        /** Uncontrolled initial markdown */
        defaultValue?: string;

        /** Fired when markdown changes */
        onValueChange?: (value: string) => void;

        /** UI */
        size?: MarkdownSize; // default "md"
        fullWidth?: boolean; // default false
        insideField?: boolean; // default false (field owns frame)
        invalid?: boolean; // default false

        /** Editor behavior */
        placeholder?: string; // default "Write in Markdown…"
        minRows?: number; // default 10
        maxRows?: number; // default 24 (only affects CSS / scroll feel)

        /** View */
        view?: MarkdownView; // controlled view
        defaultView?: MarkdownView; // uncontrolled view default "split"
        onViewChange?: (view: MarkdownView) => void;

        /** Toolbar */
        tools?: IntentControlMarkdownTool[]; // default: a curated set
        hideToolbar?: boolean; // default false

        /** Preview renderer (plug react-markdown/MDX/etc.) */
        renderPreview?: (markdown: string) => React.ReactNode;

        /** A11y */
        ariaLabel?: string; // default "Markdown editor"
        editorAriaLabel?: string; // default "Markdown"
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_MARKDOWN_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "value",
        description: { fr: "Markdown contrôlé.", en: "Controlled markdown." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: { fr: "Markdown initial non contrôlé.", en: "Initial uncontrolled markdown." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: { fr: "Callback quand le texte change.", en: "Callback when text changes." },
        type: "(value: string) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "size",
        description: { fr: "Taille (typo/padding).", en: "Size (typography/padding)." },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode “naked” pour IntentControlField (le frame appartient au Field).",
            en: "“Naked” mode for IntentControlField (frame owned by Field).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "view / defaultView",
        description: {
            fr: "Vue: edit / preview / split.",
            en: "View: edit / preview / split.",
        },
        type: `"edit" | "preview" | "split"`,
        required: false,
        default: "split",
        fromSystem: false,
    },
    {
        name: "tools",
        description: {
            fr: "Boutons de toolbar (ordre = rendu).",
            en: "Toolbar buttons (order = render).",
        },
        type: "IntentControlMarkdownTool[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "renderPreview",
        description: {
            fr: "Rendu du preview (brancher react-markdown / MDX / etc.).",
            en: "Preview renderer (plug react-markdown / MDX / etc.).",
        },
        type: "(markdown: string) => React.ReactNode",
        required: false,
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

export const IntentControlMarkdownPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_MARKDOWN_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlMarkdownIdentity: ComponentIdentity = {
    name: "IntentControlMarkdown",
    kind: "control",
    description: {
        fr: "Éditeur Markdown intent-first: toolbar + preview (edit/preview/split), renderer injectable.",
        en: "Intent-first Markdown editor: toolbar + preview (edit/preview/split), pluggable renderer.",
    },
    since: "0.2.3",
    docs: { route: "/playground/components/intent-control-markdown" },
    anatomy: {
        root: "<div>",
        toolbar: ".intent-md-toolbar",
        tool: "button.intent-md-tool",
        body: ".intent-md-body",
        editorPane: ".intent-md-editorPane",
        previewPane: ".intent-md-previewPane",
        textarea: "textarea.intent-md-editor",
    },
    classHooks: [
        "intent-control",
        "intent-control-markdown",
        "intent-control-markdown-standalone",
        "intent-control-markdown-naked",
        "intent-md-toolbar",
        "intent-md-tool",
        "intent-md-body",
        "intent-md-editorPane",
        "intent-md-previewPane",
        "intent-md-editor",
        "intent-md-preview",
        "is-invalid",
        "is-disabled",
        "is-empty",
        "is-view-edit",
        "is-view-preview",
        "is-view-split",
        "ids-md-xs",
        "ids-md-sm",
        "ids-md-md",
        "ids-md-lg",
        "ids-md-xl",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

const DEFAULT_TOOLS: IntentControlMarkdownTool[] = [
    "view",
    "undo",
    "redo",
    "hr",
    "h1",
    "h2",
    "h3",
    "bold",
    "italic",
    "strike",
    "code",
    "codeblock",
    "link",
    "quote",
    "ul",
    "ol",
];

export const IntentControlMarkdown = React.forwardRef<
    HTMLTextAreaElement,
    IntentControlMarkdownProps
>(function IntentControlMarkdown(props, forwardedRef) {
    const {
        className,

        value: valueProp,
        defaultValue = "",
        onValueChange,

        size = "md",
        fullWidth = false,
        insideField = false,
        invalid = false,

        placeholder = "Write in Markdown…",
        minRows = 10,
        maxRows = 24,

        view: viewProp,
        defaultView = "split",
        onViewChange,

        tools = DEFAULT_TOOLS,
        hideToolbar = false,

        renderPreview,

        ariaLabel = "Markdown editor",
        editorAriaLabel = "Markdown",

        // DS props (removed from DOM)
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
    const [uncontrolled, setUncontrolled] = React.useState<string>(defaultValue);
    const value = (isControlled ? valueProp : uncontrolled) ?? "";

    const viewControlled = viewProp !== undefined;
    const [uncontrolledView, setUncontrolledView] = React.useState<MarkdownView>(defaultView);
    const view = (viewControlled ? viewProp : uncontrolledView) ?? "split";

    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useEffect(() => {
        setRef(forwardedRef, textareaRef.current as any);
    }, [forwardedRef]);

    function setValue(next: string) {
        if (!isControlled) setUncontrolled(next);
        onValueChange?.(next);
    }

    function setView(next: MarkdownView) {
        if (!viewControlled) setUncontrolledView(next);
        onViewChange?.(next);
    }

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
    const layoutProps = getIntentLayoutProps(resolved);
    const controlProps = getIntentControlProps(resolved);

    const isEmpty = !value.trim();

    // Basic history (local, lightweight)
    const histRef = React.useRef<{ stack: string[]; idx: number }>({
        stack: [value],
        idx: 0,
    });

    React.useEffect(() => {
        // keep history in sync on external controlled changes
        const h = histRef.current;
        const cur = h.stack[h.idx];
        if (value !== cur) {
            h.stack = [...h.stack.slice(0, h.idx + 1), value];
            h.idx = h.stack.length - 1;
        }
    }, [value]);

    function undo() {
        const h = histRef.current;
        if (h.idx <= 0) return;
        h.idx -= 1;
        setValue(h.stack[h.idx] ?? "");
    }

    function redo() {
        const h = histRef.current;
        if (h.idx >= h.stack.length - 1) return;
        h.idx += 1;
        setValue(h.stack[h.idx] ?? "");
    }

    function pushHistory(next: string) {
        const h = histRef.current;
        const cur = h.stack[h.idx];
        if (next === cur) return;
        h.stack = [...h.stack.slice(0, h.idx + 1), next];
        h.idx = h.stack.length - 1;
    }

    function cycleView() {
        const next: MarkdownView =
            view === "edit" ? "preview" : view === "preview" ? "split" : "edit";
        setView(next);
    }

    function act(tool: IntentControlMarkdownTool) {
        if (disabled) return;
        const el = textareaRef.current;
        if (!el && tool !== "view" && tool !== "undo" && tool !== "redo") return;

        if (tool === "view") return cycleView();
        if (tool === "undo") return undo();
        if (tool === "redo") return redo();

        const doChange = (next: string) => {
            pushHistory(next);
            setValue(next);
        };

        switch (tool) {
            case "bold":
                return wrapSelection(el!, value, doChange, "**");
            case "italic":
                return wrapSelection(el!, value, doChange, "_");
            case "strike":
                return wrapSelection(el!, value, doChange, "~~");
            case "code":
                return wrapSelection(el!, value, doChange, "`");
            case "codeblock":
                return wrapSelection(el!, value, doChange, "```\n", "\n```");
            case "link": {
                // [text](url)
                const { start, end } = getSel(el!);
                const sel = value.slice(start, end) || "link";
                const snippet = `[${sel}](https://)`;
                return insertText(el!, value, doChange, snippet);
            }
            case "quote":
                return toggleLinePrefix(el!, value, doChange, "> ");
            case "ul":
                return toggleLinePrefix(el!, value, doChange, "- ");
            case "ol":
                return toggleLinePrefix(el!, value, doChange, "1. ");
            case "h1":
                return toggleLinePrefix(el!, value, doChange, "# ");
            case "h2":
                return toggleLinePrefix(el!, value, doChange, "## ");
            case "h3":
                return toggleLinePrefix(el!, value, doChange, "### ");
            case "hr":
                return insertText(el!, value, doChange, "\n---\n");
            default:
                return;
        }
    }

    function onEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (disabled) return;

        // Toolbar shortcuts
        if (modKey(e) && !e.shiftKey && e.key.toLowerCase() === "b") {
            e.preventDefault();
            act("bold");
            return;
        }
        if (modKey(e) && !e.shiftKey && e.key.toLowerCase() === "i") {
            e.preventDefault();
            act("italic");
            return;
        }
        if (modKey(e) && !e.shiftKey && e.key.toLowerCase() === "k") {
            e.preventDefault();
            act("link");
            return;
        }
        if (modKey(e) && !e.shiftKey && e.key === "`") {
            e.preventDefault();
            act("code");
            return;
        }
        if (modKey(e) && e.key.toLowerCase() === "z") {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            return;
        }
        if (modKey(e) && e.key.toLowerCase() === "y") {
            e.preventDefault();
            redo();
            return;
        }

        // Indent / unindent
        if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            if (e.shiftKey)
                indentLines(
                    el,
                    value,
                    (v) => {
                        pushHistory(v);
                        setValue(v);
                    },
                    -1
                );
            else
                indentLines(
                    el,
                    value,
                    (v) => {
                        pushHistory(v);
                        setValue(v);
                    },
                    1
                );
        }
    }

    const rootCls = cn(
        "intent-control intent-control-markdown",
        sizeClass(size),
        fullWidth && "w-full",
        insideField ? "intent-control-markdown-naked" : "intent-control-markdown-standalone",
        invalid && "is-invalid",
        disabled && "is-disabled",
        isEmpty && "is-empty",
        view === "edit" && "is-view-edit",
        view === "preview" && "is-view-preview",
        view === "split" && "is-view-split"
    );

    const rootClassName = insideField
        ? cn(layoutProps.className, rootCls, className)
        : cn(layoutProps.className, controlProps.className, rootCls, className);

    const previewNode = renderPreview ? (
        renderPreview(value)
    ) : (
        <pre className="intent-md-preview intent-md-preview-fallback">{value || " "}</pre>
    );

    const showEditor = view === "edit" || view === "split";
    const showPreview = view === "preview" || view === "split";

    return (
        <div
            {...divProps}
            {...layoutProps}
            className={rootClassName}
            role="group"
            aria-label={ariaLabel}
            aria-disabled={disabled || undefined}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {!hideToolbar ? (
                <div className="intent-md-toolbar" role="toolbar" aria-label="Markdown toolbar">
                    {tools.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className="intent-md-tool"
                            disabled={disabled}
                            onClick={() => act(t)}
                            aria-label={t}
                            data-tool={t}
                        >
                            {t === "view"
                                ? view === "edit"
                                    ? "👁"
                                    : view === "preview"
                                      ? "✍️"
                                      : "⇄"
                                : t === "undo"
                                  ? "↶"
                                  : t === "redo"
                                    ? "↷"
                                    : t === "hr"
                                      ? "—"
                                      : t === "h1"
                                        ? "H1"
                                        : t === "h2"
                                          ? "H2"
                                          : t === "h3"
                                            ? "H3"
                                            : t === "bold"
                                              ? "B"
                                              : t === "italic"
                                                ? "I"
                                                : t === "strike"
                                                  ? "S"
                                                  : t === "code"
                                                    ? "<>"
                                                    : t === "codeblock"
                                                      ? "```"
                                                      : t === "link"
                                                        ? "🔗"
                                                        : t === "quote"
                                                          ? "❝"
                                                          : t === "ul"
                                                            ? "•"
                                                            : t === "ol"
                                                              ? "1."
                                                              : t}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="intent-md-body">
                {showEditor ? (
                    <div className="intent-md-editorPane">
                        <textarea
                            ref={(n) => {
                                textareaRef.current = n;
                                setRef(forwardedRef, n as any);
                            }}
                            className="intent-md-editor font-mono"
                            value={value}
                            onChange={(e) => {
                                const next = e.target.value;
                                pushHistory(next);
                                setValue(next);
                            }}
                            onKeyDown={onEditorKeyDown}
                            placeholder={placeholder}
                            rows={minRows}
                            aria-label={editorAriaLabel}
                            aria-invalid={invalid || undefined}
                            disabled={disabled}
                            style={
                                {
                                    // allows CSS to clamp editor height feel without layout jumps
                                    ["--ids-md-max-rows" as any]: String(maxRows),
                                } as React.CSSProperties
                            }
                        />
                    </div>
                ) : null}

                {showPreview ? <div className="intent-md-previewPane">{previewNode}</div> : null}
            </div>
        </div>
    );
});
