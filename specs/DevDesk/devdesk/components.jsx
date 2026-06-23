/* DevDesk — componentes compartilhados */
const { useState, useEffect, useRef, useContext, createContext } = React;

/* ---------- helpers ---------- */
const byId = (arr, id) => arr.find((x) => x.id === id);
const ddUser = (id) => byId(window.DD_USERS, id);
const ddEpic = (id) => byId(window.DD_EPICS, id);
const ddFmtData = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}`; };
const ddFmtDataFull = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const ddPctSub = (t) => (t.subtasks.length ? Math.round((t.subtasks.filter((s) => s.done).length / t.subtasks.length) * 100) : null);

/* ---------- ícones (stroke 1.6) ---------- */
function Ic({ d, size = 15, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {d.split('|').map((p, i) => <path key={i} d={p}></path>)}
    </svg>
  );
}
const ICONS = {
  board: 'M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z',
  backlog: 'M4 6h16|M4 12h16|M4 18h10',
  planning: 'M8 3v4M16 3v4|M3 9h18|M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  daily: 'M12 8v4l2.5 2.5|M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  metrics: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M10.3 21a1.9 1.9 0 0 0 3.4 0',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  lock: 'M5 11h14v10H5z|M8 11V7a4 4 0 1 1 8 0v4',
  block: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M5.6 5.6l12.8 12.8',
  rollover: 'M3 12a9 9 0 1 0 2.6-6.3L3 8|M3 3v5h5',
  plus: 'M12 5v14M5 12h14',
  comment: 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  paperclip: 'M21 12.5 12.7 20.8a5.5 5.5 0 0 1-7.8-7.8L13.6 4.3a3.7 3.7 0 0 1 5.2 5.2L10.2 18a1.8 1.8 0 0 1-2.6-2.6L15.4 7.6',
  doc: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z|M14 3v6h6',
  user: 'M20 21a8 8 0 1 0-16 0|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  flag: 'M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v12s-1 1-4 1-5-2-8-2-4 1-4 1',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z|M21 21l-4.3-4.3',
  arrowR: 'M5 12h14|M13 6l6 6-6 6',
  drag: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
};

/* ---------- primitivas ---------- */
function Avatar({ userId, size = 'md', title }) {
  const u = ddUser(userId);
  if (!u) return null;
  return <span className={`dd-avatar av-${size}`} style={{ background: u.cor }} title={title || u.nome}>{u.iniciais}</span>;
}
function AvStack({ ids, size = 'sm' }) {
  return <span className="dd-avstack">{ids.map((id) => <Avatar key={id} userId={id} size={size}></Avatar>)}</span>;
}
function StateBadge({ estado }) {
  const e = window.DD_ESTADOS[estado];
  return (
    <span className="dd-state" style={{ color: e.cor }}>
      <span className="sdot" style={{ background: e.cor }}></span>{e.rotulo}
    </span>
  );
}
function Pts({ v, locked }) {
  if (v == null) return <span className="dd-pts" style={{ opacity: 0.5 }}>—</span>;
  return <span className={`dd-pts${locked ? ' lock' : ''}`} title={locked ? 'Pontuação travada na sprint (RN-05)' : 'Story points'}>{v}</span>;
}
function EpicChip({ epicId }) {
  const e = ddEpic(epicId);
  if (!e) return null;
  return <span className="dd-epicchip"><span className="edot" style={{ background: e.cor }}></span>{e.nome}</span>;
}
function Prio({ p }) { return p ? <span className={`dd-prio ${p}`}>{p}</span> : <span className="dd-prio P3">—</span>; }
function Progress({ pct, cor }) {
  return <div className="dd-track"><div className="dd-fill" style={{ width: `${pct}%`, background: cor || 'var(--green)' }}></div></div>;
}

/* ---------- markdown mínimo ---------- */
function Md({ src }) {
  const html = React.useMemo(() => {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = (s) => esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
    const lines = (src || '').split('\n');
    let out = '', list = null;
    const closeList = () => { if (list) { out += `</${list}>`; list = null; } };
    for (const ln of lines) {
      if (/^##\s/.test(ln)) { closeList(); out += `<h2>${inline(ln.slice(3))}</h2>`; }
      else if (/^-\s/.test(ln)) { if (list !== 'ul') { closeList(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(ln.slice(2))}</li>`; }
      else if (/^\d+\.\s/.test(ln)) { if (list !== 'ol') { closeList(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(ln.replace(/^\d+\.\s/, ''))}</li>`; }
      else if (ln.trim() === '') { closeList(); }
      else { closeList(); out += `<p>${inline(ln)}</p>`; }
    }
    closeList();
    return out;
  }, [src]);
  return <div className="dd-md" dangerouslySetInnerHTML={{ __html: html }}></div>;
}

/* texto de comentário com @menções destacadas */
function ComentTexto({ texto }) {
  const partes = texto.split(/(@[A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)?)/g);
  return (
    <span>
      {partes.map((p, i) => p.startsWith('@')
        ? <span key={i} style={{ color: 'var(--gold)', fontWeight: 600 }}>{p}</span>
        : <span key={i}>{p}</span>)}
    </span>
  );
}

/* ---------- toasts ---------- */
const ToastCtx = createContext(null);
function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (texto, tipo = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="dd-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`dd-toast ${t.tipo}`}>
            <span style={{ color: t.tipo === 'erro' ? 'var(--red)' : 'var(--green)', display: 'inline-flex' }}>
              <Ic d={t.tipo === 'erro' ? ICONS.block : ICONS.check} size={13}></Ic>
            </span>
            {t.texto}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

/* ---------- modal ---------- */
function Modal({ titulo, sub, onClose, children, width }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div className="dd-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dd-modal" style={width ? { width } : null}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3>{titulo}</h3>
          <button className="dd-btn ghost sm" onClick={onClose}><Ic d={ICONS.x} size={13}></Ic></button>
        </div>
        {sub ? <div className="m-sub">{sub}</div> : null}
        {children}
      </div>
    </div>
  );
}

/* ---------- sino de notificações ---------- */
function Bell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(window.DD_NOTIFS);
  const ref = useRef(null);
  const naoLidas = notifs.filter((n) => !n.lida).length;
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="dd-bell" ref={ref}>
      <button className="dd-bellbtn" onClick={() => setOpen(!open)} title="Notificações">
        <Ic d={ICONS.bell} size={15}></Ic>
        {naoLidas > 0 ? <span className="dd-bellcount">{naoLidas}</span> : null}
      </button>
      {open ? (
        <div className="dd-pop">
          <div className="dd-pop-head">
            <span>Notificações</span>
            <button onClick={() => setNotifs(notifs.map((n) => ({ ...n, lida: true })))}>Marcar todas como lidas</button>
          </div>
          {notifs.map((n) => (
            <div key={n.id} className={`dd-notif ${n.lida ? 'lida' : 'unread'}`}
              onClick={() => setNotifs(notifs.map((x) => x.id === n.id ? { ...x, lida: true } : x))}>
              <span className="dot"></span>
              <span className="n-texto">{n.texto}</span>
              <span className="n-quando">{n.quando}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- sidebar ---------- */
const NAV = [
  { id: 'board', rotulo: 'Board da Sprint', icone: 'board', perfis: ['techlead', 'dev'] },
  { id: 'backlog', rotulo: 'Backlog', icone: 'backlog', perfis: ['techlead', 'dev'] },
  { id: 'planning', rotulo: 'Planning', icone: 'planning', perfis: ['techlead', 'dev'] },
  { id: 'epicos', rotulo: 'Épicos', icone: 'flag', perfis: ['techlead', 'dev'] },
  { id: 'daily', rotulo: 'Daily', icone: 'daily', perfis: ['techlead', 'dev'] },
  { id: 'metricas', rotulo: 'Métricas', icone: 'metrics', perfis: ['techlead', 'dev', 'viewer'] },
];
const PAPEL_USER = { techlead: 'u1', dev: 'u3', viewer: 'u7' };
const PAPEL_ROTULO = { techlead: 'TechLead', dev: 'Dev', viewer: 'Viewer' };

function Sidebar({ tela, setTela, papel, setPapel, tasks, onSair }) {
  const sprint = window.DD_SPRINTS.find((s) => s.estado === 'ATIVA');
  const eu = ddUser(PAPEL_USER[papel]);
  const pendentes = tasks.filter((t) => t.estado === 'BACKLOG' && t.triagem === 'PENDENTE_APROVACAO').length;
  const counts = { backlog: pendentes > 0 && papel === 'techlead' ? pendentes : null };
  return (
    <aside className="dd-sidebar">
      <div className="dd-logo">
        <span>Dev<span className="gold">Desk</span></span><span className="cursor"></span>
        <small>Golden Sat</small>
      </div>
      <div className="dd-sprintbox">
        <div className="sb-top">
          <span className="sb-name">Sprint {sprint.num}</span>
          <span className="sb-day">dia {sprint.diaUtil}/{sprint.diasUteis}</span>
        </div>
        <div className="sb-dates">{ddFmtData(sprint.inicio)} → {ddFmtData(sprint.fim)} · {sprint.comprometido} pts</div>
        <div className="sb-track"><div className="sb-fill" style={{ width: `${(sprint.diaUtil / sprint.diasUteis) * 100}%` }}></div></div>
      </div>
      <nav className="dd-nav">
        <div className="dd-nav-label">Fluxo</div>
        {NAV.filter((n) => n.perfis.includes(papel)).map((n) => (
          <button key={n.id} className={`dd-nav-item${tela === n.id ? ' active' : ''}`} onClick={() => setTela(n.id)}>
            <Ic d={ICONS[n.icone]}></Ic>{n.rotulo}
            {counts[n.id] ? <span className="count">{counts[n.id]}</span> : null}
          </button>
        ))}
      </nav>
      <div className="dd-sidebar-foot">
        <div className="dd-rolelabel">Ver como (protótipo)</div>
        <div className="dd-roleswitch">
          {['techlead', 'dev', 'viewer'].map((p) => (
            <button key={p} className={papel === p ? 'on' : ''} onClick={() => setPapel(p)}>{PAPEL_ROTULO[p]}</button>
          ))}
        </div>
        <div className="dd-userline">
          <Avatar userId={eu.id} size="md"></Avatar>
          <div>
            <div className="u-nome">{eu.nome}</div>
            <div className="u-papel">{PAPEL_ROTULO[papel]}</div>
          </div>
          <button className="sair" onClick={onSair} title="Sair">Sair</button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ titulo, sub, children }) {
  return (
    <header className="dd-topbar">
      <div>
        <h1>{titulo}</h1>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      <div className="spacer"></div>
      {children}
      <Bell></Bell>
    </header>
  );
}

Object.assign(window, {
  byId, ddUser, ddEpic, ddFmtData, ddFmtDataFull, ddPctSub,
  Ic, ICONS, Avatar, AvStack, StateBadge, Pts, EpicChip, Prio, Progress, Md, ComentTexto,
  ToastHost, useToast, Modal, Bell, Sidebar, Topbar, NAV, PAPEL_USER, PAPEL_ROTULO,
});
