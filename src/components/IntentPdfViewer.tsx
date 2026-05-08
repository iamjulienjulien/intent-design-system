"use client";

// src/components/intent/IntentPdfViewer.tsx
// IntentPdfViewer
// - Intent-first PDF viewer (iframe/object skin inside an Intent surface)
// - Optional header (title/meta) + actions (open/download)
// - Stable hooks + resolver vars only (no dynamic Tailwind classes)

import * as React from "react";

import {
    resolveIntent,
    getIntentLayoutProps,
    composeIntentClassName,
    composeIntentControlClassName,
} from "CORE";
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

function safeText(v: unknown) {
    return typeof v === "string" ? v : "";
}

function safeUrl(v: unknown) {
    const s = safeText(v).trim();
    return s ? s : "";
}

/* ============================================================================
   🧩 TYPES
============================================================================ */

export type IntentPdfViewerFit = "contain" | "cover" | "auto";
export type IntentPdfViewerRenderer = "iframe" | "object";

export type IntentPdfViewerProps = IntentInput &
    Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children"> & {
        className?: string;

        /** PDF source URL (public URL, signed URL, /api/..., blob:, etc.) */
        src?: string;

        /** Optional header */
        title?: React.ReactNode;
        meta?: React.ReactNode;

        /** Presentation */
        height?: number | string; // default 420
        maxHeight?: number | string; // default "auto"
        fit?: IntentPdfViewerFit; // default "contain"
        renderer?: IntentPdfViewerRenderer; // default "iframe"
        allowFullScreen?: boolean; // default true

        /**
         * If true, we try to hide native PDF viewer UI (works in many browsers via #toolbar=0 etc.)
         * Note: browser-dependent.
         */
        hideToolbar?: boolean; // default false

        /** Actions */
        openable?: boolean; // default true
        downloadable?: boolean; // default false
        openLabel?: string; // default "Open"
        downloadLabel?: string; // default "Download"
        onOpen?: (src: string) => void;
        onDownload?: (src: string) => void;

        /** Empty state */
        emptyLabel?: React.ReactNode; // default "No PDF"
        errorLabel?: React.ReactNode; // default "Preview unavailable"

        /** Footer slot */
        footer?: React.ReactNode;
    };

/* ============================================================================
   📋 DOCS EXPORTS
============================================================================ */

