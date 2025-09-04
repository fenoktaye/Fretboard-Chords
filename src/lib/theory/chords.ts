export type ChordQuality =
  | "maj" | "min" | "dim" | "aug"
  | "7" | "maj7" | "min7" | "dim7" | "m7b5"
  | "6" | "min6" | "9" | "maj9" | "min9" | "11" | "13";

export type ExtensionOpts = { add9?: boolean; sus2?: boolean; sus4?: boolean };

export const CHORD_FORMULAS: Record<ChordQuality, number[]> = {
  maj:   [0, 4, 7],
  min:   [0, 3, 7],
  dim:   [0, 3, 6],
  aug:   [0, 4, 8],
  "7":   [0, 4, 7, 10],
  maj7:  [0, 4, 7, 11],
  min7:  [0, 3, 7, 10],
  dim7:  [0, 3, 6, 9],
  m7b5:  [0, 3, 6, 10],
  "6":   [0, 4, 7, 9],
  min6:  [0, 3, 7, 9],
  "9":   [0, 4, 7, 10, 14],
  maj9:  [0, 4, 7, 11, 14],
  min9:  [0, 3, 7, 10, 14],
  "11":  [0, 4, 7, 10, 14, 17],
  "13":  [0, 4, 7, 10, 14, 21],
};

export function applyExtensions(pcSet: number[], ext?: ExtensionOpts) {
  const out = [...pcSet];
  if (!ext) return out;
  if (ext.sus2) return [0, 2, 7];
  if (ext.sus4) return [0, 5, 7];
  if (ext.add9 && !out.includes(14)) out.push(14);
  return out;
}
