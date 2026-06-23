/* DevDesk — Detalhe da task (drawer lateral) */
const { useState: useStateT } = React;

function LinhaMeta({ rotulo, children }) {
  return (
    <div className="td-meta-linha">
      <span className="td-meta-rotulo">{rotulo}</span>
      <span className="td-meta-valor">{children}</span>
    </div>
  );
}

function TaskDrawer({ codigo, tasks, papel, onClose, onMove, onToggleSub, onComentar, onBloquear, onDesbloquear, onAbrirRelatorio, onEditarDesc, onAddSub, onAprovar, onRecusar }) {
  const t = tasks.find((x) => x.codigo === codigo);
  const [aba, setAba] = useStateT('detalhe');
  const [comentario, setComentario] = useStateT('');
  const [modalBloqueio, setModalBloqueio] = useStateT(false);
  const [motivo, setMotivo] = useStateT('');
  const [editandoDoc, setEditandoDoc] = useStateT(false);
  const [docRascunho, setDocRascunho] = useStateT('');
  const [novaSub, setNovaSub] = useStateT(null); /* null = fechado, string = digitando */
  const eu = PAPEL_USER[papel];
  if (!t) return null;

  const ehTL = papel === 'techlead';
  const ehResp = t.resp === eu;
  const podeAgir = ehTL || ehResp;
  const imutavel = t.estado === 'CONCLUIDO' || t.estado === 'CANCELADO';
  const podeEditarDoc = (ehTL || ehResp || t.criadoPor === eu) && !imutavel;
  const pct = ddPctSub(t);
  const prox = (window.DD_TRANSICOES_VALIDAS[t.estado] || []).filter((dest) => dest !== 'CONCLUIDO' || ehTL);

  const ROTULO_ACAO = {
    EM_PROGRESSO: t.estado === 'EM_REVIEW' ? 'Reprovar review' : 'Iniciar execução',
    EM_REVIEW: 'Enviar para review',
    CONCLUIDO: 'Validar e concluir',
    A_FAZER: 'Voltar para A Fazer',
  };

  return (
    <React.Fragment>
      <div className="dd-drawer-veil" onClick={onClose}></div>
      <aside className="dd-drawer">
        {/* header */}
        <div className="td-head">
          <div className="td-head-l1">
            <span className="dd-code" style={{ fontSize: 12 }}>{t.codigo}</span>
            <StateBadge estado={t.bloqueio ? 'BLOQUEADO' : t.estado}></StateBadge>
            {t.estado === 'BACKLOG' ? (
              t.triagem === 'PENDENTE_APROVACAO'
                ? <span className="bl-triagem pend">Pendente aprovação</span>
                : <span className="bl-triagem ok">Aprovada · elegível a sprint</span>
            ) : null}
            {t.rollovers > 0 ? <span className="bd-roll"><Ic d={ICONS.rollover} size={10}></Ic>{t.rollovers} rollover</span> : null}
            <span style={{ flex: 1 }}></span>
            <button className="dd-btn ghost sm" onClick={onClose}><Ic d={ICONS.x} size={14}></Ic></button>
          </div>
          <h2 className="td-titulo">{t.titulo}</h2>
          <div className="td-acoes">
            {t.estado === 'BACKLOG' && t.triagem === 'PENDENTE_APROVACAO' ? (
              ehTL ? (
                <React.Fragment>
                  <button className="dd-btn sm primary" onClick={() => onAprovar(t.codigo)}><Ic d={ICONS.check} size={12}></Ic>Aprovar na triagem</button>
                  <button className="dd-btn sm danger" onClick={() => { onRecusar(t.codigo); onClose(); }}>Recusar</button>
                </React.Fragment>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>Aguardando triagem do TechLead — só depois ela fica elegível a sprint (RN-08)</span>
              )
            ) : null}
            {t.bloqueio ? (
              podeAgir ? <button className="dd-btn sm" onClick={() => onDesbloquear(t.codigo)}><Ic d={ICONS.check} size={12}></Ic>Desbloquear</button> : null
            ) : (
              <React.Fragment>
                {podeAgir && prox.map((dest) => (
                  <button key={dest} className={`dd-btn sm${dest === 'CONCLUIDO' || dest === 'EM_REVIEW' ? ' primary' : ''}`}
                    onClick={() => onMove(t.codigo, dest)}>
                    {ROTULO_ACAO[dest]}<Ic d={ICONS.arrowR} size={12}></Ic>
                  </button>
                ))}
                {podeAgir && ['A_FAZER', 'EM_PROGRESSO'].includes(t.estado) ? (
                  <button className="dd-btn sm danger" onClick={() => setModalBloqueio(true)}><Ic d={ICONS.block} size={12}></Ic>Bloquear</button>
                ) : null}
              </React.Fragment>
            )}
            {t.estado === 'CONCLUIDO' ? (
              <button className="dd-btn sm primary" onClick={() => onAbrirRelatorio(t.codigo)}><Ic d={ICONS.doc} size={12}></Ic>Relatório de entrega</button>
            ) : null}
          </div>
          {t.bloqueio ? (
            <div className="td-bloqueio">
              <Ic d={ICONS.block} size={13}></Ic>
              <div>
                <strong>Bloqueada desde {t.bloqueio.desde.slice(11)} de {ddFmtData(t.bloqueio.desde.slice(0, 10))}</strong> — {t.bloqueio.motivo}
                <div className="td-bloqueio-nota">Tempo bloqueado é medido à parte no cycle time (RN-09)</div>
              </div>
            </div>
          ) : null}
          <div className="td-abas">
            {[['detalhe', 'Detalhe'], ['comentarios', `Comentários · ${t.comentarios.length}`], ['historico', 'Histórico']].map(([id, rot]) => (
              <button key={id} className={aba === id ? 'on' : ''} onClick={() => setAba(id)}>{rot}</button>
            ))}
          </div>
        </div>

        <div className="td-corpo">
          <div className="td-conteudo">
            {aba === 'detalhe' ? (
              <React.Fragment>
                <div className="td-secao">
                  <div className="td-secao-head">
                    <span>Documentação da demanda</span>
                    <span className="td-secao-nota">Markdown · mini-PRD (RF-10)</span>
                    {podeEditarDoc && !editandoDoc ? (
                      <button className="dd-btn ghost sm" style={{ padding: '1px 8px' }}
                        onClick={() => { setDocRascunho(t.descricao); setEditandoDoc(true); }}>Editar</button>
                    ) : null}
                  </div>
                  {editandoDoc ? (
                    <div>
                      <textarea className="dd-textarea" style={{ minHeight: 180, fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.6 }}
                        autoFocus value={docRascunho} onChange={(e) => setDocRascunho(e.target.value)}></textarea>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>## título · **negrito** · `código` · - lista · 1. numerada</span>
                        <span style={{ flex: 1 }}></span>
                        <button className="dd-btn sm" onClick={() => setEditandoDoc(false)}>Cancelar</button>
                        <button className="dd-btn sm primary" disabled={!docRascunho.trim()}
                          onClick={() => { onEditarDesc(t.codigo, docRascunho); setEditandoDoc(false); }}>
                          <Ic d={ICONS.check} size={11}></Ic>Salvar documentação
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Md src={t.descricao}></Md>
                  )}
                </div>
                <div className="td-secao">
                  <div className="td-secao-head">
                    <span>Subtasks</span>
                    {pct !== null ? <span className="td-secao-nota mono">{pct}% concluído</span> : null}
                  </div>
                  {pct !== null ? <div style={{ marginBottom: 10 }}><Progress pct={pct}></Progress></div> : null}
                  {t.subtasks.length === 0 ? <div className="td-vazio">Sem subtasks. Subtasks são o checklist de execução — não pontuam (RN-06).</div> : null}
                  {t.subtasks.map((s, i) => (
                    <label key={i} className={`td-sub${s.done ? ' done' : ''}`}>
                      <input type="checkbox" checked={s.done} disabled={!podeAgir || t.estado === 'CONCLUIDO'}
                        onChange={() => onToggleSub(t.codigo, i)}></input>
                      <span>{s.t}</span>
                    </label>
                  ))}
                  {podeAgir && t.estado !== 'CONCLUIDO' ? (
                    novaSub === null ? (
                      <button className="dd-btn ghost sm" style={{ marginTop: 6 }} onClick={() => setNovaSub('')}><Ic d={ICONS.plus} size={11}></Ic>Adicionar subtask</button>
                    ) : (
                      <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
                        <input className="dd-input" autoFocus placeholder="Descreva o passo de execução…" value={novaSub}
                          onChange={(e) => setNovaSub(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && novaSub.trim()) { onAddSub(t.codigo, novaSub.trim()); setNovaSub(''); }
                            if (e.key === 'Escape') setNovaSub(null);
                          }}></input>
                        <button className="dd-btn sm primary" disabled={!novaSub.trim()}
                          onClick={() => { onAddSub(t.codigo, novaSub.trim()); setNovaSub(''); }}><Ic d={ICONS.plus} size={11}></Ic>Adicionar</button>
                        <button className="dd-btn sm" onClick={() => setNovaSub(null)}>Fechar</button>
                      </div>
                    )
                  ) : null}
                </div>
                <div className="td-secao">
                  <div className="td-secao-head"><span>Anexos</span></div>
                  <div className="td-vazio"><Ic d={ICONS.paperclip} size={12}></Ic> Arraste imagens, PDFs ou logs (RF-10)</div>
                </div>
              </React.Fragment>
            ) : null}

            {aba === 'comentarios' ? (
              <div className="td-secao">
                {t.comentarios.map((c, i) => {
                  const a = ddUser(c.autor);
                  return (
                    <div key={i} className="td-coment">
                      <Avatar userId={c.autor} size="md"></Avatar>
                      <div>
                        <div className="td-coment-head">
                          <strong>{a.nome}</strong>
                          <span className="mono">{c.quando}</span>
                        </div>
                        <div className="td-coment-texto"><ComentTexto texto={c.texto}></ComentTexto></div>
                      </div>
                    </div>
                  );
                })}
                {t.comentarios.length === 0 ? <div className="td-vazio">Nenhum comentário ainda.</div> : null}
                <div className="td-novocoment">
                  <Avatar userId={eu} size="md"></Avatar>
                  <div style={{ flex: 1 }}>
                    <textarea className="dd-textarea" placeholder="Comentar… use @ para mencionar"
                      value={comentario} onChange={(e) => setComentario(e.target.value)}></textarea>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                      <button className="dd-btn sm primary" disabled={!comentario.trim()}
                        onClick={() => { onComentar(t.codigo, comentario); setComentario(''); }}>Comentar</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {aba === 'historico' ? (
              <div className="td-secao">
                <div className="td-secao-head">
                  <span>Log de transições</span>
                  <span className="td-secao-nota">Imutável · fonte das métricas (RN-15)</span>
                </div>
                {t.transicoes.length === 0 ? <div className="td-vazio">Task ainda no backlog — sem transições.</div> : null}
                <div className="td-timeline">
                  {t.transicoes.slice().reverse().map((tr, i) => (
                    <div key={i} className="td-evento">
                      <span className="td-evento-dot" style={{ background: window.DD_ESTADOS[tr.para].cor }}></span>
                      <div>
                        <div>
                          <span style={{ color: 'var(--text-dim)' }}>{window.DD_ESTADOS[tr.de].rotulo}</span>
                          <span style={{ color: 'var(--text-faint)' }}> → </span>
                          <strong style={{ color: window.DD_ESTADOS[tr.para].cor }}>{window.DD_ESTADOS[tr.para].rotulo}</strong>
                        </div>
                        <div className="td-evento-meta mono">{tr.quando} · {ddUser(tr.autor).nome}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* meta lateral */}
          <div className="td-meta">
            <LinhaMeta rotulo="Responsável">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Avatar userId={t.resp} size="sm"></Avatar>{t.resp ? ddUser(t.resp).nome : '—'}
              </span>
            </LinhaMeta>
            <LinhaMeta rotulo="Colaboradores">
              {t.colab.length ? (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {t.colab.map((c) => (
                    <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <Avatar userId={c} size="sm"></Avatar>{ddUser(c).nome}
                    </span>
                  ))}
                </span>
              ) : <span className="td-dim">Nenhum</span>}
              {podeAgir && t.estado !== 'CONCLUIDO' ? <button className="dd-btn ghost sm" style={{ marginTop: 4, padding: '1px 6px' }}><Ic d={ICONS.plus} size={10}></Ic>Vincular</button> : null}
            </LinhaMeta>
            <LinhaMeta rotulo="Pontuação">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Pts v={t.pontos} locked={!!t.sprint}></Pts>
                {t.sprint ? <span className="td-dim" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ic d={ICONS.lock} size={10}></Ic>travada</span> : null}
              </span>
            </LinhaMeta>
            <LinhaMeta rotulo="Épico"><EpicChip epicId={t.epicId}></EpicChip></LinhaMeta>
            <LinhaMeta rotulo="Sprint">
              {t.sprint ? <span className="mono" style={{ fontSize: 11 }}>Sprint {window.DD_SPRINTS.find((s) => s.id === t.sprint).num}</span> : <span className="td-dim">—</span>}
            </LinhaMeta>
            <LinhaMeta rotulo="Prioridade"><Prio p={t.prioridade}></Prio></LinhaMeta>
            <LinhaMeta rotulo="Criada por">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Avatar userId={t.criadoPor} size="sm"></Avatar>
                <span>{ddUser(t.criadoPor).nome}<div className="td-dim mono" style={{ fontSize: 10 }}>{ddFmtDataFull(t.criadoEm)}</div></span>
              </span>
            </LinhaMeta>
            {t.tempos ? (
              <LinhaMeta rotulo="Tempo por estado (d.u.)">
                <span className="td-tempos mono">
                  <span>A Fazer<b>{t.tempos.aFazer.toFixed(1)}</b></span>
                  <span>Progresso<b>{t.tempos.emProgresso.toFixed(1)}</b></span>
                  <span>Bloqueado<b style={{ color: t.tempos.bloqueado > 0 ? 'var(--red)' : undefined }}>{t.tempos.bloqueado.toFixed(1)}</b></span>
                  <span>Review<b>{t.tempos.emReview.toFixed(1)}</b></span>
                </span>
              </LinhaMeta>
            ) : null}
            {ehTL && t.estado !== 'CONCLUIDO' && t.estado !== 'CANCELADO' ? (
              <div style={{ marginTop: 14 }}>
                <button className="dd-btn sm danger" style={{ width: '100%', justifyContent: 'center' }}>Cancelar task…</button>
                <div className="td-dim" style={{ fontSize: 10, marginTop: 5, textAlign: 'center' }}>Exige motivo · histórico preservado (RN-13)</div>
              </div>
            ) : null}
          </div>
        </div>

        {modalBloqueio ? (
          <Modal titulo={`Bloquear ${t.codigo}`} sub="Motivo obrigatório — o TechLead será notificado e o tempo bloqueado é medido à parte (RN-09)." onClose={() => setModalBloqueio(false)}>
            <label className="dd-field-label">Motivo do bloqueio</label>
            <textarea className="dd-textarea" autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: aguardando acesso ao ambiente do parceiro…"></textarea>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="dd-btn sm" onClick={() => setModalBloqueio(false)}>Cancelar</button>
              <button className="dd-btn sm danger" disabled={!motivo.trim()}
                onClick={() => { onBloquear(t.codigo, motivo); setMotivo(''); setModalBloqueio(false); }}>
                <Ic d={ICONS.block} size={12}></Ic>Bloquear task
              </button>
            </div>
          </Modal>
        ) : null}
      </aside>
    </React.Fragment>
  );
}

Object.assign(window, { TaskDrawer });
