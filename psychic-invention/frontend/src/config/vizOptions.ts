/**
 * Visualization options from viz.md — Top 20 for financial applications.
 */

export interface VizOption {
  id: string;
  label: string;
  description: string;
  useCase: string;
  category: string;
}

export const VIZ_CATEGORIES = [
  { id: 'time-series', label: 'Time Series & Price Data' },
  { id: 'portfolio', label: 'Portfolio & Asset Allocation' },
  { id: 'performance', label: 'Performance & Comparison' },
  { id: 'risk', label: 'Risk & Statistical Analysis' },
  { id: 'correlation', label: 'Correlation & Relationships' },
  { id: 'advanced', label: 'Advanced Financial' },
] as const;

export const VIZ_OPTIONS: VizOption[] = [
  { id: 'candlestick', label: 'Candlestick Charts', description: 'OHLC price movements', useCase: 'Stock prices, trading patterns', category: 'time-series' },
  { id: 'line', label: 'Line Charts', description: 'Trends over time', useCase: 'Portfolio value, index performance', category: 'time-series' },
  { id: 'area', label: 'Area Charts', description: 'Cumulative magnitude', useCase: 'Cumulative returns, volume', category: 'time-series' },
  { id: 'ohlc-bars', label: 'OHLC Bars', description: 'Price bar representation', useCase: 'Alternative to candlesticks', category: 'time-series' },
  { id: 'treemap', label: 'Treemaps', description: 'Hierarchical proportions', useCase: 'Allocation by sector/asset class', category: 'portfolio' },
  { id: 'pie', label: 'Pie / Donut Charts', description: 'Part-to-whole', useCase: 'Asset allocation, expense breakdown', category: 'portfolio' },
  { id: 'sunburst', label: 'Sunburst Charts', description: 'Multi-level hierarchy', useCase: 'Sector to industry to stock', category: 'portfolio' },
  { id: 'bar', label: 'Bar Charts', description: 'Discrete comparison', useCase: 'Returns across assets, KPIs', category: 'performance' },
  { id: 'grouped-bar', label: 'Grouped/Stacked Bars', description: 'Multi-dimension comparison', useCase: 'Revenue by product/region', category: 'performance' },
  { id: 'waterfall', label: 'Waterfall Charts', description: 'Sequential variance', useCase: 'Income, cash flow analysis', category: 'performance' },
  { id: 'bullet', label: 'Bullet Charts', description: 'KPI vs targets', useCase: 'Performance metrics', category: 'performance' },
  { id: 'histogram', label: 'Histograms', description: 'Return distribution', useCase: 'Risk analysis, frequency', category: 'risk' },
  { id: 'box-plot', label: 'Box Plots', description: 'Quartiles and outliers', useCase: 'Volatility, outlier detection', category: 'risk' },
  { id: 'scatter', label: 'Scatter Plots', description: 'Two-variable relationship', useCase: 'Risk vs return, correlation', category: 'risk' },
  { id: 'bubble', label: 'Bubble Charts', description: 'Three dimensions', useCase: 'Risk, return, market cap', category: 'risk' },
  { id: 'heatmap', label: 'Heatmaps', description: 'Pattern recognition', useCase: 'Correlation matrices, sector performance', category: 'correlation' },
  { id: 'correlation-matrix', label: 'Correlation Matrices', description: 'Asset correlation', useCase: 'Diversification analysis', category: 'correlation' },
  { id: 'sankey', label: 'Sankey Diagrams', description: 'Flow magnitude and direction', useCase: 'Cash flow, fund flows', category: 'advanced' },
  { id: 'radar', label: 'Radar/Spider Charts', description: 'Multi-factor analysis', useCase: 'ESG, risk metrics', category: 'advanced' },
  { id: 'gantt', label: 'Gantt Charts', description: 'Schedule and duration', useCase: 'Investment timelines, bond maturity', category: 'advanced' },
];

export const getVizByCategory = (category: string) =>
  VIZ_OPTIONS.filter((v) => v.category === category);
