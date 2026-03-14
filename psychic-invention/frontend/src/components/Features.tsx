// Wall Street Themed Features Component
import type { FeatureCard } from '@/types';

const features: FeatureCard[] = [
  {
    id: 'black-scholes',
    title: 'Black-Scholes',
    description: 'Analytical solution for European options with guaranteed accuracy',
    icon: '📊',
    metrics: {
      speed: '2ms',
      accuracy: '100%',
      usage: 'Standard'
    }
  },
  {
    id: 'monte-carlo',
    title: 'Monte Carlo',
    description: 'Flexible simulation engine for complex derivatives and exotic options',
    icon: '🎲',
    metrics: {
      speed: '45ms',
      accuracy: '99.5%',
      usage: 'Exotic'
    }
  },
  {
    id: 'fft-pricing',
    title: 'FFT Pricing',
    description: 'Advanced Carr-Madan FFT method for efficient options pricing',
    icon: '⚡',
    metrics: {
      speed: '15ms',
      accuracy: '99.8%',
      usage: 'High Volume'
    }
  },
  {
    id: 'heston',
    title: 'Heston Model',
    description: 'Stochastic volatility model for realistic market dynamics',
    icon: '📈',
    metrics: {
      speed: '28ms',
      accuracy: '99.9%',
      usage: 'Professional'
    }
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-20 bg-dark-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-slate-100">Pricing</span>
            <span className="glow-text ml-3">Models</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Choose the optimal model for your trading strategy. From analytical solutions to advanced simulations.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-primary-600 to-primary-700 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="trading-grid mb-16">
          {features.map((feature) => (
            <div key={feature.id} className="card hover:border-primary-600 group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-semibold text-slate-100 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                {feature.description}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Speed:</span>
                  <span className="font-mono font-semibold text-primary-400">{feature.metrics.speed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Accuracy:</span>
                  <span className="font-mono font-semibold text-success">{feature.metrics.accuracy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Best for:</span>
                  <span className="font-medium text-gold text-sm">{feature.metrics.usage}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Benchmarks Table */}
        <div className="card">
          <h3 className="text-2xl font-bold text-slate-100 mb-8 text-center">
            Performance Benchmarks
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-4 px-6 text-slate-300 font-semibold">Model</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-semibold">Avg Response</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-semibold">Throughput</th>
                  <th className="text-left py-4 px-6 text-slate-300 font-semibold">Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700 hover:bg-dark-300 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-100">Black-Scholes</td>
                  <td className="py-4 px-6 text-primary-400 font-mono">2ms</td>
                  <td className="py-4 px-6 text-success font-mono">5,000 req/s</td>
                  <td className="py-4 px-6 text-slate-300">Standard options</td>
                </tr>
                <tr className="border-b border-slate-700 hover:bg-dark-300 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-100">Monte Carlo</td>
                  <td className="py-4 px-6 text-primary-400 font-mono">45ms</td>
                  <td className="py-4 px-6 text-success font-mono">200 req/s</td>
                  <td className="py-4 px-6 text-slate-300">Complex derivatives</td>
                </tr>
                <tr className="border-b border-slate-700 hover:bg-dark-300 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-100">FFT Pricing</td>
                  <td className="py-4 px-6 text-primary-400 font-mono">15ms</td>
                  <td className="py-4 px-6 text-success font-mono">600 req/s</td>
                  <td className="py-4 px-6 text-slate-300">High-volume trading</td>
                </tr>
                <tr className="hover:bg-dark-300 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-100">Heston Model</td>
                  <td className="py-4 px-6 text-primary-400 font-mono">28ms</td>
                  <td className="py-4 px-6 text-success font-mono">400 req/s</td>
                  <td className="py-4 px-6 text-slate-300">Stochastic volatility</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
