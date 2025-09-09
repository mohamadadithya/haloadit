<script module>
  export interface ArticleListContext {
    pageSize?: number;
    mode?: "delivery" | "onlyPublished" | "onlyDrafts" | "none";
    maxItemsTotal?: number | null;
    initialPosts?: PostListItem[];
    initialNextSkip?: number | null;
    initialError?: string | null;
    currentUrl: SvelteURL;
    allTags?: TagItem[];
  }
</script>

<script lang="ts">
  import type { PostListItem } from "@/types";
  import ArticleListInfinite from "../article/ArticleListInfinite.svelte";
  import Container from "../Container.svelte";
  import ArticlesFilter from "../article/ArticlesFilter.svelte";
  import { setContext } from "svelte";
  import { SvelteURL } from "svelte/reactivity";
  import type { TagItem } from "@/lib/contentful";

  let {
    pageSize = 10,
    initialPosts = [],
    initialNextSkip = null,
    initialError = null,
    meta,
    astroUrl,
    allTags = [],
  }: Omit<ArticleListContext, "mode" | "maxItemsTotal"> & {
    meta: {
      title: string;
      description: string;
      image?: string;
    };
    astroUrl: URL;
  } = $props();

  let context: ArticleListContext = $state({
    pageSize,
    mode: "delivery",
    maxItemsTotal: null,
    initialPosts,
    initialNextSkip,
    initialError,
    currentUrl: new SvelteURL(astroUrl),
    allTags,
  });

  setContext("article-list-context", context);
</script>

<Container>
  <div class="flex items-start gap-8">
    <div class="w-full max-w-3.5xl lg:max-w-prose">
      <div class="text-left mb-6">
        <h1 class="text-2xl sm:text-3xl md:text-4xl heading-font">
          Kumpulan Tulisan
        </h1>
        <p class="mt-3 text-muted text-balance text-sm sm:text-base">
          {meta.description}
        </p>
      </div>
      <ArticleListInfinite />
    </div>
    <div class="w-full flex-1 hidden lg:block lg:sticky top-24">
      <ArticlesFilter />
    </div>
  </div>
</Container>
