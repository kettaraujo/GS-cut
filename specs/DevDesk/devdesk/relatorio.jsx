/* DevDesk — Relatório de entrega (auto-gerado na conclusão, RN-10) */
const { useState: useStateR } = React;

function TelaRelatorio({ codigo, tasks, papel, onVoltar, onOpen }) {
  const t = tasks.find((x) => x.codigo === codigo);
  const [complemento, setComplemento] = useStateR(t ? (t.relatorioComplemento || '') : '');
  const [editando, setEditando] = useStateR(false);
  if (!t) return null;
  const eu = PAPEL_USER[papel];
  const podeComplementar = t.resp === eu || papel === 'techlead';
  const cycleDias = t.tempos ? (t.tempos.emProgresso + t.tempos.emReview) : 0;
  const totalDias = t.tempos ? (t.tempos.aFazer + t.tempos.emProgresso + t.tempos.bloqueado + t.tempos.emReview) : 0;

  return (
    <div className="dd-main">
      <Topbar titulo={`Relatório de entrega · ${t.codigo}`} sub="Gerado automaticamente na transição para Concluído (RN-10)">
        <button className="dd-btn sm" onClick={onVoltar}>← Voltar</button>
        <button className="dd-btn sm primary"><Ic d={ICONS.doc} size={12}></Ic>Exportar PDF</button>
      </Topbar>
      <div className="dd-scroll">
        <div className="rl-folha">
          {/* cabeçalho do relatório */}
          <div className="rl-head">
            <div>
              <div className="dd-code" style={{ fontSize: 12 }}>{t.codigo}</div>
              <h2>{t.titulo}</h2>
              <div className="rl-meta">
                <EpicChip epicId={t.epicId}></EpicChip>
                <span>Sprint {window.DD_SPRINTS.find((s) => s.id === t.sprint).num}</span>
                <span>·</span>
                <span>Concluída em <strong className="mono">{t.concluidaEm}</strong></span>
                <span>·</span>
                <span>Validada por <strong>{ddUser(t.transicoes[t.transicoes.length - 1].autor).nome}</strong></span>
              </div>
            </div>
            <div className="rl-selo">
              <Ic d={ICONS.check} size={16}></Ic>
              <span>Concluído</span>
              <span className="mono">{t.pontos} pts</span>
            </div>
          </div>

          {/* dados de sistema */}
          <div className="rl-grid">
            <div className="rl-bloco">
              <div className="rl-bloco-titulo"><Ic d={ICONS.daily} size={12}></Ic>Tempo em cada estado <span className="rl-sys">dado de sistema</span></div>
              <div className="rl-tempos">
                {[['A Fazer', t.tempos.aFazer, 'var(--blue)'], ['Em Progresso', t.tempos.emProgresso, 'var(--gold)'], ['Bloqueado', t.tempos.bloqueado, 'var(--red)'], ['Em Review', t.tempos.emReview, 'var(--purple)']].map(([rot, v, cor]) => (
                  <div key={rot} className="rl-tempo">
                    <div className="rl-tempo-valor mono" style={{ color: cor }}>{v.toFixed(1).replace('.', ',')}</div>
                    <div className="rl-tempo-rotulo">{rot}</div>
                    <div className="rl-tempo-bar"><span style={{ width: `${totalDias ? (v / totalDias) * 100 : 0}%`, background: cor }}></span></div>
                  </div>
                ))}
              </div>
              <div className="rl-nota">Cycle time: <strong className="mono">{cycleDias.toFixed(1).replace('.', ',')} d.u.</strong> (Em Progresso → Concluído, descontado o tempo bloqueado) · Lead time total: <strong className="mono">{totalDias.toFixed(1).replace('.', ',')} d.u.</strong></div>
            </div>

            <div className="rl-bloco">
              <div className="rl-bloco-titulo"><Ic d={ICONS.check} size={12}></Ic>Subtasks concluídas <span className="rl-sys">dado de sistema</span></div>
              <ul className="rl-lista">
                {t.subtasks.map((s, i) => (
                  <li key={i} className={s.done ? 'ok' : 'nok'}>
                    <Ic d={s.done ? ICONS.check : ICONS.x} size={11}></Ic>{s.t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rl-bloco">
              <div className="rl-bloco-titulo"><Ic d={ICONS.user} size={12}></Ic>Participantes <span className="rl-sys">dado de sistema</span></div>
              <div className="rl-parts">
                <div className="rl-part">
                  <Avatar userId={t.resp} size="md"></Avatar>
                  <div><strong>{ddUser(t.resp).nome}</strong><div className="td-dim" style={{ fontSize: 10.5 }}>Responsável</div></div>
                </div>
                {t.colab.map((c) => (
                  <div key={c} className="rl-part">
                    <Avatar userId={c} size="md"></Avatar>
                    <div><strong>{ddUser(c).nome}</strong><div className="td-dim" style={{ fontSize: 10.5 }}>Colaborador (RN-11)</div></div>
                  </div>
                ))}
              </div>
              <div className="rl-bloco-titulo" style={{ marginTop: 16 }}><Ic d={ICONS.rollover} size={12}></Ic>Reestimativas <span className="rl-sys">dado de sistema</span></div>
              <div className="rl-nota">Nenhuma — pontuação original de <strong className="mono">{t.pontos} pts</strong> mantida (RN-05).</div>
            </div>

            <div className="rl-bloco">
              <div className="rl-bloco-titulo"><Ic d={ICONS.comment} size={12}></Ic>Comentários da task <span className="rl-sys">dado de sistema</span></div>
              {t.comentarios.map((c, i) => (
                <div key={i} className="rl-coment">
                  <span className="mono" style={{ color: 'var(--text-faint)', fontSize: 10 }}>{c.quando}</span>
                  <div><strong>{ddUser(c.autor).nome}:</strong> <ComentTexto texto={c.texto}></ComentTexto></div>
                </div>
              ))}
              {t.comentarios.length === 0 ? <div className="rl-nota">Sem comentários.</div> : null}
            </div>
          </div>

          {/* complemento do responsável */}
          <div className="rl-bloco rl-complemento">
            <div className="rl-bloco-titulo">
              <Ic d={ICONS.doc} size={12}></Ic>Complemento do responsável
              <span className="rl-livre">texto livre · não altera os dados gerados (RF-26)</span>
              {podeComplementar && !editando ? (
                <button className="dd-btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => setEditando(true)}>Editar</button>
              ) : null}
            </div>
            {editando ? (
              <div>
                <textarea className="dd-textarea" style={{ minHeight: 90 }} value={complemento} onChange={(e) => setComplemento(e.target.value)} autoFocus></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button className="dd-btn sm" onClick={() => setEditando(false)}>Cancelar</button>
                  <button className="dd-btn sm primary" onClick={() => setEditando(false)}><Ic d={ICONS.check} size={11}></Ic>Salvar complemento</button>
                </div>
              </div>
            ) : complemento ? (
              <p style={{ margin: 0, lineHeight: 1.6 }}>{complemento}</p>
            ) : (
              <div className="rl-nota" style={{ fontStyle: 'italic' }}>Sem complemento ainda.</div>
            )}
          </div>

          <div className="rl-rodape mono">
            DevDesk · Grupo Golden Sat · relatório gerado pelo sistema em {t.concluidaEm} · dados derivados do log imutável de transições (RN-15) · preparado para receber commits vinculados (fase 2)
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TelaRelatorio });
