# Photo credits

Most photos are from [Unsplash](https://unsplash.com) under the free Unsplash License. They're
stored at 2400–3200px wide and registered in `components/decor/photos.ts`. Each page gets one
full-page background photo, mapped by URL in `components/decor/route-photos.ts`; some pages
(content-dense or purely utilitarian ones) show no photo at all — see `NO_PHOTO_PATHS`.

| File | Photographer | Source | Background for |
| --- | --- | --- | --- |
| kampala-skyline.jpg | Keith Kasaija | https://unsplash.com/photos/lii0uaz8Ieo | Fallback background |
| uganda-hills.jpg | Random Institute | https://unsplash.com/photos/KQ5djKAN35s | About |
| newspapers.jpg | AbsolutVision | https://unsplash.com/photos/WYd_PkCa1BY | Verify |
| kampala-sunset.jpg | Robin Kutesa | https://unsplash.com/photos/Q3ymlvOJGFs | Fact-check report |
| monitor-frontpages.webp | supplied by Noah, source/licence not confirmed | — | Library |
| newspaper-wall.webp | supplied by Noah, source/licence not confirmed | — | Home hero |
| world-wire.webp | supplied by Noah, source/licence not confirmed | — | Developers (API) |
| crimson-waves.jpg | Pawel Czerwinski | https://unsplash.com/photos/DQ2lqx_6RD0 | Sign in: two-factor |
| tea-road.jpg | Michael Starkie | https://unsplash.com/photos/hDPqTAC-QJg | Sign in |
| lake-victoria.jpg | Alexandre Barbosa | https://unsplash.com/photos/2fDt4MRgOCg | Sign up: verify |
| boats-sunset.jpg | Lionel Murage | https://unsplash.com/photos/OeEc3Qmtr-4 | Sign up |
| kampala-street.jpg | Ssenyondo Gabriel | https://unsplash.com/photos/Bb3qLfKp0Bs | Forgot password |
| night-road.jpg | Michael Starkie | https://unsplash.com/photos/zsdpVP68E8A | Reset password |
| murchison-falls.jpg | Jonathan Göhner | https://unsplash.com/photos/EmsDN8-M4dk | Account: activity |
| hill-road.jpg | Random Institute | https://unsplash.com/photos/v6MSchd3bAU | Not currently used |
| nile-boat.jpg | Derricks Nature Book | https://unsplash.com/photos/iSGFaRTro1Q | Not currently used |
| crimson-texture.jpg | Kseniya Lapteva | https://unsplash.com/photos/lpo3y90Yuig | Not currently used |

## No background photo

These routes render on the plain page background instead of a full-page photo (`PageHeader`
instead of the white-text `PageHero`): Offline, Privacy, Terms, Submission status, and every page
under Account, Admin and Review (the whole signed-in app shell — see `(app)/layout.tsx`, which
doesn't render `RouteBackdrop` at all).

## The `supplied by Noah` files

`monitor-frontpages.webp`, `newspaper-wall.webp` and `world-wire.webp` were pasted directly into
the conversation, not sourced from Unsplash. Their original source and licence aren't known —
please confirm you have the right to use them commercially before this goes to production, or
swap them for licensed equivalents. Two other supplied images were **not** used: a
magnifying-glass/5-Ws graphic carried a visible "123RF" stock-photo watermark, and an original
newspaper-archive stack photo was dropped from Verify in favour of newspapers.jpg once
newspaper-wall.webp took over the Home hero. A `newspaper-bundle.webp` used briefly on Library
was removed once `monitor-frontpages.webp` replaced it there.

**Resolution note:** all of the supplied files above came in far smaller than the Unsplash pool
(678–736px wide, vs. 3000–3200px for the rest). No amount of Next.js image-quality/sizes config
can add detail a source file doesn't have, so each was upscaled to 1600px wide with a Lanczos
filter plus a light unsharp-mask pass (`sharp`, see git history for the exact params) — this
improves how they hold up when stretched across a full-bleed hero, but it's not a substitute for
real higher-resolution originals. If you have access to bigger versions of any of these, send
them over and I'll swap them in directly.

## Faces

Every photo in this set was checked to make sure no identifiable person's face is the subject —
several older versions (journalists.jpg, market-call.jpg, friends-phone.jpg, couple-phone.jpg,
phone-on-crimson.jpg, man-texting.jpg, classroom.jpg, workshop.jpg) were removed from the repo
for showing one and are gone from git history's working tree, not just unwired.
