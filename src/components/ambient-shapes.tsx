type Motif = "flower" | "ring" | "spark" | "ribbon" | "diamond" | "squiggle";

const motifs: Motif[] = ["ring", "flower", "squiggle", "spark", "diamond", "ribbon", "flower", "ring", "spark", "squiggle", "ribbon", "diamond"];

function MotifDrawing({ motif }: { motif: Motif }) {
  switch (motif) {
    case "flower":
      return <><path d="M40 16C49 2 61 11 57 25C72 18 80 32 64 40C80 48 71 62 57 55C62 71 47 78 40 63C31 79 18 70 24 55C8 63 0 48 16 40C1 31 10 18 25 25C19 9 33 1 40 16Z" fill="url(#elita-ambient-blush)" /><path d="M29 25C26 17 32 12 36 20M17 35c-5 3-4 7 1 8" stroke="#fff5fc" strokeWidth="2" strokeLinecap="round" /><circle cx="40" cy="40" r="7" fill="#fff1fb" fillOpacity=".8" /></>;
    case "ring":
      return <><ellipse cx="40" cy="43" rx="25" ry="14" transform="rotate(-28 40 43)" stroke="#9471c9" strokeWidth="11" /><ellipse cx="40" cy="38" rx="25" ry="14" transform="rotate(-28 40 38)" stroke="url(#elita-ambient-violet)" strokeWidth="12" /><path d="M18 39C18 29 32 20 45 20" stroke="#f4edff" strokeWidth="2.2" strokeLinecap="round" /></>;
    case "spark":
      return <><path d="m40 5 8 23 24-8-17 20 17 20-24-8-8 23-8-23-24 8 17-20L8 20l24 8L40 5Z" fill="url(#elita-ambient-violet)" /><path d="m40 13 5 18-15 7" fill="none" stroke="#f6edff" strokeWidth="1.7" strokeLinecap="round" opacity=".85" /></>;
    case "ribbon":
      return <><path d="M11 54C4 31 29 15 40 39C53 66 79 45 66 23" stroke="url(#elita-ambient-blush)" strokeWidth="12" strokeLinecap="round" /><path d="M10 48C8 33 20 23 30 29M46 49c8 8 20 2 23-8" stroke="#fff4fb" strokeWidth="2" strokeLinecap="round" /></>;
    case "diamond":
      return <><path d="m36 9-25 25a8 8 0 0 0 0 12l25 25a6 6 0 0 0 8 0l25-25a8 8 0 0 0 0-12L44 9a6 6 0 0 0-8 0Z" fill="url(#elita-ambient-mint)" /><path d="m17 38 23-23 23 23-23 8-23-8Z" fill="#e7fff1" fillOpacity=".6" /><path d="m40 46 23-8-23 27V46Z" fill="#408f7a" fillOpacity=".24" /></>;
    case "squiggle":
      return <><path d="M10 51c0-16 17-26 24-12s18 13 22-2 16-9 14 2" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><path d="M14 64c9 4 19 4 27-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".55" /></>;
  }
}

/** Gutter decorations never receive input; selected SVGs can use gentle CSS motion. */
export function AmbientShapes() {
  return <div className="site-ornaments" aria-hidden="true">
    <svg width="0" height="0" focusable="false" style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <linearGradient id="elita-ambient-violet" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dfc9ff" /><stop offset=".48" stopColor="#b08be7" /><stop offset="1" stopColor="#7d51c9" /></linearGradient>
        <linearGradient id="elita-ambient-blush" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe0f0" /><stop offset=".5" stopColor="#eaa7d2" /><stop offset="1" stopColor="#bd7ab9" /></linearGradient>
        <linearGradient id="elita-ambient-mint" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ddf7ed" /><stop offset=".55" stopColor="#a0d6c4" /><stop offset="1" stopColor="#66ac96" /></linearGradient>
      </defs>
    </svg>
    {motifs.map((motif, index) => <span className={`site-ornament site-ornament-${index + 1} ornament-${motif}`} key={index}>
      <svg viewBox="0 0 80 80" fill="none" focusable="false"><MotifDrawing motif={motif} /></svg>
    </span>)}
  </div>;
}
