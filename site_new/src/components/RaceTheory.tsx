import { useMemo } from 'react';

interface Horse {
  post_position: number;
  horse_name: string;
  running_style: string | null;
  scratched?: boolean;
}

interface RaceTheoryProps {
  entries: Horse[];
  surface?: string;
  winPickPP?: number | null;
  favePP?: number | null;
}

const STYLE_COLORS: Record<string, string> = {
  'E': '#FF3333',
  'E/P': '#FF8C00',
  'P': '#4488FF',
  'S': '#22AA44',
};

const STYLE_LABELS: Record<string, string> = {
  'E': 'Speed',
  'E/P': 'Presser',
  'P': 'Stalker',
  'S': 'Closer',
};

export function RaceTheory({ entries, surface, winPickPP, favePP }: RaceTheoryProps) {
  const liveEntries = useMemo(
    () => entries.filter(e => !e.scratched && e.running_style),
    [entries]
  );

  const paceCount = useMemo(
    () => liveEntries.filter(e => e.running_style === 'E').length,
    [liveEntries]
  );

  const thesis = useMemo(() => {
    if (paceCount === 0) return 'No speed — wire job or stalker controls';
    if (paceCount === 1) return 'Lone speed — possible wire job';
    if (paceCount === 2) return `Pace duel — ${paceCount} speed clash, closers inherit`;
    return `${paceCount}-way speed war — closers and stalkers live`;
  }, [paceCount]);

  const isDirt = !surface || surface.toLowerCase().includes('dirt');

  // SVG dimensions
  const W = 360;
  const H = 200;
  const CX = W / 2;
  const CY = H / 2 + 5;
  const RX = 140;
  const RY = 60;

  // Build elliptical path (clockwise, starting from right side = gate)
  const trackPath = `M ${CX + RX} ${CY} A ${RX} ${RY} 0 1 0 ${CX + RX - 0.01} ${CY}`;

  // Each style has different timing through the race
  // keyTimes controls speed: 0=gate, ~0.3=first turn, ~0.6=far turn, ~0.85=stretch, 1=wire
  // Values are cumulative distances along the path (0 to 1)
  const getMotionParams = (style: string | null) => {
    switch (style) {
      case 'E':
        if (paceCount >= 2) {
          // Speed in duel: blazes early, dies in stretch
          return {
            keyTimes: '0;0.15;0.40;0.70;0.85;1',
            keyPoints: '0;0.25;0.50;0.70;0.80;0.85',
          };
        }
        // Lone speed: leads gate to wire
        return {
          keyTimes: '0;0.15;0.40;0.70;0.85;1',
          keyPoints: '0;0.25;0.50;0.72;0.88;0.97',
        };
      case 'E/P':
        // Presser: sits just off speed, kicks in stretch
        return {
          keyTimes: '0;0.15;0.40;0.70;0.85;1',
          keyPoints: '0;0.20;0.45;0.68;0.85;0.95',
        };
      case 'P':
        // Stalker: mid-pack, one run on the turn
        return {
          keyTimes: '0;0.15;0.40;0.70;0.85;1',
          keyPoints: '0;0.15;0.38;0.62;0.82;0.93',
        };
      case 'S':
        if (paceCount >= 2) {
          // Closer with pace to run into: drops back, explodes in stretch
          return {
            keyTimes: '0;0.15;0.40;0.70;0.85;1',
            keyPoints: '0;0.10;0.30;0.55;0.80;0.96',
          };
        }
        // Closer with no pace: drops back, can't make up ground
        return {
          keyTimes: '0;0.15;0.40;0.70;0.85;1',
          keyPoints: '0;0.10;0.28;0.48;0.68;0.82',
        };
      default:
        return {
          keyTimes: '0;0.15;0.40;0.70;0.85;1',
          keyPoints: '0;0.15;0.40;0.60;0.78;0.90',
        };
    }
  };

  // Offset from rail by post position (outside posts = wider)
  const getOffset = (pp: number, total: number) => {
    const norm = (pp - 1) / Math.max(total - 1, 1);
    return norm * 8 + 2; // 2-10px off rail
  };

  return (
    <div className="bg-gray-900 border-2 border-gray-700 p-3 my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-gray-400 font-bold uppercase tracking-wider">Race Theory</span>
        <span className="font-mono text-[10px] text-gray-500">{liveEntries.length} horses</span>
      </div>

      <div className="font-mono text-sm text-white font-bold mb-3 text-center">
        {thesis}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: '220px' }}>
        {/* Track surface — outer fill */}
        <ellipse
          cx={CX} cy={CY} rx={RX + 12} ry={RY + 12}
          fill={isDirt ? '#2A1F0A' : '#0A2A0F'}
          stroke="none"
        />
        {/* Infield */}
        <ellipse
          cx={CX} cy={CY} rx={RX - 12} ry={RY - 12}
          fill={isDirt ? '#1A1408' : '#062008'}
          stroke="none"
        />
        {/* Track racing surface */}
        <ellipse
          cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none"
          stroke={isDirt ? '#6B4E1F' : '#2D5A27'}
          strokeWidth="22"
          opacity="0.5"
        />
        {/* Inner rail */}
        <ellipse
          cx={CX} cy={CY} rx={RX - 11} ry={RY - 11}
          fill="none"
          stroke={isDirt ? '#A07830' : '#3D8B37'}
          strokeWidth="1"
          opacity="0.7"
        />
        {/* Outer rail */}
        <ellipse
          cx={CX} cy={CY} rx={RX + 11} ry={RY + 11}
          fill="none"
          stroke={isDirt ? '#A07830' : '#3D8B37'}
          strokeWidth="1"
          opacity="0.7"
        />

        {/* Quarter poles */}
        {[0.25, 0.5, 0.75].map(pct => {
          const angle = -pct * Math.PI * 2;
          const x = CX + RX * Math.cos(angle);
          const y = CY + RY * Math.sin(angle);
          return (
            <circle key={pct} cx={x} cy={y} r="2" fill="#666" opacity="0.5" />
          );
        })}

        {/* Finish line */}
        <line
          x1={CX + RX + 11} y1={CY}
          x2={CX + RX - 11} y2={CY}
          stroke="#FFFFFF" strokeWidth="2" opacity="0.6"
        />

        {/* Track labels */}
        <text x={CX + RX + 16} y={CY - 8} fill="#888" fontSize="7" fontFamily="monospace" textAnchor="start">GATE/</text>
        <text x={CX + RX + 16} y={CY + 2} fill="#888" fontSize="7" fontFamily="monospace" textAnchor="start">WIRE</text>
        <text x={CX} y={CY + RY + 22} fill="#555" fontSize="7" fontFamily="monospace" textAnchor="middle">BACKSTRETCH</text>
        <text x={CX} y={CY - RY - 14} fill="#555" fontSize="7" fontFamily="monospace" textAnchor="middle">HOME STRETCH</text>

        {/* Hidden path for animateMotion */}
        <path id="race-track" d={trackPath} fill="none" stroke="none" />

        {/* Horse dots with animateMotion */}
        {liveEntries.map((entry) => {
          const color = STYLE_COLORS[entry.running_style || ''] || '#888';
          const isWinPick = entry.post_position === winPickPP;
          const isFave = entry.post_position === favePP;
          const motion = getMotionParams(entry.running_style);
          const offset = getOffset(entry.post_position, liveEntries.length);

          // Build individual offset path (slightly larger ellipse for outer posts)
          const oRX = RX + offset - 5;
          const oRY = RY + offset - 5;
          const horsePath = `M ${CX + oRX} ${CY} A ${oRX} ${oRY} 0 1 0 ${CX + oRX - 0.01} ${CY}`;

          const r = isWinPick ? 5 : isFave ? 4.5 : 3.5;

          return (
            <g key={entry.post_position}>
              <path id={`track-${entry.post_position}`} d={horsePath} fill="none" stroke="none" />
              <circle
                r={r}
                fill={color}
                stroke={isWinPick ? '#FFD700' : isFave ? '#FF4444' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isWinPick ? 2 : isFave ? 1.5 : 0.5}
                opacity="0.95"
              >
                <animateMotion
                  dur="8s"
                  repeatCount="indefinite"
                  keyTimes={motion.keyTimes}
                  keyPoints={motion.keyPoints}
                  calcMode="spline"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                >
                  <mpath href={`#track-${entry.post_position}`} />
                </animateMotion>
              </circle>
              {/* PP label follows the dot */}
              {(isWinPick || isFave) && (
                <text
                  fill={isWinPick ? '#FFD700' : '#FF6666'}
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  dy="-8"
                >
                  <animateMotion
                    dur="8s"
                    repeatCount="indefinite"
                    keyTimes={motion.keyTimes}
                    keyPoints={motion.keyPoints}
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                  >
                    <mpath href={`#track-${entry.post_position}`} />
                  </animateMotion>
                  #{entry.post_position}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
        {Object.entries(STYLE_COLORS).map(([style, color]) => {
          const count = liveEntries.filter(e => e.running_style === style).length;
          if (count === 0) return null;
          return (
            <div key={style} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-mono text-[10px] text-gray-400">
                {STYLE_LABELS[style]} ({count})
              </span>
            </div>
          );
        })}
        {winPickPP && (
          <div className="flex items-center gap-1 ml-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#FFD700] bg-transparent" />
            <span className="font-mono text-[10px] text-[#FFD700]">PICK</span>
          </div>
        )}
        {favePP && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-[#FF4444] bg-transparent" />
            <span className="font-mono text-[10px] text-[#FF6666]">FAVE</span>
          </div>
        )}
      </div>
    </div>
  );
}
