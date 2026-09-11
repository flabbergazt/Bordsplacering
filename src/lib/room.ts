/*
 * The room, as a drawing.
 *
 * Everything about how the room looks lives here: the walls, the fixed
 * things in it (stage, bar, entrance) and where the tables stand. Change
 * this file to redraw the room; nothing else needs to know.
 *
 * Coordinates are in an abstract unit; the drawing scales to the screen.
 * (0, 0) is the top left corner.
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
  x: number;
  y: number;
  w: number;
  h: number;
};

export const ROOM = {
  width: 1000,
  height: 640,

  /** The walls, as SVG polygon points. A plain rectangle until we know better. */
  outline: "0,0 1000,0 1000,640 0,640",

  /** Fixed things people orient by. */
  features: [
    { label: "Scen", x: 330, y: 16, w: 340, h: 60 },
    { label: "Bar", x: 16, y: 480, w: 60, h: 144 },
    { label: "Entré", x: 860, y: 600, w: 124, h: 40 },
  ] satisfies Feature[],

  /** Radius of a drawn table. */
  tableRadius: 56,

  /** Twelve round tables in three rows of four. */
  slots: [
    { slot: 1, x: 200, y: 190, capacity: 8 },
    { slot: 2, x: 400, y: 190, capacity: 8 },
    { slot: 3, x: 600, y: 190, capacity: 8 },
    { slot: 4, x: 800, y: 190, capacity: 8 },
    { slot: 5, x: 200, y: 340, capacity: 8 },
    { slot: 6, x: 400, y: 340, capacity: 8 },
    { slot: 7, x: 600, y: 340, capacity: 8 },
    { slot: 8, x: 800, y: 340, capacity: 8 },
    { slot: 9, x: 200, y: 490, capacity: 8 },
    { slot: 10, x: 400, y: 490, capacity: 8 },
    { slot: 11, x: 600, y: 490, capacity: 8 },
    { slot: 12, x: 800, y: 490, capacity: 8 },
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
