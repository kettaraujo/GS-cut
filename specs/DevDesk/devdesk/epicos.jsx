/* DevDesk — Épicos (RF-06: criar, editar, desativar — status derivado das tasks) */
const { useState: useStateE } = React;

const EPICO_CORES = ['#5BB8A8', '#C58BE8', '#7A9BF0', '#E8B84B', '#E89A6B', '#88C56B', '#F0635C'];

function TelaEpicos({ epics, tasks, papel, onOpen, onCriarEpico }) {
  const ehTL = papel === 'techlead';
  const [modalNovo, setModalNovo] = useStateE(false);
  const [nNome, setNNome] = useStateE('');
  const [nDesc, setNDesc] = useStateE('');
  const [nCor, setNCor] = useStateE(EPICO_CORES[0]);
  const [expandido, setExpandido] = useStateE(null);
  const velocity = window.DD_METRICS.velocityMedia3;

  return (
    <div className="dd-main">
      <Topbar titulo="Épicos" sub={`${epics.length} épicos · status derivado das tasks vinculadas (RF-06)`}>
        {ehTL ? <button className="dd-btn primary sm" onClick={() => setModalNovo(true)}><Ic d={ICONS.plus} size={12}></Ic>Novo épico</button> : null}
      </Topbar>
      <div className="dd-scroll">
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1100 }}>
          {epics.map((e) => {
            const doEpico = tasks.filter((t) => t.epicId === e.id && t.estado !== 'CANCELADO');
            const concluidas = doEpico.filter((t) => t.estado === 'CONCLUIDO');
            const emSprint = doEpico.filter((t) => t.sprint && t.estado !== 'CONCLUIDO' && t.estado !== 'BACKLOG');
            const noBacklog = doEpico.filter((t) => t.estado === 'BACKLOG');
            const rest = e.totalPts - e.donePts;
            const pct = e.totalPts ? Math.round((e.donePts / e.totalPts) * 100) : 0;
            const aberto = expandido === e.id;
            return (
              <div key={e.id} className="dd-panel">
                <div className="ep-linha" onClick={() => setExpandido(aberto ? null : e.id)}>
                  <span className="ep-cor" style={{ background: e.cor }}></span>
                  <div className="ep-info">
                    <div className="ep-nome">{e.nome}</div>
                    {e.descricao ? <div className="ep-desc">{e.descricao}</div> : null}
                  </div>
                  <div className="ep-stats">
                    <div className="ep-stat"><span className="mono">{concluidas.length}/{doEpico.length}</span><small>tasks</small></div>
                    <div className="ep-stat"><span className="mono">{e.donePts}/{e.totalPts}</span><small>pts</small></div>
                    <div className="ep-stat">
                      <span className="mono" style={{ color: rest === 0 && e.totalPts > 0 ? 'var(--green)' : 'var(--gold)' }}>
                        {e.totalPts === 0 ? '—' : rest === 0 ? '✓' : `~${(Math.ceil(rest / velocity * 10) / 10).toFixed(1).replace('.', ',')} sp`}
                      </span>
                      <small>{e.totalPts === 0 ? 'sem pts ainda' : rest === 0 ? 'concluído' : 'projeção'}</small>
                    </div>
                  </div>
                  <div className="ep-prog">
                    <Progress pct={pct} cor={e.cor}></Progress>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{pct}%</span>
                  </div>
                  <span className="ep-caret" style={{ transform: aberto ? 'rotate(90deg)' : 'none' }}><Ic d={ICONS.arrowR} size={13}></Ic></span>
                </div>
                {aberto ? (
                  <div className="ep-detalhe">
                    {[['Em sprint', emSprint], ['No backlog', noBacklog], ['Concluídas', concluidas]].map(([rot, lista]) => (
                      <div key={rot} className="ep-grupo">
                        <div className="ep-grupo-titulo">{rot} · {lista.length}</div>
                        {lista.length === 0 ? <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>—</div> : lista.map((t) => (
                          <button key={t.codigo} className="ep-task" onClick={() => onOpen(t.codigo)}>
                            <span className="dd-code">{t.codigo}</span>
                            <span className="ep-task-titulo">{t.titulo}</span>
                            <StateBadge estado={t.bloqueio ? 'BLOQUEADO' : t.estado}></StateBadge>
                            <Pts v={t.pontos} locked={!!t.sprint}></Pts>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="pl-regra" style={{ border: 0, padding: '0 4px' }}>
            Projeção = pontos restantes ÷ velocity média das últimas 3 sprints ({velocity} pts) — RF-33 · desativar um épico preserva o histórico (RN-13)
          </div>
        </div>
      </div>

      {modalNovo ? (
        <Modal titulo="Novo épico" width={520}
          sub="Épico agrupa tasks de um projeto. O status de andamento é derivado das tasks vinculadas — nada é digitado à mão."
          onClose={() => setModalNovo(false)}>
          <label className="dd-field-label">Nome</label>
          <input className="dd-input" autoFocus value={nNome} onChange={(e) => setNNome(e.target.value)} placeholder="Ex.: Portal do Parceiro"></input>
          <label className="dd-field-label" style={{ marginTop: 12 }}>Descrição</label>
          <textarea className="dd-textarea" style={{ minHeight: 60 }} value={nDesc} onChange={(e) => setNDesc(e.target.value)}
            placeholder="Objetivo do projeto em uma ou duas frases…"></textarea>
          <label className="dd-field-label" style={{ marginTop: 12 }}>Cor de identificação</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {EPICO_CORES.map((c) => (
              <button key={c} className={`ep-swatch${nCor === c ? ' on' : ''}`} style={{ background: c }} onClick={() => setNCor(c)} title={c}></button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <button className="dd-btn sm" onClick={() => setModalNovo(false)}>Cancelar</button>
            <button className="dd-btn sm primary" disabled={!nNome.trim()}
              onClick={() => { onCriarEpico(nNome.trim(), nDesc.trim(), nCor); setNNome(''); setNDesc(''); setNCor(EPICO_CORES[0]); setModalNovo(false); }}>
              <Ic d={ICONS.plus} size={12}></Ic>Criar épico
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

Object.assign(window, { TelaEpicos });
