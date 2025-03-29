<script lang="ts">
  import { cn } from "@helpers";
  import InboxDropdown from "./inbox-dropdown/Dropdown.svelte";
  import Settings from "@lucide/svelte/icons/settings";
  import { setContext } from "svelte";

  interface Props {
    class?: string;
    popoverId?: string;
  }

  let { class: className = "", popoverId = "inbox-panel" }: Props = $props();

  setContext("popoverId", popoverId);
</script>

<div class="flex items-center gap-2 {cn(className)}">
  <InboxDropdown />
  <div class="lg:tooltip lg:tooltip-bottom" data-tip="Pengaturan">
    <button
      type="button"
      class="btn btn-circle btn-outline"
      aria-label="Settings"
    >
      <Settings class="size-5" />
    </button>
  </div>
</div>
