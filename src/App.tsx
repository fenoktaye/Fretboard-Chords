import { useEffect, useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import Fretboard from "./components/Fretboard";
import { CHORD_FORMULAS, applyExtensions, type ChordQuality } from "./lib/theory/chords";
import { NOTE_NAMES } from "./lib/theory/notes";
import { generateChordShapes, type Tuning } from "./lib/fretboard/generateChordShapes";

const E_STANDARD: Tuning = [40,45,50,55,59,64]; // E2 A2 D3 G3 B3 E4

export default function App(){
  const [root, setRoot] = useState<number>(0); // C
  const [quality, setQuality] = useState<ChordQuality>("maj");
  const [allowOpen, setAllowOpen] = useState(true);

  // extensions
  const [extAdd9, setExtAdd9] = useState(false);
  const [extSus2, setExtSus2] = useState(false);
  const [extSus4, setExtSus4] = useState(false);
  const [leftHanded, setLeftHanded] = useState(false);

  // YENİ: pozisyon (1..12), varsayılan 1. pozisyon
  const [position, setPosition] = useState(1);

  // şekiller arasında gezinme
  const [idx, setIdx] = useState(0);

  const pcs = useMemo(()=>{
    const base = CHORD_FORMULAS[quality];
    return applyExtensions(base, { add9: extAdd9, sus2: extSus2, sus4: extSus4 });
  }, [quality, extAdd9, extSus2, extSus4]);

  const shapes = useMemo(()=>{
    return generateChordShapes({
      rootPc: root,
      pcFormula: pcs,
      tuning: E_STANDARD,
      allowOpen,
      maxSpan: 7,              // geniş; asıl filtreyi pozisyon yapıyor
      fretWindow: [0, 12],
      preferredPos: position,  // <-- yeni
      posWidth: 2, // pozisyon +/- 2 perde toleransı
    });
  }, [root, pcs, allowOpen, position]);

  // şekiller değişince index'i sıfırla (yeni liste)
  useEffect(()=>{ setIdx(0); }, [root, quality, allowOpen, extAdd9, extSus2, extSus4, position]);

  const shape = shapes[idx] || undefined;

  function nextShape(dir: 1|-1){
    if (!shapes.length) return;
    setIdx((i)=> (i + dir + shapes.length) % shapes.length);
  }

  return (
    <div className="app">
      <TopBar
        root={root}
        quality={quality}
        allowOpen={allowOpen}
        extAdd9={extAdd9}
        extSus2={extSus2}
        extSus4={extSus4}
        position={position}
        leftHanded={leftHanded}
        onChange={(p)=>{
          if (p.root!==undefined) setRoot(p.root);
          if (p.quality!==undefined) setQuality(p.quality);
          if (p.allowOpen!==undefined) setAllowOpen(p.allowOpen);

          if (p.extSus2!==undefined) { setExtSus2(p.extSus2); if (p.extSus2) setExtSus4(false); }
          if (p.extSus4!==undefined) { setExtSus4(p.extSus4); if (p.extSus4) setExtSus2(false); }
          if (p.extAdd9!==undefined) setExtAdd9(p.extAdd9);
          if (p.leftHanded!==undefined) setLeftHanded(p.leftHanded);
          if (p.position!==undefined) setPosition(p.position);
        }}
      />

      <Fretboard  tuning={E_STANDARD} shape={shape} rootPc={root} pcs={pcs} leftHanded={leftHanded}/>

      <div className="footbar">
        <small style={{flex:1}}>
          Chord: <b>
            {NOTE_NAMES[root]} {quality}
            {extSus2 && " sus2"}
            {extSus4 && " sus4"}
            {extAdd9 && " add9"}
          </b>
          {" · "}
          Position: <b>{position}</b>
          {" · "}
          {shapes.length
            ? <>Voicing: <b>{idx+1}/{shapes.length}</b> — inversion: <b>{shape?.inversion}</b>, anchor: <b>{shape?.anchor ?? "-"}</b></>
            : <>No voicing found (try expanding the position).</>}
        </small>

        <button onClick={()=>nextShape(-1)} disabled={!shapes.length}>◀ Prev</button>
        <button onClick={()=>nextShape(1)} disabled={!shapes.length}>Next ▶</button>
      </div>
    </div>
  );
}
