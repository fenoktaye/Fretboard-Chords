import { useMemo } from "react";
import { NOTE_NAMES } from "../lib/theory/notes";
import type { ChordQuality } from "../lib/theory/chords";

type Props = {
  root: number;
  quality: ChordQuality;
  allowOpen: boolean;

  // extensions
  extAdd9: boolean;
  extSus2: boolean;
  extSus4: boolean;

  // YENİ: pozisyon
  position: number; // 1..12 (ankor odağı)

  onChange: (p: Partial<{
    root: number;
    quality: ChordQuality;
    allowOpen: boolean;
    extAdd9: boolean;
    extSus2: boolean;
    extSus4: boolean;
    position: number;
  }>) => void;
};

export default function TopBar(props: Props){
  const {
    root, quality, allowOpen,
    extAdd9, extSus2, extSus4,
    position,
    onChange
  } = props;

  const extSuffix = useMemo(()=>{
    const arr:string[] = [];
    if (extSus2) arr.push("sus2");
    if (extSus4) arr.push("sus4");
    if (extAdd9) arr.push("add9");
    return arr.length ? " " + arr.join(" ") : "";
  }, [extAdd9, extSus2, extSus4]);

  const title = useMemo(()=> `${NOTE_NAMES[root]} ${quality}${extSuffix}`, [root, quality, extSuffix]);

  return (
    <div className="topbar">
      <div className="row">
        <span className="title">Fretboard Chords</span>

      </div>
      <div className="row">
         <label>Root</label>
        <select value={root} onChange={e=>onChange({root: Number(e.target.value)})}>
          {NOTE_NAMES.map((n,i)=><option key={n} value={i}>{n}</option>)}
        </select>
        <label>Quality</label>
        <select value={quality} onChange={e=>onChange({quality: e.target.value as ChordQuality})}>
          {["maj","min","dim","aug","7","maj7","min7","dim7","m7b5","6","min6","9","maj9","min9","11","13"]
            .map(q=><option key={q} value={q}>{q}</option>)}
        </select>

        {/* extensions */}
        <label style={{display:"flex",alignItems:"center",gap:6, marginLeft:8}}>
          <input
            type="checkbox"
            checked={extSus2}
            onChange={()=> onChange({ extSus2: !extSus2, extSus4: false })}
          />
          sus2
        </label>

        <label style={{display:"flex",alignItems:"center",gap:6}}>
          <input
            type="checkbox"
            checked={extSus4}
            onChange={()=> onChange({ extSus4: !extSus4, extSus2: false })}
          />
          sus4
        </label>

        <label style={{display:"flex",alignItems:"center",gap:6}}>
          <input
            type="checkbox"
            checked={extAdd9}
            onChange={e=>onChange({ extAdd9: e.target.checked })}
          />
          add9
        </label>

        <label className="badge">{title}</label>
      
        <label style={{display:"flex",alignItems:"center",gap:6, marginLeft:8}}>
          <input
            type="checkbox"
            checked={allowOpen}
            onChange={e=>onChange({allowOpen: e.target.checked})}
          />
          allow open
        </label>

        {/* YENİ: pozisyon (ankor = en düşük fretted) */}
        <label style={{display:"flex",alignItems:"center",gap:6}}>
          position
          <input
            type="range" min={1} max={12} step={1} value={position}
            onChange={e=>onChange({position: Number(e.target.value)})}
          />
          {position}
        </label>

      </div>
    </div>
  );
}
