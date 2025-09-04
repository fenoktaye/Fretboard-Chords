# Fretboard Chords

A small React + TypeScript app that visualizes guitar chords on a fretboard and lists playable voicings focused on a target position. It shows degree labels (R, 3, 5, b7, 9, 11, 13) on the board and an overlay with the chord’s notes, degrees, and interval abbreviations.

## Features

- Chord selection: Root (C…B) and quality (maj, min, dim, aug, 7, maj7, min7, dim7, m7b5, 6, min6, 9, maj9, min9, 11, 13).
- Extensions: sus2, sus4 (mutually exclusive), add9.
- Position-oriented voicings: Filter by preferred position (lowest fretted note, i.e., “anchor”) with a width window (e.g., position 3 ⇒ fretted notes constrained to 3..5).
- Open strings: Allowed and do not enlarge span filters.
- Overlay info box: Displays chord notes, degree labels, and interval shorthand (P5, M3, m7, 9, 11, 13).
- Accurate drawing: Nut drawn separately; fret lines start at 1; note circles centered in the correct fret space; thin E string at the top, thick E at the bottom.
- Multiple voicings: Prev/Next navigation to cycle through ranked voicings.

## Tech Stack

- React 18 + TypeScript
- Vite (dev server and build)
- SVG for rendering the fretboard
- No external state management library is required

## Quick Start

```bash
# create a fresh Vite + React + TS project (if you’re not cloning a repo)
npm create vite@latest fretboard-chords -- --template react-ts
cd fretboard-chords
npm install

# add the source files in `src/` (components/, lib/, App.tsx, index.css)
npm run dev
```

Open the local dev URL printed by Vite (usually http://localhost:5173).

## Project Structure

```text
src/
  App.tsx
  index.css
  components/
    TopBar.tsx
    Fretboard.tsx
  lib/
    theory/
      chords.ts      # chord formulas + applyExtensions(add9/sus2/sus4)
      notes.ts       # NOTE_NAMES, pcToName, nameToPc
    fretboard/
      generateChordShapes.ts  # voicing generator (position window, scoring)
```

## Usage

- Select Root and Quality in the top bar.
- Toggle sus2 / sus4 / add9 as needed (sus2 and sus4 are mutually exclusive).
- Use the Position slider to focus voicings where the lowest fretted note is near your target. The generator constrains fretted notes to [position .. position + width] (see configuration).
- Use Prev/Next to cycle through available voicings under current filters.
- The overlay shows:
  - Notes: absolute note names after transposition to the current root.
  - Degrees: R, b3, 3, 5, b7, 7, 9, 11, 13.
  - Intervals: P1, M3, P5, M7, 9, 11, 13, etc.

Default tuning is E standard: [40, 45, 50, 55, 59, 64] (E2 A2 D3 G3 B3 E4).

## Core Theory and Algorithms

### Chord formulas

`lib/theory/chords.ts` declares chord qualities as relative intervals (e.g., maj7 = [0, 4, 7, 11]).

applyExtensions supports:

- sus2 ⇒ triad [0, 2, 7]
- sus4 ⇒ triad [0, 5, 7]
- add9 ⇒ adds 14 to the set if missing

Formulas are transposed by `rootPc` to absolute pitch classes.

### Voicing generator

`lib/fretboard/generateChordShapes.ts` enumerates candidate frets per string and performs a backtracking search with pruning:

- Coverage: all degrees in the set must appear at least once.
- Span: computed only over fretted notes (f > 0).
- Position window: when `preferredPos` is set, fretted notes must fall within `[preferredPos .. preferredPos + posWidth]`. Open strings (0) are always allowed.
- Anchor: the lowest fretted note of a shape; used to filter and score against the target position.
- Scoring favors:
  - Smaller fretted span
  - Root on the bass
  - Fewer muted strings
  - Adjacent strings sharing the same fret (ease of fingering)

The result is a sorted array of `Shape` objects.

## Public API (internal modules)

```ts
// lib/fretboard/generateChordShapes.ts
export type Tuning = number[]; // low->high MIDI; EADGBE = [40,45,50,55,59,64]

export type Shape = {
  strings: (number | "x")[];          // 0=open, "x"=mute, N=fret number
  inversion: "root" | "1st" | "2nd" | "3rd";
  span: number;                        // max(fretted) - min(fretted), only f>0
  anchor: number;                      // lowest fretted note, 0 if none
  fretsRange: [number, number];        // [minFretted, maxFretted] or [0,0]
};

type GenParams = {
  rootPc: number;                      // 0..11
  pcFormula: number[];                 // relative intervals (e.g., [0,4,7,11])
  tuning: Tuning;
  maxSpan?: number;                    // pruning; default 7 (liberal)
  allowOpen?: boolean;                 // default true
  fretWindow?: [number, number];       // search window; default [0,12]
  preferredPos?: number | null;        // position pivot (anchor)
  posWidth?: number;                   // width of the position box (default 2)
};
```

### Theory helpers

```ts
// lib/theory/chords.ts
export type ChordQuality = /* "maj" | "min" | ... */;
export const CHORD_FORMULAS: Record<ChordQuality, number[]>;
export function applyExtensions(pcSet: number[], ext?: {
  add9?: boolean; sus2?: boolean; sus4?: boolean;
}): number[];

// lib/theory/notes.ts
export const NOTE_NAMES: readonly string[];
export function pcToName(pc: number): string;
export function nameToPc(name: string): number;
```

### UI components

- `TopBar.tsx` exposes controls for root, quality, extensions, and position.
- `Fretboard.tsx` renders the board and info overlay.

```ts
// Fretboard props
type Props = {
  tuning: Tuning;
  shape?: Shape;
  rootPc: number;
  fretsCount?: number; // default 12
  pcs?: number[];      // relative chord intervals for the overlay
};
```

## Configuration

- Tuning: change `E_STANDARD` in `App.tsx`, or pass a different tuning into `generateChordShapes` and `Fretboard`.

```ts
const DROP_D: Tuning = [38, 45, 50, 55, 59, 64]; // D2 A2 D3 G3 B3 E4
```

- Position window width: adjust `posWidth` when calling `generateChordShapes` (e.g., `posWidth: 4`).
- Fret window: restrict the search space using `fretWindow` (e.g., `[5, 12]`).
- Open strings: `allowOpen: true` by default.

## Development

```bash
npm run dev     # start dev server
npm run build   # production build
npm run preview # preview built app
```

## License

MIT
