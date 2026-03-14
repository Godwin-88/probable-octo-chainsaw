import type { OptionRequest, Greeks } from '@/types';

const SQRT_TWO = Math.sqrt(2);
const INV_SQRT_2PI = 1 / Math.sqrt(2 * Math.PI);

const erf = (x: number): number => {
  // Abramowitz and Stegun approximation
  const sign = Math.sign(x) || 1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const poly =
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t;
  const approx = 1 - poly * Math.exp(-absX * absX);
  return sign * approx;
};

const normCDF = (x: number): number => (1 + erf(x / SQRT_TWO)) / 2;
const normPDF = (x: number): number => INV_SQRT_2PI * Math.exp(-0.5 * x * x);

export const computeCallGreeks = (request: OptionRequest): Greeks => {
  const { s, k, tau, r, sigma } = request;
  if (tau <= 0 || sigma <= 0 || s <= 0 || k <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const sqrtTau = Math.sqrt(tau);
  const d1 = (Math.log(s / k) + (r + 0.5 * sigma * sigma) * tau) / (sigma * sqrtTau);
  const d2 = d1 - sigma * sqrtTau;
  const pdfD1 = normPDF(d1);

  const delta = normCDF(d1);
  const gamma = pdfD1 / (s * sigma * sqrtTau);
  const theta = (-s * pdfD1 * sigma) / (2 * sqrtTau) - r * k * Math.exp(-r * tau) * normCDF(d2);
  const vega = s * pdfD1 * sqrtTau;
  const rho = k * tau * Math.exp(-r * tau) * normCDF(d2);

  return { delta, gamma, theta, vega, rho };
};

export const computePutGreeks = (request: OptionRequest): Greeks => {
  const { s, k, tau, r, sigma } = request;
  if (tau <= 0 || sigma <= 0 || s <= 0 || k <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }
  const sqrtTau = Math.sqrt(tau);
  const d1 = (Math.log(s / k) + (r + 0.5 * sigma * sigma) * tau) / (sigma * sqrtTau);
  const d2 = d1 - sigma * sqrtTau;
  const pdfD1 = normPDF(d1);
  const delta = normCDF(d1) - 1;
  const gamma = pdfD1 / (s * sigma * sqrtTau);
  const theta = (-s * pdfD1 * sigma) / (2 * sqrtTau) + r * k * Math.exp(-r * tau) * normCDF(-d2);
  const vega = s * pdfD1 * sqrtTau;
  const rho = -k * tau * Math.exp(-r * tau) * normCDF(-d2);
  return { delta, gamma, theta, vega, rho };
};
