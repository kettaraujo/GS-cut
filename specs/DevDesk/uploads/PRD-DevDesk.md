# PRD — DevDesk

>Decisões técnicas (stack, modelo de dados, padrões de código, ADRs) serão documentadas em `ARCHITECTURE.md`. Este documento foca em **o que** o sistema faz, não em **como**.

## Sumário Executivo

O DevDesk é a plataforma web interna de gestão de tarefas do time de Desenvolvimento do Grupo Golden Sat. Seu objetivo é substituir o acompanhamento informal ("boca a boca") por um fluxo estruturado de **Épico → Task → Subtask**, organizado em **sprints de 10 dias úteis**, com métricas calculadas automaticamente a partir do histórico real de trabalho.

A premissa central é o binômio **previsibilidade** e **visibilidade ponta a ponta**. O TechLead deixa de gerenciar demandas de memória; cada task tem responsável, pontuação, sprint e trilha completa de estados com timestamp; a diretoria passa a ter resposta baseada em dados para "quanto tempo leva" e "quando fica pronto".

O sistema é uma aplicação web multi-perfil: o **TechLead/Manager** aprova e prioriza tasks, monta sprints e acompanha métricas; **Devs** criam tasks no backlog, executam, registram dailies e colaboram entre si; um perfil **Viewer** dá acesso somente-leitura aos dashboards agregados, preparado para a diretoria.

Três módulos diferenciam o DevDesk das ferramentas de mercado (Jira, Trello, Linear): **daily documentada** como entidade de primeira classe, **crédito de colaboração** entre devs (ajuda deixa de ser invisível) e **relatório de entrega gerado automaticamente** ao concluir cada task.

A estimativa é feita em **story points** (escala 1, 2, 3, 5, 8); o tempo real é métrica do sistema, não promessa do dev. O sistema cruza pontuação com cycle time medido e responde empiricamente quanto tempo cada faixa de complexidade leva no time.

Público-alvo: time de Desenvolvimento do Grupo Golden Sat (estimativa MVP de 5–15 usuários ativos, 1 time, sprints contínuas). Sistema single-tenant interno. MVP previsto em 8 semanas de desenvolvimento.

## Problema e Oportunidade

### Contexto do Negócio

O time de Desenvolvimento do Grupo Golden Sat não possui hoje nenhum sistema de acompanhamento de tarefas. Demandas chegam por conversa, são distribuídas verbalmente e acompanhadas de memória. Não existe registro formal de quem está fazendo o quê, há quanto tempo, nem do que já foi entregue.

Com a chegada do novo CEO, foi solicitada a criação de um fluxo de métricas do time de desenvolvimento: quanto tempo cada task leva para ser feita, como está a distribuição de trabalho dentro da sprint e acompanhamento ponta a ponta (e2e) das entregas. Hoje nenhuma dessas perguntas pode ser respondida com dados.

Ferramentas maduras existem no mercado — Jira, Trello, Linear — mas trazem excesso de módulos que não serão usados, custo por usuário em funcionalidades essenciais, e qualquer necessidade fora do produto exige ferramenta externa. O Grupo já desenvolve e opera sistemas internos no mesmo padrão (GS Voucher, GS Learning, Automação); um sistema próprio garante exatamente os módulos necessários e controle total para evoluir.

### Problemas Específicos

- Não há registro formal de tasks: distribuição, status e histórico vivem na memória das pessoas.
- Impossível estimar prazo de entrega de uma task ou de um projeto completo — qualquer prazo comunicado é chute.
- Ajuda entre devs é invisível: quem interrompe o próprio trabalho para destravar um colega não tem isso contabilizado.
- O conteúdo das dailies se perde: impedimentos citados não geram registro nem acompanhamento.
- A diretoria não tem visibilidade nenhuma do fluxo de desenvolvimento; relatórios, quando existem, são manuais e pontuais.

### Oportunidade

