import { useCallback } from "react";

export default function useAutosizeTextArea(value: string) {
    const ref = useCallback((node: HTMLTextAreaElement | null) => {
        if (node) {
            const originalOverflow = node.style.overflow;
            node.style.overflow = "hidden";
            node.style.height = "auto";

            const computedStyle = window.getComputedStyle(node);
            const lineHeight = parseInt(computedStyle.lineHeight) || 24;

            if (value === undefined || value === null || value === "") {
                node.style.height = lineHeight + "px";
                node.style.overflow = originalOverflow || "auto";
                return;
            }

            node.style.height = "0px";
            const scrollHeight = node.scrollHeight;
            node.style.height = Math.max(scrollHeight, lineHeight) + "px";
            node.style.overflow = originalOverflow || "auto";
        }
    }, [value]);

    return ref;
}
