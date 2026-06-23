// ChipCut UI Kit — lote review (lotes/lote_review.html + _chip_tabela.html)

function ChipTable({ lote, chips, editavel, onCorrigir, onRemover, onZoom }) {
  if (!chips.length) {
    return (
      <div className="text-center py-4 text-muted">
        <i className="bi bi-inbox fs-3"></i>
        <p className="mt-2 mb-0">Nenhum chip nesta seção.</p>
      </div>
    );
  }
  return (
    <div className="table-responsive">
      <table className="table table-hover table-sm align-middle mb-0">
        <thead><tr>
          <th>#</th><th>Imagem</th><th>ICCID</th><th className="text-center">Tentativas</th>
          <th>Leitura</th><th>Revisão</th><th>Operador</th><th>Data leitura</th><th></th>
        </tr></thead>
        <tbody>
          {chips.map((c) => (
            <tr key={c.seq}>
              <td>{c.seq}</td>
              <td><img src={c.img} className="chip-thumb cursor-pointer" alt="chip" style={{ width: 40, height: 40 }} onClick={() => onZoom(c.img)} /></td>
              <td>
                {editavel ? (
                  <form className="d-flex gap-1" onSubmit={(e) => { e.preventDefault(); }}>
                    <input type="text" defaultValue={c.iccid} className="form-control form-control-sm iccid" style={{ maxWidth: 210 }} onBlur={(e) => onCorrigir(c.seq, e.target.value)} />
                    <button type="submit" className="btn btn-sm btn-outline-secondary" title="Salvar"><i className="bi bi-check-lg"></i></button>
                  </form>
                ) : (
                  <span className="iccid">{c.iccid || "—"}</span>
                )}
              </td>
              <td className="text-center">
                <window.CC.AttemptBadge tentativas={c.tentativas} />
                {c.corrigido && <span className="badge text-bg-info ms-1">corrigido</span>}
              </td>
              <td><window.CC.StatusBadge valor={c.leitura} tipo="leitura" /></td>
              <td><window.CC.StatusBadge valor={c.revisao} tipo="revisao" /></td>
              <td>{c.usuario}</td>
              <td className="text-muted small">{c.data}</td>
              <td className="text-end">
                {editavel && (
                  <button className="btn btn-sm btn-outline-danger" title="Remover" onClick={() => onRemover(c.seq)}><i className="bi bi-trash"></i></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoteReview({ lote, onBack, onCapture, onAprovar, onCancelar, onCorrigir, onRemover, onZoom }) {
  const editavel = lote.status === "aberto" || lote.status === "em_revisao";
  const secoes = [
    { titulo: "Aguardando aprovação", chips: lote.chips.filter((c) => c.revisao === "aguardando_aprovacao") },
    { titulo: "Aprovados", chips: lote.chips.filter((c) => c.revisao === "aprovado") },
    { titulo: "Rejeitados", chips: lote.chips.filter((c) => c.revisao === "rejeitado") },
  ].filter((s) => s.chips.length > 0);

  return (
    <div>
      <a href="#" className="text-decoration-none small" onClick={(e) => { e.preventDefault(); onBack(); }}><i className="bi bi-arrow-left"></i> Lotes</a>

      <div className="card shadow-sm my-3"><div className="card-body d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h1 className="h4 mb-1">{lote.id} <span className="text-muted fw-normal fs-6">· {lote.nome}</span></h1>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <window.CC.StatusBadge valor={lote.status} tipo="lote" />
            <span className="text-muted small">{lote.chips.length} chip(s)</span>
          </div>
          <div className="text-muted small mt-2">
            <i className="bi bi-person"></i> Criado por {lote.usuario}
            {" · "}<i className="bi bi-calendar3"></i> {lote.data_criacao}
            {lote.aprovado_por && <> · <i className="bi bi-check-circle"></i> Aprovado por {lote.aprovado_por}</>}
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {editavel && <>
            <button className="btn btn-success" onClick={onCapture}><i className="bi bi-camera"></i> Ler chip</button>
            <button className="btn btn-primary" disabled={!lote.chips.length} onClick={onAprovar}><i className="bi bi-check2-circle"></i> Aprovar lote</button>
            <button className="btn btn-outline-danger" onClick={onCancelar}><i className="bi bi-x-circle"></i> Cancelar</button>
          </>}
          {!!lote.chips.length && (
            <button className="btn btn-outline-success"><i className="bi bi-file-earmark-excel"></i> Exportar Excel</button>
          )}
        </div>
      </div></div>

      {secoes.length === 0 && (
        <div className="card shadow-sm"><div className="card-body text-center py-5 text-muted">
          <i className="bi bi-inbox fs-1"></i><p className="mt-2 mb-0">Nenhum chip neste lote ainda.</p>
        </div></div>
      )}

      {secoes.map((s, i) => (
        <div className="card shadow-sm mb-4" key={i}>
          <div className="card-header bg-white"><h2 className="h6 mb-0">{s.titulo} <span className="badge text-bg-secondary ms-1">{s.chips.length}</span></h2></div>
          <div className="card-body">
            <ChipTable lote={lote} chips={s.chips} editavel={editavel} onCorrigir={onCorrigir} onRemover={onRemover} onZoom={onZoom} />
          </div>
        </div>
      ))}
    </div>
  );
}

window.CC = Object.assign(window.CC || {}, { LoteReview });
