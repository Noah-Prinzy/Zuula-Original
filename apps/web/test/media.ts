// matchMedia for jsdom, with a switch for prefers-reduced-motion so motion components can be
// tested both ways.
let reduced = false

export function setReducedMotion(value: boolean) {
  reduced = value
}

if (typeof window !== "undefined")
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion: reduce")
        ? reduced
        : false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  })
