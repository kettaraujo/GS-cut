// ChipCut UI Kit — fake data store
// Mirrors the schema in chipcut/specs/PRD.md (chips / lotes / logs).

const CHIP_IMGS = [
  "../../assets/sample-chips/chip-1.jpg",
  "../../assets/sample-chips/chip-2.jpg",
  "../../assets/sample-chips/chip-3.jpg",
];

function iccid(seed) {
  // 19-digit-ish ICCID, formatted in 4-digit groups
  const base = "8955" + String(seed).padStart(15, "0");
  return base.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

const LOTES = [
  {
    id: "2026-014",
    nome: "Recolhimento Filial SP — Junho",
    status: "aberto",
    usuario: "operador01",
    data_criacao: "03/06/2026 09:12",
    aprovado_por: null,
    chips: [
      { seq: 1, iccid: iccid(102000123456), img: CHIP_IMGS[0], tentativas: 1, leitura: "sucesso", revisao: "aguardando_aprovacao", corrigido: false, usuario: "operador01", data: "03/06/2026 09:13" },
      { seq: 2, iccid: iccid(102000765432), img: CHIP_IMGS[1], tentativas: 2, leitura: "sucesso", revisao: "aguardando_aprovacao", corrigido: false, usuario: "operador01", data: "03/06/2026 09:14" },
      { seq: 3, iccid: iccid(102000334411), img: CHIP_IMGS[2], tentativas: 1, leitura: "sucesso", revisao: "aguardando_aprovacao", corrigido: true, usuario: "operador01", data: "03/06/2026 09:15" },
      { seq: 4, iccid: "", img: CHIP_IMGS[0], tentativas: 2, leitura: "erro", revisao: "rejeitado", corrigido: false, usuario: "operador01", data: "03/06/2026 09:16" },
      { seq: 5, iccid: iccid(102000998877), img: CHIP_IMGS[1], tentativas: 1, leitura: "sucesso", revisao: "aguardando_aprovacao", corrigido: false, usuario: "operador01", data: "03/06/2026 09:18" },
    ],
  },
  {
    id: "2026-013",
    nome: "Lote Logística — Maio (final)",
    status: "em_revisao",
    usuario: "operador02",
    data_criacao: "31/05/2026 16:40",
    aprovado_por: null,
    chips: [
      { seq: 1, iccid: iccid(101900111222), img: CHIP_IMGS[2], tentativas: 1, leitura: "sucesso", revisao: "aprovado", corrigido: false, usuario: "operador02", data: "31/05/2026 16:41" },
      { seq: 2, iccid: iccid(101900222333), img: CHIP_IMGS[0], tentativas: 1, leitura: "sucesso", revisao: "aprovado", corrigido: false, usuario: "operador02", data: "31/05/2026 16:42" },
      { seq: 3, iccid: iccid(101900333444), img: CHIP_IMGS[1], tentativas: 2, leitura: "sucesso", revisao: "aguardando_aprovacao", corrigido: false, usuario: "operador02", data: "31/05/2026 16:44" },
    ],
  },
  {
    id: "2026-012",
    nome: "Devolução Cliente — Contrato 8842",
    status: "exportado",
    usuario: "operador01",
    data_criacao: "28/05/2026 11:05",
    aprovado_por: "supervisor",
    chips: [
      { seq: 1, iccid: iccid(101800555666), img: CHIP_IMGS[0], tentativas: 1, leitura: "sucesso", revisao: "aprovado", corrigido: false, usuario: "operador01", data: "28/05/2026 11:06" },
      { seq: 2, iccid: iccid(101800666777), img: CHIP_IMGS[2], tentativas: 1, leitura: "sucesso", revisao: "aprovado", corrigido: false, usuario: "operador01", data: "28/05/2026 11:07" },
    ],
  },
  {
    id: "2026-011",
    nome: "Teste de bancada",
    status: "cancelado",
    usuario: "operador03",
    data_criacao: "27/05/2026 14:20",
    aprovado_por: null,
    chips: [],
  },
];

const KPIS = [
  { icon: "bi-card-checklist", color: "text-primary", value: "1.247", label: "Chips lidos", delta: "+18%", up: true },
  { icon: "bi-clock-history", color: "text-warning", value: "38", label: "Em revisão", delta: "+5", up: true },
  { icon: "bi-exclamation-triangle", color: "text-danger", value: "12", label: "Erros de leitura", delta: "-3%", up: false },
  { icon: "bi-folder2-open", color: "text-info", value: "4", label: "Lotes em aberto", delta: null, up: null },
];

const SERIE = {
  labels: ["28/05", "29/05", "30/05", "31/05", "01/06", "02/06", "03/06"],
  valores: [142, 168, 96, 203, 51, 187, 134],
};

const DISTRIB = {
  labels: ["Aprovado", "Aguardando", "Erro", "Pendente"],
  valores: [842, 318, 54, 33],
  cores: ["#198754", "#ffc107", "#dc3545", "#6c757d"],
};

window.CC_DATA = { LOTES, KPIS, SERIE, DISTRIB, CHIP_IMGS, iccid };
