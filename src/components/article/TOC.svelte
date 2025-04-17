<script lang="ts">
  import type { TOCItem } from "src/types";
  import { fly } from "svelte/transition";

  interface Props {
    items: TOCItem[];
  }

  let { items }: Props = $props();
</script>

<div
  transition:fly={{ y: 100, delay: 800 }}
  class="toc flex-1 lg:sticky lg:top-24 p-5 bg-base-200 w-full rounded-2xl shadow"
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