Uma plataforma web interna resolve os cinco problemas simultaneamente: (a) toda demanda vira task registrada com responsável, estado e histórico; (b) pontuação por story points + cycle time medido transformam prazo em projeção baseada em dados; (c) vínculo de colaborador torna a ajuda entre devs visível e contabilizada; (d) daily estruturada cria histórico pesquisável de progresso e impedimentos; (e) dashboards respondem às perguntas da diretoria sem trabalho manual.

A solução é específica para o contexto do Grupo Golden Sat: aplicação web responsiva, single-tenant, com board kanban, sprints de cadência fixa com rollover automático e dicionário fechado de métricas (cycle time, lead time, throughput, velocity, taxa de rollover, burndown). Foco em fluxo enxuto e opinativo — workflow único, sem customização —, não em replicar a flexibilidade do Jira.

## Objetivo

### Objetivos de Produto

1. Registrar 100% das demandas do time como tasks com responsável, pontuação, sprint e trilha auditável de estados.
2. Responder "quanto tempo uma task leva" com dados medidos: cycle time real cruzado com a faixa de story points.
3. Responder "quando o projeto fica pronto" com projeção de Épico: pontos restantes ÷ velocity do time.
4. Tornar visível e contabilizável a colaboração entre devs e o conteúdo das dailies.
5. Eliminar canais paralelos de acompanhamento (planilhas, conversas soltas) como fonte de verdade do trabalho do time.

### Não-Objetivos

- Integração com Git (GitHub/GitLab) para contagem e vínculo de commits por task. Fica para a fase 2; o relatório de entrega já nasce preparado para receber esse dado.
- Notificações por e-mail (exceto recuperação de senha). Notificação é sino in-app.
- Workflows customizados por projeto, automações ("quando X então Y"), campos customizados, múltiplos tipos de board. A simplicidade do workflow único é decisão de produto.
- Multi-time ou multi-tenant. O DevDesk nasce para o time de Desenvolvimento do Grupo Golden Sat.
- Apontamento manual de horas (time tracking). Tempo é derivado das transições de estado, nunca digitado.
- Roadmap visual / Gantt. A projeção de Épico via velocity cobre a necessidade de prazo no MVP.
- Aplicativo mobile nativo ou PWA instalável. Interface web responsiva acessível pelo navegador.
- Integração com Slack, Teams ou similares.
- Anexo/hospedagem de vídeo em tasks. Anexos são arquivos leves (imagens, PDFs, logs).
- Tradução de interface. PT-BR exclusivamente.

## Personas

- **Dev (desenvolvedor do time):** cria tasks no Backlog quando identifica demanda, executa as tasks atribuídas a ele, quebra em subtasks, movimenta o card no board, comenta, registra a daily, pede e presta ajuda como colaborador. Login por e-mail + senha definida pelo TechLead no cadastro. Troca senha no primeiro acesso.

- **TechLead/Manager:** gestor do time. Cadastra usuários, aprova e prioriza tasks do Backlog, completa a documentação da demanda (descrição em Markdown dentro da task), gerencia Épicos, define pontuação e responsável na planning, monta a sprint, acompanha board e métricas completas (time e individuais), cancela tasks, reemite/ajusta o que for necessário. Opera no painel da aplicação, sem acesso ao `/admin` do Django.

- **Viewer:** perfil somente-leitura com acesso aos dashboards agregados do time (velocity, burndown, throughput, projeções de Épico). Não vê métricas individuais por dev. Pensado para diretoria/CEO, caso passe a acompanhar.

- **Superusuário (Staff interno):** acesso ao `/admin` do Django para configurações sistêmicas — parâmetros de sprint (cadência, dia de início), escala de pontuação, feriados que afetam a contagem de dias úteis. Não opera o fluxo diário.

## Histórias de Usuário

