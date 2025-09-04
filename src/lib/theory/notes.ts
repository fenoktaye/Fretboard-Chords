export const NOTE_NAMES = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
] as const;

export type NoteName = typeof NOTE_NAMES[number];

const MOD12 = (n:number)=>((n%12)+12)%12;

export function pcToName(pc:number): NoteName {
  return NOTE_NAMES[MOD12(pc)];
}

export function nameToPc(name: string): number {
  const idx = NOTE_NAMES.indexOf(name as NoteName);
  return idx >= 0 ? idx : 0; // bulunamazsa güvenli C
}
