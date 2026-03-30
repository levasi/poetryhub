#!/usr/bin/env node
/**
 * Nitro/Nuxt expect Node 20.19+ and <24. On Node 24+, unbundled nitropack
 * runtime can hit ERR_PACKAGE_IMPORT_NOT_DEFINED for #nitro-internal-virtual/*.
 * @see .nvmrc
 */
const major = Number.parseInt(process.versions.node.split('.')[0], 10)
if (Number.isFinite(major) && major >= 24) {
  console.error(
    `\n[poetryhub] Node ${process.version} is not supported (need >=20.19 <24).`,
    '\nThis stack breaks with: Package import specifier "#nitro-internal-virtual/..." is not defined.',
    '\nUse Node 22: nvm use   or   fnm use   (see .nvmrc)\n',
  )
  process.exit(1)
}
