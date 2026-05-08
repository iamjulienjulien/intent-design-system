"use client";

// src/components/intent/IntentControlFiles.tsx
// IntentControlFiles
// - Intent-first file picker / upload control
// - Hidden native <input type="file"> + custom trigger / dropzone UI
// - Supports single / multiple files
// - Supports drag & drop
// - Supports controlled / uncontrolled files list
// - Standalone or inside IntentControlField (insideField=true)
// - Uses resolveIntent() to provide stable CSS vars + hooks
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

type FilesSize = "xs" | "sm" | "md" | "lg" | "xl";

function sizeClass(size: FilesSize) {
    return `ids-control-${size}`;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return;
    if (typeof ref === "function") ref(value);
    else (ref as React.MutableRefObject<T | null>).current = value;
}

function fileKey(file: File) {
    return `${file.name}::${file.size}::${file.lastModified}`;
}

function filesEqual(a: File[], b: File[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const fa = a[i];
        const fb = b[i];
        if (!fa || !fb) return false;
        if (fileKey(fa) !== fileKey(fb)) return false;
    }
    return true;
}

function mergeFiles(prev: File[], next: File[], multiple: boolean) {
    if (!multiple) return next.slice(0, 1);

    const map = new Map<string, File>();

    for (const file of prev) {
        map.set(fileKey(file), file);
    }

    for (const file of next) {
        map.set(fileKey(file), file);
    }

    return Array.from(map.values());
}

function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes) || bytes < 0) return "0 o";
    if (bytes < 1024) return `${bytes} o`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} Ko`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(mb >= 100 ? 0 : 1)} Mo`;
    const gb = mb / 1024;
    return `${gb.toFixed(gb >= 100 ? 0 : 1)} Go`;
}

