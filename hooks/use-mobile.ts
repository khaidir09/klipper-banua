import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Subscribes to the viewport width. `useSyncExternalStore` is the supported way
 * to read an external source like `matchMedia`: it keeps the value consistent
 * across a render and avoids the setState-in-effect the generated version used.
 * The server snapshot is `false`, so the desktop sidebar renders on the server
 * and the mobile sheet takes over after hydration.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
