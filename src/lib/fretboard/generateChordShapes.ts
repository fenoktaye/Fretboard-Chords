export type Tuning = number[]; // low->high MIDI; EADGBE = [40,45,50,55,59,64]
export type Shape = {
  strings: (number | "x")[]; // 0=open, "x"=mute
  inversion: "root"|"1st"|"2nd"|"3rd";
  span: number;               // sadece fretted (f>0) farkı
  anchor: number;             // en düşük fretted (0 yok sayılır)
  fretsRange: [number, number]; // [minFretted, maxFretted] (0 yoksa [0,0])
};

type GenParams = {
  rootPc: number;            // 0..11 (C..B)
  pcFormula: number[];       // göreli formül (örn maj7: [0,4,7,11])
  tuning: Tuning;
  maxSpan?: number;          // default 7 (geniş kalsın)
  allowOpen?: boolean;
  fretWindow?: [number, number];

  // YENİ: pozisyon tercihi (ankor'a göre)
  preferredPos?: number | null; // örn 1..12 (1. pozisyon, 3. pozisyon gibi)
  posWidth?: number;            // tolerans (örn 2 => ±2)
};

const MOD12 = (n:number)=>((n%12)+12)%12;
const midiToPc = (m:number)=>MOD12(m);

function scoreShapeBase(shape: Shape, rootPc: number, tuning: Tuning) {
  const xs = shape.strings.filter(s=>s==="x").length;
  const used = shape.strings.filter(s=>s!=="x").length;
  // en pes ses kökse bonus
  let rootOnBass = 0;
  const lowestIdx = shape.strings.findIndex(s=>s!=="x");
  if (lowestIdx>=0) {
    const fret = shape.strings[lowestIdx] as number;
    const midi = tuning[lowestIdx] + fret;
    if (midiToPc(midi) === rootPc) rootOnBass = 1;
  }

  // komşu tellerde aynı perde bonusu (kolay tutuş)
  let sameFretAdj = 0;
  for (let i=1;i<shape.strings.length;i++){
    const a = shape.strings[i-1], b = shape.strings[i];
    if (typeof a==="number" && typeof b==="number" && a===b) sameFretAdj += 0.2;
  }

  // Daha az X, daha çok “çalan tel”, küçük span ve kökün altta olması tercih edilsin
  return -shape.span + rootOnBass*2 - xs*1.0 + used*0.25 + sameFretAdj;
}

