// Text for app/global-error.tsx, a copy of messages/en.json → Errors (global-error-text.test.ts
// keeps them in sync). That boundary replaces the root layout, so it has no i18n provider, and
// importing the JSON there would ship the whole English catalogue (~24 KB gzipped) in the
// JavaScript of every page, because Next loads the boundary everywhere.
export const GLOBAL_ERROR_TEXT = {
  globalTitle: "Zuula ran into a problem",
  globalDescription:
    "Something went wrong while loading the app. Try again, and if it keeps happening, come back in a few minutes.",
  retry: "Try again",
  reference: "Reference: {digest}",
}
