<script lang="ts">
  import siteConfig from "@site-config";
  import Container from "./Container.svelte";
  import { headerStore } from "@/constructors/header.constructor.svelte";

  const mainLinks = [
    {
      label: "👱 Tentang",
      href: "/#about",
    },
    {
      label: "✍️ Tulisan",
      href: "/writings?sort=descending",
    },
    {
      label: "🗒️ Resume",
      href: "/resume",
      isExternal: true,
    },
  ];

  $effect(() => {
    document.documentElement.style.setProperty(
      "--header-height",
      `${headerStore.height}px`
    );
  });
</script>

<header
  bind:clientHeight={headerStore.height}
  class="py-5 sticky top-0 z-50 duration-500 bg-base-100"
>
  <Container
    class="flex items-center justify-between flex-col gap-5 sm:flex-row"
  >
    <a href="/">
      <p class="text-2xl heading-font">Halo Adit 👋</p>
      <p class="text-xs">by {siteConfig.author}</p>
    </a>
    <div class="flex items-center gap-5 w-full sm:w-auto">
      <nav
        class="border-t pt-5 sm:border-0 sm:pt-0 border-dashed border-primary w-full"
      >
        <ul class="flex justify-center items-center gap-8">
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
    </div>
  </Container>
</header>