- **TechLead/Manager:**
    - Como TechLead, quero cadastrar os devs do time com e-mail, nome e senha inicial, para liberar acesso à plataforma. (RF-05)
    - Como TechLead, quero criar Épicos e vincular tasks a eles, para acompanhar o progresso de um projeto completo. (RF-06)
    - Como TechLead, quero aprovar tasks criadas pelos devs no Backlog, para manter a triagem sob controle sem impedir o registro de demandas. (RF-08, RN-08)
    - Como TechLead, quero documentar a demanda em Markdown dentro da própria task, para que o "mini-PRD" viva junto do trabalho. (RF-10)
    - Como TechLead, quero pontuar a task na planning e atribuir o responsável, para que ela entre na sprint pronta para execução. (RF-12, RF-14, RN-03)
    - Como TechLead, quero que tasks não concluídas rolem automaticamente para a próxima sprint, para que a taxa de rollover vire métrica de planejamento sem trabalho manual. (RF-17, RN-07)
    - Como TechLead, quero ver dashboards de velocity, cycle time por faixa de ponto e projeção de Épico, para responder prazos com dados. (RF-30, RF-32, RF-33)
    - Como TechLead, quero exportar relatórios consolidados, para apresentar resultados à diretoria. (RF-34)

- **Dev:**
    - Como dev, quero entrar com meu e-mail e senha, para acessar minhas tasks e o board do time. (RF-01)
    - Como dev, quero criar uma task no Backlog quando encontro um bug ou identifico melhoria, para registrar a demanda sem depender do TechLead. (RF-07, RN-08)
    - Como dev, quero quebrar minha task em subtasks e marcá-las conforme concluo, para organizar a execução e mostrar progresso. (RF-11)
    - Como dev, quero mover meu card no board conforme avanço, para que o estado real do trabalho esteja sempre visível. (RF-15, RF-16)
    - Como dev, quero marcar uma task como Bloqueada informando o motivo, para que o impedimento fique registrado e visível. (RF-18, RN-09)
    - Como dev, quero comentar na task e mencionar colegas, para concentrar a comunicação no contexto do trabalho. (RF-19)
    - Como dev, quero ser vinculado como colaborador quando ajudo um colega, para que essa ajuda apareça nas minhas métricas. (RF-20, RF-21, RN-11)
    - Como dev, quero registrar minha daily (fiz / farei / impedimentos) vinculando às tasks, para documentar o que hoje se perde na conversa. (RF-22)
    - Como dev, quero que o relatório de entrega seja gerado automaticamente quando concluo a task, para apenas revisar e complementar em vez de escrever do zero. (RF-25, RF-26, RN-10)

- **Viewer:**
    - Como viewer, quero acessar o dashboard agregado do time em modo leitura, para acompanhar a evolução das entregas sem interferir no fluxo. (RF-35, RN-14)

## Regras de Negócio

Decisões normativas que regem o ciclo da task, da sprint e das métricas, separadas dos requisitos funcionais para dar peso e facilitar futuras revisões.

