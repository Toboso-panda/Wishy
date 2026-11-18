// Snow resting on the bottom edge of the top bar.
// The outline is generated once with a seeded random, so it is irregular but
// identical on every render (server and browser). Drawn wider than any screen
// and cropped, so it never stretches on narrow or wide windows.

const WIDTH = 2600;
const HEIGHT = 34;

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Points along the lower edge of the snow: a wavy lip with the odd sagging lump.
function edgePoints(): [number, number][] {
  const random = seeded(20251224);
  const points: [number, number][] = [];
  let x = -20;
  let nextLump = 40 + random() * 120;
  while (x < WIDTH + 40) {
    if (x > nextLump) {
      // A rounded clump of snow sagging over the edge
      const width = 34 + random() * 46;
      const depth = 5 + random() * 7;
      points.push([x + width * 0.2, 12 + depth * 0.5]);
      points.push([x + width * 0.5, 12 + depth]);
      points.push([x + width * 0.82, 12 + depth * 0.55]);
      x += width;
      nextLump = x + 70 + random() * 170;
    } else {
      points.push([x, 9 + random() * 5]);
      x += 22 + random() * 30;
    }
  }
  return points;
}

// Smooth curve through the points (Catmull-Rom converted to cubic Béziers).
function smoothPath(points: [number, number][]) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1] ?? points[i];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[i + 2] ?? points[i + 1];
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
}

const points = edgePoints();
const lastX = points[points.length - 1][0];
const SNOW_PATH = `${smoothPath(points)} L ${lastX} -4 L ${points[0][0]} -4 Z`;

export function SnowCap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMin slice" aria-hidden focusable="false">
      <defs>
        {/* Bright on top, cool blue-grey in the shaded underside */}
        <linearGradient id="snow-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#f7fafc" />
          <stop offset=".8" stopColor="#e3ecf2" />
          <stop offset="1" stopColor="#cfdde6" />
        </linearGradient>
        <filter id="snow-shadow" x="-5%" y="-50%" width="110%" height="250%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        {/* Fine grain so it reads as packed snow instead of flat paint */}
        <filter id="snow-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 .55  0 0 0 0 .65  0 0 0 0 .72  0 0 0 -1.6 .9" result="grain" />
          <feComposite in="grain" in2="SourceGraphic" operator="in" result="grainInSnow" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="grainInSnow" /></feMerge>
        </filter>
      </defs>
      <path d={SNOW_PATH} transform="translate(0 3)" fill="rgba(12, 38, 26, .3)" filter="url(#snow-shadow)" />
      <path d={SNOW_PATH} fill="url(#snow-shade)" filter="url(#snow-grain)" />
      {/* Light catching the top of the snow */}
      <path d={`M -20 1.2 H ${WIDTH + 40}`} stroke="rgba(255,255,255,.9)" strokeWidth="1.2" />
    </svg>
  );
}
