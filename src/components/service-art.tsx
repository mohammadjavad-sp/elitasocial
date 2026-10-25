/** Code-native decorative illustrations, styled to match the supplied reference. */
export function ServiceArt({ type }: { type: string }) {
  return (
    <svg className={`service-art service-art-${type}`} viewBox="0 0 180 144" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="90" cy="132" rx="54" ry="5" fill="currentColor" opacity=".08" />
      {type === "instagram" && <>
        <rect x="52" y="15" width="78" height="116" rx="10" fill="currentColor" opacity=".18" transform="rotate(8 52 15)" />
        <rect x="45" y="9" width="78" height="119" rx="10" fill="#fff" stroke="var(--color-primary)" strokeWidth="2" />
        <path d="M69 10v6h30v-6" stroke="var(--color-primary)" strokeWidth="2" />
        <circle cx="60" cy="32" r="5" fill="var(--color-tertiary)" /><path d="M71 30h28M71 35h18" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" />
        <rect x="55" y="46" width="58" height="48" rx="4" fill="currentColor" opacity=".14" />
        <rect x="72" y="54" width="25" height="25" rx="7" stroke="currentColor" strokeWidth="3" /><circle cx="84.5" cy="66.5" r="6" stroke="currentColor" strokeWidth="2.5" /><circle cx="93" cy="58" r="1.5" fill="currentColor" />
        <path d="M55 102h12m6 0h7m-25 9h45m-45 6h32" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" />
        <rect x="18" y="57" width="32" height="29" rx="7" fill="currentColor" /><path d="M28 71c-7-7 2-12 6-5 4-7 13-2 6 5l-6 6-6-6Z" fill="white" />
        <path d="m134 32 3-8 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="currentColor" />
      </>}
      {type === "website" && <>
        <path d="M78 113v13m24-13v13M64 129h52" stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round" />
        <rect x="23" y="23" width="134" height="88" rx="7" fill="var(--color-primary)" />
        <rect x="28" y="28" width="124" height="74" rx="3" fill="white" />
        <path d="M28 42h124" stroke="var(--line)" strokeWidth="2" /><circle cx="35" cy="35" r="2" fill="currentColor" /><circle cx="43" cy="35" r="2" fill="var(--color-secondary)" /><circle cx="51" cy="35" r="2" fill="var(--color-tertiary)" />
        <rect x="39" y="52" width="50" height="31" rx="3" fill="currentColor" opacity=".16" /><path d="M99 55h39m-39 8h30" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round" />
        <rect x="99" y="73" width="27" height="9" rx="4.5" fill="currentColor" /><path d="M40 92h32m8 0h27m7 0h24" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
        <rect x="133" y="70" width="27" height="56" rx="5" fill="#fff" stroke="var(--color-primary)" strokeWidth="2" /><rect x="138" y="78" width="17" height="22" rx="2" fill="currentColor" opacity=".25" /><path d="M138 106h17m-17 5h10" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" /><circle cx="146" cy="119" r="2" fill="currentColor" />
        <path d="m20 21 3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="currentColor" />
      </>}
      {type === "content" && <>
        <rect x="48" y="19" width="83" height="106" rx="5" fill="currentColor" opacity=".18" transform="rotate(8 48 19)" />
        <path d="M39 15h66l20 20v88H39V15Z" fill="white" stroke="var(--color-primary)" strokeWidth="2" /><path d="M105 15v20h20" fill="var(--color-quaternary)" stroke="var(--color-primary)" strokeWidth="2" />
        <rect x="50" y="44" width="64" height="31" rx="3" fill="currentColor" opacity=".14" /><path d="m54 69 16-16 13 13 10-9 18 15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><circle cx="103" cy="52" r="4" fill="currentColor" />
        <path d="M52 87h49M52 96h58M52 105h35" stroke="var(--color-secondary)" strokeWidth="4" strokeLinecap="round" />
        <path d="m113 103 26-57 10 5-26 57-12 10 2-15Z" fill="currentColor" stroke="var(--color-primary)" strokeWidth="1.5" /><path d="m113 103 10 5-12 10 2-15Z" fill="#fff" /><path d="m137 50 10 5" stroke="white" strokeWidth="3" />
        <path d="m23 42 3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="currentColor" />
      </>}
      {type === "seo" && <>
        <rect x="30" y="27" width="112" height="96" rx="6" fill="white" stroke="var(--color-primary)" strokeWidth="2" /><path d="M30 44h112" stroke="var(--line)" strokeWidth="2" /><circle cx="39" cy="35" r="2" fill="currentColor" /><circle cx="47" cy="35" r="2" fill="var(--color-secondary)" /><circle cx="55" cy="35" r="2" fill="var(--color-tertiary)" />
        <path d="M44 104V75h13v29M67 104V64h13v40M90 104V55h13v49" fill="currentColor" opacity=".22" /><path d="m44 75 24-15 24-13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="119" cy="83" r="24" fill="#fff" fillOpacity=".8" stroke="var(--color-primary)" strokeWidth="5" /><path d="m136 102 19 21" stroke="var(--color-primary)" strokeWidth="9" strokeLinecap="round" /><path d="m109 83 7 7 13-15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m145 18 3-7 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="currentColor" />
      </>}
    </svg>
  );
}
