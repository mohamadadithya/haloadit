<script lang="ts">
  import type { TOCItem } from "src/types";
  import { fly } from "svelte/transition";
  import { headerStore } from "@/constructors/header.constructor.svelte";
  import { MediaQuery } from "svelte/reactivity";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import LayoutList from "@lucide/svelte/icons/layout-list";
  import { onClickOutside } from "runed";

  interface Props {
    items: TOCItem[];
  }

  let { items }: Props = $props();

  const { isScrollingDown } = $derived(headerStore);

  let ref = $state<HTMLElement>(),
    tocPanelMobileRef = $state<HTMLElement>(),
    isPassed = $state(false),
    isIntersecting = $state(false);

  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const { boundingClientRect } = entry;
        const boundingRect = boundingClientRect;

        isIntersecting = entry.isIntersecting;
        isPassed = boundingRect.top < 0;
      },
      { threshold: 0.5 }
    );

    if (ref) {
      observer.observe(ref);

      return () => observer.disconnect();
    }
  });

  const largeScreen = new MediaQuery("(min-width: 1024px)");

  let isOpenMobilePanel = $state(false);

  const isShowTOCButton = $derived(
    isPassed && !isIntersecting && !largeScreen.current
  );

  onClickOutside(
    () => tocPanelMobileRef,
    () => (isOpenMobilePanel = false)
  );
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
    class="p-5 bg-base-200 w-full rounded-2xl max-w-64 shadow fixed top-2/4 -translate-y-2/4 right-5"
  >
    {@render tocList({ isShowCloseButton: true })}
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
  { isShowCloseButton }: { isShowCloseButton: boolean } = {
    isShowCloseButton: false,
  }
)}
  <div class="flex items-center gap-3 justify-between mb-4">
    <p class="font-lora font-semibold text-primary uppercase">Daftar Isi</p>
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
  <ul class="space-y-3 text-sm">
    {#each items as { id, text }}
      <li>
        <a href={`#${id}`} class="link link-hover">{text}</a>
      </li>
    {/each}
  </ul>
{/snippet}
