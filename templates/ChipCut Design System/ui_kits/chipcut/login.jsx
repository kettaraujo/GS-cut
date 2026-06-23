// ChipCut UI Kit — login (templates/registration/login.html)
// Branded GoldenSat login: navy backdrop, centered card, gold accent, palette strip.

function LoginScreen({ onLogin }) {
  const [u, setU] = React.useState("operador01");
  const [p, setP] = React.useState("demo");
  const [err, setErr] = React.useState(false);

  function submit(e) {
    e.preventDefault();
    if (!u || !p) { setErr(true); return; }
    onLogin(u);
  }

  const palette = [
    { c: "#efc319", n: "Gold" },
    { c: "#1a2332", n: "Navy" },
    { c: "#d4a574", n: "Amber" },
    { c: "#0d6efd", n: "Primary" },
    { c: "#198754", n: "Success" },
  ];

  return (
    <div className="cc-login">
      <div className="cc-login-card">
        <div className="cc-login-accent"></div>
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <img src="../../assets/logo-goldensat.png" alt="GoldenSat" style={{ height: 84, width: "auto" }} />
            <h1 className="h3 mt-3 mb-0" style={{ color: "#1a2332" }}>ChipCut</h1>
            <div className="small fw-semibold mt-1" style={{ color: "#c79e0f", letterSpacing: ".06em" }}>GRUPO GOLDENSAT</div>
          </div>

          {err && <div className="alert alert-danger py-2">Usuário ou senha inválidos.</div>}

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="u">Usuário</label>
              <input id="u" type="text" className="form-control" value={u} onChange={(e) => setU(e.target.value)} autoFocus />
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="p">Senha</label>
              <input id="p" type="password" className="form-control" value={p} onChange={(e) => setP(e.target.value)} />
            </div>
            <button type="submit" className="btn cc-btn-navy w-100">Entrar</button>
          </form>

          <div className="cc-palette" title="Paleta GoldenSat">
            {palette.map((s) => (
              <span key={s.n} className="cc-swatch" style={{ background: s.c }} title={s.n}></span>
            ))}
          </div>
        </div>
      </div>
      <p className="cc-login-foot">Grupo GoldenSat · uso interno</p>
    </div>
  );
}

window.CC = Object.assign(window.CC || {}, { LoginScreen });
