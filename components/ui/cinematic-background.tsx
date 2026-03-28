export function CinematicBackground() {
  return (
    <>
      {/* Cinematic Material Grain Effect */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* Layered Lighting - 'The Material Warmth' */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[900px] rounded-full bg-white/[0.015] blur-[160px] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-500/[0.01] blur-[120px] pointer-events-none translate-x-1/4 -translate-y-1/4" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-amber-500/[0.01] blur-[120px] pointer-events-none -translate-x-1/4 translate-y-1/4" />
    </>
  )
}
