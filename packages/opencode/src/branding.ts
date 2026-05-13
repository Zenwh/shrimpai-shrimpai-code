/**
 * Shrimpai Code branding constants.
 * All product-identity strings live here so upstream rebases stay clean.
 */
export const Brand = {
  // Product identity
  name: "Shrimpai Code",
  nameZh: "虾酱",
  shortName: "shrimpai-code",
  bundleId: "cc.shrimpai.code",
  urlScheme: "shrimpai",

  // Org
  company: "Shrimpai",
  email: "hello@shrimpai.cc",

  // URLs
  homeUrl: "https://shrimpai.cc/code",
  docsUrl: "https://shrimpai.cc/code/docs",
  apiUrl: "https://api.shrimpai.cc",
  authUrl: "https://shrimpai.cc/auth",
  configSchemaUrl: "https://shrimpai.cc/code/config.json",
  themeSchemaUrl: "https://shrimpai.cc/code/theme.json",
  faviconUrl: "https://shrimpai.cc/favicon-96x96.png",
  installUrl: "https://shrimpai.cc/code/install",
  shareBaseUrl: "https://shrimpai.cc/code",

  // GitHub Releases (auto-update)
  updateOwner: "Zenwh",
  updateRepo: "shrimpai-shrimpai-code",

  // HTTP Referer (used by upstream provider integrations to attribute traffic)
  httpReferer: "https://shrimpai.cc/",
} as const
