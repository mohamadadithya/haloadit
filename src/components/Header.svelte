<script lang="ts">
  import siteConfig from "@site-config";
  import Container from "./Container.svelte";
  import HeaderActions from "./HeaderActions.svelte";

  const mainLinks = [
    {
      label: "👱 Tentang",
      href: "/#about",
    },
    {
      label: "✍️ Tulisan",
      href: "/#writing",
    },
    {
      label: "🗒️ Resume",
      href: "/resume",
      isExternal: true,
    },
  ];

  let lastScrollY = $state<number>(),
    ticking = $state(false),
    isScrollingDown = $state(false);

  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScrollY = scrollY;

        if (lastScrollY) isScrollingDown = currentScrollY > lastScrollY;
        lastScrollY = currentScrollY;
        ticking = false;
      });

      ticking = true;
    }
  }

  let isOnHome = $state(false);

  $effect(() => {
    isOnHome = location.pathname === "/";
  });
</script>

<svelte:window onscroll={handleScroll} />

<header
  class="py-5 sticky top-0 z-50 duration-500 bg-base-100"
  class:show={(!isScrollingDown && !isOnHome) || isOnHome}
>
  <Container
    class="flex md:items-center justify-between flex-col gap-6 md:flex-row"
  >
    <div class="flex items-center justify-between">
      <a href="/">
        <p class="text-2xl font-lora font-semibold">Halo Adit 👋</p>
        <p class="text-xs">by {siteConfig.author}</p>
      </a>
      <HeaderActions class="md:hidden" />
    </div>
    <nav>
      <ul class="flex justify-center items-center gap-6">
        {#each mainLinks as { label, href, isExternal }}
          <li>
            <a
              {href}
              target={isExternal ? "_blank" : "_self"}
              rel={isExternal ? "noopener noreferrer" : ""}
            >
              {label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    <HeaderActions class="hidden md:flex" />
  </Container>
</header>

<style>
  header {
    transform: translateY(-100%);
    opacity: 0;

    &:is(.show) {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
