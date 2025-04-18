class HeaderStore {
  isScrollingDown = $state(false);
  lastScrollY = $state<number>();
  isTicking = $state(false);

  handleScroll = () => {
    if (!this.isTicking) {
      requestAnimationFrame(() => {
        const currentScrollY = scrollY;

        if (this.lastScrollY)
          this.isScrollingDown = currentScrollY > this.lastScrollY;

        this.lastScrollY = currentScrollY;
        this.isTicking = false;
      });

      this.isTicking = true;
    }
  };
}

export const headerStore = new HeaderStore();