- **RN-01:** O workflow da task é único e fixo: `Backlog → A Fazer → Em Progresso → Em Review → Concluído`, com `Bloqueado` acessível a partir de `A Fazer` e `Em Progresso` (retornando ao estado de origem) e `Cancelado` acessível a qualquer momento, exclusivamente pelo TechLead. Transições fora desse grafo são bloqueadas pelo sistema - Simplicidade é decisão de produto; workflow custom é a maior fonte de complexidade do Jira.
- **RN-02:** Sprint tem 10 dias úteis: inicia na segunda-feira e encerra na sexta-feira da semana seguinte. Fins de semana e feriados cadastrados ficam fora de qualquer contagem (burndown, cycle time em dias úteis) - Cadência fixa elimina cerimônia de gestão de sprint.
- **RN-03:** Task só entra em sprint com pontuação e responsável definidos - Sem isso, burndown e velocity não fecham.
- **RN-04:** Escala de pontuação fechada: 1, 2, 3, 5, 8. O sistema não aceita valores fora da escala. Task percebida como maior que 8 deve ser quebrada antes de entrar na sprint - Teto força decomposição e combate tasks-monstro.
- **RN-05:** Pontuação é travada quando a task entra na sprint. Reestimativa só pelo TechLead, com registro em log de auditoria (valor anterior, novo valor, motivo) - Reestimativa frequente é métrica de calibração, não pode ser silenciosa.
- **RN-06:** Subtasks não pontuam. São checklist de execução da task-pai; o progresso da task é exibido como % de subtasks concluídas - Pontuar subtask gera dupla contagem e burocracia.
- **RN-07:** Ao encerrar a sprint (automático, no fim do último dia útil), tasks não concluídas migram automaticamente para a sprint seguinte, mantendo a pontuação original. Cada rollover é registrado e contabilizado na taxa de rollover da sprint encerrada - Sprint roda sozinha; rollover é termômetro de planejamento, não punição.
- **RN-08:** Qualquer dev pode criar task, que nasce no `Backlog` com situação de triagem `PENDENTE_APROVACAO`. Apenas o TechLead aprova (tornando-a elegível a sprint), edita prioridade ou recusa (cancela com motivo) - Registro de demanda é livre; entrada na sprint é controlada.
- **RN-09:** Transição para `Bloqueado` exige motivo obrigatório. O tempo em `Bloqueado` é medido à parte e exibido separadamente nas métricas de cycle time - Distingue lentidão de execução de impedimento externo.
- **RN-10:** Relatório de entrega é gerado pelo sistema na transição para `Concluído`, consolidando: subtasks concluídas, tempo em cada estado, colaboradores, reestimativas e comentários. O responsável pode complementar com texto livre, mas não pode remover ou alterar os dados gerados - Conclusão é evento de sistema; relatório auto-gerado elimina relatório que ninguém preenche.
- **RN-11:** Task tem exatamente 1 responsável e 0..N colaboradores. O vínculo de colaborador registra quem, quando e por iniciativa de quem, e contabiliza nas métricas de participação do colaborador - Ajuda entre devs deixa de ser invisível.
- **RN-12:** Daily é individual, por dev, por dia útil, com três campos estruturados (o que fiz / o que farei / impedimentos), cada um vinculável a tasks. Editável até o fim do próprio dia; depois, somente leitura - Histórico de daily é registro, não rascunho permanente.
- **RN-13:** Soft-delete via `is_active=False` é o padrão. Cancelamento de task preserva todo o histórico (transições, comentários, subtasks). Hard-delete apenas em logs técnicos sem valor de auditoria - Auditoria exige reversibilidade; padrão dos sistemas irmãos.
- **RN-14:** Dev vê as próprias métricas individuais e os agregados do time. TechLead vê tudo. Viewer vê apenas agregados do time, nunca métricas individuais por dev - Métricas existem para calibrar o time, não para ranquear pessoas publicamente.
- **RN-15:** Toda transição de estado de task é registrada em log imutável com timestamp, autor, estado de origem e destino. Esse log é a fonte única das métricas de tempo (cycle time, lead time, tempo bloqueado) - Métrica derivada de evento, nunca de campo editável.
- **RN-16:** As 3 primeiras sprints são período de calibração: os dashboards exibem aviso visual de que velocity e cycle time ainda não são estatisticamente confiáveis - Evita conclusões precipitadas da gestão sobre dados imaturos.

## Ciclo de Vida da Task e da Sprint

A Task e a Sprint são as duas unidades centrais do sistema. Seus estados são formalizados.

