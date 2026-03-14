import { useState, useEffect, useRef } from 'react';
import { postOptimizeMvoFrontier } from '@/utils/api';

interface FrontierPoint {
  weights: number[];
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

const SAMPLE_COV = [
  [0.04, 0.02, 0.01],
  [0.02, 0.09, 0.015],
  [0.01, 0.015, 0.06],
];
const SAMPLE_MU = [0.08, 0.12, 0.06];

export const EfficientFrontierChart = () => {
  const [frontier, setFrontier] = useState<FrontierPoint[]>([]);
  const [gmv, setGmv] = useState<{ weights: number[]; expected_return: number; volatility: number } | null>(null);
  const [tangency, setTangency] = useState<{ weights: number[]; expected_return: number; volatility: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await postOptimizeMvoFrontier({
          covariance: SAMPLE_COV,
          expected_returns: SAMPLE_MU,
          risk_free_rate: 0.02,
          n_points: 50,
          long_only: true,
        });
        setFrontier(res.frontier as FrontierPoint[]);
        setGmv(res.gmv as { weights: number[]; expected_return: number; volatility: number });
        setTangency(res.tangency as { weights: number[]; expected_return: number; volatility: number });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to compute frontier');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frontier.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const margin = { top: 40, right: 40, bottom: 50, left: 80 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    const vols = frontier.map((p) => p.volatility);
    const rets = frontier.map((p) => p.expected_return);
    const minVol = Math.min(...vols);
    const maxVol = Math.max(...vols);
    const minRet = Math.min(...rets);
    const maxRet = Math.max(...rets);
    const padVol = (maxVol - minVol) * 0.05 || 0.01;
    const padRet = (maxRet - minRet) * 0.05 || 0.01;

    const scaleX = (v: number) =>
      margin.left + ((v - minVol + padVol) / (maxVol - minVol + 2 * padVol)) * chartW;
    const scaleY = (r: number) =>
      margin.top + chartH - ((r - minRet + padRet) / (maxRet - minRet + 2 * padRet)) * chartH;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

    ctx.fillStyle = '#22d3ee';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX(frontier[0].volatility), scaleY(frontier[0].expected_return));
    for (let i = 1; i < frontier.length; i++) {
      ctx.lineTo(scaleX(frontier[i].volatility), scaleY(frontier[i].expected_return));
    }
    ctx.stroke();

    if (gmv) {
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(scaleX(gmv.volatility), scaleY(gmv.expected_return), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('GMV', scaleX(gmv.volatility) + 8, scaleY(gmv.expected_return));
    } else if (tangency) {
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(scaleX(tangency.volatility), scaleY(tangency.expected_return), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('Tangency', scaleX(tangency.volatility) + 8, scaleY(tangency.expected_return));
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Volatility (σ)', w / 2 - 30, h - 10);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Expected Return', -50, 0);
    ctx.restore();
  }, [frontier, gmv, tangency]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 flex items-center justify-center h-80">
        <p className="text-slate-400">Computing efficient frontier…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Efficient Frontier (M1 L4)</h3>
        <canvas
          ref={canvasRef}
          className="w-full h-80 rounded-lg bg-slate-900"
          style={{ width: '100%', height: 320 }}
        />
        {gmv && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-3">
              <p className="text-slate-400">GMV Weights</p>
              <p className="font-mono text-white mt-1">{gmv.weights.map((w) => (w * 100).toFixed(1)).join('% / ')}%</p>
            </div>
            <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-3">
              <p className="text-slate-400">Tangency Weights</p>
              <p className="font-mono text-white mt-1">
                {tangency?.weights.map((w) => (w * 100).toFixed(1)).join('% / ')}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
