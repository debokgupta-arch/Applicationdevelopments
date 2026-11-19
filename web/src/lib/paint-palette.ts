/**
 * Curated wall-paint palette. These hex values are paint colours chosen by the
 * user (content data), not UI theme colours.
 */
export type PaintSwatch = { hex: string; name: string };

export const PAINT_PALETTE: readonly PaintSwatch[] = [
  { hex: "#F5F1E8", name: "Ivory Mist" },
  { hex: "#E9DFCF", name: "Warm Linen" },
  { hex: "#D8E3DC", name: "Sage Whisper" },
  { hex: "#C9DCE6", name: "Morning Sky" },
  { hex: "#E8D3CF", name: "Dusty Rose" },
  { hex: "#D6D2E4", name: "Lavender Haze" },
  { hex: "#BFC8C2", name: "Eucalyptus" },
  { hex: "#E3C79A", name: "Desert Sand" },
];
