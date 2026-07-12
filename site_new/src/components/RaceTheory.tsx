import { useState, useEffect, useMemo } from 'react';

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
  'E': '#FF4444',
  'E/P': '#FF9933',
  'P': '#5599FF',
  'S': '#33CC66',
};

const STYLE_LABELS: Record<string, string> = {
  'E': 'SPD',
  'E/P': 'PRESS',
  'P': 'STALK',
  'S': 'CLOSE',
};

const STAGES = ['GATE', '1ST TURN', 'FAR TURN', 'STRETCH', 'WIRE'];

export function RaceTheory({ entries, surface, winPickPP, favePP }: RaceTheoryProps) {
  const [stage, setStage] = useState(0);

  const liveEntries = useMemo(
    () => entries.filter(e => !e.scratched && e.running_style),
    [entries]
  );

  const paceCount = useMemo(
    () => liveEntries.filter(e => e.running_style === 'E').length,
    [liveEntries]
  );

  const thesis = useMemo(() => {
    if (paceCount === 0) return 'No speed — stalker or presser controls';
    if (paceCount === 1) return 'Lone speed — wire job threat';
    if (paceCount === 2) return 'Pace duel — closers inherit';
    return `${paceCount}-way speed war — closers live`;
  }, [paceCount]);

  // Cycle through stages
  useEffect(() => {
    const interval = setInterval(() => {
      setStage(s => (s + 1) % STAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Calculate position rank (1 = leading) for each horse at each stage
  const getPositionScore = (style: string | null, stageIdx: number): number => {
    // Higher score = further ahead (leading)
    // Score 0-100, determines bar width and rank order
    switch (style) {
      case 'E':
        if (paceCount >= 2) {
          // Speed in duel: leads early, collapses late
          return [88, 90, 78, 50, 35][stageIdx];
        }
        // Lone speed: leads gate to wire
        return [90, 92, 90, 88, 85][stageIdx];
      case 'E/P':
        return [72, 75, 78, 82, 80][stageIdx];
      case 'P':
        if (paceCount >= 2) {
          // Stalker benefits from pace duel
          return [50, 55, 68, 80, 88][stageIdx];
        }
        return [50, 55, 62, 72, 78][stageIdx];
      case 'S':
        if (paceCount >= 2) {
          // Closer with pace to run into: way back early, explodes
          return [25, 30, 50, 78, 95][stageIdx];
        }
        // Closer with no pace: stuck behind
        return [25, 28, 38, 55, 62][stageIdx];
      default:
        return [50, 52, 55, 58, 60][stageIdx];
    }
  };

  // Sort entries by position at current stage (leading first)
  const rankedEntries = useMemo(() => {
    return [...liveEntries]
      .map(e => ({
        ...e,
        score: getPositionScore(e.running_style, stage),
      }))
      .sort((a, b) => b.score - a.score);
  }, [liveEntries, stage, paceCount]);

  const isTurf = surface?.toLowerCase().includes('turf');

  return (
    <div className="bg-[#0a0a14] border border-[#1a1a2e] rounded-lg p-4 my-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest font-bold">Race Theory</span>
        </div>
        <span className="font-mono text-[10px] text-gray-600">{isTurf ? 'TURF' : 'DIRT'} • {liveEntries.length} runners</span>
      </div>

      {/* Thesis */}
      <div className="text-center mb-4">
        <div className="font-mono text-sm text-white font-bold tracking-wide">{thesis}</div>
      </div>

      {/* Stage indicator */}
      <div className="flex items-center justify-between mb-3 px-1">
        {STAGES.map((s, i) => (
          <div key={s} className="flex flex-col items-center">
            <div
              className="w-2 h-2 rounded-full mb-1 transition-all duration-300"
              style={{
                backgroundColor: i === stage ? '#fff' : i < stage ? '#444' : '#222',
                boxShadow: i === stage ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
              }}
            />
            <span
              className="font-mono transition-colors duration-300"
              style={{
                fontSize: '8px',
                color: i === stage ? '#fff' : '#444',
                fontWeight: i === stage ? 'bold' : 'normal',
              }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar for current stage */}
      <div className="h-0.5 bg-[#1a1a2e] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gray-600 to-white rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
        />
      </div>

      {/* Position bars */}
      <div className="space-y-1">
        {rankedEntries.map((entry, rank) => {
          const isWinPick = entry.post_position === winPickPP;
          const isFave = entry.post_position === favePP;
          const color = STYLE_COLORS[entry.running_style || ''] || '#666';
          const styleLabel = STYLE_LABELS[entry.running_style || ''] || '?';

          return (
            <div
              key={entry.post_position}
              className="flex items-center gap-2 transition-all duration-700 ease-in-out"
              style={{
                opacity: rank < 5 ? 1 : 0.4,
                transform: `translateY(0)`,
              }}
            >
              {/* Rank number */}
              <div className="w-4 shrink-0 text-right">
                <span className="font-mono text-[10px] text-gray-500 font-bold">{rank + 1}</span>
              </div>

              {/* Horse name + PP */}
              <div className="w-[120px] shrink-0 flex items-center gap-1.5 overflow-hidden">
                {isWinPick && <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shrink-0" />}
                {isFave && !isWinPick && <div className="w-1.5 h-1.5 rounded-full bg-[#FF4444] shrink-0" />}
                <span
                  className="font-mono text-[10px] truncate font-bold"
                  style={{ color: isWinPick ? '#FFD700' : isFave ? '#FF6666' : '#ccc' }}
                >
                  {entry.horse_name}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 h-5 bg-[#111] rounded-sm overflow-hidden relative">
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-in-out flex items-center justify-end pr-1.5"
                  style={{
                    width: `${entry.score}%`,
                    backgroundColor: color,
                    opacity: 0.85,
                    boxShadow: isWinPick ? '0 0 8px rgba(255,215,0,0.3)' : isFave ? '0 0 8px rgba(255,68,68,0.2)' : 'none',
                  }}
                >
                  <span className="font-mono text-[8px] text-white font-bold opacity-80">{styleLabel}</span>
                </div>
              </div>

              {/* PP badge */}
              <div
                className="w-5 h-5 rounded-sm flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isWinPick ? '#FFD700' : isFave ? '#FF4444' : '#1a1a2e',
                  border: `1px solid ${isWinPick ? '#FFD700' : isFave ? '#FF4444' : '#333'}`,
                }}
              >
                <span
                  className="font-mono text-[9px] font-bold"
                  style={{ color: isWinPick || isFave ? '#000' : '#666' }}
                >
                  {entry.post_position}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1a1a2e]">
        <div className="flex items-center gap-3">
          {Object.entries(STYLE_COLORS).map(([style, color]) => {
            const count = liveEntries.filter(e => e.running_style === style).length;
            if (count === 0) return null;
            return (
              <div key={style} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                <span className="font-mono text-[9px] text-gray-500">{STYLE_LABELS[style]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {winPickPP && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
              <span className="font-mono text-[9px] text-[#FFD700]">PICK</span>
            </div>
          )}
          {favePP && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#FF4444]" />
              <span className="font-mono text-[9px] text-[#FF6666]">FAVE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