function acceptMatches(file: File, accept?: string) {
    if (!accept?.trim()) return true;

    const tokens = accept
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

    if (tokens.length === 0) return true;

    const fileName = file.name.toLowerCase();
    const mime = (file.type || "").toLowerCase();

    for (const token of tokens) {
        if (token.startsWith(".")) {
            if (fileName.endsWith(token)) return true;
            continue;
        }

        if (token.endsWith("/*")) {
            const base = token.slice(0, -2);
            if (mime.startsWith(`${base}/`)) return true;
            continue;
        }

        if (mime === token) return true;
    }

    return false;
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentControlFilesValidationReason = "accept" | "maxFiles" | "maxFileSize" | "custom";

export type IntentControlFilesValidationError = {
    file: File;
    reason: IntentControlFilesValidationReason;
    message: string;
};

export type IntentControlFilesChangeMeta = {
    added: File[];
    removed: File[];
    source: "browse" | "drop" | "remove" | "clear";
    errors: IntentControlFilesValidationError[];
};

export type IntentControlFilesProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children" | "onChange" | "onDrop"> & {
        className?: string;

        /** Controlled selected files */
        files?: File[];

        /** Uncontrolled initial files */
        defaultFiles?: File[];

        /** Called when files selection changes */
        onFilesChange?: (files: File[], meta: IntentControlFilesChangeMeta) => void;

        /** Native input props */
        name?: string;
        accept?: string;
        multiple?: boolean;
        capture?: boolean | "user" | "environment";

        /** UI */
        size?: FilesSize; // default md
        fullWidth?: boolean; // default false
        placeholder?: React.ReactNode;
        browseLabel?: React.ReactNode;
        helperText?: React.ReactNode;

        /** Slots */
        leading?: React.ReactNode;
        trailing?: React.ReactNode;

        /** State */
        invalid?: boolean; // default false
        readOnly?: boolean; // simulated readonly
        clearable?: boolean; // default true
        removable?: boolean; // default true
        showFileList?: boolean; // default true
        showFileSize?: boolean; // default true
        insideField?: boolean; // default false

        /** Drag & drop */
        dragAndDrop?: boolean; // default true

        /** Validation */
        maxFiles?: number;
        maxFileSizeBytes?: number;
        validateFile?: (file: File) => string | null | undefined;
        onValidationError?: (
            errors: IntentControlFilesValidationError[],
            meta: { source: "browse" | "drop" }
        ) => void;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_CONTROL_FILES_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "files",
        description: {
            fr: "Liste contrôlée des fichiers sélectionnés.",
            en: "Controlled selected files list.",
        },
        type: "File[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "defaultFiles",
        description: {
            fr: "Liste initiale non contrôlée.",
            en: "Initial uncontrolled files list.",
        },
        type: "File[]",
        required: false,
        fromSystem: false,
    },
    {
        name: "onFilesChange",
        description: {
            fr: "Callback appelée quand la liste change.",
            en: "Called when files list changes.",
        },
        type: "(files, meta) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "accept / multiple / capture",
        description: {
            fr: "Props natives du file input.",
            en: "Native file input props.",
        },
        type: "string / boolean / boolean | 'user' | 'environment'",
        required: false,
        fromSystem: false,
    },
    {
        name: "placeholder / browseLabel / helperText",
        description: {
            fr: "Textes / contenus d’interface.",
            en: "UI labels / helper content.",
        },
        type: "React.ReactNode",
        required: false,
        fromSystem: false,
    },
    {
        name: "dragAndDrop",
        description: {
            fr: "Active le drag & drop.",
            en: "Enables drag & drop.",
        },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "clearable / removable",
        description: {
            fr: "Autorise le clear global et la suppression individuelle.",
            en: "Allows global clear and per-file removal.",
        },
        type: "boolean",
        required: false,
        default: "true / true",
        fromSystem: false,
    },
    {
        name: "showFileList / showFileSize",
        description: {
            fr: "Affiche la liste et la taille des fichiers.",
            en: "Shows file list and file size.",
        },
        type: "boolean",
        required: false,
        default: "true / true",
        fromSystem: false,
    },
    {
        name: "maxFiles / maxFileSizeBytes / validateFile",
        description: {
            fr: "Validations optionnelles.",
            en: "Optional validations.",
        },
        type: "number / number / (file) => string | null",
        required: false,
        fromSystem: false,
    },
    {
        name: "insideField",
        description: {
            fr: "Mode naked pour wrapper dans IntentControlField.",
            en: "Naked mode for IntentControlField wrapper.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "readOnly",
        description: {
            fr: "Empêche toute modification tout en restant focusable.",
            en: "Prevents changes while remaining focusable.",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
];

export const IntentControlFilesPropsTable: DocsPropRow[] = [
    ...INTENT_CONTROL_FILES_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentControlFilesIdentity: ComponentIdentity = {
    name: "IntentControlFiles",
    kind: "control",
    description: {
        fr: "Contrôle intent-first pour sélectionner / déposer un ou plusieurs fichiers.",
        en: "Intent-first control for selecting / dropping one or more files.",
    },
    since: "0.2.11",
    docs: { route: "/playground/components/intent-control-files" },
    anatomy: {
        root: "<div>",
        input: "<input type='file'>",
        trigger: ".intent-control-files-trigger",
        content: ".intent-control-files-content",
        actions: ".intent-control-files-actions",
        list: ".intent-control-files-list",
        item: ".intent-control-files-item",
        remove: ".intent-control-files-remove",
    },
    classHooks: [
        "intent-control",
        "intent-control-files",
        "intent-control-files-standalone",
        "intent-control-files-naked",
        "intent-control-files-trigger",
        "intent-control-files-content",
        "intent-control-files-leading",
        "intent-control-files-trailing",
        "intent-control-files-browse",
        "intent-control-files-helper",
        "intent-control-files-actions",
        "intent-control-files-clear",
        "intent-control-files-list",
        "intent-control-files-item",
        "intent-control-files-itemMain",
        "intent-control-files-itemMeta",
        "intent-control-files-remove",
        "is-invalid",
        "is-disabled",
        "is-readonly",
        "is-empty",
        "is-dragover",
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

export const IntentControlFiles = React.forwardRef<HTMLInputElement, IntentControlFilesProps>(
    function IntentControlFiles(props, forwardedRef) {
        const {
            className,

            files: filesProp,
            defaultFiles = [],
            onFilesChange,

            name,
            accept,
            multiple = false,
            capture,

            size = "md",
            fullWidth = false,
            placeholder = "Drop files here or browse…",
            browseLabel = "Browse",
            helperText,

            leading,
            trailing,

            invalid = false,
            readOnly = false,
            clearable = true,
            removable = true,
            showFileList = true,
            showFileSize = true,
            insideField = false,

            dragAndDrop = true,

            maxFiles,
            maxFileSizeBytes,
            validateFile,
            onValidationError,

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
        const isControlled = filesProp !== undefined;

        const [uncontrolledFiles, setUncontrolledFiles] = React.useState<File[]>(defaultFiles);
        const files = isControlled ? (filesProp ?? []) : uncontrolledFiles;

        const [isDragOver, setIsDragOver] = React.useState(false);

        const inputRef = React.useRef<HTMLInputElement | null>(null);

        React.useEffect(() => {
            setRef(forwardedRef, inputRef.current);
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
        const layoutProps = getIntentLayoutProps(resolved);
        const controlProps = getIntentControlProps(resolved);

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

        const isEmpty = files.length === 0;
        const canInteract = !disabled && !readOnly;
        const canClear = canInteract && clearable && files.length > 0;

        const rootCls = cn(
            "intent-control intent-control-files",
            sizeClass(size),
            fullWidth && "w-full",
            invalid && "is-invalid",
            disabled && "is-disabled",
            readOnly && "is-readonly",
            isEmpty && "is-empty",
            isDragOver && "is-dragover",
            insideField ? "intent-control-files-naked" : "intent-control-files-standalone",
            className
        );

        const triggerCls = cn("intent-control-files-trigger", "relative", fullWidth && "w-full");

        function syncFiles(next: File[], meta: IntentControlFilesChangeMeta) {
            if (!isControlled) setUncontrolledFiles(next);
            onFilesChange?.(next, meta);
        }

        function clearNativeInput() {
            if (inputRef.current) inputRef.current.value = "";
        }

        function validateIncomingFiles(
            incoming: File[],
            source: "browse" | "drop"
        ): { accepted: File[]; errors: IntentControlFilesValidationError[] } {
            const accepted: File[] = [];
            const errors: IntentControlFilesValidationError[] = [];

            const currentCount = multiple ? files.length : 0;

            for (const file of incoming) {
                if (!acceptMatches(file, accept)) {
                    errors.push({
                        file,
                        reason: "accept",
                        message: `File "${file.name}" does not match accepted types.`,
                    });
                    continue;
                }

                if (
                    typeof maxFileSizeBytes === "number" &&
                    Number.isFinite(maxFileSizeBytes) &&
                    file.size > maxFileSizeBytes
                ) {
                    errors.push({
                        file,
                        reason: "maxFileSize",
                        message: `File "${file.name}" exceeds maximum size.`,
                    });
                    continue;
                }

                const customMessage = validateFile?.(file);
                if (customMessage) {
                    errors.push({
                        file,
                        reason: "custom",
                        message: customMessage,
                    });
                    continue;
                }

                accepted.push(file);
            }

            if (typeof maxFiles === "number" && Number.isFinite(maxFiles) && maxFiles >= 0) {
                const allowedCount = Math.max(0, maxFiles - currentCount);
                if (accepted.length > allowedCount) {
                    const overflow = accepted.slice(allowedCount);
                    accepted.splice(allowedCount);

                    for (const file of overflow) {
                        errors.push({
                            file,
                            reason: "maxFiles",
                            message: `Too many files selected.`,
                        });
                    }
                }
            }

            if (errors.length) {
                onValidationError?.(errors, { source });
            }

            return { accepted, errors };
        }

        function commitIncomingFiles(nativeFiles: FileList | File[], source: "browse" | "drop") {
            if (!canInteract) return;

            const arr = Array.from(nativeFiles ?? []);
            if (arr.length === 0) return;

            const { accepted, errors } = validateIncomingFiles(arr, source);
            if (accepted.length === 0) return;

            const next = mergeFiles(files, accepted, multiple);

            if (filesEqual(files, next)) return;

            syncFiles(next, {
                added: accepted,
                removed: [],
                source,
                errors,
            });

            clearNativeInput();
        }

        function handleBrowse() {
            if (!canInteract) return;
            inputRef.current?.click();
        }

        function handleClear() {
            if (!canClear) return;

            const removed = files.slice();

            syncFiles([], {
                added: [],
                removed,
                source: "clear",
                errors: [],
            });

            clearNativeInput();
        }

        function handleRemove(file: File) {
            if (!canInteract || !removable) return;

            const next = files.filter((f) => fileKey(f) !== fileKey(file));
            if (filesEqual(files, next)) return;

            syncFiles(next, {
                added: [],
                removed: [file],
                source: "remove",
                errors: [],
            });

            clearNativeInput();
        }

        function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
            const nativeFiles = e.target.files;
            if (!nativeFiles) return;
            commitIncomingFiles(nativeFiles, "browse");
        }

        function onDragEnter(e: React.DragEvent<HTMLDivElement>) {
            if (!dragAndDrop || !canInteract) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
        }

        function onDragOver(e: React.DragEvent<HTMLDivElement>) {
            if (!dragAndDrop || !canInteract) return;
            e.preventDefault();
            e.stopPropagation();
            if (!isDragOver) setIsDragOver(true);
        }

        function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
            if (!dragAndDrop || !canInteract) return;
            e.preventDefault();
            e.stopPropagation();

            const nextTarget = e.relatedTarget as Node | null;
            if (nextTarget && (e.currentTarget as HTMLDivElement).contains(nextTarget)) return;

            setIsDragOver(false);
        }

        function onDrop(e: React.DragEvent<HTMLDivElement>) {
            if (!dragAndDrop || !canInteract) return;
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            const nativeFiles = e.dataTransfer?.files;
            if (!nativeFiles || nativeFiles.length === 0) return;

            commitIncomingFiles(nativeFiles, "drop");
        }

        function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
            divProps.onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if (!canInteract) return;

            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleBrowse();
            }

            if ((e.key === "Backspace" || e.key === "Delete") && canClear) {
                e.preventDefault();
                handleClear();
            }
        }

        const commonData = {
            "data-intent": resolved.intent,
            "data-variant": resolved.variant,
            "data-intensity": resolved.intensity,
            "data-mode": resolved.mode,
        } as const;

        return (
            <div
                {...divProps}
                {...layoutProps}
                className={cn(layoutProps.className, rootCls)}
                {...commonData}
            >
                <input
                    ref={(node) => {
                        inputRef.current = node;
                        setRef(forwardedRef, node);
                    }}
                    className="intent-control-files-native"
                    type="file"
                    name={name}
                    accept={accept}
                    multiple={multiple}
                    capture={capture}
                    disabled={disabled}
                    onChange={onInputChange}
                    tabIndex={-1}
                    aria-hidden="true"
                />

                <div
                    className={cn(insideField ? "" : controlProps.className, triggerCls)}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-disabled={disabled || undefined}
                    aria-invalid={invalid || undefined}
                    aria-readonly={readOnly || undefined}
                    onClick={handleBrowse}
                    onKeyDown={onKeyDown}
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    {!insideField && glowAllowed ? (
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

                    {leading ? (
                        <span className="intent-control-files-leading" aria-hidden>
                            {leading}
                        </span>
                    ) : null}

                    <div className="intent-control-files-content">
                        <div className="intent-control-files-placeholder">{placeholder}</div>

                        {helperText || accept || (typeof maxFiles === "number" && maxFiles > 0) ? (
                            <div className="intent-control-files-helper">
                                {helperText ? (
                                    <span>{helperText}</span>
                                ) : accept ? (
                                    <span>{accept}</span>
                                ) : typeof maxFiles === "number" ? (
                                    <span>
                                        Max {maxFiles} file{maxFiles > 1 ? "s" : ""}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div className="intent-control-files-actions">
                        {canClear ? (
                            <button
                                type="button"
                                className="intent-control-files-clear"
                                tabIndex={-1}
                                aria-label="Clear files"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            >
                                ✕
                            </button>
                        ) : null}

                        <span className="intent-control-files-browse" aria-hidden>
                            {browseLabel}
                        </span>

                        {trailing ? (
                            <span className="intent-control-files-trailing" aria-hidden>
                                {trailing}
                            </span>
                        ) : null}
                    </div>
                </div>

                {showFileList && files.length > 0 ? (
                    <div
                        className="intent-control-files-list"
                        role="list"
                        aria-label="Selected files"
                    >
                        {files.map((file) => (
                            <div
                                key={fileKey(file)}
                                className="intent-control-files-item"
                                role="listitem"
                            >
                                <div className="intent-control-files-itemMain">
                                    <div className="intent-control-files-itemName">{file.name}</div>
                                    <div className="intent-control-files-itemMeta">
                                        {file.type ? <span>{file.type}</span> : null}
                                        {showFileSize ? (
                                            <span>{formatBytes(file.size)}</span>
                                        ) : null}
                                    </div>
                                </div>

                                {removable && canInteract ? (
                                    <button
                                        type="button"
                                        className="intent-control-files-remove"
                                        onClick={() => handleRemove(file)}
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        ✕
                                    </button>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }
);
