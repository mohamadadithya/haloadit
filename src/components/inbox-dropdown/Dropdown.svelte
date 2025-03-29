<script>
  import DropdownItem from "./Item.svelte";
  import Mail from "@lucide/svelte/icons/mail";
</script>

<button
  type="button"
  class="btn btn-outline"
  popovertarget="inbox-panel"
  style="anchor-name:--inbox-anchor"
>
  <Mail class="size-5" />
  Inbox
</button>
<div
  class="dropdown dropdown-end menu w-64 max-h-96 rounded-box bg-base-100 shadow-sm"
  popover
  id="inbox-panel"
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
