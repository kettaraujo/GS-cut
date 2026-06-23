/* DevDesk — Board da sprint (colunas / raias por dev / lista) */
const { useState } = React;
const BOARD_COLS = ['A_FAZER', 'EM_PROGRESSO', 'EM_REVIEW', 'CONCLUIDO'];

function TaskCard({ t, onOpen, draggable, onDragStart, compact }) {
  const pct = ddPctSub(t);
  const done = t.subtasks.filter((s) => s.done).length;
  return (
    <div
      className={`bd-card${t.bloqueio ? ' blocked' : ''}${compact ? ' compact' : ''}`}
      draggable={draggable && !t.bloqueio}
      onDragStart={onDragStart}
      onClick={() => onOpen(t.codigo)}
    >
      <div className="bd-card-top">
        <span className="dd-code">{t.codigo}</span>
        <Prio p={t.prioridade}></Prio>
        {t.rollovers > 0 ? (
          <span className="bd-roll" title={`Rolou de ${t.rollovers} sprint${t.rollovers > 1 ? 's' : ''} (RN-07)`}>
            <Ic d={ICONS.rollover} size={10}></Ic>{t.rollovers}
          </span>
        ) : null}
        <span style={{ flex: 1 }}></span>
        <Pts v={t.pontos} locked={!!t.sprint}></Pts>
      </div>
      <div className="bd-card-titulo">{t.titulo}</div>
      {t.bloqueio ? (
        <div className="bd-block">
          <Ic d={ICONS.block} size={11}></Ic>
          <span>{t.bloqueio.motivo}</span>
        </div>
      ) : null}
      {!compact ? <div style={{ marginTop: 7 }}><EpicChip epicId={t.epicId}></EpicChip></div> : null}
      <div className="bd-card-foot">
        <Avatar userId={t.resp} size="sm"></Avatar>
        {t.colab.length > 0 ? (
          <span className="bd-colab" title={`Colaboradores: ${t.colab.map((c) => ddUser(c).nome).join(', ')}`}>
            +<AvStack ids={t.colab}></AvStack>
          </span>
        ) : null}
        {pct !== null ? (
          <span className="bd-sub" title={`${done}/${t.subtasks.length} subtasks`}>
            <span className="bd-sub-track"><span className="bd-sub-fill" style={{ width: `${pct}%` }}></span></span>
            <span className="mono">{done}/{t.subtasks.length}</span>
          </span>
        ) : null}
        <span style={{ flex: 1 }}></span>
        {t.comentarios.length > 0 ? (
          <span className="bd-meta"><Ic d={ICONS.comment} size={11}></Ic>{t.comentarios.length}</span>
        ) : null}
        <span className="bd-meta mono" title="Dias úteis no estado atual">{t.diasNoEstado}d</span>
      </div>
    </div>
  );
}

