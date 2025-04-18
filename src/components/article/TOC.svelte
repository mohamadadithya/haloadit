<script lang="ts">
  import type { TOCItem } from "src/types";
  import { fly } from "svelte/transition";
  import { headerStore } from "@/constructors/header.constructor.svelte";

  interface Props {
    items: TOCItem[];
  }

  let { items }: Props = $props();

  const { isScrollingDown } = $derived(headerStore);
</script>

<div
  transition:fly={{ y: 100, delay: 800 }}
  class="toc flex-1 lg:sticky p-5 bg-base-200 w-full rounded-2xl shadow duration-500"
  class:lg:top-24={!isScrollingDown}
  class:lg:top-8={isScrollingDown}
>
  <p class="font-lora font-semibold mb-4 text-primary uppercase">Daftar Isi</p>
  <ul class="space-y-3 text-sm">
    {#each items as { id, text }}
      <li>
        <a href={`#${id}`} class="link link-hover">{text}</a>
      </li>
    {/each}
  </ul>
</div>
