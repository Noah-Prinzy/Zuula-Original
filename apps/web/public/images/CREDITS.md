# Photo credits

All photos are from [Unsplash](https://unsplash.com) under the free Unsplash License. They're
stored at 2400–3200px wide and registered in `components/decor/photos.ts`. Each page gets one
full-page background photo, mapped by URL in `components/decor/route-photos.ts`.

None of these show a recognisable person's face — see the note at the bottom.

| File | Photographer | Source | Background for |
| --- | --- | --- | --- |
| kampala-skyline.jpg | Keith Kasaija | https://unsplash.com/photos/lii0uaz8Ieo | Home hero; fallback background |
| uganda-hills.jpg | Random Institute | https://unsplash.com/photos/KQ5djKAN35s | About |
| newspapers.jpg | AbsolutVision | https://unsplash.com/photos/WYd_PkCa1BY | Library |
| kampala-sunset.jpg | Robin Kutesa | https://unsplash.com/photos/Q3ymlvOJGFs | Fact-check report |
| crimson-texture.jpg | Kseniya Lapteva | https://unsplash.com/photos/lpo3y90Yuig | Verify |
| crimson-waves.jpg | Pawel Czerwinski | https://unsplash.com/photos/DQ2lqx_6RD0 | Developers (API); Sign in: two-factor |
| hill-road.jpg | Random Institute | https://unsplash.com/photos/v6MSchd3bAU | Offline |
| lake-victoria.jpg | Alexandre Barbosa | https://unsplash.com/photos/2fDt4MRgOCg | Privacy; Sign up: verify |
| nile-boat.jpg | Derricks Nature Book | https://unsplash.com/photos/iSGFaRTro1Q | Terms |
| tea-road.jpg | Michael Starkie | https://unsplash.com/photos/hDPqTAC-QJg | Submission status; Sign in |
| kampala-street.jpg | Ssenyondo Gabriel | https://unsplash.com/photos/Bb3qLfKp0Bs | Forgot password; Admin |
| night-road.jpg | Michael Starkie | https://unsplash.com/photos/zsdpVP68E8A | Reset password; Admin: sources |
| boats-sunset.jpg | Lionel Murage | https://unsplash.com/photos/OeEc3Qmtr-4 | Account; Sign up |
| murchison-falls.jpg | Jonathan Göhner | https://unsplash.com/photos/EmsDN8-M4dk | Account: activity |

## Faces removed

journalists.jpg, market-call.jpg, friends-phone.jpg, couple-phone.jpg, phone-on-crimson.jpg,
man-texting.jpg, classroom.jpg and workshop.jpg showed identifiable people and were deleted from
the repo, not just unwired. The routes that used them now reuse a photo from the table above.

## Still needed: news/journalist/detective themed photography

Of what's left, only `newspapers.jpg` actually reads as "journalism". The rest are general Uganda
landscape/cityscape shots reused as neutral backdrops for lack of anything better — they don't
carry the news/investigative mood the brand wants. To finish this properly we need real photos of
things like: a magnifying glass over documents, an evidence corkboard with pinned clippings and
red string, a vintage or analog camera/press badge, a reporter's notebook and pen, a newsroom
desk, a red "VERIFIED/FALSE" ink stamp, or stacks of press clippings — all without a person's face
as the subject. This sandbox has no outbound access to Unsplash or any other image source, so
someone needs to supply these files (drop them in this folder + register in `photos.ts`).
