import { useMemo } from "react";
import type { Shape, Tuning } from "../lib/fretboard/generateChordShapes";
import { pcToName } from "../lib/theory/notes";

function degreeLabelFromPc(pc:number, rootPc:number){
  const d = (pc - rootPc + 12) % 12;
  const map: Record<number,string> = {
    0:"R", 1:"b2", 2:"2", 3:"b3", 4:"3", 5:"4", 6:"#4",
    7:"5", 8:"b6", 9:"6", 10:"b7", 11:"7"
  };
  return map[d] ?? String(d);
}

type Props = {
  tuning: Tuning;            // [40,45,50,55,59,64]
  shape?: Shape;             // seçilen voicing
  rootPc: number;            // 0..11
  fretsCount?: number;       // default 12
  pcs?: number[];           // AKOR formülü (göreli): [0,4,7,11,14] gibi
};

export default function Fretboard({tuning, shape, rootPc, fretsCount=12, pcs=[]}: Props){
  const width = 920;
  const height = 260;
  const leftPad = 60; // X/O + tel isimleri
  const topPad = 36;
  const usableHeight = height - topPad - 16;
  const stringCount = tuning.length;
  const stringGap = usableHeight / (stringCount-1);
  const fretGap = (width - leftPad - 20) / fretsCount;
  const spaceX = (f:number)=> (f<=0 ? fretX(0) : (fretX(f-1) + fretX(f))/2); // f’in ‘alan’ merkezi

  const stringY = (sVis:number)=> topPad + sVis * stringGap; // 0 üstte (ince E)
  const fretX = (f:number)=> leftPad + f * fretGap;
  const dotX = (f:number)=> (fretX(f) + fretX(f+1))/2;
  

  // Görselde üstte ince E olmasını istiyoruz
  const visIndex = (s:number) => (stringCount - 1 - s); // tuning[0]=kalın E -> en altta
// ---------- INFO KUTUSU VERİSİ ----------
  const info = useMemo(()=>{
    // pcs: göreli (0..11, 14, 17, 21)
    if (!pcs || pcs.length===0) return null;
    const MOD12 = (n:number)=>((n%12)+12)%12;
    const degLabelRel = (iv:number)=>{
      const base = MOD12(iv);
      const baseMap: Record<number,string> = {0:"R",1:"b2",2:"2",3:"b3",4:"3",5:"4",6:"#4",7:"5",8:"b6",9:"6",10:"b7",11:"7"};
      if (iv===14) return "9";
      if (iv===17) return "11";
      if (iv===21) return "13";
      return baseMap[base] ?? String(base);
    };
    const intervalAbbr = (iv:number)=>{
      const base = MOD12(iv);
      const map: Record<number,string> = {0:"P1",1:"m2",2:"M2",3:"m3",4:"M3",5:"P4",6:"TT",7:"P5",8:"m6",9:"M6",10:"m7",11:"M7"};
      if (iv===14) return "9";   // M9
      if (iv===17) return "11";  // P11
      if (iv===21) return "13";  // M13
      return map[base] ?? String(base);
    };
    const orderWeight = (iv:number)=>{
      if (iv===0) return 0;
      if (iv===3 || iv===4) return 1;
      if (iv===7) return 2;
      if (iv===10 || iv===11) return 3;
      if (iv===14) return 4;
      if (iv===17) return 5;
      if (iv===21) return 6;
      return 10 + (iv%12);
    };
    const uniq = Array.from(new Set(pcs)); // pcs zaten küçük set
    const rows = uniq.sort((a,b)=>orderWeight(a)-orderWeight(b)).map(iv=>{
      const absPc = MOD12(rootPc + iv);
      return {
        note: pcToName(absPc),
        degree: degLabelRel(iv),
        interval: intervalAbbr(iv)
      };
    });
    return { rows };
  }, [pcs, rootPc]);
  return (
    <div className="fret-wrap">
      {/* ------- INFO OVERLAY BOX ------- */}
      {info && (
        <div className="info-box">
          <div className="title">Selected Chord Info</div>
          <div className="row">
            <div className="muted">Notes</div>
            <div>
              {info.rows.map(r=> <span key={r.note+r.degree} className="pill">{r.note}</span>)}
            </div>
          </div>
          <div className="row">
            <div className="muted">Intervals</div>
            <div>
              {info.rows.map(r=> <span key={r.interval+r.degree} className="pill">{r.interval}</span>)}
            </div>
          </div>
        </div>
      )}
      {/* ------- FRETBOARD SVG ------- */}
      <div className="fretboard-wrapper">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img"
            aria-label="Guitar fretboard with chord">
          <rect x={0} y={0} width={width} height={height} fill="#0b0d10" rx="8"/>
          {/* nut */}
          <rect x={leftPad-6} y={topPad-10} width={6} height={usableHeight+20} fill="#d9d9d9"/>

          {/* teller */}
          {tuning.map((_, s)=>
            <line key={"s"+s}
              x1={leftPad-6} y1={stringY(visIndex(s))}
              x2={fretX(fretsCount)} y2={stringY(visIndex(s))}
              stroke="#c7cbd2" strokeWidth={1.6} opacity={0.9}/>
          )}

          {/* perdeler */}
          {Array.from({length: fretsCount}).map((_, i)=>{
          const f = i+1; // 1..fretsCount (0 yok)
          return (
              <line
              key={"f"+f}
              x1={fretX(f)} y1={topPad-10}
              x2={fretX(f)} y2={topPad+usableHeight+10}
              stroke="#3a4456"
              strokeWidth={2}
              opacity={0.8}
              />
          );
          })}

          {/* REFERANS DOTLARI: 3,5,7,9,12 (DÜZELTİLDİ: off-by-one yok) */}
          {[3,5,7,9,12].map(f=>
            <circle key={"m"+f} cx={spaceX(f)} cy={topPad+usableHeight/2} r={6} fill="#243141" opacity={.9}/>
          )}

          {/* tel adları (nut'ın solunda) */}
          {tuning.map((midi, s)=>(
            <text
              key={"name"+s}
              x={leftPad-12}
              y={stringY(visIndex(s))+4}
              textAnchor="end"
              fontSize="12"
              fill="#e8eef6"
              fontWeight={700}
            >
              {pcToName(midi % 12)}
            </text>
          ))}

          {/* akor: X/O başlıkları */}
          {shape && shape.strings.map((fret, sIdx)=>{
            const x = dotX(0) - 28;
            const y = stringY(visIndex(sIdx)) - 10;
            if (fret==="x"){
              return <text key={"xo"+sIdx} x={x} y={y} fill="#e8eef6" fontWeight={700}>X</text>;
            }
            if (fret===0){
              return <text key={"xo"+sIdx} x={x} y={y} fill="#e8eef6" fontWeight={700}>O</text>;
            }
            return null;
          })}

          {/* akor: notalar */}
          {shape && shape.strings.map((fret, sIdx)=>{
            if (typeof fret!=="number" || fret===0) return null;
            const cx = spaceX(fret);
            const cy = stringY(visIndex(sIdx));
            const midi = tuning[sIdx] + fret;
            const pc = midi % 12;
            const label = degreeLabelFromPc(pc, rootPc);
            return (
              <g key={"n"+sIdx}>
                <circle cx={cx} cy={cy} r={12} fill="#88aaff" opacity={0.95} stroke="#e8eef6" strokeWidth={1.5}/>
                <text x={cx} y={cy+4} textAnchor="middle" fontSize="11" fill="#0b0d10" fontWeight={800}>{label}</text>
              </g>
            );
          })}

          {/* shape span highlight (fretted aralığı) */}
          {shape && (()=> {
            const [a,b] = shape.fretsRange;      // a,b >=1 (fretted)
            const x = fretX(Math.max(0, a-1));   // alan başlangıcı = (a-1) tel teli
            const w = fretX(b) - fretX(Math.max(0, a-1));
            return <rect x={x} y={topPad-10} width={w} height={usableHeight+20} fill="#88aaff" opacity={0.08} rx={4}/>
          })()}

          {/* fret numaraları */}
          {Array.from({length: fretsCount}).map((_,i)=>{
            const dots = [3,5,7,9,12];
            const f = i+1;
            return (
              <>
              {dots.includes(f) && (
                <circle cx={(fretX(f)-18+fretX(f))/2} cy={topPad+usableHeight+10} r={6} fill="#243141" opacity={.9}/>
              )}
              <text key={"fn"+f} x={(fretX(f)-18+fretX(f))/2} y={topPad+usableHeight+13}
                    textAnchor="middle" fontSize="9" fill="#9aa6b2">{f}</text>
              
              </>   
            );
          })}
        </svg>
      </div>
      
    </div>
  );
}
