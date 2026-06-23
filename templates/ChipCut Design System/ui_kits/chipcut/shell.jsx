// ChipCut UI Kit — app shell (sidebar + mobile topbar)
// Mirrors templates/base.html

const NAV = [
  { key: "dashboard", icon: "bi-speedometer2", label: "Dashboard" },
  { key: "lotes", icon: "bi-collection", label: "Lotes" },
  { key: "capture", icon: "bi-camera", label: "Leitura" },
  { key: "logs", icon: "bi-clipboard-data", label: "Logs" },
];

function Sidebar({ active, onNav, user, onLogout, mobileOpen, onClose }) {
  return (
    <>
      <div
        className={`cc-backdrop d-lg-none ${mobileOpen ? "show" : ""}`}
        onClick={onClose}
      ></div>
      <aside className={`cc-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="cc-sidebar-header d-flex align-items-center justify-content-between">
          <a className="cc-brand d-flex align-items-center gap-2" href="#" onClick={(e) => { e.preventDefault(); onNav("dashboard"); }}>
            <img src="../../assets/logo-goldensat.png" alt="GoldenSat" style={{ height: 30, width: "auto" }} />
            ChipCut
          </a>
          <button className="btn-close btn-close-white d-lg-none" onClick={onClose} aria-label="Fechar"></button>
        </div>
        <nav className="cc-nav d-flex flex-column">
          {NAV.map((n) => (
            <a
              key={n.key}
              href="#"
              className={`nav-link ${active === n.key ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); onNav(n.key); }}
            >
              <i className={`bi ${n.icon}`}></i> {n.label}
            </a>
          ))}
          <span className="nav-link disabled"><i className="bi bi-gear"></i> Configurações</span>
        </nav>
        <div className="cc-sidebar-footer mt-auto">
          <div className="small mb-2"><i className="bi bi-person-circle"></i> {user}</div>
          <button className="btn btn-outline-light btn-sm w-100" onClick={onLogout}>
            <i className="bi bi-box-arrow-right"></i> Sair
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileTopbar({ onMenu, onNav }) {
  return (
    <nav className="navbar bg-dark d-lg-none px-3">
      <button className="btn btn-outline-light btn-sm" onClick={onMenu}><i className="bi bi-list"></i></button>
      <a className="navbar-brand text-light fw-bold m-0 d-flex align-items-center gap-2" href="#" onClick={(e) => { e.preventDefault(); onNav("dashboard"); }}>
        <img src="../../assets/logo-goldensat.png" alt="GoldenSat" style={{ height: 26, width: "auto" }} /> ChipCut
      </a>
      <span style={{ width: 38 }}></span>
    </nav>
  );
}

window.CC = Object.assign(window.CC || {}, { Sidebar, MobileTopbar });
