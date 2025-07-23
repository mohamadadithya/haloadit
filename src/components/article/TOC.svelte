<script lang="ts">
  import type { TOCItem } from "src/types";
  import { fly } from "svelte/transition";
  import { headerStore } from "@/constructors/header.constructor.svelte";
  import { MediaQuery } from "svelte/reactivity";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import LayoutList from "@lucide/svelte/icons/layout-list";
  import { onClickOutside } from "runed";
  import { innerHeight } from "svelte/reactivity/window";

  interface Props {
    items: TOCItem[];
  }

  let { items }: Props = $props();

  const { isScrollingDown, height: headerHeight } = $derived(headerStore);

  let ref = $state<HTMLElement>(),
    tocPanelMobileRef = $state<HTMLElement>(),
    isPassed = $state(false),
    isIntersecting = $state(false),
    isOpenMobilePanel = $state(false);

  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const { boundingClientRect } = entry;
        const boundingRect = boundingClientRect;

        isIntersecting = entry.isIntersecting;
        isPassed = boundingRect.top < 0;
      },
      { threshold: 1 }
    );

    if (ref) {
      observer.observe(ref);

      return () => observer.disconnect();
    }
  });

  const largeScreen = new MediaQuery("(min-width: 1024px)");
  const isShowTOCButton = $derived(
    isPassed && !isIntersecting && !largeScreen.current
  );

  onClickOutside(
    () => tocPanelMobileRef,
    () => (isOpenMobilePanel = false)
  );

  let tocPanelHeaderHeight = $state<number>();

  const tocMaxHeight = $derived.by(() => {
    const windowHeight = innerHeight.current;

    if (windowHeight && tocPanelHeaderHeight) {
      return windowHeight - (headerHeight + tocPanelHeaderHeight + 20 + 60);
    }

    return 0;
  });
</script>

<div
  bind:this={ref}
  transition:fly={{ y: 100, delay: 800 }}
  class="toc flex-1 lg:sticky p-5 bg-base-200 w-full rounded-2xl shadow duration-500"
  class:lg:top-24={!isScrollingDown}
  class:lg:top-8={isScrollingDown}
>
  {@render tocList()}
</div>

{#if isOpenMobilePanel && isShowTOCButton}
  <div
    bind:this={tocPanelMobileRef}
    in:fly={{ x: 100 }}
    out:fly={{ x: 100 }}
    class="p-5 bg-base-200 w-full rounded-2xl max-w-72 shadow fixed bottom-5 right-5 z-[60]"
  >
    {@render tocList({ isShowCloseButton: true, isEnableOverflow: true })}
  </div>
{:else if !isOpenMobilePanel && isShowTOCButton}
  <div class="fixed top-2/4 -translate-y-2/4 right-5">
    <button
      in:fly={{ x: 100, delay: 500 }}
      out:fly={{ x: 100 }}
      onclick={() => (isOpenMobilePanel = !isOpenMobilePanel)}
      type="button"
      aria-label="TOC button"
      class="btn btn-primary btn-circle"
    >
      <LayoutList class="size-6" />
    </button>
  </div>
{/if}

{#snippet tocList(
  {
    isShowCloseButton,
    isEnableOverflow,
  }: { isShowCloseButton: boolean; isEnableOverflow?: boolean } = {
    isShowCloseButton: false,
    isEnableOverflow: false,
  }
)}
  <div
    class="flex items-center gap-3 justify-between mb-4"
    bind:clientHeight={tocPanelHeaderHeight}
  >
    <p class="heading-font text-primary uppercase">Daftar Isi</p>
    {#if isShowCloseButton}
      <button
        type="button"
        aria-label="Close"
        onclick={() => (isOpenMobilePanel = false)}
        class="btn btn-primary btn-soft btn-sm"
      >
        Tutup
        <ArrowRight class="size-5" />
      </button>
    {/if}
  </div>
  <ul
    class="space-y-4 text-sm"
    class:overflow-y-auto={isEnableOverflow}
    class:overscroll-y-contain={isEnableOverflow}
    style={isEnableOverflow ? `max-height: ${tocMaxHeight}px` : ""}
  >
    {#each items as { id, text, level }}
      <li
        class:list-disc={level !== "h2"}
        class:ml-6={level === "h3"}
        class:ml-12={level === "h4"}
      >
        <a href={`#${id}`} class="link link-hover">
          <p class="text-pretty">{text}</p>
        </a>
      </li>
    {/each}
  </ul>
{/snippet}