export function generateChordShapes(p: GenParams): Shape[] {
  const {
    rootPc, pcFormula, tuning,
    maxSpan=7, allowOpen=true, fretWindow=[0,12],
    preferredPos=null, posWidth=4, // posWidth: kutu genişliği (ör. 2 => [n .. n+2])
  } = p;

  // 1) Formülü köke göre mutlak pc'lere çevir
  const neededRel = pcFormula.map(MOD12);
  const needed    = neededRel.map(iv => MOD12(iv + rootPc));

  // 2) Her tel için uygun perdeler
  const choicesPerString: (number[] | "mute")[] = tuning.map((openMidi)=>{
    const list:number[]=[];
    for (let f=fretWindow[0]; f<=Math.min(24, fretWindow[1]); f++){
      if (!allowOpen && f===0) continue;
      // Pozisyon kutusu: n..n+posWidth (open 0 her zaman serbest)
     if (preferredPos && f>0) {
       const boxStart = preferredPos;
       const boxEnd   = preferredPos + posWidth;
       if (f < boxStart || f > boxEnd) continue;
     }
      const pc = midiToPc(openMidi + f);
      if (needed.includes(pc)) list.push(f);
    }
    return list.length ? list : "mute";
  });

  const shapes: Shape[] = [];
  const N = tuning.length;

  function backtrack(i:number, acc:(number|"x")[], minFretted=99, maxFretted=-1) {
    if (i===N){
      const used = acc.filter(v=>v!=="x") as number[];
      if (!used.length) return;

      // sadece fretted (f>0)
      const fretted = used.filter(f=>f>0);
      const span = fretted.length ? (Math.max(...fretted) - Math.min(...fretted)) : 0;
      if (span > maxSpan) return;

      // tüm dereceler var mı?
      const pcsFound = new Set<number>();
      acc.forEach((f,j)=>{
        if (f==="x") return;
        const pc = midiToPc(tuning[j] + f);
        pcsFound.add(pc);
      });
      for (const pc of needed) if (!pcsFound.has(pc)) return;

      // inversiyon
      let inversion:"root"|"1st"|"2nd"|"3rd"="root";
      const lowestIdx = acc.findIndex(s=>s!=="x");
      if (lowestIdx>=0){
        const lf  = acc[lowestIdx] as number;
        const lpc = midiToPc(tuning[lowestIdx] + lf);
        const deg = MOD12(lpc - rootPc);
        if      (deg===0)              inversion="root";
        else if (deg===3 || deg===4)   inversion="1st";
        else if (deg===7)              inversion="2nd";
        else if (deg===10 || deg===11) inversion="3rd";
      }

      const anchor = fretted.length ? Math.min(...fretted) : 0;

      shapes.push({
        strings: acc.slice(),
        span,
        inversion,
        anchor,
        fretsRange: fretted.length ? [Math.min(...fretted), Math.max(...fretted)] : [0,0]
      });
      return;
    }

    const choices = choicesPerString[i];
    if (choices==="mute"){
      backtrack(i+1, [...acc, "x"], minFretted, maxFretted);
    } else {
      // önce tüm seçenekleri dene
      for (const f of choices){
        if (f === 0) { // açık tel span'ı büyütmez
          backtrack(i+1, [...acc, 0], minFretted, maxFretted);
          continue;
        }
        const nMin = Math.min(minFretted, f);
        const nMax = Math.max(maxFretted, f);
        if (nMax >= 0 && nMin !== 99 && (nMax - nMin) > maxSpan) continue;
        backtrack(i+1, [...acc, f], nMin===99?f:nMin, nMax);
      }
      //sonra mute dene
      backtrack(i+1, [...acc, "x"], minFretted, maxFretted);
    }
  }

  backtrack(0, []);

  // dedup
  const seen = new Set<string>();
  const uniq = shapes.filter(s=>{
    const key = s.strings.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const BOX = (p.preferredPos ?? null);
  const BOX_W = 4; // istersen UI’dan da kontrol edebiliriz

  const boxed = uniq.filter(s=>{
  if (!BOX) return true;
  const [minF, maxF] = s.fretsRange; // sadece fretted aralık
  if (minF===0 && maxF===0) return true; // tamamen open ise serbest bırak
  const boxStart = BOX;
  const boxEnd   = BOX + BOX_W;
  return (minF >= boxStart) && (maxF <= boxEnd);
  });
  // pozisyon filtresi + skorlama
  const filtered = uniq.filter(s=>{
    if (!preferredPos) return true;
    const anc = s.anchor === 0 ? 1 : s.anchor;
    return (anc >= preferredPos - posWidth) && (anc <= preferredPos + posWidth);
  });

  /*return filtered.sort((a,b)=>{
    const aAnc = a.anchor === 0 ? 1 : a.anchor;
    const bAnc = b.anchor === 0 ? 1 : b.anchor;
    const aScore = scoreShapeBase(a, rootPc, tuning) + (preferredPos ? -Math.abs(aAnc - preferredPos)*2 : 0);
    const bScore = scoreShapeBase(b, rootPc, tuning) + (preferredPos ? -Math.abs(bAnc - preferredPos)*2 : 0);
    return bScore - aScore;
  });*/
  return boxed.sort((a,b)=>{
    const aAnc = a.anchor === 0 ? 1 : a.anchor;
    const bAnc = b.anchor === 0 ? 1 : b.anchor;
    const aScore = scoreShapeBase(a, rootPc, tuning) + (preferredPos ? -Math.abs(aAnc - preferredPos)*2 : 0);
    const bScore = scoreShapeBase(b, rootPc, tuning) + (preferredPos ? -Math.abs(bAnc - preferredPos)*2 : 0);
    return bScore - aScore;
  });
}
