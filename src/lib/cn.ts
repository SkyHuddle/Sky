import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our type scale lives in custom utilities (globals.css); tell tailwind-merge they are font sizes,
// so `text-callout text-ink` keeps both instead of treating them as two colours.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "section", "headline", "body", "callout", "footnote", "caption", "eyebrow", "score"] }],
    },
  },
});

/** Join class names; later Tailwind utilities win over earlier conflicting ones (e.g. `hidden` over `inline-flex`). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
