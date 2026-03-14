import React, { useEffect, useRef } from 'react';
import type { VolatilitySurfaceData } from '@/types';

interface VolatilitySurfaceChartProps {
  data: VolatilitySurfaceData;
  width?: number;
  height?: number;
  className?: string;
}

export const VolatilitySurfaceChart: React.FC<VolatilitySurfaceChartProps> = ({
  data,
  width = 600,
  height = 400,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.strikes.length || !data.expirations.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins and dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find min/max values for scaling
    const minStrike = Math.min(...data.strikes);
    const maxStrike = Math.max(...data.strikes);
    const minExpiration = Math.min(...data.expirations);
    const maxExpiration = Math.max(...data.expirations);
    
    const allVols = data.volatilities.flat();
    const minVol = Math.min(...allVols);
    const maxVol = Math.max(...allVols);

    // Color mapping function
    const getColor = (vol: number): string => {
      const normalized = (vol - minVol) / (maxVol - minVol);
      const hue = (1 - normalized) * 240; // Blue to red
      return `hsl(${hue}, 70%, 50%)`;
    };

    // Draw the surface as a heatmap
    const cellWidth = chartWidth / data.strikes.length;
    const cellHeight = chartHeight / data.expirations.length;

    for (let i = 0; i < data.strikes.length; i++) {
      for (let j = 0; j < data.expirations.length; j++) {
        const vol = data.volatilities[j][i];
        if (vol !== undefined && !isNaN(vol)) {
          ctx.fillStyle = getColor(vol);
          ctx.fillRect(
            margin.left + i * cellWidth,
            margin.top + j * cellHeight,
            cellWidth,
            cellHeight
          );
        }
      }
    }

    // Draw axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';

    // X-axis labels (strikes)
    const strikeStep = Math.max(1, Math.floor(data.strikes.length / 5));
    for (let i = 0; i < data.strikes.length; i += strikeStep) {
      const x = margin.left + (i + 0.5) * cellWidth;
      ctx.fillText(
        data.strikes[i].toFixed(0),
        x,
        height - margin.bottom + 20
      );
    }

    // Y-axis labels (expirations)
    ctx.textAlign = 'right';
    const expStep = Math.max(1, Math.floor(data.expirations.length / 5));
    for (let j = 0; j < data.expirations.length; j += expStep) {
      const y = margin.top + (j + 0.5) * cellHeight;
      ctx.fillText(
        data.expirations[j].toFixed(2),
        margin.left - 10,
        y + 4
      );
    }

    // Axis titles
    ctx.textAlign = 'center';
    ctx.font = '14px sans-serif';
    ctx.fillText('Strike Price', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Time to Expiration', 0, 0);
    ctx.restore();

    // Title
    ctx.font = '16px sans-serif';
    ctx.fillText('Implied Volatility Surface', width / 2, 25);

    // Color scale legend
    const legendWidth = 20;
    const legendHeight = chartHeight / 2;
    const legendX = width - margin.right + 10;
    const legendY = margin.top + chartHeight / 4;

    for (let i = 0; i < legendHeight; i++) {
      const vol = minVol + (maxVol - minVol) * (1 - i / legendHeight);
      ctx.fillStyle = getColor(vol);
      ctx.fillRect(legendX, legendY + i, legendWidth, 1);
    }

    // Legend labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(maxVol.toFixed(2), legendX + legendWidth + 5, legendY + 5);
    ctx.fillText(minVol.toFixed(2), legendX + legendWidth + 5, legendY + legendHeight);

  }, [data, width, height]);

  if (!data.strikes.length || !data.expirations.length) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700 ${className}`} 
           style={{ width, height }}>
        <p className="text-slate-400 text-sm">No volatility surface data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 p-4 ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="max-w-full h-auto"
      />
    </div>
  );
};