import * as React from "react";

import type { IntentInput } from "../lib/intent/types";
import { resolveIntent, getIntentSurfaceProps } from "../lib/intent/resolve";

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export type IntentSurfaceComponentProps<T extends React.ElementType = "div"> = IntentInput & {
    as?: T;
    className?: string;
    children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function IntentSurface<T extends React.ElementType = "div">(
    props: IntentSurfaceComponentProps<T>
) {
    const { as, className, children, ...intentInput } = props;

    const Tag = (as ?? "div") as React.ElementType;

    const resolved = resolveIntent(intentInput);
    const surfaceProps = getIntentSurfaceProps(resolved, className);

    const hasGlow = Boolean(resolved.glowBackground);
    const variant = resolved.variant;

    // ✅ glow layers are never rendered for ghost
    const glowAllowed = hasGlow && variant !== "ghost";

    /**
     * ✅ Variant rules
     * - Normal intents:
     *   - flat/elevated  => fill glow
     *   - outlined/elevated => border glow
     *
     * - intent="glowed":
     *   - we want the "aura" to exist EVEN in outlined
     *   - so we allow the fill glow for all variants except ghost
     */
    const isGlowed = resolved.intent === "glowed";

    const allowFillGlow = glowAllowed && (isGlowed || variant === "flat" || variant === "elevated");

    const allowBorderGlow = glowAllowed && (variant === "outlined" || variant === "elevated");

    // Small helper: read final opacity from resolver style (string -> number)
    const readOpacity = (key: "--intent-glow-fill-opacity" | "--intent-glow-border-opacity") => {
        const raw = resolved.style?.[key] ?? "0";
        const n = Number(raw.toString());
        return Number.isFinite(n) ? n : 0;
    };

    return (
        <Tag {...surfaceProps}>
            {glowAllowed ? (
                <>
                    {allowFillGlow ? (
                        <div
                            className={cn("intent-glow-layer intent-glow-fill")}
                            style={{ opacity: readOpacity("--intent-glow-fill-opacity") }}
                        />
                    ) : null}

                    {allowBorderGlow ? (
                        <div
                            className={cn("intent-glow-layer intent-glow-border")}
                            style={{
                                opacity: readOpacity("--intent-glow-border-opacity"),
                                borderRadius: "inherit",
                            }}
                        />
                    ) : null}
                </>
            ) : null}

            <div className="relative z-10">{children}</div>
        </Tag>
    );
}