**Task:**
- `BACKLOG` - Estado default na criação; aguardando triagem e/ou priorização - Sistema (default)
- `A_FAZER` - Aprovada, pontuada, com responsável, alocada em sprint; execução não iniciada - TechLead (ao puxar para sprint)
- `EM_PROGRESSO` - Responsável iniciou a execução. Marco inicial do cycle time - Dev responsável
- `BLOQUEADO` - Impedimento registrado com motivo; retorna ao estado de origem quando desbloqueada - Dev responsável ou TechLead
- `EM_REVIEW` - Execução finalizada; aguardando validação do TechLead - Dev responsável
- `CONCLUIDO` - Validada. Marco final do cycle time; dispara geração automática do relatório de entrega. Imutável (exceto complemento do relatório) - TechLead
- `CANCELADO` - Encerrada sem conclusão, com motivo. Histórico preservado - TechLead

**Triagem da Task (paralela ao estado, apenas em `BACKLOG`):**
- `PENDENTE_APROVACAO` - Criada por dev; aguardando análise do TechLead - Sistema (default na criação por dev)
- `APROVADA` - Validada pelo TechLead; elegível a entrar em sprint - TechLead

**Sprint:**
- `PLANEJADA` - Criada automaticamente pela cadência; ainda não iniciada; recebe tasks - Sistema
- `ATIVA` - Em andamento (da segunda-feira inicial à sexta-feira final). Apenas uma sprint ativa por vez - Sistema (na data de início)
- `ENCERRADA` - Finalizada; rollover executado; métricas congeladas - Sistema (no fim do último dia útil)

## Requisitos Funcionais

### Autenticação e Usuários

- **RF-01:** O sistema deve permitir login com e-mail e senha para os quatro perfis (Superusuário, TechLead/Manager, Dev, Viewer), exibindo a interface correta para cada um.
- **RF-02:** O sistema deve permitir logout explícito pelo usuário.
- **RF-03:** O sistema deve permitir recuperação de senha via e-mail, com link assinado e expiração curta.
- **RF-04:** O sistema deve bloquear temporariamente o login após 5 tentativas falhas seguidas para o mesmo e-mail, com janela de 15 minutos.
- **RF-05:** O TechLead deve poder cadastrar, editar e desativar usuários (Dev e Viewer) informando e-mail, nome, perfil e senha inicial. O usuário deve ser forçado a trocar a senha no primeiro acesso.

### Épicos e Tasks

- **RF-06:** O TechLead deve poder criar, editar e desativar Épicos (nome, descrição, status de andamento derivado das tasks vinculadas).
- **RF-07:** Qualquer usuário Dev ou TechLead deve poder criar uma Task no Backlog informando título e descrição. Task criada por Dev nasce com triagem `PENDENTE_APROVACAO`.
- **RF-08:** O TechLead deve poder aprovar, editar, priorizar, vincular a Épico ou recusar (cancelar com motivo) tasks do Backlog.
- **RF-09:** O sistema deve gerar automaticamente um código legível e sequencial para cada task (`DD-NNN`), usado em URLs, buscas e referências.
- **RF-10:** A descrição da Task deve aceitar Markdown com renderização na visualização, servindo como documentação da demanda (mini-PRD). A task deve aceitar anexos leves (imagens, PDFs, logs).
- **RF-11:** O responsável e o TechLead devem poder criar, editar, concluir e remover subtasks (checklist) dentro da Task. O sistema deve exibir o % de subtasks concluídas como progresso da task.
- **RF-12:** O TechLead deve poder atribuir pontuação à task na escala 1, 2, 3, 5, 8. O sistema deve travar a pontuação na entrada da sprint e registrar qualquer reestimativa (autor, valores, motivo).

### Sprint e Board

