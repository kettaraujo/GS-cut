/* ============================================================
   DevDesk — dados de exemplo (mock)
   Hoje: quarta-feira, 10/06/2026 — Sprint 12 ativa (dia 8 de 10)
   ============================================================ */

window.DD_HOJE = '2026-06-10';

window.DD_USERS = [
  { id: 'u1', nome: 'André Souza',  papel: 'techlead', iniciais: 'AS', cor: '#E8B84B' },
  { id: 'u2', nome: 'Camila Reis',  papel: 'dev',      iniciais: 'CR', cor: '#5BB8A8' },
  { id: 'u3', nome: 'Thiago Melo',  papel: 'dev',      iniciais: 'TM', cor: '#7A9BF0' },
  { id: 'u4', nome: 'Juliana Costa',papel: 'dev',      iniciais: 'JC', cor: '#C58BE8' },
  { id: 'u5', nome: 'Rafael Pires', papel: 'dev',      iniciais: 'RP', cor: '#E89A6B' },
  { id: 'u6', nome: 'Bruna Dias',   papel: 'dev',      iniciais: 'BD', cor: '#88C56B' },
  { id: 'u7', nome: 'Otávio Braga', papel: 'viewer',   iniciais: 'OB', cor: '#9AA5B5' },
];

window.DD_EPICS = [
  { id: 'e1', nome: 'GS Voucher 2.0',        cor: '#5BB8A8', totalPts: 55, donePts: 36 },
  { id: 'e2', nome: 'GS Learning · Trilhas', cor: '#C58BE8', totalPts: 40, donePts: 13 },
  { id: 'e3', nome: 'Automação de Rastreio', cor: '#7A9BF0', totalPts: 34, donePts: 26 },
  { id: 'e4', nome: 'DevDesk (dogfooding)',  cor: '#E8B84B', totalPts: 21, donePts: 8  },
];

window.DD_SPRINTS = [
  { id: 's10', num: 10, inicio: '2026-05-04', fim: '2026-05-15', estado: 'ENCERRADA' },
  { id: 's11', num: 11, inicio: '2026-05-18', fim: '2026-05-29', estado: 'ENCERRADA' },
  { id: 's12', num: 12, inicio: '2026-06-01', fim: '2026-06-12', estado: 'ATIVA', diaUtil: 8, diasUteis: 10, comprometido: 42 },
  { id: 's13', num: 13, inicio: '2026-06-15', fim: '2026-06-26', estado: 'PLANEJADA' },
];

