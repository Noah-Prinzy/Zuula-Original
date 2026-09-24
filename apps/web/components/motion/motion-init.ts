// Runs before paint: enables the hidden-until-revealed styles only when JavaScript is running.
// Kept out of reveal-observer.tsx because exports of a "use client" module are client references.
//
// It also reveals whatever [data-reveal] content is already on screen as soon as the HTML is
// parsed (DOMContentLoaded doesn't wait for Next's async scripts). Otherwise text above the
// fold stays invisible until React has downloaded and hydrated and RevealObserver runs, which
// on a slow phone is seconds after the HTML arrived. Below-the-fold content is left to
// RevealObserver, as before; the 0.92 matches its -8% bottom rootMargin.
export const MOTION_INIT_SCRIPT = `document.documentElement.setAttribute("data-motion","");document.addEventListener("DOMContentLoaded",function(){var h=innerHeight*0.92;document.querySelectorAll("[data-reveal]:not([data-revealed])").forEach(function(e){if(e.getBoundingClientRect().top<h)e.setAttribute("data-revealed","")})})`
