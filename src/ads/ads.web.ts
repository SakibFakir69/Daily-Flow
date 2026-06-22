/**
 * Web (and any non-native) stub for the ads module. The Mobile Ads SDK has no
 * web support, so every entry point here is an inert no-op. Metro picks this
 * file over ./ads.ts when bundling for web.
 */
export async function initializeAds(): Promise<void> {}

export function maybeShowInterstitial(_enabled: boolean): void {}
