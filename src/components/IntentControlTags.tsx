"use client";

// src/components/intent/IntentControlTags.tsx
// IntentControlTags
// - Intent-first multi-value input (tag / token input)
// - Standalone: renders a control "frame" (bg/ring/shadow) + tags + inline input
// - Inside IntentControlField: set insideField=true (field owns the frame visuals)
// - Uses resolveIntent() to compute stable CSS vars + hooks
// - No dynamic Tailwind classes: only stable hooks

import * as React from "react";

import { resolveIntent, getIntentLayoutProps, getIntentControlProps } from "CORE";
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

type TagsSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: TagsSize) {
    return `ids-control-${size}`;
}

function asArray(v: string[] | null | undefined): string[] {
    return Array.isArray(v) ? v : [];
}

function uniq(arr: string[]) {
    return Array.from(new Set(arr));
}

function defaultNormalize(raw: string) {
    return raw.trim().replace(/\s+/g, " ");
}

function defaultValidate(next: string, current: string[], allowDuplicates: boolean) {
    if (!next) return false;
    if (!allowDuplicates && current.includes(next)) return false;
    return true;
}

function splitPasted(text: string) {
    const out: string[] = [];

    let buf = "";
    let inQuote: '"' | "'" | null = null;
    let escaped = false;

    function pushBuf() {
        let s = buf.trim();
        if (!s) {
            buf = "";
            return;
        }

        // strip surrounding quotes if present
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.slice(1, -1);
        }

        // cleanup trailing commas
        s = s.replace(/,+\s*$/, "").trim();

        if (s) out.push(s);
        buf = "";
    }

    for (let i = 0; i < text.length; i++) {
        const c = text[i] ?? "";

        // escaped character inside quotes
        if (escaped) {
            buf += c;
            escaped = false;
            continue;
        }

        if (inQuote) {
            if (c === "\\") {
                buf += c;
                escaped = true;
                continue;
            }

            if (c === inQuote) {
                buf += c;
                inQuote = null;
                continue;
            }

            buf += c;
            continue;
        }

        // opening quote
        if (c === '"' || c === "'") {
            buf += c;
            inQuote = c;
            continue;
        }

        // separators (only when NOT inside quotes)
        if (c === "\n" || c === "\r" || c === "\t" || c === "," || c === ";") {
            pushBuf();
            continue;
        }

        buf += c;
    }

    pushBuf();

    return out;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as any).current = value;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlTagsAddOn = "enter" | "comma" | "space" | "blur";

