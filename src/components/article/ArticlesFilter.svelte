<script lang="ts">
  import { watch } from "runed";
  import { getContext } from "svelte";
  import type { ArticleListContext } from "../sections/ArticleListWithFilter.svelte";
  import TagList from "./TagList.svelte";
  import type { SortOrder } from "@/lib/contentful";

  const sortItems: {
    label: string;
    value: SortOrder;
  }[] = [
    {
      label: "Terbaru",
      value: "descending",
    },
    {
      label: "Terlama",
      value: "ascending",
    },
  ];

  const articleListContext = getContext<ArticleListContext>(
    "article-list-context"
  );

  const { currentUrl, allTags } = $derived(articleListContext);
  const { currentUrl: nonReactiveCurrentUrl } = articleListContext;
  const currentParams = {
    sort: nonReactiveCurrentUrl.searchParams.get("sort") as
      | SortOrder
      | undefined,
    search: nonReactiveCurrentUrl.searchParams.get("search") ?? "",
  };

  const { sort: currentSort, search: currentSearch } = currentParams;

  let selectedSort = $state(currentSort ?? "descending");
  let searchQuery = $state(currentSearch);

  watch(
    () => selectedSort,
    (value) => {
      currentUrl.searchParams.set("sort", value);
      history.replaceState({}, "", currentUrl.toString());
    }
  );

  function handleSearch(event: Event) {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const query = formData.get("search") as string;

    currentUrl.searchParams.set("search", query);
    history.replaceState({}, "", currentUrl.toString());
  }

  const modifiedTags = $derived.by(() => {
    if (!allTags) return [];

    const searchParams = new URLSearchParams(currentUrl.search);
    const tags = allTags.map((tag) => {
      searchParams.set("tag", tag.slug);

      const isActive = currentUrl.searchParams.get("tag") === tag.slug;

      let href = `${currentUrl.pathname}?${searchParams.toString()}`;

      if (isActive) {
        searchParams.delete("tag");
        href = `${currentUrl.pathname}?${searchParams.toString()}`;
      }

      return {
        ...tag,
        href,
        isActive,
      };
    });

    return tags;
  });
</script>

<div class="space-y-4">
  <form method="POST" onsubmit={handleSearch}>
    <label class="input w-full">
      <svg
        class="h-[1em] opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <g
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="2.5"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </g>
      </svg>
      <input
        type="search"
        placeholder="Cari tulisan..."
        aria-label="Cari tulisan"
        autocapitalize="off"
        id="search"
        name="search"
        bind:value={searchQuery}
      />
    </label>
  </form>
  <div
    aria-label="Sort articles"
    class="p-4 bg-base-200 rounded-2xl space-y-4 border border-primary border-dashed"
  >
    <div aria-label="Sort articles">
      <p class="heading-font text-primary uppercase">Urutkan Secara</p>
      <div class="mt-3 grid grid-cols-2 gap-3">
        {#each sortItems as { label, value }}
          <label for={value} class="flex items-center">
            <input
              type="radio"
              id={value}
              name="sort"
              class="radio checked:radio-primary"
              {value}
              bind:group={selectedSort}
            />
            <span class="ml-2">{label}</span>
          </label>
        {/each}
      </div>
    </div>
    {#if allTags && allTags.length > 0}
      <div aria-label="Article tags">
        <p class="heading-font text-primary uppercase">Tags</p>
        <TagList tags={modifiedTags} class="mt-3" />
      </div>
    {/if}
  </div>
</div>