/* estados: BACKLOG | A_FAZER | EM_PROGRESSO | BLOQUEADO | EM_REVIEW | CONCLUIDO | CANCELADO */
window.DD_TASKS = [
  /* ---------- SPRINT 12 · A FAZER ---------- */
  {
    codigo: 'DD-151', titulo: 'Certificado em PDF ao concluir trilha', epicId: 'e2',
    estado: 'A_FAZER', triagem: 'APROVADA', pontos: 5, resp: 'u4', colab: [], sprint: 's12', prioridade: 'P2',
    criadoPor: 'u1', criadoEm: '2026-05-26', diasNoEstado: 8, rollovers: 0,
    descricao: '## Contexto\nAo concluir 100% de uma trilha, o colaborador deve receber certificado em PDF com nome, trilha, carga horária e data.\n\n## Escopo\n- Template único institucional\n- Geração assíncrona (fila)\n- Download na tela da trilha concluída',
    subtasks: [
      { t: 'Definir template do certificado com o time de marca', done: false },
      { t: 'Job assíncrono de geração (WeasyPrint)', done: false },
      { t: 'Endpoint de download autenticado', done: false },
    ],
    comentarios: [
      { autor: 'u1', quando: '2026-06-08 09:12', texto: 'Prioridade sobe se o RH pedir os certificados do onboarding de junho. @Juliana Costa fica de olho.' },
    ],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
    ],
  },
  {
    codigo: 'DD-153', titulo: 'Filtro por cliente no dashboard de frota', epicId: 'e3',
    estado: 'A_FAZER', triagem: 'APROVADA', pontos: 2, resp: 'u6', colab: [], sprint: 's12', prioridade: 'P3',
    criadoPor: 'u6', criadoEm: '2026-05-27', diasNoEstado: 8, rollovers: 0,
    descricao: '## Contexto\nOperação pediu para filtrar o dashboard de frota por cliente (hoje só por região).\n\n## Escopo\n- Select com busca no topo do dashboard\n- Persistir filtro na sessão',
    subtasks: [
      { t: 'Endpoint /frota?cliente=', done: false },
      { t: 'Select com busca no front', done: false },
    ],
    comentarios: [],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
    ],
  },
  {
    codigo: 'DD-149', titulo: 'Reenvio de convite de acesso expirado', epicId: 'e2',
    estado: 'A_FAZER', triagem: 'APROVADA', pontos: 1, resp: 'u3', colab: [], sprint: 's12', prioridade: 'P3',
    criadoPor: 'u3', criadoEm: '2026-05-22', diasNoEstado: 8, rollovers: 0,
    descricao: 'Link de convite do GS Learning expira em 72h. Suporte precisa de botão "reenviar convite" na lista de colaboradores.',
    subtasks: [ { t: 'Botão + endpoint de reenvio', done: false }, { t: 'Invalidar link anterior', done: false } ],
    comentarios: [],
    transicoes: [ { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' } ],
  },

  /* ---------- SPRINT 12 · EM PROGRESSO ---------- */
  {
    codigo: 'DD-138', titulo: 'Reemissão de voucher expirado', epicId: 'e1',
    estado: 'EM_PROGRESSO', triagem: 'APROVADA', pontos: 5, resp: 'u2', colab: ['u5'], sprint: 's12', prioridade: 'P1',
    criadoPor: 'u2', criadoEm: '2026-05-14', diasNoEstado: 3, rollovers: 0,
    descricao: '## Contexto\nVouchers expirados hoje exigem cancelamento manual + emissão nova, gerando dois registros e quebrando o histórico do cliente.\n\n## Proposta\nAção **Reemitir** no detalhe do voucher expirado:\n\n- Gera novo código com validade renovada\n- Mantém vínculo com o voucher original (`reissued_from`)\n- Notifica o parceiro via webhook existente\n\n## Regras\n1. Só vouchers `EXPIRADO` podem ser reemitidos\n2. Máximo de **1 reemissão** por voucher\n3. Reemissão registra autor e motivo no log\n\n## Fora de escopo\n- Reemissão em lote\n- Alteração de valor na reemissão',
    subtasks: [
      { t: 'Migration: coluna reissued_from + índice', done: true },
      { t: 'Service de reemissão com validações', done: true },
      { t: 'Action no detalhe do voucher (front)', done: true },
      { t: 'Disparo do webhook de reemissão', done: true },
      { t: 'Testes de regra (1 reemissão, só expirado)', done: false },
      { t: 'Atualizar doc da API pública', done: false },
    ],
    comentarios: [
      { autor: 'u2', quando: '2026-06-08 10:41', texto: 'Webhook reaproveitou 90% do service de emissão. @Rafael Pires me ajudou a destravar a assinatura HMAC — vinculei como colaborador.' },
      { autor: 'u5', quando: '2026-06-08 11:02', texto: 'Tranquilo! O segredo era o encoding do payload. Deixei anotado no README do módulo.' },
      { autor: 'u1', quando: '2026-06-09 17:30', texto: 'Boa. Quando subir pra review me marca que eu valido junto com o pessoal do Voucher.' },
    ],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-05 09:18', autor: 'u2' },
    ],
  },
  {
    codigo: 'DD-144', titulo: 'Player de trilha: retomar de onde parou', epicId: 'e2',
    estado: 'EM_PROGRESSO', triagem: 'APROVADA', pontos: 3, resp: 'u3', colab: [], sprint: 's12', prioridade: 'P2',
    criadoPor: 'u1', criadoEm: '2026-05-20', diasNoEstado: 2, rollovers: 0,
    descricao: '## Contexto\nColaborador que fecha o player perde a posição do vídeo e o módulo atual.\n\n## Escopo\n- Salvar posição a cada 10s (debounce)\n- Botão "Continuar de onde parei" na home da trilha',
    subtasks: [
      { t: 'Endpoint de progresso (PATCH)', done: true },
      { t: 'Persistência no player', done: true },
      { t: 'CTA "Continuar" na home da trilha', done: false },
    ],
    comentarios: [
      { autor: 'u3', quando: '2026-06-09 14:20', texto: 'Salvar a cada 10s estava gerando muita escrita. Mudei pra 30s + save no pause/fechar. Algum problema, @André Souza?' },
      { autor: 'u1', quando: '2026-06-09 15:01', texto: 'Aprovado, registra a decisão na descrição.' },
    ],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-08 09:05', autor: 'u3' },
    ],
  },
  {
    codigo: 'DD-126', titulo: 'Alerta de antena sem sinal > 15 min', epicId: 'e3',
    estado: 'EM_PROGRESSO', triagem: 'APROVADA', pontos: 8, resp: 'u5', colab: ['u6'], sprint: 's12', prioridade: 'P1',
    criadoPor: 'u1', criadoEm: '2026-05-06', diasNoEstado: 1, rollovers: 1,
    bloqueio: { motivo: 'Aguardando credenciais da API da operadora (chamado #4821 aberto em 08/06)', desde: '2026-06-09 11:40' },
    descricao: '## Contexto\nAntenas que param de reportar posição só são percebidas quando o cliente reclama.\n\n## Proposta\nJob que varre últimos heartbeats e abre alerta quando o silêncio passa de 15 min, com escalonamento: painel → e-mail operação → SMS plantão.\n\n## Dependência externa\nConsulta de status da antena exige API da operadora (credenciais pendentes).',
    subtasks: [
      { t: 'Job de varredura de heartbeat', done: true },
      { t: 'Tabela de alertas + estados', done: true },
      { t: 'Painel de alertas na operação', done: true },
      { t: 'Integração API operadora (status da antena)', done: false },
      { t: 'Escalonamento e-mail/SMS', done: false },
    ],
    comentarios: [
      { autor: 'u5', quando: '2026-06-09 11:42', texto: 'Bloqueada: sem as credenciais não consigo distinguir "antena desligada" de "antena sem cobertura". Chamado #4821 na operadora.' },
      { autor: 'u1', quando: '2026-06-09 12:10', texto: 'Vou escalar com o comercial da operadora hoje. Segue nas outras subtasks se der.' },
    ],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-05-18 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-05-21 10:02', autor: 'u5' },
      { de: 'EM_PROGRESSO', para: 'BLOQUEADO', quando: '2026-06-09 11:40', autor: 'u5' },
    ],
  },
  {
    codigo: 'DD-152', titulo: 'Board: indicador de rollover no card', epicId: 'e4',
    estado: 'EM_PROGRESSO', triagem: 'APROVADA', pontos: 2, resp: 'u6', colab: [], sprint: 's12', prioridade: 'P3',
    criadoPor: 'u6', criadoEm: '2026-05-28', diasNoEstado: 1, rollovers: 0,
    descricao: 'Card do board deve mostrar quantas sprints a task já rolou (↻ n). Dado já existe no log de rollover.',
    subtasks: [ { t: 'Expor contagem no serializer do card', done: true }, { t: 'Chip ↻ no card', done: false } ],
    comentarios: [],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-09 09:30', autor: 'u6' },
    ],
  },

  /* ---------- SPRINT 12 · EM REVIEW ---------- */
  {
    codigo: 'DD-140', titulo: 'Rate limit na API pública de resgate', epicId: 'e1',
    estado: 'EM_REVIEW', triagem: 'APROVADA', pontos: 3, resp: 'u5', colab: [], sprint: 's12', prioridade: 'P1',
    criadoPor: 'u5', criadoEm: '2026-05-15', diasNoEstado: 1, rollovers: 0,
    descricao: '## Contexto\nParceiro X derrubou a API de resgate com 40 req/s num sorteio. Precisamos de rate limit por chave de parceiro.\n\n## Escopo\n- 10 req/s por chave, burst 20\n- Resposta 429 com Retry-After\n- Métrica de throttling no Grafana',
    subtasks: [
      { t: 'Middleware de rate limit (Redis)', done: true },
      { t: 'Header Retry-After + payload de erro', done: true },
      { t: 'Painel de throttling', done: true },
    ],
    comentarios: [ { autor: 'u5', quando: '2026-06-09 16:55', texto: 'Em review. @André Souza testei com k6: 200 req/s sustentado sem degradar o resto da API.' } ],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-03 09:12', autor: 'u5' },
      { de: 'EM_PROGRESSO', para: 'EM_REVIEW', quando: '2026-06-09 16:50', autor: 'u5' },
    ],
  },
  {
    codigo: 'DD-147', titulo: 'Daily: lembrete às 9h30 pra quem não registrou', epicId: 'e4',
    estado: 'EM_REVIEW', triagem: 'APROVADA', pontos: 2, resp: 'u4', colab: ['u2'], sprint: 's12', prioridade: 'P2',
    criadoPor: 'u4', criadoEm: '2026-05-21', diasNoEstado: 1, rollovers: 0,
    descricao: 'Notificação in-app às 9h30 para devs sem daily registrada no dia. Sem e-mail (fora de escopo do MVP).',
    subtasks: [ { t: 'Job agendado 9h30 (dias úteis)', done: true }, { t: 'Notificação com link direto pra daily', done: true } ],
    comentarios: [ { autor: 'u2', quando: '2026-06-09 11:15', texto: 'Ajudei na config do scheduler com feriados. Job pula feriado cadastrado, conforme RN-02.' } ],
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-04 14:00', autor: 'u4' },
      { de: 'EM_PROGRESSO', para: 'EM_REVIEW', quando: '2026-06-09 18:02', autor: 'u4' },
    ],
  },

  /* ---------- SPRINT 12 · CONCLUÍDO ---------- */
  {
    codigo: 'DD-129', titulo: 'Webhook de baixa de voucher para parceiros', epicId: 'e1',
    estado: 'CONCLUIDO', triagem: 'APROVADA', pontos: 5, resp: 'u2', colab: ['u3'], sprint: 's12', prioridade: 'P1',
    criadoPor: 'u1', criadoEm: '2026-05-07', diasNoEstado: 2, rollovers: 0, concluidaEm: '2026-06-08 15:34',
    tempos: { aFazer: 2.0, emProgresso: 3.1, bloqueado: 0.0, emReview: 0.8 },
    descricao: '## Contexto\nParceiros consultam baixa de voucher por polling (a cada 5 min), gerando carga inútil.\n\n## Proposta\nWebhook `voucher.redeemed` assinado (HMAC) com retry exponencial e painel de entregas por parceiro.',
    subtasks: [
      { t: 'Cadastro de endpoint por parceiro', done: true },
      { t: 'Disparo assinado com HMAC', done: true },
      { t: 'Retry exponencial (5 tentativas)', done: true },
      { t: 'Painel de entregas/falhas', done: true },
    ],
    comentarios: [
      { autor: 'u3', quando: '2026-06-04 10:22', texto: 'Peguei a parte do retry. Usei a mesma lib do GS Learning pra manter padrão.' },
      { autor: 'u1', quando: '2026-06-08 15:35', texto: 'Validado com o parceiro piloto. Excelente entrega.' },
    ],
    relatorioComplemento: 'Parceiro piloto (Rede Útil) validou em produção no dia 08/06. Próximo passo natural é descontinuar o endpoint de polling — sugerido como task nova no backlog (DD-158).',
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-02 09:40', autor: 'u2' },
      { de: 'EM_PROGRESSO', para: 'EM_REVIEW', quando: '2026-06-05 17:12', autor: 'u2' },
      { de: 'EM_REVIEW', para: 'CONCLUIDO', quando: '2026-06-08 15:34', autor: 'u1' },
    ],
  },
  {
    codigo: 'DD-142', titulo: 'Exportar lista de vouchers em CSV', epicId: 'e1',
    estado: 'CONCLUIDO', triagem: 'APROVADA', pontos: 2, resp: 'u4', colab: [], sprint: 's12', prioridade: 'P2',
    criadoPor: 'u4', criadoEm: '2026-05-18', diasNoEstado: 4, rollovers: 0, concluidaEm: '2026-06-04 11:20',
    tempos: { aFazer: 1.0, emProgresso: 1.6, bloqueado: 0.0, emReview: 0.4 },
    descricao: 'Exportação CSV da lista filtrada de vouchers (mesmos filtros da tela). Assíncrona acima de 10k linhas.',
    subtasks: [ { t: 'Export síncrono < 10k', done: true }, { t: 'Fila p/ exports grandes', done: true } ],
    comentarios: [],
    relatorioComplemento: '',
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-02 10:00', autor: 'u4' },
      { de: 'EM_PROGRESSO', para: 'EM_REVIEW', quando: '2026-06-03 16:40', autor: 'u4' },
      { de: 'EM_REVIEW', para: 'CONCLUIDO', quando: '2026-06-04 11:20', autor: 'u1' },
    ],
  },
  {
    codigo: 'DD-146', titulo: 'Tela de login do DevDesk', epicId: 'e4',
    estado: 'CONCLUIDO', triagem: 'APROVADA', pontos: 1, resp: 'u6', colab: [], sprint: 's12', prioridade: 'P2',
    criadoPor: 'u1', criadoEm: '2026-05-25', diasNoEstado: 6, rollovers: 0, concluidaEm: '2026-06-02 14:08',
    tempos: { aFazer: 0.5, emProgresso: 0.9, bloqueado: 0.0, emReview: 0.2 },
    descricao: 'Login e-mail + senha com bloqueio após 5 tentativas (RF-04) e troca obrigatória no primeiro acesso (RF-05).',
    subtasks: [ { t: 'Form + validações', done: true }, { t: 'Bloqueio 15 min', done: true }, { t: 'Fluxo primeira senha', done: true } ],
    comentarios: [],
    relatorioComplemento: '',
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-01 13:00', autor: 'u6' },
      { de: 'EM_PROGRESSO', para: 'EM_REVIEW', quando: '2026-06-02 11:30', autor: 'u6' },
      { de: 'EM_REVIEW', para: 'CONCLUIDO', quando: '2026-06-02 14:08', autor: 'u1' },
    ],
  },
  {
    codigo: 'DD-137', titulo: 'Mapa: clusterizar pins acima de 200 veículos', epicId: 'e3',
    estado: 'CONCLUIDO', triagem: 'APROVADA', pontos: 3, resp: 'u3', colab: [], sprint: 's12', prioridade: 'P2',
    criadoPor: 'u3', criadoEm: '2026-05-13', diasNoEstado: 1, rollovers: 0, concluidaEm: '2026-06-09 10:15',
    tempos: { aFazer: 3.0, emProgresso: 2.2, bloqueado: 0.0, emReview: 0.6 },
    descricao: 'Mapa da frota trava com >200 veículos renderizados. Clusterizar pins com contagem e expandir no zoom.',
    subtasks: [ { t: 'Lib de cluster no mapa', done: true }, { t: 'Estilo dos clusters', done: true }, { t: 'Teste com frota de 800', done: true } ],
    comentarios: [],
    relatorioComplemento: '',
    transicoes: [
      { de: 'BACKLOG', para: 'A_FAZER', quando: '2026-06-01 09:00', autor: 'u1' },
      { de: 'A_FAZER', para: 'EM_PROGRESSO', quando: '2026-06-04 09:00', autor: 'u3' },
      { de: 'EM_PROGRESSO', para: 'EM_REVIEW', quando: '2026-06-08 14:30', autor: 'u3' },
      { de: 'EM_REVIEW', para: 'CONCLUIDO', quando: '2026-06-09 10:15', autor: 'u1' },
    ],
  },

  /* ---------- BACKLOG ---------- */
  {
    codigo: 'DD-158', titulo: 'Descontinuar endpoint de polling de baixa', epicId: 'e1',
    estado: 'BACKLOG', triagem: 'PENDENTE_APROVACAO', pontos: null, resp: null, colab: [], sprint: null, prioridade: null,
    criadoPor: 'u2', criadoEm: '2026-06-08', diasNoEstado: 2, rollovers: 0,
    descricao: 'Com o webhook de baixa em produção (DD-129), o endpoint de polling pode ser descontinuado. Sugestão: sunset de 60 dias com aviso aos parceiros.',
    subtasks: [], comentarios: [], transicoes: [],
  },
  {
    codigo: 'DD-159', titulo: 'GS Learning: quiz ao fim de cada módulo', epicId: 'e2',
    estado: 'BACKLOG', triagem: 'PENDENTE_APROVACAO', pontos: null, resp: null, colab: [], sprint: null, prioridade: null,
    criadoPor: 'u4', criadoEm: '2026-06-09', diasNoEstado: 1, rollovers: 0,
    descricao: 'RH pediu avaliação de retenção: quiz de 5 questões ao fim de cada módulo, nota mínima 70% pra avançar.',
    subtasks: [], comentarios: [ { autor: 'u4', quando: '2026-06-09 09:50', texto: 'Provavelmente é maior que 8 pontos — sugiro quebrar em editor de quiz + player de quiz.' } ], transicoes: [],
  },
  {
    codigo: 'DD-156', titulo: 'Auditoria: tela de log de transições por task', epicId: 'e4',
    estado: 'BACKLOG', triagem: 'APROVADA', pontos: 3, resp: null, colab: [], sprint: null, prioridade: 'P2',
    criadoPor: 'u1', criadoEm: '2026-06-05', diasNoEstado: 5, rollovers: 0,
    descricao: 'Expor o log imutável de transições (RN-15) numa aba da task, com autor, origem, destino e timestamp.',
    subtasks: [], comentarios: [], transicoes: [],
  },
  {
    codigo: 'DD-155', titulo: 'Voucher: busca por CPF mascarado', epicId: 'e1',
    estado: 'BACKLOG', triagem: 'APROVADA', pontos: 2, resp: null, colab: [], sprint: null, prioridade: 'P2',
    criadoPor: 'u5', criadoEm: '2026-06-03', diasNoEstado: 7, rollovers: 0,
    descricao: 'Suporte busca voucher por CPF, mas a tela exige código. Adicionar busca por CPF com máscara e auditoria de consulta (LGPD).',
    subtasks: [], comentarios: [], transicoes: [],
  },
  {
    codigo: 'DD-154', titulo: 'Rastreio: replay de rota das últimas 24h', epicId: 'e3',
    estado: 'BACKLOG', triagem: 'APROVADA', pontos: 5, resp: null, colab: [], sprint: null, prioridade: 'P1',
    criadoPor: 'u1', criadoEm: '2026-06-02', diasNoEstado: 8, rollovers: 0,
    descricao: '## Contexto\nCliente quer ver o trajeto percorrido pelo veículo nas últimas 24h com player (play/pause/velocidade).\n\n## Escopo\n- Timeline com slider\n- Marcadores de parada > 10 min',
    subtasks: [], comentarios: [], transicoes: [],
  },
  {
    codigo: 'DD-157', titulo: 'Notificação de menção com preview do comentário', epicId: 'e4',
    estado: 'BACKLOG', triagem: 'PENDENTE_APROVACAO', pontos: null, resp: null, colab: [], sprint: null, prioridade: null,
    criadoPor: 'u6', criadoEm: '2026-06-07', diasNoEstado: 3, rollovers: 0,
    descricao: 'O sino mostra "você foi mencionado", mas sem o texto. Incluir preview de 2 linhas do comentário na notificação.',
    subtasks: [], comentarios: [], transicoes: [],
  },
  {
    codigo: 'DD-148', titulo: 'Learning: modo offline do player', epicId: 'e2',
    estado: 'CANCELADO', triagem: 'APROVADA', pontos: 5, resp: null, colab: [], sprint: null, prioridade: null,
    criadoPor: 'u3', criadoEm: '2026-05-21', diasNoEstado: 12, rollovers: 0,
    cancelamento: { motivo: 'PWA instalável está fora dos não-objetivos do MVP. Reavaliar na fase 2.', quando: '2026-05-29 16:00', autor: 'u1' },
    descricao: 'Permitir baixar módulos pra assistir offline.',
    subtasks: [], comentarios: [], transicoes: [],
  },

  /* ---------- SPRINT 13 (planejada) ---------- */
  {
    codigo: 'DD-150', titulo: 'Importação CSV de colaboradores (GS Learning)', epicId: 'e2',
    estado: 'A_FAZER', triagem: 'APROVADA', pontos: 5, resp: 'u2', colab: [], sprint: 's13', prioridade: 'P1',
    criadoPor: 'u1', criadoEm: '2026-05-26', diasNoEstado: 0, rollovers: 0,
    descricao: '## Contexto\nOnboarding de turmas grandes é manual. RH quer subir CSV com nome, e-mail e cargo.\n\n## Escopo\n- Upload com validação linha a linha\n- Relatório de erros por linha\n- Convites disparados em lote',
    subtasks: [], comentarios: [], transicoes: [],
  },
  {
    codigo: 'DD-145', titulo: 'Voucher: relatório mensal por parceiro (PDF)', epicId: 'e1',
    estado: 'A_FAZER', triagem: 'APROVADA', pontos: 3, resp: 'u4', colab: [], sprint: 's13', prioridade: 'P2',
    criadoPor: 'u1', criadoEm: '2026-05-22', diasNoEstado: 0, rollovers: 0,
    descricao: 'Consolidado mensal de emissões/resgates por parceiro, gerado dia 1º e disponível no painel do parceiro.',
    subtasks: [], comentarios: [], transicoes: [],
  },
];

