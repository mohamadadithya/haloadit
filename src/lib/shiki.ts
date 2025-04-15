import { getSingletonHighlighter, type BundledTheme } from "shiki";

let highlighterPromise: ReturnType<typeof getSingletonHighlighter> | null =
  null;

export async function highlightCode(code: string, lang = "javascript") {
  if (!highlighterPromise) {
    highlighterPromise = getSingletonHighlighter({
      themes: ["github-dark", "nord"],
      langs: [
        "javascript",
        "ts",
        "bash",
        "html",
        "css",
        "json",
        "svelte",
        "astro",
      ],
    });
  }

  const highlighter = await highlighterPromise;
  const THEME: BundledTheme = "vitesse-dark" as const;

  await highlighter.loadTheme(THEME);

  return highlighter.codeToHtml(code, {
    lang,
    theme: THEME,
  });
}