const INTENT_PDF_VIEWER_LOCAL_PROPS_TABLE: DocsPropRow[] = [
    {
        name: "src",
        description: { fr: "URL du fichier PDF à afficher.", en: "PDF file URL to display." },
        type: "string",
        required: false,
        fromSystem: false,
    },
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
        name: "height",
        description: { fr: "Hauteur du viewer.", en: "Viewer height." },
        type: "number | string",
        required: false,
        default: "420",
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
        name: "fit",
        description: {
            fr: "Ajustement visuel du contenu (hook CSS).",
            en: "Visual fitting (CSS hook).",
        },
        type: `"contain" | "cover" | "auto"`,
        required: false,
        default: "contain",
        fromSystem: false,
    },
    {
        name: "renderer",
        description: {
            fr: "Moteur d’embed: iframe ou object (fallback).",
            en: "Embed renderer: iframe or object (fallback).",
        },
        type: `"iframe" | "object"`,
        required: false,
        default: "iframe",
        fromSystem: false,
    },
    {
        name: "allowFullScreen",
        description: { fr: "Autorise le plein écran.", en: "Allows fullscreen." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "hideToolbar",
        description: {
            fr: "Tente de masquer la toolbar du viewer natif (#toolbar=0...).",
            en: "Attempts to hide native toolbar (#toolbar=0...).",
        },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "openable",
        description: { fr: "Affiche l’action Ouvrir.", en: "Shows Open action." },
        type: "boolean",
        required: false,
        default: "true",
        fromSystem: false,
    },
    {
        name: "downloadable",
        description: { fr: "Affiche l’action Télécharger.", en: "Shows Download action." },
        type: "boolean",
        required: false,
        default: "false",
        fromSystem: false,
    },
    {
        name: "openLabel",
        description: { fr: "Label du bouton Ouvrir.", en: "Open button label." },
        type: "string",
        required: false,
        default: "Open",
        fromSystem: false,
    },
    {
        name: "downloadLabel",
        description: { fr: "Label du bouton Télécharger.", en: "Download button label." },
        type: "string",
        required: false,
        default: "Download",
        fromSystem: false,
    },
    {
        name: "onOpen",
        description: { fr: "Callback quand on ouvre.", en: "Callback when opening." },
        type: "(src: string) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "onDownload",
        description: { fr: "Callback quand on télécharge.", en: "Callback when downloading." },
        type: "(src: string) => void",
        required: false,
        fromSystem: false,
    },
    {
        name: "emptyLabel",
        description: { fr: "Label si pas de src.", en: "Label when src is missing." },
        type: "React.ReactNode",
        required: false,
        default: `"No PDF"`,
        fromSystem: false,
    },
    {
        name: "errorLabel",
        description: {
            fr: "Label si le rendu est indisponible.",
            en: "Label when rendering is unavailable.",
        },
        type: "React.ReactNode",
        required: false,
        default: `"Preview unavailable"`,
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

export const IntentPdfViewerPropsTable: DocsPropRow[] = [
    ...INTENT_PDF_VIEWER_LOCAL_PROPS_TABLE,
    ...SYSTEM_PROPS_TABLE,
];

export const IntentPdfViewerIdentity: ComponentIdentity = {
    name: "IntentPdfViewer",
    kind: "data",
    description: {
        fr: "Viewer PDF intent-first (aperçu intégré) avec header/actions optionnels.",
        en: "Intent-first PDF viewer (embedded preview) with optional header/actions.",
    },
    since: "0.2.4",
    docs: { route: "/playground/components/intent-pdf-viewer" },
    anatomy: {
        root: "<div>",
        header: ".intent-pdf-header",
        title: ".intent-pdf-title",
        meta: ".intent-pdf-meta",
        actions: ".intent-pdf-actions",
        open: ".intent-pdf-open",
        download: ".intent-pdf-download",
        body: ".intent-pdf-body",
        frame: ".intent-pdf-frame",
        empty: ".intent-pdf-empty",
        error: ".intent-pdf-error",
        footer: ".intent-pdf-footer",
    },
    classHooks: [
        "intent-pdf-viewer",
        "has-header",
        "has-footer",
        "is-fit-contain",
        "is-fit-cover",
        "is-fit-auto",
    ],
};

/* ============================================================================
   ✅ MAIN
============================================================================ */

export function IntentPdfViewer(props: IntentPdfViewerProps) {
    const {
        className,

        src,
        title,
        meta,

        height = 420,
        maxHeight = "auto",
        fit = "contain",
        renderer = "iframe",
        allowFullScreen = true,
        hideToolbar = false,

        openable = true,
        downloadable = false,
        openLabel = "Open",
        downloadLabel = "Download",
        onOpen,
        onDownload,

        emptyLabel = "No PDF",
        errorLabel = "Preview unavailable",

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

    // Action links: control recipe (compact)
    const controlClassName = composeIntentControlClassName(resolved);

    const hasHeader = Boolean(title) || Boolean(meta) || openable || downloadable;
    const hasFooter = Boolean(footer);

    const pdfSrcRaw = safeUrl(src);
    const pdfSrc = React.useMemo(() => {
        if (!pdfSrcRaw) return "";
        if (!hideToolbar) return pdfSrcRaw;

        // Append common PDF viewer parameters when possible.
        // NOTE: hash params are widely used by built-in viewers, but not guaranteed.
        const hasHash = pdfSrcRaw.includes("#");
        const suffix = "toolbar=0&navpanes=0&scrollbar=1&view=FitH";
        return hasHash ? `${pdfSrcRaw}&${suffix}` : `${pdfSrcRaw}#${suffix}`;
    }, [pdfSrcRaw, hideToolbar]);

    const fitHook =
        fit === "contain" ? "is-fit-contain" : fit === "cover" ? "is-fit-cover" : "is-fit-auto";

    const onOpenClick = React.useCallback(() => {
        if (!pdfSrcRaw || disabled) return;
        onOpen?.(pdfSrcRaw);
        // default behavior handled by <a target="_blank">
    }, [pdfSrcRaw, disabled, onOpen]);

    const onDownloadClick = React.useCallback(() => {
        if (!pdfSrcRaw || disabled) return;
        onDownload?.(pdfSrcRaw);
        // default behavior handled by <a download>
    }, [pdfSrcRaw, disabled, onDownload]);

    return (
        <div
            {...divProps}
            style={layoutProps.style}
            className={cn(
                layoutProps.className,
                "intent-surface intent-pdf-viewer",
                surfaceClassName,
                fitHook,
                hasHeader && "has-header",
                hasFooter && "has-footer"
            )}
            data-intent={resolved.intent}
            data-variant={resolved.variant}
            data-intensity={resolved.intensity}
            data-mode={resolved.mode}
        >
            {hasHeader ? (
                <div className="intent-pdf-header">
                    <div className="intent-pdf-titleRow">
                        {title ? <div className="intent-pdf-title">{title}</div> : null}
                        {meta ? <div className="intent-pdf-meta">{meta}</div> : null}
                    </div>

                    <div className="intent-pdf-actions">
                        {openable ? (
                            <a
                                className={cn("intent-control intent-pdf-open", controlClassName)}
                                href={pdfSrcRaw || undefined}
                                target="_blank"
                                rel="noreferrer"
                                aria-disabled={disabled || !pdfSrcRaw}
                                onClick={(e) => {
                                    if (disabled || !pdfSrcRaw) {
                                        e.preventDefault();
                                        return;
                                    }
                                    onOpenClick();
                                }}
                            >
                                {openLabel}
                            </a>
                        ) : null}

                        {downloadable ? (
                            <a
                                className={cn(
                                    "intent-control intent-pdf-download",
                                    controlClassName
                                )}
                                href={pdfSrcRaw || undefined}
                                download
                                aria-disabled={disabled || !pdfSrcRaw}
                                onClick={(e) => {
                                    if (disabled || !pdfSrcRaw) {
                                        e.preventDefault();
                                        return;
                                    }
                                    onDownloadClick();
                                }}
                            >
                                {downloadLabel}
                            </a>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <div className="intent-pdf-body" style={{ maxHeight }}>
                {!pdfSrc ? (
                    <div className="intent-pdf-empty" role="status">
                        {emptyLabel}
                    </div>
                ) : renderer === "object" ? (
                    <object
                        className="intent-pdf-frame"
                        data={pdfSrc}
                        type="application/pdf"
                        style={{ height }}
                        aria-label="PDF preview"
                    >
                        <div className="intent-pdf-error" role="status">
                            {errorLabel}{" "}
                            <a href={pdfSrcRaw} target="_blank" rel="noreferrer">
                                {openLabel}
                            </a>
                        </div>
                    </object>
                ) : (
                    <iframe
                        className="intent-pdf-frame"
                        src={pdfSrc}
                        title="PDF preview"
                        style={{ height }}
                        loading="lazy"
                        allow={allowFullScreen ? "fullscreen" : undefined}
                    />
                )}
            </div>

            {footer ? <div className="intent-pdf-footer">{footer}</div> : null}
        </div>
    );
}
