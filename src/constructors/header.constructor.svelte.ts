class HeaderStore {
  lastScrollY = $state<number>();
  isTicking = $state(false);
  height = $state(0);

  handleScroll = () => {
    if (!this.isTicking) {
      requestAnimationFrame(() => {
        const currentScrollY = scrollY;

        this.lastScrollY = currentScrollY;
        this.isTicking = false;
      });

      this.isTicking = true;
    }
  };
}

export const headerStore = new HeaderStore();
