<script lang="ts">
  import Ellipsis from "@lucide/svelte/icons/ellipsis";

  interface Props {
    title: string;
    description: string;
    canonicalUrl: string;
  }

  let { title, description, canonicalUrl }: Props = $props();

  async function openShareAPI(event: Event) {
    try {
      const target = event.currentTarget as HTMLButtonElement;
      const data = {
        title: target.dataset.title,
        text: target.dataset.description,
        url: target.dataset.url,
      };

      await navigator.share(data);
    } catch (error) {
      console.error(error);
    }
  }
</script>

<div class="tooltip tooltip-bottom" data-tip="Lainnya">
  <button
    onclick={openShareAPI}
    data-title={title}
    data-description={description}
    data-url={canonicalUrl}
    type="button"
    aria-label="More"
    class="btn btn-circle btn-sm"
  >
    <span class="sr-only">More</span>
    <Ellipsis name="uil:ellipsis-h" class="size-6" />
  </button>
</div>
