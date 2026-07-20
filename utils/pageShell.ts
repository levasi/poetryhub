/**
 * Horizontal inset + width aligned with `components/AppNav.vue` inner bar.
 * Use in layouts so page content shares the same left/right margins as the header.
 */
export const PAGE_SHELL_INSET_CLASS =
  'mx-auto w-full max-w-none min-w-0 px-4 md:px-8 lg:px-10'

/** Clearance above fixed mobile tab bars (account, docs). */
export const MOBILE_TAB_BAR_CLEARANCE = 'pb-mobile-tab md:pb-14'

/** Poem reader: mobile actions pill + collapsed settings rail. */
export const READER_MOBILE_CLEARANCE = 'pb-reader-mobile md:pb-0'

/** Carousel generator fixed export bar. */
export const CAROUSEL_MOBILE_CLEARANCE = 'pb-carousel-mobile md:pb-16'

/** Author profile unified edit bar (save / discard), above mobile site tab bar. */
export const AUTHOR_EDIT_BAR_CLEARANCE = 'pb-[calc(9rem+env(safe-area-inset-bottom,0px))] md:pb-36'
