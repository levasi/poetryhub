/** CSS `font-weight` presets for carousel verse & title (optional override over theme Tailwind classes). */
export const CAROUSEL_FONT_WEIGHT_PRESETS = [300, 400, 500, 600, 700] as const

export type CarouselFontWeightPreset = (typeof CAROUSEL_FONT_WEIGHT_PRESETS)[number]
