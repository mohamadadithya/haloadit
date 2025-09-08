<script lang="ts">
  import type { PostListItem } from "@/types";
  import TagList from "./TagList.svelte";

  let {
    post,
  }: {
    post: PostListItem;
  } = $props();

  const { title, description, slug, date, tags } = $derived(post);
</script>

<div aria-label="Article Card" class="group p-5 bg-base-200 rounded-2xl">
  <div>
    <a
      href={`/${slug}`}
      class="link link-hover text-primary text-lg sm:text-xl md:text-2xl heading-font text-pretty inline-block mb-4"
    >
      {title}
    </a>
    <div class="space-y-3">
      <p class="line-clamp-2">
        {description}
      </p>
      <p aria-label="Date" class="text-sm text-muted">
        Dipublikasikan pada {date}
      </p>
    </div>
    <TagList {tags} class="mt-4" />
  </div>
  <a href={`/${slug}`} class="btn btn-soft btn-primary rounded-full mt-6">
    Baca selengkapnya
  </a>
</div>
