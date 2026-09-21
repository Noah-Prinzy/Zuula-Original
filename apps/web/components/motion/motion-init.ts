// Runs before paint: enables the hidden-until-revealed styles only when JavaScript is running.
// Kept out of reveal-observer.tsx because exports of a "use client" module are client references.
export const MOTION_INIT_SCRIPT = `document.documentElement.setAttribute("data-motion","")`
