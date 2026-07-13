/** Reading color schemes — shared by client composable and server validation. */
export const COLOR_SCHEMES = ['paper', 'ink', 'sepia', 'qi', 'historic', 'parchment'] as const
export type ColorSchemeId = (typeof COLOR_SCHEMES)[number]

export const DEFAULT_COLOR_SCHEME: ColorSchemeId = 'paper'

export function isColorSchemeId(v: string): v is ColorSchemeId {
  return (COLOR_SCHEMES as readonly string[]).includes(v)
}
