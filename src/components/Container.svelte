<script lang="ts">
  import { cn } from "@helpers";
  import type { Snippet } from "svelte";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = "", children }: Props = $props();
</script>

<div class="container mx-auto lg:max-w-5xl {cn('px-5', className)}">
  {@render children?.()}
</div>