/* ---------- Dailies ---------- */
window.DD_DAILIES = [
  { user: 'u2', data: '2026-06-10', registradaAs: '09:12',
    fiz: [ { texto: 'Fechei o disparo do webhook de reemissão', task: 'DD-138' } ],
    farei: [ { texto: 'Testes de regra + doc da API', task: 'DD-138' } ],
    impedimentos: [] },
  { user: 'u3', data: '2026-06-10', registradaAs: '09:05',
    fiz: [ { texto: 'Persistência de progresso no player', task: 'DD-144' }, { texto: 'Review do cluster do mapa com o André', task: 'DD-137' } ],
    farei: [ { texto: 'CTA "Continuar de onde parei"', task: 'DD-144' } ],
    impedimentos: [] },
  { user: 'u5', data: '2026-06-10', registradaAs: '09:31',
    fiz: [ { texto: 'Subi o rate limit pra review com teste de carga', task: 'DD-140' } ],
    farei: [ { texto: 'Escalonamento e-mail/SMS enquanto a API da operadora não sai', task: 'DD-126' } ],
    impedimentos: [ { texto: 'Credenciais da operadora seguem pendentes (chamado #4821)', task: 'DD-126' } ] },
  { user: 'u6', data: '2026-06-10', registradaAs: '09:48',
    fiz: [ { texto: 'Serializer do contador de rollover', task: 'DD-152' } ],
    farei: [ { texto: 'Chip ↻ no card do board', task: 'DD-152' }, { texto: 'Começo o filtro por cliente', task: 'DD-153' } ],
    impedimentos: [] },
  { user: 'u4', data: '2026-06-09', registradaAs: '09:22',
    fiz: [ { texto: 'Job do lembrete da daily', task: 'DD-147' } ],
    farei: [ { texto: 'Subo o lembrete pra review', task: 'DD-147' } ],
    impedimentos: [] },
];

