/* DevDesk — Daily (registro individual + consolidado do time) */
const { useState: useStateD } = React;

function TaskRef({ codigo, onOpen }) {
  if (!codigo) return null;
  return (
    <button className="dl-taskref mono" onClick={(e) => { e.stopPropagation(); onOpen(codigo); }}>{codigo}</button>
  );
}

function CampoDaily({ rotulo, cor, itens, onOpen }) {
  return (
    <div className="dl-campo">
      <div className="dl-campo-rotulo" style={{ color: cor }}>{rotulo}</div>
      {itens.length === 0 ? <div className="dl-campo-vazio">—</div> : (
        <ul>
          {itens.map((it, i) => (
            <li key={i}>{it.texto} <TaskRef codigo={it.task} onOpen={onOpen}></TaskRef></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TelaDaily({ papel, onOpen, dailies, onRegistrar }) {
  const eu = PAPEL_USER[papel];
  const hoje = window.DD_HOJE;
  const [fiz, setFiz] = useStateD('');
  const [farei, setFarei] = useStateD('');
  const [imped, setImped] = useStateD('');
  const [editando, setEditando] = useStateD(false);
  const doDia = dailies.filter((d) => d.data === hoje);
  const minha = doDia.find((d) => d.user === eu);
  const devs = window.DD_USERS.filter((u) => u.papel === 'dev');
  const semRegistro = devs.filter((d) => !doDia.some((x) => x.user === d.id));
  const podeRegistrar = papel !== 'viewer';
  const mostraForm = podeRegistrar && (!minha || editando);
  const serializa = (itens) => itens.map((i) => i.texto + (i.task ? ` ${i.task}` : '')).join('\n');
  const comecarEdicao = () => {
    setFiz(serializa(minha.fiz)); setFarei(serializa(minha.farei)); setImped(serializa(minha.impedimentos));
    setEditando(true);
  };

  return (
    <div className="dd-main">
      <Topbar titulo="Daily" sub={`Quarta-feira, 10/06/2026 · ${doDia.filter((d) => ddUser(d.user).papel === 'dev').length}/${devs.length} devs registradas · editável até o fim do dia (RN-12)`}></Topbar>
      <div className="dd-scroll">
        <div style={{ padding: 22, display: 'grid', gridTemplateColumns: podeRegistrar ? '380px 1fr' : '1fr', gap: 18, alignItems: 'start' }}>
          {podeRegistrar ? (
            <div className="dd-panel" style={{ position: 'sticky', top: 0 }}>
              <div className="dd-panel-head">
                <h2>Minha daily de hoje</h2>
                {minha && !editando ? <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>✓ registrada às {minha.registradaAs}</span> : null}
              </div>
              {!mostraForm ? (
                <div className="dd-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[['O que fiz', minha.fiz, 'var(--green)'], ['O que farei', minha.farei, 'var(--blue)'], ['Impedimentos', minha.impedimentos, 'var(--red)']].map(([rot, itens, cor]) => (
                    <div key={rot}>
                      <label className="dd-field-label" style={{ color: cor }}>{rot}</label>
                      {itens.length === 0 ? <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>—</div> : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.5 }}>
                          {itens.map((it, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>{it.texto} <TaskRef codigo={it.task} onOpen={onOpen}></TaskRef></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  <button className="dd-btn" onClick={comecarEdicao}>Editar registro</button>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', textAlign: 'center' }}>Editável até o fim do dia · depois vira somente leitura (RN-12)</div>
                </div>
              ) : (
              <div className="dd-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="dd-field-label" style={{ color: 'var(--green)' }}>O que fiz</label>
                  <textarea className="dd-textarea" value={fiz} onChange={(e) => setFiz(e.target.value)} placeholder="Ontem fechei… (vincule tasks com DD-NNN)"></textarea>
                </div>
                <div>
                  <label className="dd-field-label" style={{ color: 'var(--blue)' }}>O que farei</label>
                  <textarea className="dd-textarea" value={farei} onChange={(e) => setFarei(e.target.value)} placeholder="Hoje vou…"></textarea>
                </div>
                <div>
                  <label className="dd-field-label" style={{ color: 'var(--red)' }}>Impedimentos</label>
                  <textarea className="dd-textarea" style={{ minHeight: 44 }} value={imped} onChange={(e) => setImped(e.target.value)} placeholder="Nada me bloqueia / descreva o impedimento"></textarea>
                </div>
                <button className="dd-btn primary" disabled={!fiz.trim() && !farei.trim()}
                  onClick={() => { onRegistrar(eu, fiz, farei, imped); setFiz(''); setFarei(''); setImped(''); setEditando(false); }}>
                  <Ic d={ICONS.check} size={13}></Ic>{minha ? 'Salvar alterações' : 'Registrar daily'}
                </button>
                {editando ? <button className="dd-btn ghost sm" onClick={() => setEditando(false)}>Cancelar edição</button> : null}
                {!minha ? <div style={{ fontSize: 10, color: 'var(--text-faint)', textAlign: 'center' }}>Dica: cite um código DD-NNN para vincular a linha à task</div> : null}
              </div>
              )}
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {doDia.map((d) => {
              const u = ddUser(d.user);
              const temImped = d.impedimentos.length > 0;
              return (
                <div key={d.user} className={`dd-panel dl-card${temImped ? ' imped' : ''}`}>
                  <div className="dl-card-head">
                    <Avatar userId={d.user} size="md"></Avatar>
                    <strong>{u.nome}</strong>
                    {temImped ? <span className="dl-flag"><Ic d={ICONS.flag} size={10}></Ic>impedimento</span> : null}
                    <span style={{ flex: 1 }}></span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>registrada às {d.registradaAs}</span>
                  </div>
                  <div className="dl-card-corpo">
                    <CampoDaily rotulo="Fiz" cor="var(--green)" itens={d.fiz} onOpen={onOpen}></CampoDaily>
                    <CampoDaily rotulo="Farei" cor="var(--blue)" itens={d.farei} onOpen={onOpen}></CampoDaily>
                    <CampoDaily rotulo="Impedimentos" cor="var(--red)" itens={d.impedimentos} onOpen={onOpen}></CampoDaily>
                  </div>
                </div>
              );
            })}
            {semRegistro.length > 0 ? (
              <div className="dl-pendentes">
                <span>Sem registro hoje:</span>
                {semRegistro.map((d) => (
                  <span key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Avatar userId={d.id} size="sm"></Avatar>{d.nome.split(' ')[0]}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>lembrete automático às 9h30 (DD-147)</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TelaDaily });
