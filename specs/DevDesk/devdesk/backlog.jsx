/* DevDesk — Backlog (triagem) e Planning (montagem da sprint) */
const { useState: useStateB } = React;

/* ============ BACKLOG ============ */
function TelaBacklog({ tasks, papel, onOpen, onAprovar, onRecusar, onCriar }) {
  const [filtro, setFiltro] = useStateB('todas');
  const [busca, setBusca] = useStateB('');
  const [modalNova, setModalNova] = useStateB(false);
  const [nTitulo, setNTitulo] = useStateB('');
  const [nDesc, setNDesc] = useStateB('');
  const [nEpico, setNEpico] = useStateB('');
  const ehTL = papel === 'techlead';

  let lista = tasks.filter((t) => t.estado === 'BACKLOG' || t.estado === 'CANCELADO');
  const pend = lista.filter((t) => t.triagem === 'PENDENTE_APROVACAO' && t.estado === 'BACKLOG');
  const aprov = lista.filter((t) => t.triagem === 'APROVADA' && t.estado === 'BACKLOG');
  const canc = lista.filter((t) => t.estado === 'CANCELADO');
  if (filtro === 'pendentes') lista = pend;
  else if (filtro === 'aprovadas') lista = aprov;
  else if (filtro === 'canceladas') lista = canc;
  else lista = [...pend, ...aprov, ...canc];
  if (busca) lista = lista.filter((t) => (t.titulo + t.codigo).toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="dd-main">
      <Topbar titulo="Backlog" sub={`${pend.length} aguardando triagem · ${aprov.length} aprovadas e elegíveis a sprint`}>
        <button className="dd-btn primary sm" onClick={() => setModalNova(true)}><Ic d={ICONS.plus} size={12}></Ic>Nova task</button>
      </Topbar>
      <div className="bd-filtros">
        <div className="dd-seg">
          {[['todas', `Todas · ${pend.length + aprov.length + canc.length}`], ['pendentes', `Triagem · ${pend.length}`], ['aprovadas', `Aprovadas · ${aprov.length}`], ['canceladas', `Canceladas · ${canc.length}`]].map(([id, rot]) => (
            <button key={id} className={filtro === id ? 'on' : ''} onClick={() => setFiltro(id)}>{rot}</button>
          ))}
        </div>
        <div className="bd-busca">
          <Ic d={ICONS.search} size={13}></Ic>
          <input className="dd-input" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)}></input>
        </div>
      </div>
      <div className="dd-scroll">
        <div className="dd-panel" style={{ margin: '0 22px 22px' }}>
          <table className="dd-table">
            <thead>
              <tr>
                <th>Código</th><th>Task</th><th>Épico</th><th>Triagem</th><th>Prio</th><th>Pts</th><th>Criada por</th><th>Há</th>
                {ehTL ? <th style={{ textAlign: 'right' }}>Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {lista.map((t) => (
                <tr key={t.codigo} onClick={() => onOpen(t.codigo)}>
                  <td className="dd-code">{t.codigo}</td>
                  <td style={{ maxWidth: 340, fontWeight: 600 }}>
                    {t.titulo}
                    {t.cancelamento ? <div style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Motivo: {t.cancelamento.motivo}</div> : null}
                  </td>
                  <td><EpicChip epicId={t.epicId}></EpicChip></td>
                  <td>
                    {t.estado === 'CANCELADO'
                      ? <StateBadge estado="CANCELADO"></StateBadge>
                      : t.triagem === 'PENDENTE_APROVACAO'
                        ? <span className="bl-triagem pend">Pendente aprovação</span>
                        : <span className="bl-triagem ok">Aprovada</span>}
                  </td>
                  <td><Prio p={t.prioridade}></Prio></td>
                  <td><Pts v={t.pontos}></Pts></td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Avatar userId={t.criadoPor} size="sm"></Avatar><span style={{ fontSize: 12 }}>{ddUser(t.criadoPor).nome.split(' ')[0]}</span></span></td>
                  <td className="mono" style={{ color: 'var(--text-dim)' }}>{t.diasNoEstado}d</td>
                  {ehTL ? (
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {t.estado === 'BACKLOG' && t.triagem === 'PENDENTE_APROVACAO' ? (
                        <span style={{ display: 'inline-flex', gap: 6 }}>
                          <button className="dd-btn sm primary" onClick={() => onAprovar(t.codigo)}><Ic d={ICONS.check} size={11}></Ic>Aprovar</button>
                          <button className="dd-btn sm danger" onClick={() => onRecusar(t.codigo)}>Recusar</button>
                        </span>
                      ) : t.estado === 'BACKLOG' ? (
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Elegível a sprint</span>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
              {lista.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 28 }}>Nada por aqui.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalNova ? (
        <Modal titulo="Nova task no Backlog" width={560}
          sub={papel === 'dev' ? 'Sua task nasce como Pendente Aprovação — o TechLead faz a triagem (RN-08).' : 'Task criada por você já nasce aprovada.'}
          onClose={() => setModalNova(false)}>
          <label className="dd-field-label">Título</label>
          <input className="dd-input" autoFocus value={nTitulo} onChange={(e) => setNTitulo(e.target.value)} placeholder="Ex.: Voucher: busca por CPF mascarado"></input>
          <label className="dd-field-label" style={{ marginTop: 12 }}>Descrição (Markdown · mini-PRD)</label>
          <textarea className="dd-textarea" style={{ minHeight: 110, fontFamily: 'var(--font-mono)', fontSize: 11.5 }} value={nDesc} onChange={(e) => setNDesc(e.target.value)}
            placeholder={'## Contexto\nO que motivou a demanda…\n\n## Escopo\n- item 1\n- item 2'}></textarea>
          <label className="dd-field-label" style={{ marginTop: 12 }}>Épico (opcional)</label>
          <select className="dd-select" value={nEpico} onChange={(e) => setNEpico(e.target.value)}>
            <option value="">Sem épico</option>
            {window.DD_EPICS.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button className="dd-btn sm" onClick={() => setModalNova(false)}>Cancelar</button>
            <button className="dd-btn sm primary" disabled={!nTitulo.trim()}
              onClick={() => { onCriar(nTitulo, nDesc, nEpico || null); setNTitulo(''); setNDesc(''); setNEpico(''); setModalNova(false); }}>
              <Ic d={ICONS.plus} size={12}></Ic>Criar task
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

/* ============ PLANNING ============ */
function TelaPlanning({ tasks, papel, onOpen, onAlocar, onRemover, onDefinir }) {
  const ehTL = papel === 'techlead';
  const s13 = window.DD_SPRINTS.find((s) => s.estado === 'PLANEJADA');
  const elegiveis = tasks.filter((t) => t.estado === 'BACKLOG' && t.triagem === 'APROVADA');
  const alocadas = tasks.filter((t) => t.sprint === s13.id);
  const ptsAlocados = alocadas.reduce((a, t) => a + (t.pontos || 0), 0);
  const capacidade = window.DD_METRICS.velocityMedia3;
  const pctCap = Math.min(100, Math.round((ptsAlocados / capacidade) * 100));

  return (
    <div className="dd-main">
      <Topbar titulo={`Planning · Sprint ${s13.num}`} sub={`${ddFmtData(s13.inicio)} → ${ddFmtData(s13.fim)} · inicia automaticamente na segunda-feira (RF-13)`}></Topbar>
      {!ehTL ? (
        <div className="pl-aviso">
          <Ic d={ICONS.lock} size={12}></Ic>
          Somente o TechLead monta a sprint. Você pode acompanhar a alocação abaixo.
        </div>
      ) : null}
      <div className="dd-scroll">
        <div className="pl-grid">
          {/* coluna esquerda: backlog aprovado */}
          <div className="dd-panel">
            <div className="dd-panel-head">
              <h2>Backlog aprovado</h2>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto' }}>{elegiveis.length} elegíveis</span>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {elegiveis.map((t) => {
                const pronta = t.pontos != null && t.resp != null;
                return (
                  <div key={t.codigo} className="pl-item" onClick={() => onOpen(t.codigo)}>
                    <div className="pl-item-l1">
                      <span className="dd-code">{t.codigo}</span>
                      <Prio p={t.prioridade}></Prio>
                      <span style={{ flex: 1 }}></span>
                      <EpicChip epicId={t.epicId}></EpicChip>
                    </div>
                    <div className="pl-item-titulo">{t.titulo}</div>
                    <div className="pl-item-l2" onClick={(e) => e.stopPropagation()}>
                      <select className="dd-select" style={{ width: 76 }} disabled={!ehTL}
                        value={t.pontos ?? ''} onChange={(e) => onDefinir(t.codigo, 'pontos', e.target.value ? Number(e.target.value) : null)}>
                        <option value="">pts</option>
                        {[1, 2, 3, 5, 8].map((p) => <option key={p} value={p}>{p} pts</option>)}
                      </select>
                      <select className="dd-select" style={{ flex: 1 }} disabled={!ehTL}
                        value={t.resp ?? ''} onChange={(e) => onDefinir(t.codigo, 'resp', e.target.value || null)}>
                        <option value="">responsável</option>
                        {window.DD_USERS.filter((u) => u.papel === 'dev').map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                      </select>
                      <button className="dd-btn sm primary" disabled={!ehTL || !pronta}
                        title={pronta ? `Alocar na Sprint ${s13.num}` : 'Exige pontuação e responsável (RN-03)'}
                        onClick={() => onAlocar(t.codigo, s13.id)}>
                        Alocar<Ic d={ICONS.arrowR} size={11}></Ic>
                      </button>
                    </div>
                  </div>
                );
              })}
              {elegiveis.length === 0 ? <div className="td-vazio" style={{ margin: 6 }}>Backlog aprovado vazio — aprove tasks na triagem.</div> : null}
            </div>
            <div className="pl-regra">Escala fechada 1 · 2 · 3 · 5 · 8 — maior que 8, quebre a task (RN-04)</div>
          </div>

          {/* coluna direita: sprint sendo montada */}
          <div className="dd-panel">
            <div className="dd-panel-head">
              <h2>Sprint {s13.num} · planejada</h2>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 'auto' }} className="mono">{ptsAlocados} / ~{capacidade} pts</span>
            </div>
            <div style={{ padding: '12px 16px 4px' }}>
              <div className="pl-cap-track">
                <div className={`pl-cap-fill${ptsAlocados > capacidade ? ' estourou' : ''}`} style={{ width: `${pctCap}%` }}></div>
              </div>
              <div className="pl-cap-legenda">
                <span>Capacidade = velocity média das últimas 3 sprints encerradas ({capacidade} pts)</span>
                {ptsAlocados > capacidade ? <span style={{ color: 'var(--red)', fontWeight: 700 }}>+{ptsAlocados - capacidade} acima</span> : null}
              </div>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alocadas.map((t) => (
                <div key={t.codigo} className="pl-item alocada" onClick={() => onOpen(t.codigo)}>
                  <div className="pl-item-l1">
                    <span className="dd-code">{t.codigo}</span>
                    <span style={{ flex: 1 }}></span>
                    <Pts v={t.pontos} locked></Pts>
                  </div>
                  <div className="pl-item-titulo">{t.titulo}</div>
                  <div className="pl-item-l1" style={{ marginTop: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                      <Avatar userId={t.resp} size="sm"></Avatar>{ddUser(t.resp).nome}
                    </span>
                    <EpicChip epicId={t.epicId}></EpicChip>
                    <span style={{ flex: 1 }}></span>
                    {ehTL ? <button className="dd-btn ghost sm" onClick={(e) => { e.stopPropagation(); onRemover(t.codigo); }}>Remover</button> : null}
                  </div>
                </div>
              ))}
              {alocadas.length === 0 ? <div className="td-vazio" style={{ margin: 6 }}>Nenhuma task alocada ainda.</div> : null}
            </div>
            <div className="pl-regra">Pontuação trava ao entrar na sprint — reestimativa só pelo TechLead, com log (RN-05) · não concluídas da Sprint 12 rolam automaticamente (RN-07)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TelaBacklog, TelaPlanning });
