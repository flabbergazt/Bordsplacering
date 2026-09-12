/*
 * One colour per group, in slot order. Chosen to sit next to SASSE purple,
 * so no purple here. Wraps around if there are more groups than colours.
 */

export const PALETTE = [
  "#C2185B", // magenta
  "#D9A421", // gold
  "#159A8E", // teal
  "#E8604C", // coral
  "#1F3A93", // navy
  "#4C9A2A", // green
  "#2E86C1", // sky
  "#E57FA3", // rose
  "#E28D2B", // amber
  "#36B37E", // mint
  "#8E2043", // burgundy
  "#5C7C9E", // slate
  "#B5651D", // copper
  "#3C8D8A", // pine
];

export function slotColor(slot: number): string {
  return PALETTE[(slot - 1) % PALETTE.length];
}

/** A darker shade of the same colour, for the bottom of a card's gradient. */
export function darken(hex: string, amount = 0.25): string {
  const n = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount));
  return `rgb(${n(1)}, ${n(3)}, ${n(5)})`;
}
