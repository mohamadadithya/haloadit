<script lang="ts">
  import ArticleCard from "@components/article/ArticleCard.svelte";
  import type { PostListItem } from "@/types";

  let {
    posts,
  }: {
    posts: PostListItem[];
  } = $props();
</script>

<div class="space-y-6">
  {#each posts as post}
    <ArticleCard {post} />
  {/each}
</div>