- **RF-13:** O sistema deve criar sprints automaticamente na cadência configurada (default: 10 dias úteis, segunda-feira → sexta-feira da semana seguinte), sem ação manual de abertura ou fechamento.
- **RF-14:** O TechLead deve poder alocar tasks aprovadas do Backlog na sprint ativa ou em sprint futura. A alocação exige pontuação e responsável definidos.
- **RF-15:** O sistema deve exibir board kanban da sprint ativa com colunas correspondentes aos estados da task e movimentação por drag-and-drop, respeitando as transições válidas e as permissões de cada perfil.
- **RF-16:** O sistema deve registrar toda transição de estado com timestamp, autor, origem e destino, em log imutável.
- **RF-17:** O sistema deve executar o rollover automático no encerramento da sprint: tasks não concluídas migram para a sprint seguinte e o evento é contabilizado na taxa de rollover.
- **RF-18:** O sistema deve exigir motivo na transição para `Bloqueado` e exibir o bloqueio com destaque no board e na daily.

### Comentários e Colaboração

- **RF-19:** O sistema deve permitir comentários na task, com menção a usuários via `@` e exibição cronológica.
- **RF-20:** O TechLead ou o responsável deve poder vincular outros devs como colaboradores da task, registrando quem vinculou e quando.
- **RF-21:** O sistema deve contabilizar a colaboração nas métricas de participação do colaborador (tasks em que colaborou, no período).

### Daily

- **RF-22:** O Dev deve poder registrar a daily do dia com três campos estruturados (o que fiz / o que farei / impedimentos), com vínculo opcional de cada item a tasks.
- **RF-23:** O sistema deve exibir a visão consolidada da daily do dia com os registros de todo o time, acessível a todos os perfis internos.
- **RF-24:** O sistema deve manter histórico pesquisável de dailies por dev, por data e por task vinculada.

### Relatório de Entrega

- **RF-25:** O sistema deve gerar automaticamente o relatório de entrega na transição da task para `Concluído`, consolidando: subtasks concluídas, tempo em cada estado (incluindo tempo bloqueado), colaboradores, reestimativas e comentários.
- **RF-26:** O responsável deve poder complementar o relatório com texto livre, sem alterar os dados gerados pelo sistema.
- **RF-27:** O relatório de entrega deve ser exportável em PDF.

### Notificações

- **RF-28:** O sistema deve exibir notificações in-app (sino com contador) para: task atribuída, menção em comentário, task aprovada na triagem, task movida para `Em Review` (para o TechLead) e task bloqueada (para o TechLead).
- **RF-29:** O usuário deve poder marcar notificações como lidas, individualmente ou em lote.

### Métricas e Dashboards

- **RF-30:** O sistema deve exibir dashboard do time com: velocity por sprint, burndown da sprint ativa (em pontos, dias úteis), throughput, taxa de rollover e lead time médio.
- **RF-31:** O sistema deve exibir dashboard individual por dev (visível ao próprio dev e ao TechLead): tasks e pontos concluídos por sprint, cycle time médio, colaborações prestadas.
- **RF-32:** O sistema deve calcular e exibir o cycle time médio por faixa de pontuação (ex: "tasks de 3 pontos levam em média 2,1 dias úteis"), descontando e exibindo separadamente o tempo em `Bloqueado`.
- **RF-33:** O sistema deve exibir projeção de conclusão por Épico: pontos restantes ÷ velocity média das últimas 3 sprints encerradas.
- **RF-34:** O TechLead deve poder exportar relatórios consolidados em CSV, Excel e PDF.
- **RF-35:** O Viewer deve acessar os dashboards agregados do time em modo somente-leitura, sem métricas individuais.

## Requisitos Não Funcionais

