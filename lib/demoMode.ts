// In the live-wall demo (`?demoAuto=1`) the funnel tiles are non-interactive
// (the iframes use pointer-events: none), so a `controls`-only video can never
// be played and just renders black. In that mode we autoplay videos muted/looped
// so they show motion; the real funnel keeps normal click-to-play controls.
export function isDemoAutoplay(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demoAuto') === '1';
}
