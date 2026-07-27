import React, { useMemo, useState, useEffect, useRef } from "react";

interface AudioWaveformVisualizerProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isScrubbing?: boolean;
  scrubValue?: number;
  onSeek: (time: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: (time: number) => void;
  seed?: string;
  height?: number;
  barCount?: number;
  className?: string;
}

/**
 * Deterministic pseudo-random number generator based on string seed.
 */
function seedRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return function () {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  duration,
  currentTime,
  isPlaying,
  isScrubbing = false,
  scrubValue = 0,
  onSeek,
  onScrubStart,
  onScrubEnd,
  seed = "default-episode",
  height = 48,
  barCount = 52,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [animTime, setAnimTime] = useState<number>(0);

  // Dynamic animation frame for lively audio visualizer movement while playing
  useEffect(() => {
    if (!isPlaying) return;
    let animationFrameId: number;
    const animate = (time: number) => {
      setAnimTime(time / 1000);
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Generate base waveform heights (normalized 0.12 to 0.95)
  const baseHeights = useMemo(() => {
    const rng = seedRandom(seed || "podcast-audio");
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      // Create natural waveform rhythm with low & high peaks
      const progress = i / barCount;
      const envelope = Math.sin(progress * Math.PI) * 0.4 + 0.6; // curve ends slightly lower
      const raw = rng();
      const h = Math.min(0.98, Math.max(0.15, (0.2 + raw * 0.75) * envelope));
      heights.push(h);
    }
    return heights;
  }, [seed, barCount]);

  const effectiveTime = isScrubbing ? scrubValue : currentTime;
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, effectiveTime / duration)) : 0;
  const activeBarIndex = Math.floor(progressRatio * barCount);

  // Time format helper for hover tooltip
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const sStr = s < 10 ? `0${s}` : s;
    if (h > 0) {
      const mStr = m < 10 ? `0${m}` : m;
      return `${h}:${mStr}:${sStr}`;
    }
    return `${m}:${sStr}`;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    const targetTime = ratio * duration;
    setHoverX(x);
    setHoverTime(targetTime);

    if (e.buttons === 1) {
      onSeek(targetTime);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    onScrubStart?.();
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetTime = (x / rect.width) * duration;
    onSeek(targetTime);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (hoverTime !== null) {
      onScrubEnd?.(hoverTime);
    }
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const svgWidth = 500;
  const svgHeight = height;
  const barWidth = 5.5;
  const gap = (svgWidth - barCount * barWidth) / (barCount - 1);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setHoverTime(null)}
      className={`relative w-full cursor-pointer select-none touch-none group ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Hover Time Tooltip */}
      {hoverTime !== null && (
        <div
          className="absolute -top-8 -translate-x-1/2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-md pointer-events-none transition-all z-20"
          style={{ left: `${hoverX}px` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* SVG Audio Visualizer Waveform */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Vibrant active audio gradient */}
          <linearGradient id="activeBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#007AFF" />
            <stop offset="100%" stopColor="#0051C6" />
          </linearGradient>

          {/* Active playhead glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Render each audio waveform bar */}
        {baseHeights.map((baseH, idx) => {
          const x = idx * (barWidth + gap);
          const isPlayed = idx / barCount <= progressRatio;
          const isActiveBar = idx === activeBarIndex;

          // Dynamic wave modulation if audio is actively playing
          let dynamicFactor = 0;
          if (isPlaying) {
            if (isActiveBar) {
              dynamicFactor = Math.sin(animTime * 12) * 0.18 + Math.cos(animTime * 8) * 0.12;
            } else if (isPlayed) {
              dynamicFactor = Math.sin(animTime * 6 + idx * 0.4) * 0.08;
            } else {
              dynamicFactor = Math.sin(animTime * 3 + idx * 0.2) * 0.04;
            }
          }

          const hFactor = Math.min(1, Math.max(0.12, baseH + dynamicFactor));
          const actualBarHeight = Math.max(4, hFactor * (svgHeight - 8));
          const y = (svgHeight - actualBarHeight) / 2;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={actualBarHeight}
              rx={barWidth / 2}
              ry={barWidth / 2}
              className={`transition-colors duration-150 ${
                isPlayed
                  ? "fill-[#007AFF] dark:fill-[#007AFF]"
                  : "fill-neutral-200/90 dark:fill-neutral-800"
              } ${isActiveBar && isPlaying ? "brightness-125" : ""}`}
            />
          );
        })}

        {/* Active Playhead Line & Glowing Dot */}
        {progressRatio > 0 && progressRatio < 1 && (
          <g transform={`translate(${progressRatio * svgWidth}, 0)`}>
            <line
              x1="0"
              y1="2"
              x2="0"
              y2={svgHeight - 2}
              stroke="#007AFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#glow)"
            />
            <circle
              cx="0"
              cy={svgHeight / 2}
              r="4.5"
              fill="#FFFFFF"
              stroke="#007AFF"
              strokeWidth="2"
              className={isPlaying ? "animate-ping opacity-75" : ""}
            />
            <circle
              cx="0"
              cy={svgHeight / 2}
              r="4.5"
              fill="#FFFFFF"
              stroke="#007AFF"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Mini Equalizer SVG for compact player headers or minimized bottom player.
 */
export const MiniAudioEqualizer: React.FC<{ isPlaying: boolean; className?: string }> = ({
  isPlaying,
  className = "",
}) => {
  const [animTime, setAnimTime] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    let frameId: number;
    const update = (t: number) => {
      setAnimTime(t / 1000);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  const bars = [0.6, 0.9, 0.4, 0.8, 0.5];

  return (
    <svg
      viewBox="0 0 24 18"
      className={`w-5 h-4 overflow-visible ${className}`}
      fill="currentColor"
    >
      {bars.map((base, idx) => {
        let heightFactor = isPlaying
          ? Math.abs(Math.sin(animTime * (8 + idx * 2) + idx)) * 0.7 + 0.3
          : 0.25;
        const barHeight = Math.max(3, heightFactor * 16);
        const y = 18 - barHeight;
        const x = idx * 4.5 + 1;

        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width="3"
            height={barHeight}
            rx="1.5"
            className="fill-[#007AFF] transition-all duration-75"
          />
        );
      })}
    </svg>
  );
};
