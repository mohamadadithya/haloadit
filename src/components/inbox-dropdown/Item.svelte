<script lang="ts">
  function handleClick() {
    location.href = "/lorem-ipsum";
  }
</script>

<button
  type="button"
  onclick={handleClick}
  class="py-3 block rounded-xl space-y-2 text-left"
>
  <div class="flex items-center justify-between gap-2">
    <div class="badge badge-soft badge-primary badge-sm">Postingan</div>
    <p class="text-gray-400 text-xs">5 menit yang lalu</p>
  </div>
  <p class="font-medium text-balance">
    Lorem ipsum dolor sit amet consectetur.
  </p>
</button>
