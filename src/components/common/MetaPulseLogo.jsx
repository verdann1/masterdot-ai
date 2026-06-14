/**
 * MetaPulse brand logo — inline SVG, zero dependencies.
 *
 * Management-oriented mark: ascending progress bars inside a rounded square,
 * topped by a check mark. No "pulse"/ECG line.
 *
 * Props
 *   iconSize  – px size of the rounded-square icon mark  (default 56)
 *   layout    – "icon" | "horizontal" | "stacked"        (default "icon")
 *   className – extra classes on the root element
 */
export default function MetaPulseLogo({ iconSize = 56, layout = "icon", className = "" }) {
  const mark = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MetaPulse logo"
    >
      <defs>
        {/* Background: dark navy gradient */}
        <linearGradient id="mp-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d1f3c" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Bar gradient: cyan, top-lit */}
        <linearGradient id="mp-bar" x1="0" y1="100" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0891b2" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>

        {/* Soft glow for the bars + check */}
        <filter id="mp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip to keep content inside the rounded square */}
        <clipPath id="mp-clip">
          <rect width="100" height="100" rx="22" />
        </clipPath>
      </defs>

      {/* ── Background ───────────────────────────────────────────── */}
      <rect width="100" height="100" rx="22" fill="url(#mp-bg)" />

      {/* ── Subtle border ─────────────────────────────────────────── */}
      <rect
        x="1" y="1" width="98" height="98" rx="21"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.2"
        strokeOpacity="0.18"
      />

      {/* ── Clipped content ──────────────────────────────────────── */}
      <g clipPath="url(#mp-clip)">
        {/* Baseline */}
        <rect x="20" y="74" width="60" height="3" rx="1.5" fill="#1e3a5f" />

        {/* Ascending progress bars */}
        <g filter="url(#mp-glow)">
          <rect x="24" y="56" width="13" height="18" rx="3.5" fill="url(#mp-bar)" fillOpacity="0.55" />
          <rect x="43" y="44" width="13" height="30" rx="3.5" fill="url(#mp-bar)" fillOpacity="0.8" />
          <rect x="62" y="30" width="13" height="44" rx="3.5" fill="url(#mp-bar)" />
        </g>

        {/* Check mark above the tallest bar */}
        <polyline
          points="30,34 44,48 72,18"
          fill="none"
          stroke="#e0f9ff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#mp-glow)"
        />
      </g>
    </svg>
  );

  const text = (
    <span
      className="select-none font-bold tracking-tight text-white"
      style={{ fontSize: iconSize * 0.45 }}
    >
      Meta<span className="text-cyan-400">Pulse</span>
    </span>
  );

  if (layout === "horizontal") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {mark}
        {text}
      </div>
    );
  }

  if (layout === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {mark}
        {text}
      </div>
    );
  }

  // default: icon only
  return <div className={className}>{mark}</div>;
}
