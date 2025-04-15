<script lang="ts">
  import type { TOCItem } from "src/types";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";

  interface Props {
    items: TOCItem[];
  }

  let { items }: Props = $props();
  let activeId = $state<TOCItem["id"]>(),
    isMounted = $state(false);

  onMount(() => {
    isMounted = true;

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activeId = entry.target.id;
        });
      },
      {
        rootMargin: "0px 0px -70% 0px", // Trigger when heading hits 30% from top
        threshold: 1.0,
      }
    );

    headings.forEach((h) => observer.observe(h as HTMLElement));

    return () => {
      observer.disconnect();
      isMounted = false;
    };
  });
</script>

{#if isMounted}
  <div
    transition:fly={{ y: 100, delay: 800 }}
    class="toc flex-1 lg:sticky lg:top-24 p-5 bg-base-200 w-full rounded-2xl shadow"
  >
    <p class="font-lora font-semibold mb-4 text-primary uppercase">
      Daftar Isi
    </p>
    <ul class="list-inside list-disc space-y-1.5">
      {#each items as { id, text }}
        {@const isActive = activeId === id}
        <li>
          <a
            href={`#${id}`}
            class="link link-hover"
            class:link-primary={isActive}>{text}</a
          >
        </li>
      {/each}
    </ul>
  </div>
{/if}
