/*
 * The room, as a drawing.
 *
 * Everything about how the room looks lives here: the walls, the fixed
 * things in it (stage, bar, pillars, entrance) and where the tables stand,
 * how many fit at each, the colours. Change this file to redraw the room;
 * nothing else needs to know.
 *
 * The room is the oval "Museum" hall at Handelshögskolan, measured off the
 * 1925 plan: about 16.5 m wide and 14 m deep, four pillars inside. One
 * metre is 60 units here, so the drawing is roughly to scale. (0, 0) is the
 * top left corner; the stage is at the top, the entrance at the bottom.
 */

export type Slot = {
  /** Stable number, stored in the database when someone starts the table. */
  slot: number;
  x: number;
  y: number;
  /** How many can sit here. */
  capacity: number;
};

export type Feature = {
  label: string;
  /** SVG polygon points. */
  points: string;
  labelX: number;
  labelY: number;
  /** Degrees, for a label along a slanted thing like the bar. */
  rotate?: number;
};

export type Pillar = { x: number; y: number; r: number };

export const ROOM = {
  width: 1000,
  height: 900,

  /** The walls: an oval. */
  oval: { cx: 500, cy: 430, rx: 495, ry: 420 },

  /** The four pillars. Nothing can stand on them. */
  pillars: [
    { x: 332, y: 226, r: 21 },
    { x: 668, y: 226, r: 21 },
    { x: 332, y: 634, r: 21 },
    { x: 668, y: 634, r: 21 },
  ] satisfies Pillar[],

  /** Fixed things people orient by. */
  features: [
    {
      label: "Scen",
      /* Between the two upper pillars, widening out to the wall behind. */
      points: "332,226 668,226 800,130 200,130",
      labelX: 500,
      labelY: 182,
    },
    {
      label: "Bar",
      /* A long counter running from the lower right pillar up towards the wall. */
      points: "707,630 868,340 832,320 672,610",
      labelX: 770,
      labelY: 475,
      rotate: -61,
    },
  ] satisfies Feature[],

  /** Where you come in: bottom of the oval, middle. */
  entrance: { x: 500, y: 850, label: "Ingång" },

  /** Radius of a drawn table. */
  tableRadius: 48,

  /**
   * Fourteen tables of eight, 112 seats, for a party of 100 to 110.
   * Four rows, keeping clear of the stage, the bar, the pillars and a
   * walkway from the entrance. Placeholder until the real table plan
   * is known.
   */
  slots: [
    { slot: 1, x: 220, y: 300, capacity: 8 },
    { slot: 2, x: 390, y: 300, capacity: 8 },
    { slot: 3, x: 610, y: 300, capacity: 8 },
    { slot: 4, x: 760, y: 300, capacity: 8 },
    { slot: 5, x: 110, y: 430, capacity: 8 },
    { slot: 6, x: 280, y: 430, capacity: 8 },
    { slot: 7, x: 450, y: 430, capacity: 8 },
    { slot: 8, x: 620, y: 430, capacity: 8 },
    { slot: 9, x: 160, y: 560, capacity: 8 },
    { slot: 10, x: 400, y: 560, capacity: 8 },
    { slot: 11, x: 560, y: 560, capacity: 8 },
    { slot: 12, x: 240, y: 700, capacity: 8 },
    { slot: 13, x: 420, y: 700, capacity: 8 },
    { slot: 14, x: 600, y: 700, capacity: 8 },
  ] satisfies Slot[],
};

/** One colour per table, in slot order. Wraps around if the room grows. */
export const PALETTE = [
  "#E63946", // red
  "#F4A261", // orange
  "#E9C46A", // yellow
  "#2A9D8F", // teal
  "#457B9D", // steel blue
  "#8E44AD", // purple
  "#F28482", // salmon
  "#84A59D", // sage
  "#F5CAC3", // blush
  "#3D5A80", // navy
  "#B5838D", // mauve
  "#6D9F71", // green
  "#D98C3F", // amber
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
