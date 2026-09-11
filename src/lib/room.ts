/*
 * The room, as a drawing.
 *
 * The background is the 1925 plan of the oval "Museum" hall at
 * Handelshögskolan, cropped to the hall (public/room.jpg). Everything laid
 * on top of it is defined here: the stage, the bar, the entrance and where
 * the tables stand. Change this file to move things; nothing else needs to
 * know.
 *
 * Coordinates are pixels in that image. The plan's scale bar gives
 * 50 px per metre, so a table drawn here is the size it will be on the
 * night. (0, 0) is the top left corner; the stage is at the top, the
 * entrance at the bottom.
 */

export type Slot = {
  /** Stable number, stored in the database when someone starts the table. */
  slot: number;
  /** Centre of the table top. */
  x: number;
  y: number;
  /** "h": long side left-right. "v": long side up-down. */
  orientation: "h" | "v";
  /** How many can sit here. */
  capacity: number;
};

export const PX_PER_METRE = 50;

export const ROOM = {
  image: { src: "/room.jpg", width: 911, height: 781 },

  /** A table for eight: 2.0 x 0.8 m top, three a side and one at each end. */
  tableTop: { w: 100, h: 40 },
  /** Chairs are drawn as small circles this far out from the table edge. */
  chair: { r: 8, gap: 15 },

  /** The stage sits between the two upper pillars and widens out to the wall behind. */
  stage: {
    label: "Scen",
    points: "304,238 584,238 711,135 600,70 448,46 300,70 185,135",
    labelX: 448,
    labelY: 150,
  },

  /** A long counter from the lower right pillar up towards the wall. */
  bar: {
    label: "Bar",
    points: "600,582 780,307 760,293 580,568",
    labelX: 700,
    labelY: 450,
    rotate: -57,
  },

  /** Where you come in: bottom of the oval, in the middle. */
  entrance: { x: 448, y: 736, label: "Ingång" },

  /**
   * Twelve tables of eight, 96 seats. That is what fits to scale with
   * 40 cm between chairs; a party of 110 needs longer tables or a
   * smaller stage. Positions are a proposal until the real plan is known.
   */
  slots: [
    { slot: 1, x: 152, y: 292, orientation: "h", capacity: 8 },
    { slot: 2, x: 317, y: 292, orientation: "h", capacity: 8 },
    { slot: 3, x: 482, y: 292, orientation: "h", capacity: 8 },
    { slot: 4, x: 617, y: 332, orientation: "v", capacity: 8 },
    { slot: 5, x: 122, y: 397, orientation: "h", capacity: 8 },
    { slot: 6, x: 287, y: 397, orientation: "h", capacity: 8 },
    { slot: 7, x: 452, y: 397, orientation: "h", capacity: 8 },
    { slot: 8, x: 162, y: 502, orientation: "h", capacity: 8 },
    { slot: 9, x: 327, y: 502, orientation: "h", capacity: 8 },
    { slot: 10, x: 492, y: 502, orientation: "h", capacity: 8 },
    { slot: 11, x: 330, y: 650, orientation: "h", capacity: 8 },
    { slot: 12, x: 562, y: 650, orientation: "h", capacity: 8 },
  ] satisfies Slot[],
};

/** One colour per table, in slot order. Wraps around if the room grows. */
export const PALETTE = [
  "#C8323E", // red
  "#E08A3C", // orange
  "#D4B24C", // yellow
  "#2A9D8F", // teal
  "#3F7CA6", // steel blue
  "#7D4AA0", // purple
  "#E2716E", // salmon
  "#6F9A8A", // sage
  "#C97B9A", // rose
  "#2F4C6E", // navy
  "#A0706A", // mauve
  "#5E9A62", // green
  "#B8742E", // amber
  "#5C7C9E", // slate
];

export function slotColor(slot: number): string {
  return PALETTE[(slot - 1) % PALETTE.length];
}

/** Dark text on light colours, light text on dark ones. */
export function textOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1b1b1f" : "#ffffff";
}
