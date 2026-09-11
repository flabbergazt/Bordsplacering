/*
 * One colour per group, in slot order. Wraps around if there are more
 * groups than colours.
 */

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

/** A darker shade of the same colour, for the bottom of a card's gradient. */
export function darken(hex: string, amount = 0.25): string {
  const n = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount));
  return `rgb(${n(1)}, ${n(3)}, ${n(5)})`;
}
