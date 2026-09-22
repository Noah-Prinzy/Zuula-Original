# Photo credits

Most photos are from [Unsplash](https://unsplash.com) under the free Unsplash License. They're
stored at 2400–3200px wide and registered in `components/decor/photos.ts`. Each page gets one
full-page background photo, mapped by URL in `components/decor/route-photos.ts`; some pages
(content-dense or purely utilitarian ones) show no photo at all — see `NO_PHOTO_PATHS`.

| File | Photographer | Source | Background for |
| --- | --- | --- | --- |
| kampala-skyline.jpg | Keith Kasaija | https://unsplash.com/photos/lii0uaz8Ieo | Fallback background |
| uganda-hills.jpg | Random Institute | https://unsplash.com/photos/KQ5djKAN35s | About |
| newspapers.jpg | AbsolutVision | https://unsplash.com/photos/WYd_PkCa1BY | Home hero |
| kampala-sunset.jpg | Robin Kutesa | https://unsplash.com/photos/Q3ymlvOJGFs | Fact-check report |
| newspaper-bundle.webp | supplied by Noah, source/licence not confirmed | — | Library |
| newspaper-archive.webp | supplied by Noah, source/licence not confirmed | — | Verify |
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
instead of the white-text `PageHero`): Offline, Privacy, Terms, Submission status, Account,
Account activity, Admin, Admin sources.

## The three `supplied by Noah` files

`newspaper-bundle.webp`, `newspaper-archive.webp` and `world-wire.webp` were pasted directly into
the conversation, not sourced from Unsplash. Their original source and licence aren't known —
please confirm you have the right to use them commercially before this goes to production, or
swap them for licensed equivalents. A fourth supplied image (a magnifying-glass/5-Ws graphic) was
**not** used: it carried a visible "123RF" stock-photo watermark and can't ship as-is.

## Faces

Every photo in this set was checked to make sure no identifiable person's face is the subject —
several older versions (journalists.jpg, market-call.jpg, friends-phone.jpg, couple-phone.jpg,
phone-on-crimson.jpg, man-texting.jpg, classroom.jpg, workshop.jpg) were removed from the repo
for showing one and are gone from git history's working tree, not just unwired.
