import React, { useEffect, useRef } from 'react';
import type { GreeksVisualizationData } from '@/types';

interface GreeksChartProps {
  data: GreeksVisualizationData;
  selectedGreek?: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho';
  width?: number;
  height?: number;
  className?: string;
}

export const GreeksChart: React.FC<GreeksChartProps> = ({
  data,
  selectedGreek = 'delta',
  width = 500,
  height = 300,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.spotPrices.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up margins and dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Get the selected Greek data
    const greekData = data[`${selectedGreek}s` as keyof GreeksVisualizationData] as number[];
    
    if (!greekData || greekData.length === 0) return;

    // Find min/max values for scaling
    const minSpot = Math.min(...data.spotPrices);
    const maxSpot = Math.max(...data.spotPrices);
    const minGreek = Math.min(...greekData);
    const maxGreek = Math.max(...greekData);

    // Scaling functions
    const scaleX = (spot: number) => margin.left + ((spot - minSpot) / (maxSpot - minSpot)) * chartWidth;
    const scaleY = (greek: number) => margin.top + chartHeight - ((greek - minGreek) / (maxGreek - minGreek)) * chartHeight;

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = margin.left + (i / 5) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }

    // Draw the Greek curve
    ctx.strokeStyle = getGreekColor(selectedGreek);
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < data.spotPrices.length; i++) {
      const x = scaleX(data.spotPrices[i]);
      const y = scaleY(greekData[i]);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = getGreekColor(selectedGreek);
    for (let i = 0; i < data.spotPrices.length; i++) {
      const x = scaleX(data.spotPrices[i]);
      const y = scaleY(greekData[i]);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
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

    // X-axis labels (spot prices)
    for (let i = 0; i <= 5; i++) {
      const spot = minSpot + (maxSpot - minSpot) * (i / 5);
      const x = margin.left + (i / 5) * chartWidth;
      ctx.fillText(spot.toFixed(0), x, height - margin.bottom + 20);
    }

    // Y-axis labels (Greek values)
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const greek = minGreek + (maxGreek - minGreek) * (1 - i / 5);
      const y = margin.top + (i / 5) * chartHeight;
      ctx.fillText(greek.toFixed(3), margin.left - 10, y + 4);
    }

    // Axis titles
    ctx.textAlign = 'center';
    ctx.font = '14px sans-serif';
    ctx.fillText('Spot Price', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(getGreekLabel(selectedGreek), 0, 0);
    ctx.restore();

    // Title
    ctx.font = '16px sans-serif';
    ctx.fillText(`${getGreekLabel(selectedGreek)} vs Spot Price`, width / 2, 25);

  }, [data, selectedGreek, width, height]);

  const getGreekColor = (greek: string): string => {
    const colors = {
      delta: '#3b82f6',   // Blue
      gamma: '#10b981',   // Green
      theta: '#f59e0b',   // Amber
      vega: '#8b5cf6',    // Purple
      rho: '#ef4444'      // Red
    };
    return colors[greek as keyof typeof colors] || '#64748b';
  };

  const getGreekLabel = (greek: string): string => {
    const labels = {
      delta: 'Delta (Δ)',
      gamma: 'Gamma (Γ)',
      theta: 'Theta (Θ)',
      vega: 'Vega (ν)',
      rho: 'Rho (ρ)'
    };
    return labels[greek as keyof typeof labels] || greek;
  };

  if (!data.spotPrices.length) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700 ${className}`} 
           style={{ width, height }}>
        <p className="text-slate-400 text-sm">No Greeks data available</p>
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