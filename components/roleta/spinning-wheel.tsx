"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Prize {
  id: number;
  label: string;
  color: string;
}

interface SpinningWheelProps {
  prizes: Prize[];
  previewMode?: boolean;
  onSpin?: () => Promise<{
    error?: string;
    winnerIndex?: number;
    winnerLabel?: string;
  }>;
  disabled?: boolean;
}

// ---- Math helpers ----

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

// ---- Component ----

export function SpinningWheel({
  prizes,
  previewMode = false,
  onSpin,
  disabled = false,
}: SpinningWheelProps) {
  const SIZE = 320;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = SIZE / 2 - 12;

  const segmentAngle = 360 / prizes.length;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const currentRotation = useRef(0);

  async function handleSpin() {
    if (spinning || disabled || !onSpin) return;
    setResult(null);
    setShowResult(false);
    setSpinning(true);

    const response = await onSpin();

    if (response.error) {
      setSpinning(false);
      return;
    }

    const winnerIndex = response.winnerIndex!;
    const targetAngle = winnerIndex * segmentAngle + segmentAngle / 2;
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const nextRotation = currentRotation.current + extraSpins + (360 - targetAngle) - (currentRotation.current % 360);

    currentRotation.current = nextRotation;
    setRotation(nextRotation);

    setTimeout(() => {
      setResult(response.winnerLabel!);
      setShowResult(true);
      setSpinning(false);
    }, 4200);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Fixed pointer at top */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2">
          <svg width="24" height="32" viewBox="0 0 24 32">
            <polygon
              points="12,32 0,0 24,0"
              className="fill-foreground"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            spinning && "animate-pulse"
          )}
          style={{
            boxShadow: spinning
              ? "0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.2)"
              : "0 0 20px rgba(139, 92, 246, 0.15)",
            borderRadius: "50%",
          }}
        />

        {/* SVG Wheel */}
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="drop-shadow-xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
            willChange: "transform",
          }}
        >
          {/* Outer ring */}
          <circle
            cx={CX}
            cy={CY}
            r={R + 6}
            fill="none"
            className="stroke-border"
            strokeWidth="4"
          />

          {/* Decorative dots on outer ring */}
          {prizes.map((_, i) => {
            const angle = i * segmentAngle;
            const pos = polarToCartesian(CX, CY, R + 6, angle);
            return (
              <circle
                key={`dot-${i}`}
                cx={pos.x}
                cy={pos.y}
                r={3}
                className="fill-muted-foreground"
              />
            );
          })}

          {/* Prize segments */}
          {prizes.map((prize, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            const midAngle = startAngle + segmentAngle / 2;

            const labelPos = polarToCartesian(CX, CY, R * 0.62, midAngle);
            const fontSize = prizes.length <= 4 ? 14 : prizes.length <= 6 ? 12 : prizes.length <= 10 ? 10 : 8;
            const maxChars = prizes.length <= 6 ? 16 : prizes.length <= 10 ? 12 : 9;
            const displayLabel = prize.label.length > maxChars
              ? prize.label.slice(0, maxChars - 1) + "…"
              : prize.label;

            return (
              <g key={prize.id}>
                <path
                  d={describeSlice(CX, CY, R, startAngle, endAngle)}
                  fill={prize.color}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fontWeight="700"
                  fill="white"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                  transform={`rotate(${midAngle}, ${labelPos.x}, ${labelPos.y})`}
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}

          {/* Center hub */}
          <circle cx={CX} cy={CY} r={22} fill="white" stroke="#e2e8f0" strokeWidth="3" />
          <circle cx={CX} cy={CY} r={10} fill="#6366f1" />
          <circle cx={CX} cy={CY} r={4} fill="white" />
        </svg>
      </div>

      {/* Spin button (hidden in previewMode) */}
      {!previewMode && (
        <button
          onClick={handleSpin}
          disabled={spinning || disabled}
          className={cn(
            "relative overflow-hidden rounded-full px-10 py-3.5 text-white font-bold text-lg",
            "bg-gradient-to-r from-violet-600 to-indigo-600",
            "shadow-lg shadow-violet-500/30",
            "transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/40 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
          )}
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 60" />
              </svg>
              Girando...
            </span>
          ) : (
            "Girar!"
          )}
        </button>
      )}

      {/* Result celebration */}
      {showResult && result && (
        <div className="animate-bounce-once">
          <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 px-8 py-5 text-center shadow-2xl shadow-yellow-500/20">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
              Parabens! Voce ganhou
            </p>
            <p className="mt-2 text-2xl font-extrabold text-yellow-800 dark:text-yellow-200">
              {result}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
