// ChipCut UI Kit — capture (chips/capture.html)
// Camera capture is faked: "take photo" loads a sample chip; "Ler ICCID"
// simulates the 2-step AI validation flow described in the PRD.

function CaptureScreen({ data, lote, onBack, onAddChip }) {
  const [preview, setPreview] = React.useState(null);
  const [reading, setReading] = React.useState(false);
  const [reads, setReads] = React.useState([]);
  const [toast, setToast] = React.useState(null);

  function takePhoto() {
    const img = data.CHIP_IMGS[Math.floor(Math.random() * data.CHIP_IMGS.length)];
    setPreview(img);
  }

  function lerICCID() {
    if (!preview || reading) return;
    setReading(true);
    setTimeout(() => {
      // ~80% succeed on 1st try, ~15% on 2nd, ~5% error (per PRD targets)
      const r = Math.random();
      const seq = reads.length + 1;
      let result;
      if (r < 0.8) {
        result = { seq, iccid: data.iccid(102000000000 + Math.floor(Math.random() * 9e8)), tentativas: 1, leitura: "sucesso", img: preview };
        setToast({ cor: "success", msg: "ICCID lido com sucesso." });
      } else if (r < 0.95) {
        result = { seq, iccid: data.iccid(102000000000 + Math.floor(Math.random() * 9e8)), tentativas: 2, leitura: "sucesso", img: preview };
        setToast({ cor: "warning", msg: "Validado na 2ª tentativa." });
      } else {
        result = { seq, iccid: "", tentativas: 2, leitura: "erro", img: preview };
        setToast({ cor: "danger", msg: "Falha nas 2 tentativas — reposicione o chip." });
      }
      setReads((prev) => [result, ...prev]);
      onAddChip && onAddChip(lote.id, result);
      setReading(false);
      setPreview(null);
      setTimeout(() => setToast(null), 2600);
    }, 1100);
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <a href="#" className="text-decoration-none small" onClick={(e) => { e.preventDefault(); onBack(); }}>&larr; Revisão do lote</a>
          <h1 className="h4 mb-0">{lote.id}</h1>
          <div className="text-muted small">{lote.nome}</div>
        </div>
        <span className="badge text-bg-primary fs-6">{lote.chips.length + reads.length} lido(s)</span>
      </div>

      {toast && (
        <div className={`alert alert-${toast.cor} d-flex align-items-center gap-2 py-2`}>
          <i className={`bi ${toast.cor === "success" ? "bi-check-circle" : toast.cor === "warning" ? "bi-exclamation-circle" : "bi-x-circle"}`}></i>
          {toast.msg}
        </div>
      )}

      <div className="card shadow-sm mb-3"><div className="card-body text-center">
        {preview
          ? <img className="capture-preview mb-3" src={preview} alt="prévia" />
          : <div className="capture-preview mb-3 d-flex align-items-center justify-content-center text-muted">Toque em "Tirar foto do chip"</div>}

        <div className="d-grid gap-2">
          <button className="btn btn-success btn-capture" onClick={takePhoto} disabled={reading}>📷 Tirar foto do chip</button>
          <button className="btn btn-primary btn-capture" onClick={lerICCID} disabled={!preview || reading}>
            {reading ? <><span className="spinner-border spinner-border-sm me-2"></span> Lendo…</> : "Ler ICCID"}
          </button>
        </div>
      </div></div>

      <div className="d-grid mb-4">
        <button className="btn btn-outline-secondary" onClick={onBack}>Concluir e revisar lote</button>
      </div>

      {reads.length > 0 && <>
        <h2 className="h6 text-muted">Últimas leituras</h2>
        <ul className="list-group">
          {reads.map((c) => (
            <li key={c.seq} className="list-group-item d-flex justify-content-between align-items-center">
              <span className="iccid">#{c.seq} — {c.iccid || "(erro)"}</span>
              {c.leitura === "sucesso"
                ? <span className="badge text-bg-success">ok</span>
                : <span className="badge text-bg-danger">erro</span>}
            </li>
          ))}
        </ul>
      </>}
    </div>
  );
}

window.CC = Object.assign(window.CC || {}, { CaptureScreen });
