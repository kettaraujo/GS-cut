// ChipCut UI Kit — dashboard (dashboard/home.html + _painel.html)

function KpiCard({ k }) {
  return (
    <div className="col-6 col-xl-3">
      <div className="card shadow-sm kpi-card h-100"><div className="card-body d-flex align-items-center gap-3">
        <i className={`bi ${k.icon} kpi-icon ${k.color}`}></i>
        <div>
          <div className="kpi-value">{k.value}</div>
          <div className="text-muted small">{k.label}</div>
          {k.delta && (
            <div className={`small ${k.up ? "text-success" : "text-danger"}`}>
              <i className={`bi ${k.up ? "bi-arrow-up-right" : "bi-arrow-down-right"}`}></i> {k.delta}
            </div>
          )}
        </div>
      </div></div>
    </div>
  );
}

function Dashboard({ data, onOpenLote, onNav }) {
  const lineRef = React.useRef(null);
  const dougRef = React.useRef(null);
  const [preset, setPreset] = React.useState("semana");

  React.useEffect(() => {
    if (!window.Chart) return;
    const charts = [];
    if (lineRef.current) {
      const ex = Chart.getChart(lineRef.current); if (ex) ex.destroy();
      charts.push(new Chart(lineRef.current, {
        type: "line",
        data: { labels: data.SERIE.labels, datasets: [{ label: "Leituras", data: data.SERIE.valores, borderColor: "#0d6efd", backgroundColor: "rgba(13,110,253,.15)", fill: true, tension: 0.3, pointRadius: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
      }));
    }
    if (dougRef.current) {
      const ex2 = Chart.getChart(dougRef.current); if (ex2) ex2.destroy();
      charts.push(new Chart(dougRef.current, {
        type: "doughnut",
        data: { labels: data.DISTRIB.labels, datasets: [{ data: data.DISTRIB.valores, backgroundColor: data.DISTRIB.cores }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } },
      }));
    }
    return () => charts.forEach((c) => c.destroy());
  }, [data]);

  const ultimas = data.LOTES.flatMap((l) => l.chips.map((c) => ({ ...c, lote: l }))).slice(0, 8);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0"><i className="bi bi-speedometer2 text-primary"></i> Dashboard</h1>
        <button className="btn btn-primary" onClick={() => onNav("capture")}><i className="bi bi-plus-lg"></i> Novo lote</button>
      </div>

      <div className="card shadow-sm mb-4"><div className="card-body">
        <form className="row g-2 align-items-end" onSubmit={(e) => e.preventDefault()}>
          <div className="col-auto">
            <label className="form-label small text-muted mb-1">De</label>
            <input type="date" defaultValue="2026-05-28" className="form-control form-control-sm" />
          </div>
          <div className="col-auto">
            <label className="form-label small text-muted mb-1">Até</label>
            <input type="date" defaultValue="2026-06-03" className="form-control form-control-sm" />
          </div>
          <div className="col-auto">
            <button className="btn btn-sm btn-outline-primary"><i className="bi bi-funnel"></i> Filtrar</button>
          </div>
          <div className="col-auto ms-auto btn-group btn-group-sm" role="group">
            {[["hoje", "Hoje"], ["semana", "Últimos 7 dias"], ["mes", "Este mês"]].map(([k, lbl]) => (
              <button key={k} type="button" className={`btn btn-outline-secondary ${preset === k ? "active" : ""}`} onClick={() => setPreset(k)}>{lbl}</button>
            ))}
          </div>
        </form>
      </div></div>

      <div className="row g-3 mb-4">
        {data.KPIS.map((k, i) => <KpiCard key={i} k={k} />)}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8"><div className="card shadow-sm h-100"><div className="card-body">
          <h2 className="h6 text-muted mb-3">Leituras por dia</h2>
          <div style={{ height: 220 }}><canvas ref={lineRef}></canvas></div>
        </div></div></div>
        <div className="col-12 col-lg-4"><div className="card shadow-sm h-100"><div className="card-body">
          <h2 className="h6 text-muted mb-3">Distribuição de status</h2>
          <div style={{ height: 220 }}><canvas ref={dougRef}></canvas></div>
        </div></div></div>
      </div>

      <div className="card shadow-sm"><div className="card-body">
        <h2 className="h6 text-muted mb-3">Últimas leituras</h2>
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead><tr><th>ICCID</th><th>Lote</th><th>Tentativas</th><th>Status</th><th>Operador</th><th>Data/hora</th></tr></thead>
            <tbody>
              {ultimas.map((c, i) => (
                <tr key={i}>
                  <td><span className="iccid">{c.iccid || "(erro)"}</span></td>
                  <td><a href="#" className="text-decoration-none" onClick={(e) => { e.preventDefault(); onOpenLote(c.lote.id); }}>{c.lote.id}</a></td>
                  <td><window.CC.AttemptBadge tentativas={c.tentativas} /></td>
                  <td><window.CC.StatusBadge valor={c.revisao} tipo="revisao" /></td>
                  <td>{c.usuario}</td>
                  <td className="text-muted small">{c.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></div>
    </div>
  );
}

window.CC = Object.assign(window.CC || {}, { Dashboard });
