"use client";

// src/components/intent/IntentControlData.tsx
// IntentControlData
// - Intent-first structural data editor (JSON by default)
// - Looks like IntentControlInput (textarea) but optimized for structured data
// - Supports: json | yaml | toml | xml | graphql | sql | ini | text
// - Syntax highlighting via an overlay (no contenteditable, keeps textarea editing UX)
// - Standalone: renders control "frame" visuals
// - Inside IntentControlField: set insideField=true (field owns the frame visuals)
// - Read-only supported (still selectable, scrollable)

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

type DataSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: DataSize) {
    switch (size) {
        case "xs":
            return "ids-data-xs";
        case "sm":
            return "ids-data-sm";
        case "lg":
            return "ids-data-lg";
        case "xl":
            return "ids-data-xl";
        default:
            return "ids-data-md";
    }
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlDataFormat =
    | "json"
    | "yaml"
    | "toml"
    | "xml"
    | "ini"
    | "graphql"
    | "sql"
    | "text";

export type IntentControlDataProps = IntentInput &
    Omit<
        React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        "className" | "disabled" | "children" | "readOnly" | "value" | "defaultValue" | "onChange"
    > & {
        className?: string;

        /** Controlled value */
        value?: string;

        /** Uncontrolled initial value */
        defaultValue?: string;

        /** Fired when text changes */
        onValueChange?: (value: string) => void;

        /** Data language for highlighting */
        format?: IntentControlDataFormat; // default: "json"

        /** UI */
        size?: DataSize; // default: "md"
        fullWidth?: boolean; // default false

        /**
         * When used inside IntentControlField, you generally want the field to own padding.
         * - insideField=true => no internal padding, no bg/ring, inherits frame spacing
         * - standalone => provides the usual control "frame" look + padding
         */
        insideField?: boolean; // default false

        /** State */
        invalid?: boolean; // default false

        /** Behavior */
        readOnly?: boolean; // default false (selectable)
        pretty?: boolean; // default false (JSON only: attempts to format on blur)
        indent?: number; // default 2 (JSON only)
        showLineNumbers?: boolean; // default false
    };

/* ============================================================================
   🧾 TOKENIZER (lightweight, no deps)
   - Minimal highlight: enough for “structural data”
   - You can swap later for Prism/Shiki without changing the public API.
============================================================================ */

type TokenKind =
    | "plain"
    | "punct"
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "key"
    | "comment"
    | "tag"
    | "attr"
    | "keyword";

type Token = { k: TokenKind; t: string };

function escapeHtml(s: string) {
    // Compat ES2019: no replaceAll
    return s
        .split("&")
        .join("&amp;")
        .split("<")
        .join("&lt;")
        .split(">")
        .join("&gt;")
        .split('"')
        .join("&quot;")
        .split("'")
        .join("&#039;");
}

function tokenizeJsonLike(src: string): Token[] {
    const out: Token[] = [];
    let i = 0;

    function push(k: TokenKind, t: string) {
        if (!t) return;
        out.push({ k, t });
    }

    const isWS = (c: string) => c === " " || c === "\n" || c === "\r" || c === "\t";

    while (i < src.length) {
        const c = src.charAt(i); // ✅ always string ("" if out of bounds, but i<src.length)

        // whitespace
        if (isWS(c)) {
            let j = i + 1;
            while (j < src.length && isWS(src.charAt(j))) j++;
            push("plain", src.slice(i, j));
            i = j;
            continue;
        }

        // punctuation
        if ("{}[]():,.".includes(c)) {
            push("punct", c);
            i++;
            continue;
        }

        // string
        if (c === '"') {
            let j = i + 1;
            let esc = false;
            while (j < src.length) {
                const ch = src.charAt(j);
                if (esc) esc = false;
                else if (ch === "\\") esc = true;
                else if (ch === '"') {
                    j++;
                    break;
                }
                j++;
            }
            const raw = src.slice(i, j);

            // key heuristic
            let k: TokenKind = "string";
            let kLook = j;
            while (kLook < src.length && isWS(src.charAt(kLook))) kLook++;
            if (src.charAt(kLook) === ":") k = "key";

            push(k, raw);
            i = j;
            continue;
        }

        // numbers
        if (c === "-" || (c >= "0" && c <= "9")) {
            let j = i + 1;
            while (j < src.length && /[0-9.eE+-]/.test(src.charAt(j))) j++;
            push("number", src.slice(i, j));
            i = j;
            continue;
        }

        // literals
        const rest = src.slice(i);
        if (rest.startsWith("true")) {
            push("boolean", "true");
            i += 4;
            continue;
        }
        if (rest.startsWith("false")) {
            push("boolean", "false");
            i += 5;
            continue;
        }
        if (rest.startsWith("null")) {
            push("null", "null");
            i += 4;
            continue;
        }

        // fallback
        let j = i + 1;
        while (j < src.length && !isWS(src.charAt(j)) && !"{}[]():,.".includes(src.charAt(j))) j++;
        push("plain", src.slice(i, j));
        i = j;
    }

    return out;
}

function tokenizeYamlTomlIni(src: string): Token[] {
    const out: Token[] = [];
    const lines = src.split(/\n/);

    lines.forEach((line, idx) => {
        // comment
        const commentIdx = line.indexOf("#");
        const hasComment = commentIdx >= 0;
        const head = hasComment ? line.slice(0, commentIdx) : line;
        const comment = hasComment ? line.slice(commentIdx) : "";

        // key: value (very light)
        const m = head.match(/^(\s*)([A-Za-z0-9_.-]+)(\s*[:=]\s*)(.*)$/);
        if (m) {
            out.push({ k: "plain", t: m[1] ?? "" });
            out.push({ k: "key", t: m[2] ?? "" });
            out.push({ k: "punct", t: m[3] ?? "" });

            const tail = m[4] ?? "";
            // quoted string
            if (/^["']/.test(tail.trim())) out.push({ k: "string", t: tail });
            else if (/^(true|false)\b/.test(tail.trim())) out.push({ k: "boolean", t: tail });
            else if (/^(null|~)\b/.test(tail.trim())) out.push({ k: "null", t: tail });
            else if (/^-?\d+(\.\d+)?\b/.test(tail.trim())) out.push({ k: "number", t: tail });
            else out.push({ k: "plain", t: tail });
        } else {
            out.push({ k: "plain", t: head });
        }

        if (comment) out.push({ k: "comment", t: comment });

        // re-add newline except last
        if (idx < lines.length - 1) out.push({ k: "plain", t: "\n" });
    });

    return out;
}

function tokenizeXml(src: string): Token[] {
    const out: Token[] = [];
    let i = 0;

    while (i < src.length) {
        const c = src[i];

        // comments <!-- -->
        if (src.startsWith("<!--", i)) {
            const end = src.indexOf("-->", i + 4);
            const j = end >= 0 ? end + 3 : src.length;
            out.push({ k: "comment", t: src.slice(i, j) });
            i = j;
            continue;
        }

        if (c === "<") {
            // tag
            const end = src.indexOf(">", i + 1);
            const j = end >= 0 ? end + 1 : src.length;
            const chunk = src.slice(i, j);

            // very light: <tag attr="x">
            // split by whitespace inside
            const parts = chunk.match(/^<\/*\s*([A-Za-z0-9:_-]+)/);
            if (parts?.[1]) {
                // emit "<" or "</"
                const prefix = chunk.startsWith("</") ? "</" : "<";
                out.push({ k: "punct", t: prefix });
                out.push({ k: "tag", t: parts[1] });

                const afterName = chunk.slice(prefix.length + parts[1].length);
                // attrs naive
                const attrRe = /(\s+)([A-Za-z0-9:_-]+)(=)("[^"]*"|'[^']*')/g;
                let last = 0;
                let m: RegExpExecArray | null;
                while ((m = attrRe.exec(afterName))) {
                    out.push({ k: "plain", t: afterName.slice(last, m.index) });
                    out.push({ k: "plain", t: m[1] ?? "" });
                    out.push({ k: "attr", t: m[2] ?? "" });
                    out.push({ k: "punct", t: m[3] ?? "" });
                    out.push({ k: "string", t: m[4] ?? "" });
                    last = m.index + (m[0]?.length ?? 0);
                }
                out.push({ k: "plain", t: afterName.slice(last) });
            } else {
                out.push({ k: "tag", t: chunk });
            }

            i = j;
            continue;
        }

        // text until next "<"
        const next = src.indexOf("<", i);
        const j = next >= 0 ? next : src.length;
        out.push({ k: "plain", t: src.slice(i, j) });
        i = j;
    }

    return out;
}

function tokenizeSqlGraphql(src: string): Token[] {
    const out: Token[] = [];
    // super light keyword pass
    const kw = new Set(
        [
            // sql-ish
            "select",
            "from",
            "where",
            "insert",
            "into",
            "update",
            "delete",
            "join",
            "left",
            "right",
            "inner",
            "outer",
            "group",
            "by",
            "order",
            "limit",
            "values",
            "create",
            "table",
            "and",
            "or",
            "as",
            "on",
            // graphql-ish
            "query",
            "mutation",
            "subscription",
            "fragment",
            "schema",
            "type",
            "input",
            "enum",
            "implements",
            "extend",
        ].map((s) => s.toLowerCase())
    );

    const re =
        /(--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("([^"\\]|\\.)*"|'([^'\\]|\\.)*')|(-?\d+(\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^])/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(src))) {
        const [all] = m;
        if (!all) continue;

        if (m[1]) out.push({ k: "comment", t: all });
        else if (m[2]) out.push({ k: "string", t: all });
        else if (m[5]) out.push({ k: "number", t: all });
        else if (m[7]) out.push({ k: kw.has(all.toLowerCase()) ? "keyword" : "plain", t: all });
        else if (m[8]) out.push({ k: "plain", t: all });
        else out.push({ k: "punct", t: all });
    }

    return out;
}

function tokenize(format: IntentControlDataFormat, src: string): Token[] {
    if (!src) return [{ k: "plain", t: "" }];

    switch (format) {
        case "json":
            return tokenizeJsonLike(src);
        case "yaml":
        case "toml":
        case "ini":
            return tokenizeYamlTomlIni(src);
        case "xml":
            return tokenizeXml(src);
        case "sql":
        case "graphql":
            return tokenizeSqlGraphql(src);
        default:
            return [{ k: "plain", t: src }];
    }
}

function tokensToHtml(tokens: Token[]) {
    return tokens
        .map((tok) => {
            const safe = escapeHtml(tok.t);
            if (tok.k === "plain") return safe;
            return `<span class="ids-data-token ids-data-${tok.k}">${safe}</span>`;
        })
        .join("");
}

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_DATA_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "value",
        description: { fr: "Valeur contrôlée.", en: "Controlled value." },
        type: "string",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: { fr: "Valeur initiale non contrôlée.", en: "Initial uncontrolled value." },
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
        name: "format",
        description: {
            fr: "Format des données (impacte la coloration).",
            en: "Data format (affects highlighting).",
        },
        type: `"json" | "yaml" | "toml" | "xml" | "ini" | "graphql" | "sql" | "text"`,
        required: false,
        default: "json",
        fromSystem: false,
    },
    {
        name: "pretty",
        description: {
            fr: "JSON uniquement: tente de formatter à la perte de focus.",
            en: "JSON only: tries to pretty-print on blur.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "indent",
        description: { fr: "JSON uniquement: indentation.", en: "JSON only: indentation." },
        type: "number",
        required: false,
        default: "2",
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
        name: "readOnly",
        description: { fr: "Mode lecture seule.", en: "Read-only mode." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode “naked” pour être wrappé par IntentControlField (frame owned by Field).",
            en: "“Naked” mode for IntentControlField wrapper (frame owned by Field).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "invalid",
        description: { fr: "Force l’état invalide.", en: "Forces invalid state." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "(native props)",
        description: {
            fr: "Props natives textarea (placeholder, name, spellCheck…).",
            en: "Native textarea props (placeholder, name, spellCheck…).",
        },
        type: "Omit<TextareaHTMLAttributes, ...>",
        required: false,
        fromSystem: false,
    },
];

export const IntentControlDataPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_DATA_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlDataIdentity: ComponentIdentity = {
    name: "IntentControlData",
    kind: "control",
    description: {
        fr: "Éditeur de données structurelles (JSON/YAML/XML/…). Textarea + overlay de coloration, intent-first, standalone ou insideField.",
        en: "Structural data editor (JSON/YAML/XML/…). Textarea + syntax overlay highlighting, intent-first, standalone or insideField.",
    },
    since: "0.2.3",
    docs: { route: "/playground/components/intent-control-data" },
    anatomy: {
        root: "<div> (standalone only)",
        wrapper: ".intent-control-data-wrap",
        overlay: ".intent-control-data-overlay",
        gutter: ".intent-control-data-gutter",
        textarea: "<textarea.intent-control-data-el>",
    },
    classHooks: [
        "intent-control",
        "intent-control-data",
        "intent-control-data-standalone",
        "intent-control-data-naked",
        "intent-control-data-wrap",
        "intent-control-data-overlay",
        "intent-control-data-gutter",
        "intent-control-data-el",
        "is-invalid",
        "is-disabled",
        "is-readonly",
        "is-empty",
        "ids-data-xs",
        "ids-data-sm",
        "ids-data-md",
        "ids-data-lg",
        "ids-data-xl",
        // token hooks
        "ids-data-token",
        "ids-data-punct",
        "ids-data-string",
        "ids-data-number",
        "ids-data-boolean",
        "ids-data-null",
        "ids-data-key",
        "ids-data-comment",
        "ids-data-tag",
        "ids-data-attr",
        "ids-data-keyword",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export const IntentControlData = React.forwardRef<HTMLTextAreaElement, IntentControlDataProps>(
    function IntentControlData(props, forwardedRef) {
        const {
            className,

            value: valueProp,
            defaultValue = "",

            onValueChange,

            format = "json",

            size = "md",
            fullWidth = false,
            insideField = false,

            invalid = false,

            readOnly = false,
            pretty = false,
            indent = 2,
            showLineNumbers = false,

            // DS props (removed from DOM)
            intent,
            variant,
            tone,
            glow,
            intensity,
            mode,
            disabled: disabledProp,

            ...nativeProps
        } = props;

        const disabled = Boolean(disabledProp);

        const isControlled = valueProp !== undefined;
        const [uncontrolled, setUncontrolled] = React.useState<string>(defaultValue);
        const value = String(isControlled ? valueProp : uncontrolled);

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

        const elRef = React.useRef<HTMLTextAreaElement | null>(null);
        const overlayRef = React.useRef<HTMLPreElement | null>(null);

        React.useEffect(() => {
            setRef(forwardedRef, elRef.current as any);
        }, [forwardedRef]);

        const isEmpty = value.length === 0;

        const highlightedHtml = React.useMemo(() => {
            const tokens = tokenize(format, value);
            return tokensToHtml(tokens);
        }, [format, value]);

        const linesCount = React.useMemo(() => {
            if (!showLineNumbers) return 0;
            // Always at least 1 line for display parity
            return Math.max(1, value.split("\n").length);
        }, [showLineNumbers, value]);

        function emit(next: string) {
            if (!isControlled) setUncontrolled(next);
            onValueChange?.(next);
        }

        function syncScroll() {
            const ta = elRef.current;
            const ov = overlayRef.current;
            if (!ta || !ov) return;
            ov.scrollTop = ta.scrollTop;
            ov.scrollLeft = ta.scrollLeft;
        }

        function tryPrettyPrintJson() {
            if (!pretty) return;
            if (format !== "json") return;
            const raw = value;
            if (!raw.trim()) return;

            try {
                const obj = JSON.parse(raw);
                const next = JSON.stringify(obj, null, indent);
                if (next !== raw) emit(next);
            } catch {
                // ignore invalid JSON
            }
        }

        /* ============================================================================
           🧱 Class hooks (stable)
        ============================================================================ */

        const wrapCls = cn(
            "intent-control-data-wrap",
            sizeClass(size),
            fullWidth && "w-full",
            invalid && "is-invalid",
            disabled && "is-disabled",
            readOnly && "is-readonly",
            isEmpty && "is-empty",
            insideField ? "intent-control-data-naked" : "intent-control-data-standalone"
        );

        const textareaCls = cn("intent-control-data-el", sizeClass(size), className);

        const standaloneRootCls = cn(
            "intent-control intent-control-data",
            "relative inline-flex",
            sizeClass(size),
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

        const editor = (
            <div className={wrapCls}>
                {showLineNumbers ? (
                    <div className="intent-control-data-gutter" aria-hidden>
                        {Array.from({ length: linesCount }).map((_, i) => (
                            <div key={i} className="intent-control-data-ln">
                                {i + 1}
                            </div>
                        ))}
                    </div>
                ) : null}

                <pre
                    ref={overlayRef}
                    aria-hidden
                    className="intent-control-data-overlay"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                        __html: highlightedHtml + (value.endsWith("\n") ? "\n" : ""),
                    }}
                />

                <textarea
                    {...nativeProps}
                    {...layoutProps} // vars still useful in both modes
                    ref={(n) => {
                        elRef.current = n;
                        setRef(forwardedRef, n as any);
                    }}
                    className={cn(layoutProps.className, textareaCls)}
                    value={value}
                    disabled={disabled}
                    readOnly={readOnly}
                    spellCheck={nativeProps.spellCheck ?? false}
                    autoCapitalize={nativeProps.autoCapitalize ?? "none"}
                    autoCorrect={nativeProps.autoCorrect ?? "off"}
                    onChange={(e) => emit(e.target.value)}
                    onScroll={(e) => {
                        nativeProps.onScroll?.(e);
                        if (!e.defaultPrevented) syncScroll();
                    }}
                    onBlur={(e) => {
                        nativeProps.onBlur?.(e);
                        if (!e.defaultPrevented) tryPrettyPrintJson();
                    }}
                    {...commonAria}
                />
            </div>
        );

        // InsideField: no frame visuals here (Field owns them)
        if (insideField) return editor;

        // Standalone: frame visuals on root
        const rootProps = {
            ...layoutProps,
            className: cn(layoutProps.className, controlProps.className, standaloneRootCls),
            "data-intent": resolved.intent,
            "data-variant": resolved.variant,
            "data-intensity": resolved.intensity,
            "data-mode": resolved.mode,
        } as const;

        return <div {...(rootProps as any)}>{editor}</div>;
    }
);
