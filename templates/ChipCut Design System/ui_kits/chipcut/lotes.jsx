// ChipCut UI Kit — lotes list (lotes/lote_list.html + _secao_tabela.html)

function LotesList({ data, onOpenLote, onNav }) {
  const secoes = window.CC.LOTE_SECOES
    .map((s) => ({ ...s, lotes: data.LOTES.filter((l) => s.match.includes(l.status)) }))
    .filter((s) => s.lotes.length > 0);

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0"><i className="bi bi-collection text-primary"></i> Lotes</h1>
        <button className="btn btn-primary" onClick={() => onNav("capture")}><i className="bi bi-plus-lg"></i> Novo lote</button>
      </div>

      {secoes.map((s) => (
        <div className="card shadow-sm mb-4" key={s.id}>
          <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h2 className="h6 mb-0">{s.titulo} <span className="badge text-bg-secondary ms-1">{s.lotes.length}</span></h2>
            <div className="d-flex align-items-center gap-1">
              <input type="date" className="form-control form-control-sm" style={{ width: 140 }} />
              <span className="text-muted small">—</span>
              <input type="date" className="form-control form-control-sm" style={{ width: 140 }} />
              <button className="btn btn-sm btn-outline-secondary"><i className="bi bi-funnel"></i></button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead><tr><th>Lote</th><th>Status</th><th className="text-center">Chips</th><th>Operador</th><th>Criado em</th><th></th></tr></thead>
                <tbody>
                  {s.lotes.map((l) => (
                    <tr key={l.id} className="cursor-pointer" onClick={() => onOpenLote(l.id)}>
                      <td>
                        <div className="fw-semibold">{l.id}</div>
                        <div className="text-muted small">{l.nome}</div>
                      </td>
                      <td><window.CC.StatusBadge valor={l.status} tipo="lote" /></td>
                      <td className="text-center">{l.chips.length}</td>
                      <td>{l.usuario}</td>
                      <td className="text-muted small">{l.data_criacao}</td>
                      <td className="text-end"><i className="bi bi-chevron-right text-muted"></i></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.CC = Object.assign(window.CC || {}, { LotesList });
