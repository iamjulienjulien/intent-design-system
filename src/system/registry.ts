/* ============================================================================
   src/system/registry.ts
   Intent Design System – Components Registry
   - Single source of truth for public IDS components
   - Powers docs, playground navigation, lookups and future search helpers
   - Centralizes component identity + props table + playground metadata
============================================================================ */

import type {
    ComponentIdentity,
    ComponentDefinition,
    ComponentKind,
    ComponentBadge,
    DocsPropRow,
} from "./types";

/* ============================================================================
   Component imports – identities
============================================================================ */

import {
    IntentCodeViewerIdentity,
    IntentCodeViewerPropsTable,
} from "../components/IntentCodeViewer";
import {
    IntentCommandPaletteIdentity,
    IntentCommandPalettePropsTable,
} from "../components/IntentCommandPalette";
import {
    IntentConfirmDialogIdentity,
    IntentConfirmDialogPropsTable,
} from "../components/IntentConfirmDialog";
import {
    IntentControlButtonIdentity,
    IntentControlButtonPropsTable,
} from "../components/IntentControlButton";
import {
    IntentControlButtonGroupIdentity,
    IntentControlButtonGroupPropsTable,
} from "../components/IntentControlButtonGroup";
import {
    IntentControlColorIdentity,
    IntentControlColorPropsTable,
} from "../components/IntentControlColor";
import {
    IntentControlComboboxIdentity,
    IntentControlComboboxPropsTable,
} from "../components/IntentControlCombobox";
import {
    IntentControlDataIdentity,
    IntentControlDataPropsTable,
} from "../components/IntentControlData";
import {
    IntentControlDateIdentity,
    IntentControlDatePropsTable,
} from "../components/IntentControlDate";
import {
    IntentControlDropdownIdentity,
    IntentControlDropdownPropsTable,
} from "../components/IntentControlDropdown";
import {
    IntentControlFieldIdentity,
    IntentControlFieldPropsTable,
} from "../components/IntentControlField";
import {
    IntentControlFilesIdentity,
    IntentControlFilesPropsTable,
} from "../components/IntentControlFiles";
import {
    IntentControlInputIdentity,
    IntentControlInputPropsTable,
} from "../components/IntentControlInput";
import {
    IntentControlLinkIdentity,
    IntentControlLinkPropsTable,
} from "../components/IntentControlLink";
import {
    IntentControlMarkdownIdentity,
    IntentControlMarkdownPropsTable,
} from "../components/IntentControlMarkdown";
import {
    IntentControlNavListIdentity,
    IntentControlNavListPropsTable,
} from "../components/IntentControlNavList";
import {
    IntentControlSegmentedIdentity,
    IntentControlSegmentedPropsTable,
} from "../components/IntentControlSegmented";
import {
    IntentControlSelectIdentity,
    IntentControlSelectPropsTable,
} from "../components/IntentControlSelect";
import {
    IntentControlTabsIdentity,
    IntentControlTabsPropsTable,
} from "../components/IntentControlTabs";
import {
    IntentControlTagsIdentity,
    IntentControlTagsPropsTable,
} from "../components/IntentControlTags";
import {
    IntentControlTimeIdentity,
    IntentControlTimePropsTable,
} from "../components/IntentControlTime";
import {
    IntentControlToggleIdentity,
    IntentControlTogglePropsTable,
} from "../components/IntentControlToggle";
import { IntentDialogIdentity, IntentDialogPropsTable } from "../components/IntentDialog";
import { IntentDividerIdentity, IntentDividerPropsTable } from "../components/IntentDivider";
import { IntentDrawerIdentity, IntentDrawerPropsTable } from "../components/IntentDrawer";
import {
    IntentGenealogyHierarchyIdentity,
    IntentGenealogyHierarchyPropsTable,
} from "../components/IntentGenealogyHierarchy";
import { IntentIndicatorIdentity, IntentIndicatorPropsTable } from "../components/IntentIndicator";
import { IntentJourneyIdentity, IntentJourneyPropsTable } from "../components/IntentJourney";
import { IntentPdfViewerIdentity, IntentPdfViewerPropsTable } from "../components/IntentPdfViewer";
import {
    IntentPickerGlowIdentity,
    IntentPickerGlowPropsTable,
} from "../components/IntentPickerGlow";
import {
    IntentPickerToneIdentity,
    IntentPickerTonePropsTable,
} from "../components/IntentPickerTone";
import { IntentPopoverIdentity, IntentPopoverPropsTable } from "../components/IntentPopover";
import { IntentStatIdentity, IntentStatPropsTable } from "../components/IntentStat";
import { IntentSurfaceIdentity, IntentSurfacePropsTable } from "../components/IntentSurface";
import {
    IntentSurfaceCardIdentity,
    IntentSurfaceCardPropsTable,
} from "../components/IntentSurfaceCard";
import {
    IntentSurfacePanelIdentity,
    IntentSurfacePanelPropsTable,
} from "../components/IntentSurfacePanel";
import {
    IntentSurfaceSkeletonIdentity,
    IntentSurfaceSkeletonPropsTable,
} from "../components/IntentSurfaceSkeleton";
import {
    IntentSurfaceWidgetIdentity,
    IntentSurfaceWidgetPropsTable,
} from "../components/IntentSurfaceWidget";
import { IntentTableIdentity, IntentTablePropsTable } from "../components/IntentTable";
import {
    IntentThemePreviewIdentity,
    IntentThemePreviewPropsTable,
} from "../components/IntentThemePreview";
import { IntentTimelineIdentity, IntentTimelinePropsTable } from "../components/IntentTimeline";
import { IntentToastIdentity, IntentToastPropsTable } from "../components/IntentToast";
import { IntentToolbarIdentity, IntentToolbarPropsTable } from "../components/IntentToolbar";
import { IntentTreeIdentity, IntentTreePropsTable } from "../components/IntentTree";
import {
    IntentVisualizationBarIdentity,
    IntentVisualizationBarPropsTable,
} from "../components/IntentVisualizationBar";

