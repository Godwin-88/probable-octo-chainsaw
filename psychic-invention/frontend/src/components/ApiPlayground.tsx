import { Button } from '@/components/Button';
import { API_CONFIG } from '@/config/api';

const endpoints = [
  { method: 'POST', path: API_CONFIG.ENDPOINTS.PRICE_CALL_BS, label: 'Black-Scholes call' },
  { method: 'POST', path: API_CONFIG.ENDPOINTS.PRICE_PUT_BS, label: 'Black-Scholes put' },
  { method: 'POST', path: API_CONFIG.ENDPOINTS.PRICE_CALL_FFT, label: 'FFT call surface' },
  { method: 'POST', path: API_CONFIG.ENDPOINTS.PRICE_PUT_FFT, label: 'FFT put surface' },
];

const bsSample = `curl -X POST ${API_CONFIG.BASE_URL}/price/call/bs \\
  -H "Content-Type: application/json" \\
  -d '{"s":100,"k":100,"tau":1,"r":0.05,"sigma":0.2}'`;

const fftSample = `curl -X POST ${API_CONFIG.BASE_URL}/price/call/fft \\
  -H "Content-Type: application/json" \\
  -d '{"s":100,"k_min":4.5,"delta_v":0.01,"delta_k":0.00015,"n":4096,"tau":1,"r":0.05,"sigma":0.2,"alpha":1.5}'`;

export const ApiPlayground = () => {
  return (
    <section className="section-padding bg-slate-950">
      <div className="container space-y-10">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">API Playground</p>
          <h1 className="text-4xl font-bold text-white">Direct access to the FastAPI surface</h1>
          <p className="text-slate-300 max-w-3xl">
            Use the same endpoints that power the UI. Every request flows through the PyO3 bindings into the
            Rust pricing core, so you can embed this engine in trading tools, notebooks, or automation scripts.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-2xl font-semibold text-white mb-4">REST endpoints</h2>
            <ul className="space-y-4">
              {endpoints.map((endpoint) => (
                <li key={endpoint.path} className="bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">{endpoint.method}</p>
                  <p className="font-mono text-primary-300">{endpoint.path}</p>
                  <p className="text-slate-300 text-sm">{endpoint.label}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3">
              <Button size="sm" onClick={() => window.open('Pricing_Engine_API.postman_collection.json', '_blank')}>
                Download Postman Collection
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/docs', '_blank')}>
                Open Swagger Docs
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="card">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Black-Scholes request</p>
              <pre className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 text-xs font-mono overflow-auto whitespace-pre-wrap">
                {bsSample}
              </pre>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">FFT request</p>
              <pre className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 text-xs font-mono overflow-auto whitespace-pre-wrap">
                {fftSample}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
