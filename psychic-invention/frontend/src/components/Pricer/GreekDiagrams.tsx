import { useMemo } from 'react';
import { computeCallGreeks, computePutGreeks } from '@/utils/greeks';
import type { Greeks } from '@/types';

const margin = { top: 16, right: 16, bottom: 28, left: 44 };
const chartW = 180;
const chartH = 100;

interface GreekDiagramsProps {
  s: number;
  k: number;
  tau: number;
  r: number;
  sigma: number;
  optionType: 'call' | 'put';
}

function computeGreek(
  optionType: 'call' | 'put',
  field: keyof Greeks,
  base: { s: number; k: number; tau: number; r: number; sigma: number },
  vary: { key: keyof typeof base; min: number; max: number; steps: number }
): { x: number; y: number }[] {
  const fn = optionType === 'call' ? computeCallGreeks : computePutGreeks;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= vary.steps; i++) {
    const t = i / vary.steps;
    const val = vary.min + t * (vary.max - vary.min);
    const req = { ...base, [vary.key]: val };
    const greeks = fn(req);
    const y = (greeks as Record<string, number>)[field];
    pts.push({ x: val, y: Number.isFinite(y) ? y : 0 });
  }
  return pts;
}

function GreekChart({
  title,
  points,
  xLabel,
  yFormat,
  color,
}: {
  title: string;
  points: { x: number; y: number }[];
  xLabel: string;
  yFormat: (v: number) => string;
  color: string;
}) {
  const { path, xMin, xMax, yMin, yMax } = useMemo(() => {
    if (!points.length) return { path: '', xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const pad = (yMax - yMin) * 0.1 || 0.01;
    const yLo = yMin - pad;
    const yHi = yMax + pad;
    const w = chartW - margin.left - margin.right;
    const h = chartH - margin.top - margin.bottom;
    const scaleX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin || 1)) * w;
    const scaleY = (y: number) => margin.top + h - ((y - yLo) / (yHi - yLo)) * h;
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
      .join(' ');
    return { path: d, xMin, xMax, yMin: yLo, yMax: yHi };
  }, [points]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
      <p className="text-xs font-medium text-slate-300 mb-2">{title}</p>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full max-w-[200px] h-[100px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`grad-${title}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x={chartW / 2} y={chartH - 4} textAnchor="middle" className="fill-slate-500 text-[9px]">
          {xLabel}
        </text>
      </svg>
    </div>
  );
}

export const GreekDiagrams = ({ s, k, tau, r, sigma, optionType }: GreekDiagramsProps) => {
  const base = { s, k, tau, r, sigma };
  const colors = {
    delta: '#3b82f6',
    gamma: '#22c55e',
    theta: '#f59e0b',
    vega: '#8b5cf6',
    rho: '#ec4899',
  };

  const diagrams = useMemo(() => {
    const sRange = Math.max(k * 0.5, 1);
    const sMax = k * 1.5;
    return [
      {
        key: 'delta',
        title: 'Δ Delta vs Spot',
        points: computeGreek(optionType, 'delta', base, { key: 's', min: sRange, max: sMax, steps: 40 }),
        xLabel: 'Spot (S)',
        yFormat: (v: number) => v.toFixed(2),
        color: colors.delta,
      },
      {
        key: 'gamma',
        title: 'Γ Gamma vs Spot',
        points: computeGreek(optionType, 'gamma', base, { key: 's', min: sRange, max: sMax, steps: 40 }),
        xLabel: 'Spot (S)',
        yFormat: (v: number) => v.toExponential(2),
        color: colors.gamma,
      },
      {
        key: 'theta',
        title: 'Θ Theta vs Time',
        points: computeGreek(optionType, 'theta', base, { key: 'tau', min: 0.01, max: 2, steps: 40 }),
        xLabel: 'τ (years)',
        yFormat: (v: number) => v.toFixed(2),
        color: colors.theta,
      },
      {
        key: 'vega',
        title: 'ν Vega vs Volatility',
        points: computeGreek(optionType, 'vega', base, { key: 'sigma', min: 0.05, max: 0.8, steps: 40 }),
        xLabel: 'σ',
        yFormat: (v: number) => v.toFixed(1),
        color: colors.vega,
      },
      {
        key: 'rho',
        title: 'ρ Rho vs Rate',
        points: computeGreek(optionType, 'rho', base, { key: 'r', min: 0, max: 0.15, steps: 40 }),
        xLabel: 'r',
        yFormat: (v: number) => v.toFixed(2),
        color: colors.rho,
      },
    ];
  }, [s, k, tau, r, sigma, optionType]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-white">Greek Sensitivity Diagrams</h4>
      <p className="text-xs text-slate-500">
        How each Greek varies with spot, time, volatility, and rate (Black-Scholes {optionType})
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {diagrams.map((d) => (
          <GreekChart
            key={d.key}
            title={d.title}
            points={d.points}
            xLabel={d.xLabel}
            yFormat={d.yFormat}
            color={d.color}
          />
        ))}
      </div>
    </div>
  );
};
