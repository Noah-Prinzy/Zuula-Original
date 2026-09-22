import type { StaticImageData } from "next/image"

import boatsSunset from "@/public/images/boats-sunset.jpg"
import crimsonTexture from "@/public/images/crimson-texture.jpg"
import crimsonWaves from "@/public/images/crimson-waves.jpg"
import hillRoad from "@/public/images/hill-road.jpg"
import kampalaSkyline from "@/public/images/kampala-skyline.jpg"
import kampalaStreet from "@/public/images/kampala-street.jpg"
import kampalaSunset from "@/public/images/kampala-sunset.jpg"
import lakeVictoria from "@/public/images/lake-victoria.jpg"
import monitorFrontpages from "@/public/images/monitor-frontpages.webp"
import murchisonFalls from "@/public/images/murchison-falls.jpg"
import newspaperWall from "@/public/images/newspaper-wall.webp"
import newspapers from "@/public/images/newspapers.jpg"
import nightRoad from "@/public/images/night-road.jpg"
import nileBoat from "@/public/images/nile-boat.jpg"
import teaRoad from "@/public/images/tea-road.jpg"
import ugandaHills from "@/public/images/uganda-hills.jpg"
import worldWire from "@/public/images/world-wire.webp"

export type Photo = {
  src: StaticImageData
  alt: string
  /** null when the source/licence isn't known (e.g. supplied directly, not sourced from Unsplash). */
  credit: { name: string; url: string } | null
}

// Decorative photography, all from Unsplash (free licence), stored at 2400–3200px so they
// stay sharp on high-DPI screens. Next.js serves resized AVIF/WebP from these originals.
export const PHOTOS = {
  kampalaSkyline: {
    src: kampalaSkyline,
    alt: "Kampala skyline under a bright sky",
    credit: {
      name: "Keith Kasaija",
      url: "https://unsplash.com/photos/lii0uaz8Ieo",
    },
  },
  ugandaHills: {
    src: ugandaHills,
    alt: "Terraced green hills around a lake in south-western Uganda",
    credit: {
      name: "Random Institute",
      url: "https://unsplash.com/photos/KQ5djKAN35s",
    },
  },
  hillRoad: {
    src: hillRoad,
    alt: "A road winding through green Ugandan hills",
    credit: {
      name: "Random Institute",
      url: "https://unsplash.com/photos/v6MSchd3bAU",
    },
  },
  newspapers: {
    src: newspapers,
    alt: "Close-up of folded newspapers",
    credit: {
      name: "AbsolutVision",
      url: "https://unsplash.com/photos/WYd_PkCa1BY",
    },
  },
  monitorFrontpages: {
    src: monitorFrontpages,
    alt: "A collage of Daily Monitor and Sunday Monitor Uganda newspaper front pages",
    credit: null,
  },
  newspaperWall: {
    src: newspaperWall,
    alt: "A person reading, seated in front of a wall covered in newspaper clippings",
    credit: null,
  },
  worldWire: {
    src: worldWire,
    alt: "A world map tracking a wire-service flight path",
    credit: null,
  },
  crimsonTexture: {
    src: crimsonTexture,
    alt: "",
    credit: {
      name: "Kseniya Lapteva",
      url: "https://unsplash.com/photos/lpo3y90Yuig",
    },
  },
  crimsonWaves: {
    src: crimsonWaves,
    alt: "",
    credit: {
      name: "Pawel Czerwinski",
      url: "https://unsplash.com/photos/DQ2lqx_6RD0",
    },
  },
  kampalaStreet: {
    src: kampalaStreet,
    alt: "Busy Kampala street with taxis and boda bodas",
    credit: {
      name: "Ssenyondo Gabriel",
      url: "https://unsplash.com/photos/Bb3qLfKp0Bs",
    },
  },
  kampalaSunset: {
    src: kampalaSunset,
    alt: "Kampala skyline at sunset",
    credit: {
      name: "Robin Kutesa",
      url: "https://unsplash.com/photos/Q3ymlvOJGFs",
    },
  },
  murchisonFalls: {
    src: murchisonFalls,
    alt: "The Nile forcing through the gorge at Murchison Falls",
    credit: {
      name: "Jonathan Göhner",
      url: "https://unsplash.com/photos/EmsDN8-M4dk",
    },
  },
  nileBoat: {
    src: nileBoat,
    alt: "A tour boat on the Nile near Jinja",
    credit: {
      name: "Derricks Nature Book",
      url: "https://unsplash.com/photos/iSGFaRTro1Q",
    },
  },
  teaRoad: {
    src: teaRoad,
    alt: "A red dirt road between green tea fields",
    credit: {
      name: "Michael Starkie",
      url: "https://unsplash.com/photos/hDPqTAC-QJg",
    },
  },
  boatsSunset: {
    src: boatsSunset,
    alt: "Fishing boats on calm water at sunset on the East African coast",
    credit: {
      name: "Lionel Murage",
      url: "https://unsplash.com/photos/OeEc3Qmtr-4",
    },
  },
  lakeVictoria: {
    src: lakeVictoria,
    alt: "A canoe on Lake Victoria, in black and white",
    credit: {
      name: "Alexandre Barbosa",
      url: "https://unsplash.com/photos/2fDt4MRgOCg",
    },
  },
  nightRoad: {
    src: nightRoad,
    alt: "Cars on a Kampala road at night under streetlights",
    credit: {
      name: "Michael Starkie",
      url: "https://unsplash.com/photos/zsdpVP68E8A",
    },
  },
} satisfies Record<string, Photo>
