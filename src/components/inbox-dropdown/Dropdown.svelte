<script lang="ts">
  import DropdownItem from "./Item.svelte";
  import Mail from "@lucide/svelte/icons/mail";
</script>

<div class="dropdown dropdown-end">
  <div tabindex={0} role="button" class="btn btn-outline m-1">
    <Mail class="size-5" />
    Inbox
  </div>
  <div
    role="menu"
    tabindex={0}
    class="dropdown-content menu bg-base-100 rounded-box z-1 w-64 p-2 shadow-sm"
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
</div>
