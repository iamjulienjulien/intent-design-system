/* ============================================================================
   src/system/types/components.ts
   Intent Design System – Component registry types
============================================================================ */

import type { COMPONENT_KIND_VALUES } from "../constants";
import type { LocalizedText, DocsPropRow } from "./docs";

export type ComponentKind = (typeof COMPONENT_KIND_VALUES)[number];

export type ComponentAnatomy = {
    root: string;
    content?: string;
    header?: string;
    body?: string;
    footer?: string;
} & Record<string, string | undefined>;

export type ComponentIdentity = {
    name: string;
    emoji?: string;
    kind: ComponentKind;
    description: LocalizedText;
    since?: string;
    docs?: {
        route?: string;
        story?: string;
    };
    anatomy: ComponentAnatomy;
    classHooks: string[];
    dataAttributes?: string[];
    stateHooks?: string[];
    exports?: {
        component?: string;
        propsTable?: string;
        identity?: string;
    };
    notes?: LocalizedText;
};

export type ComponentBadge =
    | "Surface"
    | "Control"
    | "Layout"
    | "Indicator"
    | "Feedback"
    | "Data"
    | "Visualization"
    | "Design"
    | "Genealogy";

export type ComponentDefinition = {
    key: string;
    name: string;
    title: string;
    description: string;
    kind: ComponentKind;
    badge: ComponentBadge;
    badgeEmoji: string;
    href: string | null;
    since?: string;
    emoji?: string;
    featured?: boolean;
    status?: "active" | "wip" | "experimental" | "deprecated";
    tags?: string[];

    identity: ComponentIdentity;
    propsTable: DocsPropRow[];
};
