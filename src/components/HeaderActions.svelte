<script lang="ts">
  import { cn } from "@helpers";
  import InboxDropdown from "./inbox-dropdown/Dropdown.svelte";
  import Settings from "@lucide/svelte/icons/settings";

  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();
</script>

<div class="flex items-center gap-2 {cn(className)}">
  <InboxDropdown />
  <div class="lg:tooltip lg:tooltip-bottom" data-tip="Pengaturan">
    <button
      type="button"
      class="btn btn-circle btn-soft btn-primary"
      aria-label="Settings"
    >
      <Settings class="size-5" />
    </button>
  </div>
</div>
