import type { StaticImageData } from "next/image"

import boatsSunset from "@/public/images/boats-sunset.jpg"
import classroom from "@/public/images/classroom.jpg"
import couplePhone from "@/public/images/couple-phone.jpg"
import crimsonTexture from "@/public/images/crimson-texture.jpg"
import crimsonWaves from "@/public/images/crimson-waves.jpg"
import friendsPhone from "@/public/images/friends-phone.jpg"
import hillRoad from "@/public/images/hill-road.jpg"
import journalists from "@/public/images/journalists.jpg"
import kampalaSkyline from "@/public/images/kampala-skyline.jpg"
import kampalaStreet from "@/public/images/kampala-street.jpg"
import kampalaSunset from "@/public/images/kampala-sunset.jpg"
import lakeVictoria from "@/public/images/lake-victoria.jpg"
import manTexting from "@/public/images/man-texting.jpg"
import marketCall from "@/public/images/market-call.jpg"
import murchisonFalls from "@/public/images/murchison-falls.jpg"
import newspapers from "@/public/images/newspapers.jpg"
import nightRoad from "@/public/images/night-road.jpg"
import nileBoat from "@/public/images/nile-boat.jpg"
import phoneOnCrimson from "@/public/images/phone-on-crimson.jpg"
import teaRoad from "@/public/images/tea-road.jpg"
import ugandaHills from "@/public/images/uganda-hills.jpg"
import workshop from "@/public/images/workshop.jpg"

export type Photo = {
  src: StaticImageData
  alt: string
  credit: { name: string; url: string }
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
  phoneOnCrimson: {
    src: phoneOnCrimson,
    alt: "Young woman reading her phone against a crimson wall",
    credit: {
      name: "Ahmed Nasiru",
      url: "https://unsplash.com/photos/Sl-LrWJNXV8",
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
  marketCall: {
    src: marketCall,
    alt: "Woman taking a phone call in a busy market",
    credit: {
      name: "proudlyswazi",
      url: "https://unsplash.com/photos/Yx6249gywlk",
    },
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
  friendsPhone: {
    src: friendsPhone,
    alt: "Two men reading something together on a smartphone",
    credit: {
      name: "Mugabi Owen",
      url: "https://unsplash.com/photos/oCq3LW3rCD8",
    },
  },
  couplePhone: {
    src: couplePhone,
    alt: "A man and a woman checking a phone by the roadside",
    credit: {
      name: "Francis Odeyemi",
      url: "https://unsplash.com/photos/O8SpYxOFnK8",
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
  manTexting: {
    src: manTexting,
    alt: "Young man reading a message on his phone",
    credit: {
      name: "Emmanuel Ikwuegbu",
      url: "https://unsplash.com/photos/81fRHbVliQI",
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
  classroom: {
    src: classroom,
    alt: "Students writing at wooden desks in a Ugandan classroom",
    credit: {
      name: "Zach Wear",
      url: "https://unsplash.com/photos/RzPWYL3G6Pw",
    },
  },
  workshop: {
    src: workshop,
    alt: "People working at long tables in a bright workshop hall",
    credit: {
      name: "Zach Wear",
      url: "https://unsplash.com/photos/jgu6Dkd0fCM",
    },
  },
  journalists: {
    src: journalists,
    alt: "A reporter interviewing a man outdoors, cameras rolling",
    credit: {
      name: "Luke Thornton",
      url: "https://unsplash.com/photos/ugY9ZDfZq_c",
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
