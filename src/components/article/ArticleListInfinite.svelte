<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";
  import type { PostListItem } from "@/types";
  import { onMount } from "svelte";
  import { watch } from "runed";
  import ArticleList from "../sections/ArticleList.svelte";

  let {
    pageSize = 10,
    mode = "delivery",
    maxItemsTotal = null,
    initialPosts = [] as PostListItem[],
    initialNextSkip = null as number | null,
    initialError = null as string | null,
  }: {
    pageSize?: number;
    maxItemsTotal?: number | null;
    mode?: "delivery" | "onlyPublished" | "onlyDrafts" | "none";
    initialPosts?: PostListItem[];
    initialNextSkip?: number | null;
    initialError?: string | null;
  } = $props();

  let posts = $state<PostListItem[]>([...initialPosts]);
  let isLoading = $state(false);
  let errorMessage = $state<string | null>(initialError);

  const seen = new SvelteSet<string>();
  for (const it of initialPosts) seen.add(it.slug);

  let nextSkip = $state<number | null>(
    initialPosts.length ? initialNextSkip : 0
  );

  let isHasMore = $state(
    maxItemsTotal != null
      ? initialPosts.length < maxItemsTotal && initialNextSkip != null
      : initialNextSkip != null || initialPosts.length === 0
  );

  let sentinel: HTMLElement | null = $state(null);
  let observer: IntersectionObserver | null = $state(null);

  let inflight: Promise<void> | null = $state(null);
  let reqId = $state(0);
  let lastLoadedSkip: number | null = $state(null);

  let aborter: AbortController | null = $state(null);

  async function load(skip: number) {
    if (isLoading || !isHasMore || skip == null) return;
    if (lastLoadedSkip === skip) return;
    if (maxItemsTotal != null && posts.length >= maxItemsTotal) {
      isHasMore = false;
      nextSkip = null;
      return;
    }

    if (sentinel && observer) observer.unobserve(sentinel);

    aborter?.abort();
    aborter = new AbortController();

    isLoading = true;
    errorMessage = null;
    lastLoadedSkip = skip;

    const myReq = ++reqId;

    const params = new URLSearchParams({
      limit: String(pageSize),
      skip: String(skip),
      mode,
    });

    params.append("order", "-fields.date");
    params.append("order", "sys.id");

    const run = (async () => {
      try {
        const res = await fetch(`/api/contentful/posts?${params.toString()}`, {
          cache: "no-store",
          signal: aborter.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const batch = (await res.json()) as PostListItem[];

        if (!Array.isArray(batch) || batch.length === 0) {
          nextSkip = null;
          isHasMore = false;
          return;
        }

        const hintedHeader = res.headers.get("X-Next-Skip");
        const hinted =
          hintedHeader != null ? Number.parseInt(hintedHeader, 10) : NaN;

        nextSkip = Number.isFinite(hinted)
          ? hinted
          : batch.length === pageSize
            ? skip + batch.length
            : null;

        for (const it of batch) {
          if (!seen.has(it.slug)) {
            posts.push(it);
            seen.add(it.slug);
            if (maxItemsTotal != null && posts.length >= maxItemsTotal) {
              nextSkip = null;
              break;
            }
          }
        }

        isHasMore =
          nextSkip != null &&
          (maxItemsTotal == null || posts.length < maxItemsTotal);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }

        errorMessage = e instanceof Error ? e.message : "Unknown error";
      } finally {
        if (reqId === myReq) {
          isLoading = false;
          aborter = null;
          queueMicrotask(() => {
            if (sentinel && observer && (isHasMore ?? false)) {
              observer.observe(sentinel);
            }
          });
        }
      }
    })();

    inflight = run;
    await inflight;
    inflight = null;
  }

  watch(
    [() => pageSize, () => mode, () => maxItemsTotal],
    () => {
      posts = [];
      isLoading = false;
      errorMessage = null;
      seen.clear();
      lastLoadedSkip = null;
      reqId = 0;
      isHasMore = true;
      nextSkip = 0;
      void load(0);
    },
    { lazy: true }
  );

  onMount(() => {
    const el = sentinel;
    observer?.disconnect();

    if (el) {
      observer = new IntersectionObserver(
        (entries) => {
          const e = entries[0];

          if (
            e?.isIntersecting &&
            nextSkip != null &&
            !isLoading &&
            !inflight
          ) {
            void load(nextSkip);
          }
        },
        { root: null, rootMargin: "0px 0px 240px 0px", threshold: 0.01 }
      );

      observer.observe(el);
    }

    if (!posts.length && nextSkip === 0) {
      void load(0);
    }

    return () => observer?.disconnect();
  });
</script>

<div class="min-h-96">
  <ArticleList {posts} />

  {#if errorMessage}
    <p class="text-error mt-5">{errorMessage}</p>
  {/if}

  {#if isLoading}
    <div class="flex items-center justify-center mt-5">
      <span class="loading loading-dots loading-lg"></span>
    </div>
  {/if}

  {#if isHasMore}
    <div bind:this={sentinel} style="height:8px"></div>
  {/if}
</div>
