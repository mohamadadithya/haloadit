<script lang="ts">
  let progress = $state(0);

  function handleReadingProgress() {
    const totalHeight = document.documentElement.scrollHeight - innerHeight;
    const currentHeight = scrollY;

    progress = (currentHeight / totalHeight) * 100;
  }
</script>

<svelte:window onscroll={handleReadingProgress} />

<div
  aria-label="Reading Progress"
  role="progressbar"
  class="w-full h-1 bg-base-100 fixed top-0 left-0 z-50"
  class:opacity-0={progress === 0}
>
  <div class="h-1 bg-primary" style="width: {progress}%"></div>
</div>