export type IntentControlTagsProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange"> & {
        className?: string;

        /** Controlled list */
        value?: string[];

        /** Uncontrolled initial list */
        defaultValue?: string[];

        /** Fired when list changes */
        onValueChange?: (value: string[], meta?: { added?: string; removed?: string }) => void;

        /** Input placeholder */
        placeholder?: string; // default: "Add…"

        /** UI */
        size?: TagsSize; // default: "md"
        fullWidth?: boolean; // default: false

        /** ✅ Layout: tags take full width and stack vertically */
        stackItems?: boolean; // default: false

        /**
         * When used inside IntentControlField, you generally want the field to own padding.
         * - insideField=true => no frame visuals, minimal padding
         * - standalone => frame visuals + inner padding
         */
        insideField?: boolean; // default: false

        /** State */
        invalid?: boolean; // default false
        readOnly?: boolean; // ✅ default false

        /** Behavior */
        allowDuplicates?: boolean; // default false
        addOn?: IntentControlTagsAddOn[]; // default ["enter","comma"]
        removeOnBackspace?: boolean; // default true (when input empty)
        maxItems?: number; // optional (blocks adding)
        disabled?: boolean;

        /** Pipeline */
        normalize?: (raw: string) => string; // default: trim + collapse spaces
        validate?: (next: string, current: string[]) => boolean; // default: non-empty + unique (unless allowDuplicates)

        /** Rendering */
        renderTag?: (tag: string) => React.ReactNode;
        getTagText?: (tag: string) => string; // used for aria-labels (default: tag)

        /** A11y */
        ariaLabel?: string; // default: "Tags"
        inputAriaLabel?: string; // default: "Add tag"
        removeAriaLabel?: (tag: string) => string; // default: `Remove ${tag}`
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_TAGS_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "value",
        description: {
            fr: "Liste contrôlée de tags.",
            en: "Controlled tags list.",
        },
        type: "string[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultValue",
        description: {
            fr: "Liste initiale non contrôlée.",
            en: "Initial uncontrolled list.",
        },
        type: "string[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "onValueChange",
        description: {
            fr: "Callback appelé quand la liste change (ajout/suppression).",
            en: "Callback fired when list changes (add/remove).",
        },
        type: "(value: string[], meta?: { added?: string; removed?: string }) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "placeholder",
        description: {
            fr: "Placeholder de l’input d’ajout.",
            en: "Placeholder for the add input.",
        },
        type: "string",
        required: false,
        default: "Add…",
        fromSystem: false,
    },
    {
        name: "size",
        description: {
            fr: "Taille (hauteur/padding/typo).",
            en: "Size (height/padding/typography).",
        },
        type: `"xs" | "sm" | "md" | "lg" | "xl"`,
        required: false,
        default: "md",
        fromSystem: false,
    },
    {
        name: "fullWidth",
        description: {
            fr: "Étire le contrôle sur toute la largeur.",
            en: "Stretches the control to full width.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "stackItems",
        description: {
            fr: "Affiche les tags sur une colonne: chaque item fait 100% et s’empile verticalement.",
            en: "Stacks tags vertically: each item takes full width (100%) and flows in a column.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode “naked” pour être wrappé par IntentControlField (le frame appartient au Field).",
            en: "“Naked” mode intended to be wrapped by IntentControlField (frame owned by Field).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "invalid",
        description: {
            fr: "Force l’état invalide (aria-invalid + hook).",
            en: "Forces invalid state (aria-invalid + hook).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Lecture seule: focusable mais non éditable (readOnly + aria-readonly + hook).",
            en: "Read-only: focusable but not editable (readOnly + aria-readonly + hook).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "allowDuplicates",
        description: {
            fr: "Autorise les doublons dans la liste.",
            en: "Allows duplicates in the list.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "addOn",
        description: {
            fr: "Déclencheurs d’ajout (enter/comma/space/blur).",
            en: "Add triggers (enter/comma/space/blur).",
        },
        type: `("enter" | "comma" | "space" | "blur")[]`,
        required: false,
        default: `["enter","comma"]`,
        fromSystem: false,
    },
    {
        name: "removeOnBackspace",
        description: {
            fr: "Si input vide: Backspace supprime le dernier tag.",
            en: "When input is empty: Backspace removes last tag.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "maxItems",
        description: {
            fr: "Limite le nombre de tags (bloque les ajouts au-delà).",
            en: "Limits number of tags (blocks adds beyond).",
        },
        type: "number",
        required: false,
        fromSystem: false,
    },
    {
        name: "normalize",
        description: {
            fr: "Normalise la saisie avant ajout (trim, etc.).",
            en: "Normalizes input before adding (trim, etc.).",
        },
        type: "(raw: string) => string",
        required: false,
        fromSystem: false,
    },
    {
        name: "validate",
        description: {
            fr: "Valide le tag avant ajout (unique, longueur, regex…).",
            en: "Validates tag before adding (unique, length, regex…).",
        },
        type: "(next: string, current: string[]) => boolean",
        required: false,
        fromSystem: false,
    },
    {
        name: "renderTag",
        description: {
            fr: "Rendu custom d’un tag (label).",
            en: "Custom render for a tag (label).",
        },
        type: "(tag: string) => React.ReactNode",
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

export const IntentControlTagsPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_TAGS_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlTagsIdentity: ComponentIdentity = {
    name: "IntentControlTags",
    kind: "control",
    description: {
        fr: "Multi-value input intent-first (tags/tokens). Standalone: frame visuel. Dans IntentControlField: mode naked.",
        en: "Intent-first multi-value input (tags/tokens). Standalone: visual frame. Inside IntentControlField: naked mode.",
    },
    since: "0.2.2",
    docs: { route: "/playground/components/intent-control-tags" },
    anatomy: {
        root: "<div>",
        list: ".intent-tags-list",
        tag: ".intent-tag",
        tagLabel: ".intent-tag-label",
        tagRemove: ".intent-tag-remove",
        input: ".intent-tags-input",
    },
    classHooks: [
        "intent-control",
        "intent-control-tags",
        "intent-control-tags-standalone",
        "intent-control-tags-naked",
        "intent-tags-list",
        "intent-tag",
        "intent-tag-label",
        "intent-tag-remove",
        "intent-tags-input",
        "is-stacked",
        "is-invalid",
        "is-disabled",
        "is-empty",
        "is-readonly",
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

export const IntentControlTags = React.forwardRef<HTMLInputElement, IntentControlTagsProps>(
    function IntentControlTags(props, forwardedRef) {
        const {
            className,

            value: valueProp,
            defaultValue = [],
            onValueChange,

            placeholder = "Add…",

            size = "md",
            fullWidth = false,

            stackItems = false,

            insideField = false,

            invalid = false,
            readOnly = false,

            allowDuplicates = false,
            addOn = ["enter", "comma"],
            removeOnBackspace = true,
            maxItems,

            normalize = defaultNormalize,
            validate,

            renderTag,
            getTagText = (t) => t,

            ariaLabel = "Tags",
            inputAriaLabel = "Add tag",
            removeAriaLabel = (tag) => `Remove ${tag}`,

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
        const [uncontrolled, setUncontrolled] = React.useState<string[]>(asArray(defaultValue));
        const value = asArray(isControlled ? valueProp : uncontrolled);

        const inputRef = React.useRef<HTMLInputElement | null>(null);
        const [draft, setDraft] = React.useState("");

        React.useEffect(() => {
            setRef(forwardedRef, inputRef.current as any);
        }, [forwardedRef]);

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

        // Standalone: root carries vars + frame visuals
        // InsideField: root carries vars only (naked), field provides frame visuals
        const layoutProps = getIntentLayoutProps(resolved);
        const controlProps = getIntentControlProps(resolved);

        const isEmpty = value.length === 0;

        function emit(next: string[], meta?: { added?: string; removed?: string }) {
            if (!isControlled) setUncontrolled(next);
            onValueChange?.(next, meta);
        }

        function canAddMore(cur: string[]) {
            if (typeof maxItems !== "number") return true;
            return cur.length < maxItems;
        }

        function addOne(raw: string) {
            if (disabled || readOnly) return;

            const nextTag = normalize(raw);
            const validator =
                validate ??
                ((n: string, cur: string[]) => defaultValidate(n, cur, allowDuplicates));

            if (!validator(nextTag, value)) return;
            if (!canAddMore(value)) return;

            const next = allowDuplicates ? [...value, nextTag] : uniq([...value, nextTag]);
            emit(next, { added: nextTag });
            setDraft("");
        }

        function addMany(tags: string[]) {
            if (disabled || readOnly) return;
            if (tags.length === 0) return;

            let cur = [...value];
            const validator =
                validate ?? ((n: string, c: string[]) => defaultValidate(n, c, allowDuplicates));

            for (const t of tags) {
                const nextTag = normalize(t);
                if (!validator(nextTag, cur)) continue;
                if (!canAddMore(cur)) break;
                cur = allowDuplicates ? [...cur, nextTag] : uniq([...cur, nextTag]);
            }

            if (cur.join("\u0000") !== value.join("\u0000")) {
                emit(cur);
            }

            setDraft("");
        }

        function removeTag(tag: string) {
            if (disabled || readOnly) return;

            const idx = value.indexOf(tag);
            if (idx < 0) return;

            const next = value.filter((t, i) => i !== idx);
            emit(next, { removed: tag });

            // keep focus on input for flow
            window.setTimeout(() => inputRef.current?.focus(), 0);
        }

        function removeLast() {
            if (disabled || readOnly) return;
            if (value.length === 0) return;

            const last = value[value.length - 1];
            if (!last) return; // 👈 satisfait TS

            removeTag(last);
        }

        function commitDraft() {
            const raw = draft;
            if (!raw.trim()) return;
            addMany(splitPasted(raw));
        }

        function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
            if (disabled || readOnly) return;

            const wantEnter = addOn.includes("enter");
            const wantComma = addOn.includes("comma");
            const wantSpace = addOn.includes("space");

            if (e.key === "Enter" && wantEnter) {
                e.preventDefault();
                commitDraft();
                return;
            }

            if (e.key === "," && wantComma) {
                e.preventDefault();
                commitDraft();
                return;
            }

            if (e.key === " " && wantSpace) {
                // Avoid stealing spaces mid-text if you want multi-word tags.
                // If you DO want spaces, we only commit when draft has content and caret is at end.
                if (draft.trim()) {
                    e.preventDefault();
                    commitDraft();
                }
                return;
            }

            if (e.key === "Backspace" && removeOnBackspace && !draft) {
                // input empty -> remove last tag
                e.preventDefault();
                removeLast();
            }
        }

        function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
            if (disabled || readOnly) return;

            const text = e.clipboardData.getData("text/plain");
            const parts = splitPasted(text);
            if (parts.length <= 1) return; // let normal paste happen

            e.preventDefault();
            addMany(parts);
        }

        function onBlur(e: React.FocusEvent<HTMLInputElement>) {
            if (addOn.includes("blur")) {
                // Only commit if focus leaves the whole control
                window.setTimeout(() => {
                    const active = document.activeElement;
                    const root = (e.currentTarget as HTMLElement).closest("[data-ids-tags-root]");
                    if (root && active && root.contains(active)) return;
                    commitDraft();
                }, 0);
            }
        }

        const rootCls = cn(
            "intent-control intent-control-tags",
            sizeClass(size),
            fullWidth && "w-full",
            insideField ? "intent-control-tags-naked" : "intent-control-tags-standalone",
            stackItems && "is-stacked",
            invalid && "is-invalid",
            readOnly && "is-readonly",
            disabled && "is-disabled",
            isEmpty && "is-empty"
        );

        const rootClassName = insideField
            ? cn(layoutProps.className, rootCls, className)
            : cn(layoutProps.className, controlProps.className, rootCls, className);

        return (
            <div
                {...divProps}
                {...layoutProps}
                data-ids-tags-root
                className={rootClassName}
                role="group"
                aria-label={ariaLabel}
                aria-disabled={disabled || undefined}
                data-intent={resolved.intent}
                data-variant={resolved.variant}
                data-intensity={resolved.intensity}
                data-mode={resolved.mode}
                aria-readonly={readOnly || undefined}
                onMouseDown={(e) => {
                    divProps.onMouseDown?.(e);
                    if (e.defaultPrevented) return;
                    // click anywhere focuses input
                    if (disabled) return;
                    const t = e.target as HTMLElement | null;
                    if (!t) return;
                    if (t.closest("button")) return;
                    inputRef.current?.focus();
                }}
            >
                <div className="intent-tags-list">
                    {value.map((tag, i) => {
                        const text = getTagText(tag);
                        return (
                            <span key={`${tag}-${i}`} className="intent-tag" data-value={tag}>
                                <span className="intent-tag-label">
                                    {renderTag ? renderTag(tag) : tag}
                                </span>
                                <button
                                    type="button"
                                    className="intent-tag-remove"
                                    aria-label={removeAriaLabel(text)}
                                    disabled={disabled || readOnly}
                                    onClick={() => removeTag(tag)}
                                >
                                    ×
                                </button>
                            </span>
                        );
                    })}

                    <input
                        ref={(n) => {
                            inputRef.current = n;
                            setRef(forwardedRef, n as any);
                        }}
                        className="intent-tags-input"
                        type="text"
                        value={draft}
                        placeholder={placeholder}
                        disabled={disabled}
                        aria-label={inputAriaLabel}
                        aria-invalid={invalid || undefined}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={onKeyDown}
                        onPaste={onPaste}
                        onBlur={onBlur}
                        readOnly={readOnly}
                        aria-readonly={readOnly || undefined}
                    />
                </div>
            </div>
        );
    }
);
