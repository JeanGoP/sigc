import { useEffect } from "react";

export function useBrowserTranslationObserver(): void {
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      const hasLargeTextMutation = mutations.some((item) => item.type === "characterData");
      if (hasLargeTextMutation) {
        // Reserved for browser-translation warnings if needed.
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);
}
