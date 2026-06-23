/* DevDesk — app raiz: estado global, regras de transição, roteamento */
const { useState: useStateA, useEffect: useEffectA } = React;

function App() {
  const [logado, setLogado] = useStateA(() => sessionStorage.getItem('dd-logado') === '1');
  const [papel, setPapelRaw] = useStateA(() => sessionStorage.getItem('dd-papel') || 'techlead');
  const [tela, setTelaRaw] = useStateA(() => sessionStorage.getItem('dd-tela') || 'board');
  const [tasks, setTasks] = useStateA(window.DD_TASKS);
  const [epics, setEpics] = useStateA(window.DD_EPICS);
  const [dailies, setDailies] = useStateA(window.DD_DAILIES);
  const [taskAberta, setTaskAberta] = useStateA(null);
  const [relatorio, setRelatorio] = useStateA(null);
  const toast = useToast();

  const setTela = (t) => { setTelaRaw(t); sessionStorage.setItem('dd-tela', t); setRelatorio(null); };
  const setPapel = (p) => {
    setPapelRaw(p); sessionStorage.setItem('dd-papel', p);
    const permitidas = NAV.filter((n) => n.perfis.includes(p)).map((n) => n.id);
    if (!permitidas.includes(tela)) setTela(permitidas[0]);
    setTaskAberta(null); setRelatorio(null);
  };
  const entrar = () => { setLogado(true); sessionStorage.setItem('dd-logado', '1'); };
  const sair = () => { setLogado(false); sessionStorage.removeItem('dd-logado'); };

  const atualizar = (codigo, fn) => setTasks((ts) => ts.map((t) => (t.codigo === codigo ? fn(t) : t)));
  const agora = () => '2026-06-10 ' + new Date().toTimeString().slice(0, 5);
  const eu = PAPEL_USER[papel];

  /* transição de estado com validação RN-01 */
  const moverTask = (codigo, destino) => {
    const t = tasks.find((x) => x.codigo === codigo);
    if (!t || t.estado === destino) return;
    if (t.bloqueio) { toast(`${codigo} está bloqueada — desbloqueie antes de mover (RN-09)`, 'erro'); return; }
    const validas = window.DD_TRANSICOES_VALIDAS[t.estado] || [];
    if (!validas.includes(destino)) {
      toast(`Transição ${window.DD_ESTADOS[t.estado].rotulo} → ${window.DD_ESTADOS[destino].rotulo} não é permitida (RN-01)`, 'erro');
      return;
    }
    if (destino === 'CONCLUIDO' && papel !== 'techlead') {
      toast('Apenas o TechLead valida e conclui uma task (RN-01)', 'erro');
      return;
    }
    if (papel === 'dev' && t.resp !== eu) {
      toast('Você só movimenta tasks sob sua responsabilidade', 'erro');
      return;
    }
    if (papel === 'viewer') return;
    atualizar(codigo, (x) => ({
      ...x,
      estado: destino,
      diasNoEstado: 0,
      ...(destino === 'CONCLUIDO' ? {
        concluidaEm: agora(),
        tempos: x.tempos || { aFazer: 1.5, emProgresso: x.diasNoEstado || 1, bloqueado: 0, emReview: 0.3 },
        relatorioComplemento: x.relatorioComplemento || '',
      } : {}),
      transicoes: [...x.transicoes, { de: x.estado, para: destino, quando: agora(), autor: eu }],
    }));
    if (destino === 'CONCLUIDO') toast(`${codigo} concluída — relatório de entrega gerado automaticamente (RN-10)`);
    else if (destino === 'EM_REVIEW') toast(`${codigo} em review — TechLead notificado`);
    else toast(`${codigo} → ${window.DD_ESTADOS[destino].rotulo}`);
  };

  const toggleSub = (codigo, i) => atualizar(codigo, (t) => ({
    ...t, subtasks: t.subtasks.map((s, j) => (j === i ? { ...s, done: !s.done } : s)),
  }));

  const addSub = (codigo, texto) => {
    atualizar(codigo, (t) => ({ ...t, subtasks: [...t.subtasks, { t: texto, done: false }] }));
    toast('Subtask adicionada — checklist de execução, não pontua (RN-06)');
  };

  const editarDesc = (codigo, texto) => {
    atualizar(codigo, (t) => ({ ...t, descricao: texto }));
    toast(`Documentação de ${codigo} atualizada`);
  };

  const criarEpico = (nome, descricao, cor) => {
    const novo = { id: `e${Date.now()}`, nome, descricao, cor, totalPts: 0, donePts: 0 };
    window.DD_EPICS.push(novo);
    setEpics([...window.DD_EPICS]);
    toast(`Épico "${nome}" criado — vincule tasks no backlog (RF-06)`);
  };

  const comentar = (codigo, texto) => {
    atualizar(codigo, (t) => ({ ...t, comentarios: [...t.comentarios, { autor: eu, quando: agora(), texto }] }));
    toast('Comentário publicado');
  };

  const bloquear = (codigo, motivo) => {
    atualizar(codigo, (t) => ({ ...t, bloqueio: { motivo, desde: agora() } }));
    toast(`${codigo} bloqueada — TechLead notificado, tempo medido à parte (RN-09)`, 'erro');
  };
  const desbloquear = (codigo) => {
    atualizar(codigo, (t) => ({ ...t, bloqueio: null }));
    toast(`${codigo} desbloqueada — de volta a ${window.DD_ESTADOS[tasks.find((x) => x.codigo === codigo).estado].rotulo}`);
  };

  const aprovar = (codigo) => {
    atualizar(codigo, (t) => ({ ...t, triagem: 'APROVADA' }));
    toast(`${codigo} aprovada na triagem — elegível a sprint (RN-08)`);
  };
  const recusar = (codigo) => {
    atualizar(codigo, (t) => ({ ...t, estado: 'CANCELADO', cancelamento: { motivo: 'Recusada na triagem', quando: agora(), autor: eu } }));
    toast(`${codigo} recusada — cancelada com histórico preservado (RN-13)`);
  };
  const criarTask = (titulo, desc, epicId) => {
    const n = Math.max(...tasks.map((t) => Number(t.codigo.slice(3)))) + 1;
    const codigo = `DD-${n}`;
    setTasks((ts) => [...ts, {
      codigo, titulo, descricao: desc || 'Sem descrição ainda — o TechLead completa a documentação na triagem.',
      epicId: epicId, estado: 'BACKLOG',
      triagem: papel === 'techlead' ? 'APROVADA' : 'PENDENTE_APROVACAO',
      pontos: null, resp: null, colab: [], sprint: null, prioridade: null,
      criadoPor: eu, criadoEm: '2026-06-10', diasNoEstado: 0, rollovers: 0,
      subtasks: [], comentarios: [], transicoes: [],
    }]);
    toast(`${codigo} criada no Backlog${papel === 'dev' ? ' — aguardando aprovação do TechLead' : ''}`);
  };

  const definirPlanning = (codigo, campo, valor) => atualizar(codigo, (t) => ({ ...t, [campo]: valor }));
  const alocar = (codigo, sprintId) => {
    const t = tasks.find((x) => x.codigo === codigo);
    if (t.pontos == null || t.resp == null) { toast('Task só entra em sprint com pontuação e responsável (RN-03)', 'erro'); return; }
    atualizar(codigo, (x) => ({
      ...x, sprint: sprintId, estado: 'A_FAZER', prioridade: x.prioridade || 'P2',
      transicoes: [...x.transicoes, { de: 'BACKLOG', para: 'A_FAZER', quando: agora(), autor: eu }],
    }));
    toast(`${codigo} alocada na Sprint 13 — pontuação travada (RN-05)`);
  };
  const removerDaSprint = (codigo) => {
    atualizar(codigo, (x) => ({ ...x, sprint: null, estado: 'BACKLOG', transicoes: x.transicoes.slice(0, -1) }));
    toast(`${codigo} devolvida ao backlog`);
  };

  const registrarDaily = (userId, fiz, farei, imped) => {
    const parse = (txt) => txt.trim() ? txt.split('\n').filter(Boolean).map((linha) => {
      const m = linha.match(/DD-\d+/);
      return { texto: linha.replace(/\s*\(?DD-\d+\)?/, '').trim(), task: m ? m[0] : null };
    }) : [];
    const jaExistia = dailies.some((d) => d.user === userId && d.data === window.DD_HOJE);
    setDailies((ds) => [
      { user: userId, data: window.DD_HOJE, registradaAs: new Date().toTimeString().slice(0, 5), fiz: parse(fiz), farei: parse(farei), impedimentos: parse(imped) },
      ...ds.filter((d) => !(d.user === userId && d.data === window.DD_HOJE)),
    ]);
    toast(jaExistia ? 'Daily atualizada — editável até o fim do dia (RN-12)' : 'Daily registrada — editável até o fim do dia (RN-12)');
  };

  if (!logado) return <TelaLogin onEntrar={entrar}></TelaLogin>;

  const abrirTask = (codigo) => setTaskAberta(codigo);
  const abrirRelatorio = (codigo) => { setTaskAberta(null); setRelatorio(codigo); };

  return (
    <div className="dd-shell">
      <Sidebar tela={relatorio ? 'board' : tela} setTela={setTela} papel={papel} setPapel={setPapel} tasks={tasks} onSair={sair}></Sidebar>
      {relatorio
        ? <TelaRelatorio codigo={relatorio} tasks={tasks} papel={papel} onVoltar={() => setRelatorio(null)} onOpen={abrirTask}></TelaRelatorio>
        : tela === 'board' ? <TelaBoard tasks={tasks} papel={papel} onOpen={abrirTask} onMove={moverTask}></TelaBoard>
        : tela === 'backlog' ? <TelaBacklog tasks={tasks} papel={papel} onOpen={abrirTask} onAprovar={aprovar} onRecusar={recusar} onCriar={criarTask}></TelaBacklog>
        : tela === 'planning' ? <TelaPlanning tasks={tasks} papel={papel} onOpen={abrirTask} onAlocar={alocar} onRemover={removerDaSprint} onDefinir={definirPlanning}></TelaPlanning>
        : tela === 'epicos' ? <TelaEpicos epics={epics} tasks={tasks} papel={papel} onOpen={abrirTask} onCriarEpico={criarEpico}></TelaEpicos>
        : tela === 'daily' ? <TelaDaily papel={papel} onOpen={abrirTask} dailies={dailies} onRegistrar={registrarDaily}></TelaDaily>
        : <TelaMetricas papel={papel} onAbrirRelatorio={abrirRelatorio}></TelaMetricas>}
      {taskAberta ? (
        <TaskDrawer codigo={taskAberta} tasks={tasks} papel={papel}
          onClose={() => setTaskAberta(null)} onMove={moverTask} onToggleSub={toggleSub}
          onComentar={comentar} onBloquear={bloquear} onDesbloquear={desbloquear}
          onAbrirRelatorio={abrirRelatorio} onEditarDesc={editarDesc} onAddSub={addSub}
          onAprovar={aprovar} onRecusar={recusar}></TaskDrawer>
      ) : null}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <ToastHost><App></App></ToastHost>
);