/* ============================================================================
   Types
============================================================================ */

function badgeFromKind(kind: ComponentKind): ComponentBadge {
    if (kind === "surface") return "Surface";
    if (kind === "control") return "Control";
    if (kind === "layout") return "Layout";
    if (kind === "indicator") return "Indicator";
    if (kind === "feedback") return "Feedback";
    if (kind === "data") return "Data";
    if (kind === "visualization") return "Visualization";
    if (kind === "design") return "Design";
    return "Genealogy";
}

function emojiForBadge(badge: ComponentBadge): string {
    if (badge === "Surface") return "🧱";
    if (badge === "Control") return "🕹️";
    if (badge === "Layout") return "🧭";
    if (badge === "Indicator") return "🚦";
    if (badge === "Feedback") return "🔔";
    if (badge === "Data") return "🧬";
    if (badge === "Visualization") return "📊";
    if (badge === "Design") return "🎨";
    if (badge === "Genealogy") return "🌳";
    return "✨";
}

function englishDescription(identity: ComponentIdentity) {
    return identity.description.en;
}

function registryItem(
    identity: ComponentIdentity,
    propsTable: DocsPropRow[],
    extras?: Partial<
        Omit<
            ComponentDefinition,
            | "key"
            | "name"
            | "title"
            | "description"
            | "kind"
            | "badge"
            | "badgeEmoji"
            | "href"
            | "identity"
            | "propsTable"
        >
    >
): ComponentDefinition {
    const badge = badgeFromKind(identity.kind);

    return {
        key: identity.name,
        name: identity.name,
        title: identity.name,
        description: englishDescription(identity),
        kind: identity.kind,
        badge,
        badgeEmoji: emojiForBadge(badge),
        href: identity.docs?.route ?? null,
        ...(identity.since !== undefined ? { since: identity.since } : {}),
        ...(identity.emoji !== undefined ? { emoji: identity.emoji } : {}),
        featured: true,
        status: "active",
        tags: [],
        identity,
        propsTable,
        ...extras,
    };
}

/* ============================================================================
   Registry
============================================================================ */

