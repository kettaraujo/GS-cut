// ChipCut UI Kit — status badges (mirrors core/templatetags/chipcut_tags.py)

const BADGES = {
  revisao: {
    aguardando_aprovacao: { label: "Aguardando Aprovação", cor: "warning", icone: "bi-clock-history" },
    aprovado: { label: "Aprovado", cor: "success", icone: "bi-check-circle" },
    rejeitado: { label: "Rejeitado", cor: "danger", icone: "bi-x-circle" },
  },
  leitura: {
    sucesso: { label: "Lido", cor: "success", icone: "bi-check2" },
    erro: { label: "Erro de Leitura", cor: "danger", icone: "bi-exclamation-triangle" },
    pendente: { label: "Pendente", cor: "secondary", icone: "bi-hourglass" },
  },
  lote: {
    aberto: { label: "Aberto", cor: "primary", icone: "bi-folder2-open" },
    em_revisao: { label: "Em Revisão", cor: "warning", icone: "bi-eye" },
    aprovado: { label: "Aprovado", cor: "info", icone: "bi-clipboard-check" },
    exportado: { label: "Exportado", cor: "success", icone: "bi-check-all" },
    cancelado: { label: "Cancelado", cor: "secondary", icone: "bi-slash-circle" },
  },
};

function StatusBadge({ valor, tipo }) {
  const cfg = (BADGES[tipo] && BADGES[tipo][valor]) || { label: valor || "—", cor: "secondary", icone: "bi-question" };
  return (
    <span className={`badge text-bg-${cfg.cor} d-inline-flex align-items-center gap-1`}>
      <i className={`bi ${cfg.icone}`}></i> {cfg.label}
    </span>
  );
}

function AttemptBadge({ tentativas }) {
  return tentativas > 1
    ? <span className="badge text-bg-warning">2ª</span>
    : <span className="badge text-bg-success">1ª</span>;
}

// Lote section grouping used by the list & review screens
const LOTE_SECOES = [
  { id: "aberto", titulo: "Em aberto", match: ["aberto"] },
  { id: "em_revisao", titulo: "Em revisão", match: ["em_revisao"] },
  { id: "fechados", titulo: "Aprovados / exportados", match: ["aprovado", "exportado"] },
  { id: "cancelados", titulo: "Cancelados", match: ["cancelado"] },
];

window.CC = Object.assign(window.CC || {}, { StatusBadge, AttemptBadge, BADGES, LOTE_SECOES });
