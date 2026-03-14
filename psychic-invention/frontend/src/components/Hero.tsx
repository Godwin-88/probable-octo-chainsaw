import { Button } from './Button';
import { usePerformanceMetrics } from '@/hooks/useApi';

export const Hero = () => {
  const metrics = usePerformanceMetrics();

  return (
    <section className="section-padding bg-slate-900">
      <div className="container text-center">
        {/* Main Headline */}
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-8">
          High-Frequency
          <br />
          <span className="glow-text">Options Pricing</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto">
          Institutional-grade derivatives pricing engine powered by Rust algorithms.
          <br />
          Execute trades at Wall Street speed.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Button size="lg">⚡ Launch Terminal</Button>
          <Button variant="outline" size="lg">📊 View Performance</Button>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="metric-card">
            <div className="text-4xl font-bold text-blue-400 mb-2 font-mono">2ms</div>
            <div className="text-white font-medium">Execution Speed</div>
            <div className="text-slate-400 text-sm mt-1">Black-Scholes Pricing</div>
          </div>
          <div className="metric-card">
            <div className="text-4xl font-bold text-success mb-2 font-mono">
              {metrics.calculationsServed.toLocaleString()}+
            </div>
            <div className="text-white font-medium">Trades Processed</div>
            <div className="text-slate-400 text-sm mt-1">Real-time calculations</div>
          </div>
          <div className="metric-card">
            <div className="text-4xl font-bold text-gold mb-2 font-mono">99.9%</div>
            <div className="text-white font-medium">Uptime SLA</div>
            <div className="text-slate-400 text-sm mt-1">Enterprise reliability</div>
          </div>
        </div>
      </div>
    </section>
  );
};