export const COMPONENT_REGISTRY: ComponentDefinition[] = [
    registryItem(IntentSurfaceIdentity, IntentSurfacePropsTable, {
        tags: ["surface", "base", "semantic", "glow"],
    }),
    registryItem(IntentSurfacePanelIdentity, IntentSurfacePanelPropsTable, {
        tags: ["surface", "panel", "section", "header", "footer"],
    }),
    registryItem(IntentSurfaceCardIdentity, IntentSurfaceCardPropsTable, {
        tags: ["surface", "card", "media", "interactive"],
    }),
    registryItem(IntentSurfaceWidgetIdentity, IntentSurfaceWidgetPropsTable, {
        tags: ["surface", "widget", "dashboard", "collapse", "dismiss"],
    }),
    registryItem(IntentSurfaceSkeletonIdentity, IntentSurfaceSkeletonPropsTable, {
        tags: ["surface", "loading", "skeleton", "placeholder"],
    }),
    registryItem(IntentCommandPaletteIdentity, IntentCommandPalettePropsTable, {
        tags: ["surface", "search", "palette", "keyboard"],
    }),
    registryItem(IntentDrawerIdentity, IntentDrawerPropsTable, {
        tags: ["surface", "drawer", "overlay", "panel"],
    }),
    registryItem(IntentDialogIdentity, IntentDialogPropsTable, {
        tags: ["surface", "dialog", "modal", "overlay"],
    }),
    registryItem(IntentPopoverIdentity, IntentPopoverPropsTable, {
        tags: ["surface", "popover", "tooltip", "portal"],
    }),

    registryItem(IntentToastIdentity, IntentToastPropsTable, {
        tags: ["feedback", "toast", "notification"],
    }),
    registryItem(IntentConfirmDialogIdentity, IntentConfirmDialogPropsTable, {
        tags: ["feedback", "confirm", "dialog", "modal"],
    }),

    registryItem(IntentCodeViewerIdentity, IntentCodeViewerPropsTable, {
        tags: ["data", "code", "viewer", "highlight"],
    }),
    registryItem(IntentTableIdentity, IntentTablePropsTable, {
        tags: ["data", "table", "rows", "selection"],
    }),
    registryItem(IntentTreeIdentity, IntentTreePropsTable, {
        tags: ["data", "tree", "hierarchy", "svg", "zoom"],
    }),
    registryItem(IntentStatIdentity, IntentStatPropsTable, {
        tags: ["data", "stat", "metric", "dashboard"],
    }),
    registryItem(IntentPdfViewerIdentity, IntentPdfViewerPropsTable, {
        tags: ["data", "pdf", "viewer", "preview"],
    }),

    registryItem(IntentThemePreviewIdentity, IntentThemePreviewPropsTable, {
        tags: ["design", "theme", "preview", "intents"],
    }),
    registryItem(IntentPickerToneIdentity, IntentPickerTonePropsTable, {
        tags: ["design", "tone", "picker", "palette"],
    }),
    registryItem(IntentPickerGlowIdentity, IntentPickerGlowPropsTable, {
        tags: ["design", "glow", "picker", "aesthetic"],
    }),

    registryItem(IntentJourneyIdentity, IntentJourneyPropsTable, {
        tags: ["layout", "journey", "stepper", "progress"],
    }),
    registryItem(IntentTimelineIdentity, IntentTimelinePropsTable, {
        tags: ["layout", "timeline", "events", "marker"],
    }),
    registryItem(IntentDividerIdentity, IntentDividerPropsTable, {
        tags: ["layout", "divider", "separator"],
    }),
    registryItem(IntentToolbarIdentity, IntentToolbarPropsTable, {
        tags: ["layout", "toolbar", "actions", "sticky"],
    }),

    registryItem(IntentControlButtonIdentity, IntentControlButtonPropsTable, {
        tags: ["control", "button", "action"],
    }),
    registryItem(IntentControlInputIdentity, IntentControlInputPropsTable, {
        tags: ["control", "input", "textarea", "field"],
    }),
    registryItem(IntentControlSelectIdentity, IntentControlSelectPropsTable, {
        tags: ["control", "select", "listbox", "search"],
    }),
    registryItem(IntentControlComboboxIdentity, IntentControlComboboxPropsTable, {
        tags: ["control", "combobox", "autocomplete", "typeahead"],
    }),
    registryItem(IntentControlTagsIdentity, IntentControlTagsPropsTable, {
        tags: ["control", "tags", "tokens", "multi-value"],
    }),
    registryItem(IntentControlDateIdentity, IntentControlDatePropsTable, {
        tags: ["control", "date", "split", "iso"],
    }),
    registryItem(IntentControlTimeIdentity, IntentControlTimePropsTable, {
        tags: ["control", "time", "split", "hhmm"],
    }),
    registryItem(IntentControlFieldIdentity, IntentControlFieldPropsTable, {
        tags: ["control", "field", "label", "hint", "error"],
    }),
    registryItem(IntentControlToggleIdentity, IntentControlTogglePropsTable, {
        tags: ["control", "toggle", "switch", "boolean"],
    }),
    registryItem(IntentControlSegmentedIdentity, IntentControlSegmentedPropsTable, {
        tags: ["control", "segmented", "toggle-group", "selection"],
    }),
    registryItem(IntentControlTabsIdentity, IntentControlTabsPropsTable, {
        tags: ["control", "tabs", "navigation", "segmented"],
    }),
    registryItem(IntentControlLinkIdentity, IntentControlLinkPropsTable, {
        tags: ["control", "link", "navigation"],
    }),
    registryItem(IntentControlButtonGroupIdentity, IntentControlButtonGroupPropsTable, {
        tags: ["control", "button-group", "toggle", "selection"],
    }),
    registryItem(IntentControlDropdownIdentity, IntentControlDropdownPropsTable, {
        tags: ["control", "dropdown", "menu", "actions"],
    }),
    registryItem(IntentControlFilesIdentity, IntentControlFilesPropsTable, {
        tags: ["control", "files", "upload", "dropzone"],
    }),
    registryItem(IntentControlColorIdentity, IntentControlColorPropsTable, {
        tags: ["control", "color", "picker", "swatch"],
    }),
    registryItem(IntentControlMarkdownIdentity, IntentControlMarkdownPropsTable, {
        tags: ["control", "markdown", "editor", "preview"],
    }),
    registryItem(IntentControlDataIdentity, IntentControlDataPropsTable, {
        tags: ["control", "data", "json", "yaml", "xml"],
    }),
    registryItem(IntentControlNavListIdentity, IntentControlNavListPropsTable, {
        tags: ["control", "nav", "list", "sidebar"],
    }),

    registryItem(IntentIndicatorIdentity, IntentIndicatorPropsTable, {
        tags: ["indicator", "status", "badge"],
    }),

    registryItem(IntentVisualizationBarIdentity, IntentVisualizationBarPropsTable, {
        tags: ["visualization", "chart", "bar", "svg"],
    }),

    registryItem(IntentGenealogyHierarchyIdentity, IntentGenealogyHierarchyPropsTable, {
        tags: ["genealogy", "tree", "hierarchy", "family", "svg"],
    }),
];

