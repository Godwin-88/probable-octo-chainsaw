const jobs = [
  { name: 'FFT Chain Batch', status: 'Running', eta: '00:32', load: '62%' },
  { name: 'Risk Report', status: 'Queued', eta: '—', load: 'Pending' },
  { name: 'Calibration Sweep', status: 'Complete', eta: '06:12', load: 'Finished' },
];

const resources = [
  { label: 'CPU', value: '45%', tone: 'text-success' },
  { label: 'Memory', value: '63%', tone: 'text-warning' },
  { label: 'API Throughput', value: '850 req/h', tone: 'text-primary-300' },
];

export const ProcessingStage = () => {
  return (
    <section className="section-padding bg-slate-900">
      <div className="container space-y-10">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3 font-semibold">Operations centre</p>
            <h2 className="text-3xl font-bold text-white mb-3">Batch jobs, monitoring and automation</h2>
            <p className="text-slate-300 max-w-3xl">
              Production desks run scheduled FFT chains, deliver VaR packets and calibrate Greeks overnight.
              This view mirrors that future state to prove the frontend can support it.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <span className="status-dot bg-primary-500"></span>
            <span>Power users only</span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">Batch operations</p>
                <h3 className="text-xl font-semibold text-white">Job queue preview</h3>
              </div>
              <span className="tag-pill bg-slate-800 text-slate-300">Coming soon</span>
            </div>
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.name} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{job.name}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">{job.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-200">ETA {job.eta}</p>
                    <p className="text-xs text-slate-500">{job.load}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Fleet metrics</p>
              <div className="space-y-4">
                {resources.map(resource => (
                  <div key={resource.label} className="flex items-center justify-between">
                    <span className="text-slate-300">{resource.label}</span>
                    <span className={`text-lg font-mono ${resource.tone}`}>{resource.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Automation hooks</p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>• Schedule FFT recalculations on expiry roll</li>
                <li>• Stream VaR deltas to Slack or Bloomberg IB</li>
                <li>• Export results via S3, Kafka or webhook</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
