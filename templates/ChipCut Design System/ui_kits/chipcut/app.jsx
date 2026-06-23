// ChipCut UI Kit — app root (state machine + routing)

function App() {
  const [data, setData] = React.useState(() => JSON.parse(JSON.stringify(window.CC_DATA)));
  const [user, setUser] = React.useState(null);
  const [screen, setScreen] = React.useState("dashboard");
  const [loteId, setLoteId] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [zoom, setZoom] = React.useState(null);

  const lote = data.LOTES.find((l) => l.id === loteId) || data.LOTES[0];

  function nav(key) {
    setMobileOpen(false);
    if (key === "capture") { setLoteId(data.LOTES[0].id); setScreen("capture"); return; }
    setScreen(key);
  }
  function openLote(id) { setLoteId(id); setScreen("review"); setMobileOpen(false); }

  function mutateLote(id, fn) {
    setData((d) => {
      const nd = JSON.parse(JSON.stringify(d));
      const l = nd.LOTES.find((x) => x.id === id);
      if (l) fn(l, nd);
      return nd;
    });
  }

  const handlers = {
    onCorrigir: (seq, val) => mutateLote(lote.id, (l) => { const c = l.chips.find((x) => x.seq === seq); if (c) { c.iccid = val; c.corrigido = true; } }),
    onRemover: (seq) => mutateLote(lote.id, (l) => { l.chips = l.chips.filter((x) => x.seq !== seq); }),
    onAprovar: () => { mutateLote(lote.id, (l) => { l.status = "aprovado"; l.aprovado_por = "supervisor"; l.chips.forEach((c) => { if (c.revisao === "aguardando_aprovacao") c.revisao = "aprovado"; }); }); setScreen("review"); },
    onCancelar: () => { mutateLote(lote.id, (l) => { l.status = "cancelado"; }); setScreen("lotes"); },
    onAddChip: (id, chip) => mutateLote(id, (l) => { l.chips.push({ ...chip, revisao: chip.leitura === "erro" ? "rejeitado" : "aguardando_aprovacao", corrigido: false, usuario: user, data: "03/06/2026 09:20" }); if (l.status === "aberto") l.status = "aberto"; }),
  };

  if (!user) return <window.CC.LoginScreen onLogin={(u) => { setUser(u); setScreen("dashboard"); }} />;

  let content;
  if (screen === "dashboard") content = <window.CC.Dashboard data={data} onOpenLote={openLote} onNav={nav} />;
  else if (screen === "lotes") content = <window.CC.LotesList data={data} onOpenLote={openLote} onNav={nav} />;
  else if (screen === "review") content = <window.CC.LoteReview lote={lote} onBack={() => setScreen("lotes")} onCapture={() => setScreen("capture")} onAprovar={handlers.onAprovar} onCancelar={handlers.onCancelar} onCorrigir={handlers.onCorrigir} onRemover={handlers.onRemover} onZoom={setZoom} />;
  else if (screen === "capture") content = <window.CC.CaptureScreen data={data} lote={lote} onBack={() => openLote(lote.id)} onAddChip={handlers.onAddChip} />;
  else if (screen === "logs") content = <LogsPlaceholder />;

  return (
    <div className="cc-shell">
      <window.CC.Sidebar active={screen === "review" || screen === "capture" ? "lotes" : screen} onNav={nav} user={user} onLogout={() => { setUser(null); }} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="cc-content">
        <window.CC.MobileTopbar onMenu={() => setMobileOpen(true)} onNav={nav} />
        <main className="container-fluid p-3 p-lg-4">{content}</main>
      </div>

      {zoom && (
        <div className="cc-modal" onClick={() => setZoom(null)}>
          <img src={zoom} alt="chip" />
        </div>
      )}
    </div>
  );
}

function LogsPlaceholder() {
  return (
    <div>
      <h1 className="h3 mb-4"><i className="bi bi-clipboard-data text-primary"></i> Logs de auditoria</h1>
      <div className="card shadow-sm"><div className="card-body text-center py-5 text-muted">
        <i className="bi bi-clipboard-data fs-1"></i>
        <p class="mt-2 mb-1">Trilha de auditoria de todas as operações.</p>
        <p className="small mb-0">Tela não incluída neste kit — disponível no produto (app <code>audit</code>).</p>
      </div></div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