/* ---------- Notificações ---------- */
window.DD_NOTIFS = [
  { id: 'n1', tipo: 'review',   lida: false, quando: '09:48', texto: 'DD-147 movida para Em Review por Juliana Costa', task: 'DD-147' },
  { id: 'n2', tipo: 'bloqueio', lida: false, quando: 'ontem', texto: 'DD-126 bloqueada por Rafael Pires — "Aguardando credenciais da operadora"', task: 'DD-126' },
  { id: 'n3', tipo: 'mencao',   lida: false, quando: 'ontem', texto: 'Thiago Melo mencionou você em DD-144', task: 'DD-144' },
  { id: 'n4', tipo: 'triagem',  lida: true,  quando: 'ontem', texto: '2 tasks aguardando aprovação na triagem (DD-158, DD-159)', task: null },
  { id: 'n5', tipo: 'review',   lida: true,  quando: 'seg',   texto: 'DD-140 movida para Em Review por Rafael Pires', task: 'DD-140' },
];

/* ---------- Métricas ---------- */
window.DD_METRICS = {
  velocity: [
    { sprint: 'S7', pts: 26 }, { sprint: 'S8', pts: 31 }, { sprint: 'S9', pts: 28 },
    { sprint: 'S10', pts: 35 }, { sprint: 'S11', pts: 33 },
  ],
  velocityMedia3: 32,
  /* burndown sprint 12: 10 dias úteis, comprometido 42 pts; hoje = dia 8 */
  burndown: { comprometido: 42, diaAtual: 8, real: [42, 42, 39, 36, 36, 31, 28, 26, 23] },
  throughput: [ { sprint: 'S7', n: 9 }, { sprint: 'S8', n: 11 }, { sprint: 'S9', n: 10 }, { sprint: 'S10', n: 13 }, { sprint: 'S11', n: 12 } ],
  rollover: [ { sprint: 'S7', pct: 19 }, { sprint: 'S8', pct: 16 }, { sprint: 'S9', pct: 11 }, { sprint: 'S10', pct: 12 }, { sprint: 'S11', pct: 6 } ],
  leadTimeMedio: 6.4,
  cyclePorPonto: [
    { pts: 1, dias: 0.9, bloqueado: 0.1, amostra: 14 },
    { pts: 2, dias: 1.6, bloqueado: 0.2, amostra: 21 },
    { pts: 3, dias: 2.4, bloqueado: 0.3, amostra: 18 },
    { pts: 5, dias: 4.1, bloqueado: 0.8, amostra: 12 },
    { pts: 8, dias: 6.8, bloqueado: 1.4, amostra: 5 },
  ],
  individual: [
    { user: 'u2', ptsSprint: 7, tasksSprint: 2, cycleMedio: 2.8, colaboracoes: 3 },
    { user: 'u3', ptsSprint: 3, tasksSprint: 1, cycleMedio: 2.3, colaboracoes: 2 },
    { user: 'u4', ptsSprint: 2, tasksSprint: 1, cycleMedio: 1.9, colaboracoes: 1 },
    { user: 'u5', ptsSprint: 0, tasksSprint: 0, cycleMedio: 3.4, colaboracoes: 4 },
    { user: 'u6', ptsSprint: 1, tasksSprint: 1, cycleMedio: 1.5, colaboracoes: 1 },
  ],
};

/* ---------- Constantes de domínio ---------- */
window.DD_ESTADOS = {
  BACKLOG:      { rotulo: 'Backlog',      cor: '#8B96A5' },
  A_FAZER:      { rotulo: 'A Fazer',      cor: '#7A9BF0' },
  EM_PROGRESSO: { rotulo: 'Em Progresso', cor: '#E8B84B' },
  BLOQUEADO:    { rotulo: 'Bloqueado',    cor: '#F0635C' },
  EM_REVIEW:    { rotulo: 'Em Review',    cor: '#C58BE8' },
  CONCLUIDO:    { rotulo: 'Concluído',    cor: '#4FC98B' },
  CANCELADO:    { rotulo: 'Cancelado',    cor: '#5C6675' },
};

/* Transições válidas (RN-01). 'CANCELADO' é só TechLead, de qualquer estado. */
window.DD_TRANSICOES_VALIDAS = {
  A_FAZER:      ['EM_PROGRESSO'],
  EM_PROGRESSO: ['EM_REVIEW', 'A_FAZER'],
  EM_REVIEW:    ['CONCLUIDO', 'EM_PROGRESSO'],
  CONCLUIDO:    [],
};