/* ============================================================================
   Helpers
============================================================================ */

export function getComponentByKey(key: string) {
    return COMPONENT_REGISTRY.find((item) => item.key === key) ?? null;
}

export function getComponentByName(name: string) {
    return COMPONENT_REGISTRY.find((item) => item.name === name) ?? null;
}

export function getComponentsByKind(kind: ComponentKind) {
    return COMPONENT_REGISTRY.filter((item) => item.kind === kind);
}

export function getComponentsByBadge(badge: ComponentBadge) {
    return COMPONENT_REGISTRY.filter((item) => item.badge === badge);
}

export function getFeaturedComponents() {
    return COMPONENT_REGISTRY.filter((item) => item.featured);
}

export function getComponentKeys() {
    return COMPONENT_REGISTRY.map((item) => item.key);
}

export function getComponentNames() {
    return COMPONENT_REGISTRY.map((item) => item.name);
}

export function componentLabel(key?: string | null): string {
    if (!key) return "Component";
    return getComponentByKey(key)?.title ?? key;
}

export function componentIcon(key?: string | null): string {
    if (!key) return "✨";
    const found = getComponentByKey(key);
    return found?.emoji ?? found?.badgeEmoji ?? "✨";
}

export function componentHref(key?: string | null): string | null {
    if (!key) return null;
    return getComponentByKey(key)?.href ?? null;
}

export function componentPropsTable(key?: string | null): DocsPropRow[] {
    if (!key) return [];
    return getComponentByKey(key)?.propsTable ?? [];
}

export function componentIdentity(key?: string | null): ComponentIdentity | null {
    if (!key) return null;
    return getComponentByKey(key)?.identity ?? null;
}

export function searchComponents(query?: string | null) {
    const q = String(query ?? "")
        .trim()
        .toLowerCase();
    if (!q) return COMPONENT_REGISTRY;

    return COMPONENT_REGISTRY.filter((item) => {
        return (
            item.key.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.badge.toLowerCase().includes(q) ||
            item.kind.toLowerCase().includes(q) ||
            item.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
    });
}