function BoardColunas({ tasks, onOpen, onMove, podeArrastar }) {
  const [dragOver, setDragOver] = useState(null);
  return (
    <div className="bd-cols">
      {BOARD_COLS.map((col) => {
        const lista = tasks.filter((t) => t.estado === col);
        const pts = lista.reduce((a, t) => a + (t.pontos || 0), 0);
        const cor = window.DD_ESTADOS[col].cor;
        return (
          <div
            key={col}
            className={`bd-col${dragOver === col ? ' over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => { setDragOver(null); onMove(e.dataTransfer.getData('text/plain'), col); }}
          >
            <div className="bd-col-head">
              <span className="sdot" style={{ background: cor }}></span>
              <span className="bd-col-nome">{window.DD_ESTADOS[col].rotulo}</span>
              <span className="bd-col-count mono">{lista.length}</span>
              <span style={{ flex: 1 }}></span>
              <span className="bd-col-pts mono">{pts} pts</span>
            </div>
            <div className="bd-col-body">
              {lista.map((t) => (
                <TaskCard key={t.codigo} t={t} onOpen={onOpen}
                  draggable={podeArrastar(t)}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', t.codigo)}></TaskCard>
              ))}
              {lista.length === 0 ? <div className="bd-vazio">Solte um card aqui</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BoardRaias({ tasks, onOpen, onMove, podeArrastar }) {
  const devs = window.DD_USERS.filter((u) => u.papel !== 'viewer' && tasks.some((t) => t.resp === u.id));
  return (
    <div className="bd-raias">
      <div className="bd-raia-header">
        <div></div>
        {BOARD_COLS.map((col) => (
          <div key={col} className="bd-raia-colhead">
            <span className="sdot" style={{ background: window.DD_ESTADOS[col].cor }}></span>
            {window.DD_ESTADOS[col].rotulo}
          </div>
        ))}
      </div>
      {devs.map((dev) => {
        const minhas = tasks.filter((t) => t.resp === dev.id);
        const pts = minhas.reduce((a, t) => a + (t.pontos || 0), 0);
        return (
          <div key={dev.id} className="bd-raia">
            <div className="bd-raia-dev">
              <Avatar userId={dev.id} size="md"></Avatar>
              <div>
                <div className="rd-nome">{dev.nome}</div>
                <div className="rd-pts mono">{pts} pts · {minhas.length} tasks</div>
              </div>
            </div>
            {BOARD_COLS.map((col) => {
              const lista = minhas.filter((t) => t.estado === col);
              return (
                <div key={col} className="bd-raia-cel"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onMove(e.dataTransfer.getData('text/plain'), col)}>
                  {lista.map((t) => (
                    <TaskCard key={t.codigo} t={t} onOpen={onOpen} compact
                      draggable={podeArrastar(t)}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', t.codigo)}></TaskCard>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function BoardLista({ tasks, onOpen }) {
  return (
    <div className="dd-panel" style={{ margin: '0 22px 22px' }}>
      <table className="dd-table">
        <thead>
          <tr>
            <th>Código</th><th>Task</th><th>Épico</th><th>Estado</th><th>Pts</th>
            <th>Resp.</th><th>Colab.</th><th>Subtasks</th><th>Prio</th><th>No estado</th>
          </tr>
        </thead>
        <tbody>
          {BOARD_COLS.flatMap((col) => tasks.filter((t) => t.estado === col)).map((t) => {
            const pct = ddPctSub(t);
            return (
              <tr key={t.codigo} onClick={() => onOpen(t.codigo)}>
                <td className="dd-code">{t.codigo}</td>
                <td style={{ maxWidth: 320 }}>
                  <span style={{ fontWeight: 600 }}>{t.titulo}</span>
                  {t.bloqueio ? <span className="bd-block" style={{ marginTop: 4 }}><Ic d={ICONS.block} size={11}></Ic>{t.bloqueio.motivo}</span> : null}
                </td>
                <td><EpicChip epicId={t.epicId}></EpicChip></td>
                <td><StateBadge estado={t.bloqueio ? 'BLOQUEADO' : t.estado}></StateBadge></td>
                <td><Pts v={t.pontos} locked></Pts></td>
                <td><Avatar userId={t.resp} size="sm"></Avatar></td>
                <td>{t.colab.length ? <AvStack ids={t.colab}></AvStack> : <span style={{ color: 'var(--text-faint)' }}>—</span>}</td>
                <td style={{ minWidth: 90 }}>
                  {pct !== null ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ flex: 1 }}><Progress pct={pct}></Progress></span>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{pct}%</span>
                    </span>
                  ) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                </td>
                <td><Prio p={t.prioridade}></Prio></td>
                <td className="mono" style={{ color: 'var(--text-dim)' }}>{t.diasNoEstado}d</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TelaBoard({ tasks, papel, onOpen, onMove }) {
  const [layout, setLayout] = useState('colunas');
  const [fEpico, setFEpico] = useState('');
  const [fDev, setFDev] = useState('');
  const [busca, setBusca] = useState('');
  const eu = PAPEL_USER[papel];
  const sprint = window.DD_SPRINTS.find((s) => s.estado === 'ATIVA');

  let lista = tasks.filter((t) => t.sprint === sprint.id && t.estado !== 'CANCELADO' && t.estado !== 'BACKLOG');
  if (fEpico) lista = lista.filter((t) => t.epicId === fEpico);
  if (fDev) lista = lista.filter((t) => t.resp === fDev || t.colab.includes(fDev));
  if (busca) lista = lista.filter((t) => (t.titulo + ' ' + t.codigo).toLowerCase().includes(busca.toLowerCase()));

  const podeArrastar = (t) => papel === 'techlead' || (papel === 'dev' && t.resp === eu);
  const bloqueadas = lista.filter((t) => t.bloqueio).length;
  const concluidoPts = lista.filter((t) => t.estado === 'CONCLUIDO').reduce((a, t) => a + t.pontos, 0);

  return (
    <div className="dd-main">
      <Topbar
        titulo={`Board · Sprint ${sprint.num}`}
        sub={`${ddFmtData(sprint.inicio)} → ${ddFmtData(sprint.fim)} · ${concluidoPts}/${sprint.comprometido} pts concluídos${bloqueadas ? ` · ${bloqueadas} bloqueada${bloqueadas > 1 ? 's' : ''}` : ''}`}
      >
        <div className="dd-seg">
          <button className={layout === 'colunas' ? 'on' : ''} onClick={() => setLayout('colunas')}><Ic d={ICONS.board} size={12}></Ic>Colunas</button>
          <button className={layout === 'raias' ? 'on' : ''} onClick={() => setLayout('raias')}><Ic d={ICONS.user} size={12}></Ic>Raias por dev</button>
          <button className={layout === 'lista' ? 'on' : ''} onClick={() => setLayout('lista')}><Ic d={ICONS.backlog} size={12}></Ic>Lista</button>
        </div>
      </Topbar>
      <div className="bd-filtros">
        <div className="bd-busca">
          <Ic d={ICONS.search} size={13}></Ic>
          <input className="dd-input" placeholder="Buscar por título ou código…" value={busca} onChange={(e) => setBusca(e.target.value)}></input>
        </div>
        <select className="dd-select" style={{ width: 190 }} value={fEpico} onChange={(e) => setFEpico(e.target.value)}>
          <option value="">Todos os épicos</option>
          {window.DD_EPICS.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <select className="dd-select" style={{ width: 170 }} value={fDev} onChange={(e) => setFDev(e.target.value)}>
          <option value="">Todos os devs</option>
          {window.DD_USERS.filter((u) => u.papel !== 'viewer').map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
        {papel === 'dev' ? (
          <button className="dd-btn sm ghost" onClick={() => setFDev(fDev === eu ? '' : eu)}>
            {fDev === eu ? '✓ ' : ''}Minhas tasks
          </button>
        ) : null}
      </div>
      <div className="dd-scroll">
        {layout === 'colunas' ? <BoardColunas tasks={lista} onOpen={onOpen} onMove={onMove} podeArrastar={podeArrastar}></BoardColunas> : null}
        {layout === 'raias' ? <BoardRaias tasks={lista} onOpen={onOpen} onMove={onMove} podeArrastar={podeArrastar}></BoardRaias> : null}
        {layout === 'lista' ? <BoardLista tasks={lista} onOpen={onOpen}></BoardLista> : null}
      </div>
    </div>
  );
}

Object.assign(window, { TelaBoard, TaskCard, BOARD_COLS });
