import React from "react";

// Sequentially drawn full-screen graph: grid lines, then axes, then curve
export const RetroGameRoomBackground: React.FC = () => {
  // Timing (total ~12s): grid 0-3s, axes 4-6s, curve 6-12s
  const cell = 48; // tighter grid like earlier version
  const width = 1600;
  const height = 900;
  const verticalCount = Math.ceil(width / cell) + 1; // 0..1600
  const horizontalCount = Math.ceil(height / cell) + 1; // 0..900
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Full-screen graph paper grid base (faint) */}
      <div
        className="absolute inset-0"
        style={{
          // Deep green gradient base for the cells (replaces the former white)
          background: `linear-gradient(180deg, #0A7A66 0%, #086B59 55%, #064C40 100%)`
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#32936F" />
            <stop offset="55%" stopColor="#8BA8DD" />
            <stop offset="100%" stopColor="#52528C" />
          </linearGradient>
          {/* Static grid pattern matching cell size */}
          <pattern id="gridPattern" width={cell} height={cell} patternUnits="userSpaceOnUse">
            {/* Grid lines with slightly higher opacity for crisper, seamless blend */}
            <path
              d={`M ${cell} 0 L 0 0 0 ${cell}`}
              stroke="#000"
              strokeOpacity="0.35"
              strokeWidth="1"
              fill="none"
              shapeRendering="crispEdges"
            />
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feColorMatrix in="b" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.55  0 0 0 0 0.4  0 0 0 0.6 0" />
            <feBlend in="SourceGraphic" in2="b" mode="screen" />
          </filter>
          <style>{`
            @keyframes drawStroke { to { stroke-dashoffset: 0; } }
            @keyframes axisReveal { from { stroke-dashoffset: var(--axis-len); opacity:0; } to { stroke-dashoffset:0; opacity:1; } }
            @keyframes labelFade { from { opacity:0; transform:translateY(-6px);} to { opacity:1; transform:translateY(0);} }
            .gridDraw { stroke:#000; stroke-opacity:0.4; stroke-width:1.5; stroke-dasharray:1000; stroke-dashoffset:1000; animation: drawStroke 2.6s ease-out forwards; shape-rendering:crispEdges; }
            .axisLine { stroke:#fff; stroke-width:3; fill:none; marker-end:url(#arrowThin); stroke-dasharray:var(--axis-len); stroke-dashoffset:var(--axis-len); animation: axisReveal 1.2s cubic-bezier(.23,.97,.37,1) forwards; animation-delay:4s; vector-effect:non-scaling-stroke; shape-rendering:crispEdges; }
            .curve { stroke:url(#curveGrad); stroke-width:16; fill:none; stroke-linecap:round; filter:url(#glow); stroke-dasharray:2600; stroke-dashoffset:2600; animation: drawStroke 6s ease-in-out forwards; animation-delay:6.2s; }
            .labels { font:600 20px 'Comfortaa', sans-serif; fill:#fff; opacity:0; animation: labelFade .9s ease-out forwards; animation-delay:6.3s; letter-spacing:.5px; }
          `}</style>
          <marker id="arrowThin" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="strokeWidth">
            {/* Slender arrowhead without trailing funnel extension */}
            <path d="M0 0 L10 5 L0 10 L3.2 5 Z" fill="#fff" />
          </marker>
        </defs>

        {/* Static full-screen grid */}
        <rect x="0" y="0" width={width} height={height} fill="url(#gridPattern)" />

        {/* Vertical grid lines (staggered) to match CSS grid, cover edge-to-edge */}
        {Array.from({ length: verticalCount }).map((_, i) => {
          const x = i * cell;
          const delay = (i / verticalCount) * 1.5; // spread over first 1.5s
          return (
            <line
              key={'vx'+i}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              className="gridDraw"
              style={{ animationDelay: `${delay}s` }}
            />
          );
        })}
        {/* Horizontal grid lines (start after vertical begin), cover edge-to-edge */}
        {Array.from({ length: horizontalCount }).map((_, i) => {
          const y = i * cell;
          const delay = 1.6 + (i / horizontalCount) * 1.4; // start after vertical sequence
          return (
            <line
              key={'hy'+i}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              className="gridDraw"
              style={{ animationDelay: `${delay}s` }}
            />
          );
        })}

  {/* Axes snapped to grid multiples for perfect alignment (cell=48) */}
  {/* Vertical axis starts exactly at horizontal to avoid a downward stub */}
  <line x1={96} y1={816} x2={96} y2={48} className="axisLine" style={{ ['--axis-len' as any]: 768 }} />
  <line x1={96} y1={816} x2={1536} y2={816} className="axisLine" style={{ ['--axis-len' as any]: 1440 }} />

  {/* Axis labels (clean sans-serif) */}
  <text x={1516} y={800} className="labels" textAnchor="end">X</text>
  {/* Give Y label extra breathing room from the axis and arrowhead */}
  <text x={68} y={64} className="labels">Y</text>

        {/* Smooth curve using cubic Beziers (draws last) */}
        <path
          d="M160 760 C240 650 320 640 400 700 C480 760 560 560 640 520 C720 480 800 560 880 620 C960 680 1040 640 1120 560 C1200 480 1280 500 1360 600"
          className="curve"
        />

        {/* Removed glow ellipse to prevent grid lines appearing faded on the right */}
      </svg>
    </div>
  );
};

export default RetroGameRoomBackground;
