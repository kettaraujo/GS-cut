/* DevDesk — Login */
const { useState: useStateL } = React;

function TelaLogin({ onEntrar }) {
  const [email, setEmail] = useStateL('andre.souza@grupogoldensat.com.br');
  const [senha, setSenha] = useStateL('••••••••••');
  return (
    <div className="dd-login">
      <div className="dd-login-left">
        <div className="dd-login-grid"></div>
        <div style={{ position: 'relative' }}>
          <div className="dd-logo" style={{ border: 0, padding: 0, fontSize: 26 }}>
            <span>Dev<span className="gold">Desk</span></span><span className="cursor" style={{ height: 22, width: 11 }}></span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: 6 }}>
            Grupo Golden Sat · Time de Desenvolvimento
          </div>
        </div>
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-0.02em', fontWeight: 700 }}>
            Previsibilidade e visibilidade <span style={{ color: 'var(--gold)' }}>ponta a ponta</span>.
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>
            Épico → Task → Subtask, sprints de 10 dias úteis e métricas calculadas
            do histórico real de trabalho. Nada de boca a boca.
          </p>
          <div className="lg-stats">
            <div><span className="mono">S12</span><small>sprint ativa</small></div>
            <div><span className="mono">32</span><small>velocity média</small></div>
            <div><span className="mono">6%</span><small>rollover</small></div>
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 10.5, color: 'var(--text-faint)' }} className="mono">
          single-tenant · interno · PT-BR
        </div>
      </div>
      <div className="dd-login-right">
        <div className="dd-login-card">
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Entrar</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 20px' }}>Acesso criado pelo TechLead. Primeira vez? Você vai definir uma nova senha.</p>
          <label className="dd-field-label">E-mail corporativo</label>
          <input className="dd-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}></input>
          <label className="dd-field-label" style={{ marginTop: 14 }}>Senha</label>
          <input className="dd-input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onEntrar(); }}></input>
          <button className="dd-btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '9px 0' }} onClick={onEntrar}>
            Entrar no DevDesk<Ic d={ICONS.arrowR} size={13}></Ic>
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <button className="dd-btn ghost sm" style={{ padding: 0 }}>Esqueci minha senha</button>
            <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>5 tentativas → bloqueio 15 min (RF-04)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TelaLogin });
