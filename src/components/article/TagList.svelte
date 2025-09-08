<script lang="ts">
  import { cn } from "@/helpers";
  import type { TagItem } from "@/lib/contentful";

  let {
    tags,
    class: className = "",
  }: {
    tags: TagItem[];
    class?: string;
  } = $props();
</script>

{#if tags && tags.length > 0}
  <div class={cn("flex items-center gap-2", className)}>
    {#each tags as { name, slug }}
      <a href={`/tags/${slug}`} class="badge badge-soft hover:badge-primary">
        #{name}
      </a>
    {/each}
  </div>
{/if}
