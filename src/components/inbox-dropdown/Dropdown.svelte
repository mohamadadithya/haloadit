<script lang="ts">
  import { getContext } from "svelte";
  import DropdownItem from "./Item.svelte";
  import Mail from "@lucide/svelte/icons/mail";

  const popoverId = getContext<string>("popoverId");
</script>

<button
  type="button"
  class="btn btn-outline"
  popovertarget={popoverId}
  style="anchor-name:--inbox-anchor"
>
  <Mail class="size-5" />
  Inbox
</button>
<div
  popover
  class="dropdown dropdown-end menu w-64 max-h-96 rounded-box bg-base-100 shadow-sm"
  id={popoverId}
  style="position-anchor:--inbox-anchor"
>
  <button type="button" class="btn btn-sm btn-soft mb-2.5">
    Tandai telah dibaca semua
  </button>
  <ul>
    {#each { length: 5 } as _}
      <li>
        <DropdownItem />
      </li>
    {/each}
  </ul>
</div>