- **Plataforma:** Aplicação web responsiva. Suportar navegadores Chrome, Edge, Safari e Firefox nas duas últimas versões principais.
- **Performance:** Páginas devem carregar em < 2 segundos. Board kanban deve refletir movimentação de card em < 500ms percebidos. Exportações e geração de PDF do relatório de entrega rodam de forma assíncrona quando excederem 5 segundos.
- **Disponibilidade:** Uptime alvo 99,5% em horário comercial estendido (7h às 20h, dias úteis). Janela de manutenção fora desse intervalo.
- **Escalabilidade MVP:** Suportar 15 usuários simultâneos, 1 sprint ativa, ~200 tasks ativas, 5 anos de histórico de transições sem degradação nas consultas de métricas.
- **Segurança:** Autenticação por senha com hash PBKDF2 (default Django). CSRF, HSTS e secrets via variáveis de ambiente. Recuperação de senha por link assinado com expiração de 30 minutos. Permissões por perfil aplicadas no backend (middleware + decorators), nunca apenas na UI.
- **Auditoria:** Toda ação relevante (criação, edição, cancelamento de task; transição de estado; reestimativa; alocação e rollover de sprint; vínculo de colaborador; criação/desativação de usuário) registrada em log imutável com timestamp, autor e diff antes/depois. O log de transições é a fonte única das métricas de tempo (RN-15).
- **Integridade das métricas:** Métricas nunca derivam de campos editáveis; sempre de eventos registrados. Encerramento de sprint congela suas métricas (snapshot), garantindo que relatórios históricos não mudem retroativamente.
- **Compatibilidade mobile:** Visualização de board, task, daily e notificações plenamente funcional em telas a partir de 360px. Drag-and-drop pode ser substituído por ação de menu em telas pequenas.

## Jornada Principal da Task

1. **Registro:** Um dev encontra um bug (ou o TechLead recebe uma demanda) e cria a task no Backlog com título e descrição. Se criada por dev, nasce como `PENDENTE_APROVACAO`.

2. **Triagem:** O TechLead revisa, completa a documentação em Markdown (mini-PRD), vincula ao Épico correspondente e aprova. A task fica elegível a sprint.

3. **Planning:** Na montagem da sprint, o TechLead define a pontuação (1–8; acima disso, quebra a task) e o responsável, e aloca a task na sprint. A pontuação é travada.

4. **Execução:** Na segunda-feira a sprint inicia automaticamente. O dev move a task para `Em Progresso` (marco inicial do cycle time), quebra em subtasks e vai concluindo. Comentários e menções concentram a comunicação na task. Se travar, marca `Bloqueado` com motivo — o TechLead é notificado e o tempo bloqueado é medido à parte.

5. **Colaboração:** Se outro dev ajudar, é vinculado como colaborador. A participação entra nas métricas dele.

6. **Daily:** Diariamente, cada dev registra o que fez, o que fará e impedimentos, vinculando às tasks. A visão consolidada do dia substitui a memória da reunião.

7. **Review:** Ao terminar, o dev move para `Em Review`. O TechLead valida e move para `Concluído` (marco final do cycle time).

8. **Relatório:** O sistema gera automaticamente o relatório de entrega (subtasks, tempos por estado, colaboradores, reestimativas, comentários). O dev complementa com observações e o relatório fica disponível, exportável em PDF.

9. **Encerramento da sprint:** Na sexta-feira final, a sprint encerra sozinha. Tasks não concluídas rolam para a próxima sprint (taxa de rollover registrada). Métricas da sprint são congeladas e alimentam velocity, cycle time por faixa de ponto e projeções de Épico.

## Métricas de Sucesso

- 100% das tasks concluídas possuem trilha completa de transições de estado nos logs (nenhuma métrica órfã).
- A partir da 4ª sprint, o sistema responde "quanto tempo leva uma task de N pontos" com base em dados medidos, e exibe projeção de prazo para todos os Épicos ativos.
- ≥90% das demandas do time registradas como task no DevDesk (eliminação do boca a boca como fonte de verdade), medido por auditoria amostral mensal.
- Daily registrada em ≥80% dos dias úteis por dev ativo.
- Taxa de rollover em tendência de queda após o período de calibração (sprints 4–6 vs. 1–3).
- Zero divergência entre métricas exibidas e log de transições (verificado em teste automatizado de consistência).
- Tempo de montagem da sprint (planning) ≤ 1 hora, com alocação e pontuação feitas inteiramente no sistema.
