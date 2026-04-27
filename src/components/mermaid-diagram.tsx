"use client";

import { useEffect, useId, useState } from "react";

export function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import("mermaid");
        const isDarkMode = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isDarkMode ? "dark" : "default",
        });

        const { svg } = await mermaid.render(`mermaid-${id}`, chart);

        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch (renderError) {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Unable to render diagram.",
          );
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        Mermaid render error: {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="rounded-xl border border-black/10 bg-black/5 p-4 text-sm opacity-75 dark:border-white/10 dark:bg-white/5">
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram my-6 overflow-x-auto rounded-xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
