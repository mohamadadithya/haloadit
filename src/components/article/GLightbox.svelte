<script lang="ts">
  import { onMount } from "svelte";
  import GLightbox from "glightbox";
  import "glightbox/dist/css/glightbox.min.css";

  onMount(() => {
    const gl = GLightbox({
      touchNavigation: true,
      zoomable: true,
    });

    return () => gl.destroy();
  });
</script>
