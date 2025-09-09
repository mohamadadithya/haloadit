<script lang="ts">
  import { cn } from "@/helpers";
  import type { TagItem } from "@/lib/contentful";
  import X from "@lucide/svelte/icons/x";

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
    {#each tags as { name, slug, isActive, href }}
      <a
        href={href ?? `/tags/${slug}`}
        class="badge {isActive
          ? 'badge-primary'
          : 'badge-soft hover:badge-primary'}"
      >
        #{name}
        {#if isActive}
          <X class="size-4" />
        {/if}
      </a>
    {/each}
  </div>
{/if}
