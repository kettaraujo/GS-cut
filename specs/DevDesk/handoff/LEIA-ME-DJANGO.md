# DevDesk — Handoff para Django + HTMX + Alpine

O protótipo React (`DevDesk.html`) é a **referência visual e de comportamento**.
Este pacote traduz a arquitetura de front pra sua stack: Django templates renderizam
tudo no servidor, HTMX faz as trocas parciais, Alpine cuida do estado efêmero de UI.

## O que transfere direto, sem tocar

| Arquivo | Destino | Observação |
|---|---|---|
| `devdesk/devdesk.css` | `static/devdesk/devdesk.css` | Identidade inteira: tokens, shell, primitivas |
| `devdesk/screens.css` | `static/devdesk/screens.css` | Estilos por tela (board, drawer, daily…) |
| Fontes Google (Archivo + JetBrains Mono) | `base.html` | mesmo `<link>` |

Todas as classes (`bd-card`, `td-drawer`, `pl-item`, `dl-card`, `ep-linha`…) foram
escritas sem dependência de React — os templates daqui usam exatamente as mesmas.

## Divisão de responsabilidade

- **Django template**: TODO o HTML. Cada tela é uma view; cada pedaço que o HTMX troca é um partial.
- **HTMX**: navegação entre telas (`hx-get` + `hx-push-url`), mutações (`hx-post`),
  e troca de fragmentos (mover card, aprovar triagem, registrar daily).
- **Alpine**: só estado que não interessa ao servidor — aba ativa do drawer, modal
  aberto/fechado, dropdown do sino, texto sendo digitado, drag em andamento.
- **Regra de ouro**: regras de negócio (RN-01 transições, RN-03, RN-08 permissões)
  vivem na view/service do Django. O front desabilita botões por conveniência,
  mas o backend SEMPRE revalida (mesma exigência do RNF de segurança do PRD).

## Mapa de telas → views

| Tela | URL | Template | Partials que o HTMX troca |
|---|---|---|---|
| Board | `/board/` | `board.html` | `partials/board_corpo.html` (troca de layout/filtro), `partials/card_task.html` |
| Drawer da task | `/tasks/<codigo>/drawer/` | `partials/drawer_task.html` | abas são Alpine; comentários/subtasks re-renderizam o partial |
| Backlog | `/backlog/` | `backlog.html` | `partials/linha_backlog.html` (aprovar/recusar troca a linha) |
| Planning | `/planning/` | `planning.html` | `partials/pl_item.html`, `partials/pl_sprint.html` (alocar re-renderiza os dois lados) |
| Épicos | `/epicos/` | `epicos.html` | `partials/ep_linha.html` |
| Daily | `/daily/` | `daily.html` | `partials/dl_form.html`, `partials/dl_card.html` |
| Métricas | `/metricas/` | `metricas.html` | estático por request (gráficos são SVG renderizados no template) |
| Relatório | `/tasks/<codigo>/relatorio/` | `relatorio.html` | — |

## Endpoints de mutação (todos `hx-post`, retornam partial)

```text
POST /tasks/<codigo>/mover/            body: destino=EM_PROGRESSO   → card + coluna (ou 422 com motivo RN-01)
POST /tasks/<codigo>/bloquear/         body: motivo                 → drawer_task.html
POST /tasks/<codigo>/desbloquear/                                   → drawer_task.html
POST /tasks/<codigo>/aprovar/                                       → linha_backlog.html
POST /tasks/<codigo>/recusar/          body: motivo                 → linha_backlog.html
POST /tasks/<codigo>/subtasks/         body: texto                  → bloco de subtasks do drawer
POST /tasks/<codigo>/subtasks/<i>/toggle/                           → idem
POST /tasks/<codigo>/descricao/        body: markdown               → seção de documentação renderizada
POST /tasks/<codigo>/comentarios/      body: texto                  → lista de comentários
POST /tasks/criar/                     body: titulo, descricao, epico → linha_backlog.html (triagem conforme RN-08!)
POST /tasks/<codigo>/alocar/           body: sprint                 → planning re-render (valida RN-03/RN-04 no server)
POST /epicos/criar/                    body: nome, descricao, cor   → ep_linha.html
POST /daily/registrar/                 body: fiz, farei, impedimentos → dl_card.html (upsert por dev+dia, RN-12)
```

Convenções:
- Erro de regra de negócio → `HttpResponse(status=422)` + header `HX-Trigger`
  com `{"dd:toast": {"texto": "Transição X → Y não permitida (RN-01)", "tipo": "erro"}}`.
  O listener de toast em `base.html` mostra exatamente como no protótipo.
- Sucesso que afeta mais de um lugar (ex.: mover card muda contadores de 2 colunas)
  → use swap **OOB** (`hx-swap-oob`) ou re-renderize `board_corpo.html` inteiro.
  Para o MVP de 15 usuários, re-renderizar o corpo inteiro é simples e rápido o bastante.
- Markdown da descrição: renderize no servidor (lib `markdown` + `bleach`), nunca no cliente.

## Onde o Alpine entra (e onde NÃO)

| Uso | Como |
|---|---|
| Abas do drawer (Detalhe/Comentários/Histórico) | `x-data="{aba:'detalhe'}"` — conteúdo já veio no HTML, só esconde/mostra |
| Modais (bloquear, nova task, novo épico) | `x-data="{aberto:false}"` + `x-show` + `@keydown.escape.window` |
| Dropdown do sino | `x-data` + `@click.outside` |
| Seletor de layout do board | Alpine guarda o ativo; o conteúdo vem por `hx-get="?layout=raias"` |
| Drag-and-drop do card | Alpine marca `arrastando`; o `drop` dispara `htmx.ajax('POST', …/mover/)` — ver `board.html` |
| ❌ Lista de tasks, contadores, % de subtask | NÃO — isso é estado do servidor, re-renderize o partial |

## Estrutura sugerida no projeto Django

```text
devdesk/
  templates/
    base.html                  ← shell (sidebar + topbar + toasts)
    board.html  backlog.html  planning.html  epicos.html  daily.html  metricas.html
    partials/
      board_corpo.html  card_task.html  drawer_task.html
      linha_backlog.html  pl_item.html  ep_linha.html  dl_card.html  toast.html
  static/devdesk/
    devdesk.css  screens.css   ← copiados do protótipo, sem alteração
```

Dica: a lib `django-template-partials` permite definir os partials dentro do
template da tela (`{% partialdef card %}…{% endpartialdef %}`) e renderizar só o
pedaço na view — casa perfeitamente com esse desenho.

## Exemplos incluídos neste pacote

- `templates/base.html` — shell completo: sidebar com active por `request.resolver_match`,
  sino com Alpine, container de toasts ouvindo `HX-Trigger`, CSRF global pro HTMX.
- `templates/board.html` — tela mais complexa: troca de layout via HTMX, filtros como
  form GET, colunas com drop zone (Alpine + `htmx.ajax`).
- `templates/partials/card_task.html` — o card do board, 1:1 com o protótipo.
- `templates/partials/drawer_task.html` — drawer com abas Alpine e mutações HTMX.

Os demais templates seguem o mesmo padrão — o protótipo React é o gabarito visual:
inspecione qualquer tela e os nomes de classe batem com o CSS já copiado.
