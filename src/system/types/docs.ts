/* ============================================================================
   src/system/types/docs.ts
   Intent Design System – Docs registry types
============================================================================ */

export type LocalizedText = {
    fr: string;
    en: string;
};

export type DocsPropRow = {
    name: string;
    description: LocalizedText;
    type: string;
    required: boolean;
    default?: string;
    fromSystem: boolean;
};

export type DocsTypeFieldRow = {
    name: string;
    type: string;
    required?: boolean;
    description?: LocalizedText;
};

export type DocsTypeRow = {
    name: string;
    description: LocalizedText;
    kind?: "type" | "interface" | "union";
    source?: string;
    fields?: DocsTypeFieldRow[];
    examples?: Array<{
        title?: string;
        code: string;
    }>;
};

export type DocsSystemApiRow = {
    name: string;
    kind: "type" | "constant";
    description: LocalizedText;
    valueOrRef?: string; // value for constants, or "union ref" for types
};
