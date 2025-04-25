<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  let mermaidLoaded = $state(false);

  async function loadMermaid() {
    if (mermaidLoaded) return (window as any).mermaid;

    const mermaid = (await import("mermaid")).default;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    mermaid.initialize({
      startOnLoad: false,
      theme: prefersDark ? "dark" : "default",
    });

    mermaidLoaded = true;
    return mermaid;
  }

  async function renderVisibleMermaid() {
    const mermaid = await loadMermaid();
    const blocks = document.querySelectorAll("[data-mermaid]");
    const observer = new IntersectionObserver(async (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target;

        try {
          const svgId = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
          const { svg } = await mermaid.render(svgId, el.textContent);

          el.innerHTML = svg;
          el.removeAttribute("data-mermaid");
          obs.unobserve(el);
        } catch (err) {
          console.error("Mermaid render failed", err);
        }
      }
    });

    blocks.forEach((el) => observer.observe(el));
  }

  onMount(renderVisibleMermaid);
  onDestroy(() => {
    mermaidLoaded = false;
  });
</script>
