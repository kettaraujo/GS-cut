# ChipCut – SPEC 2: Melhorias de Layout, Leitura em Massa, Lotes e Logs

> **Especificação técnica para implementação por IA (Claude)**
> Continuação da SPEC 1 — não substitui, complementa e corrige.

| Campo       | Valor                              |
|-------------|------------------------------------|
| Versão      | 2.0                                |
| Status      | Pronto para Implementação          |
| Autor       | Grupo GoldenSat                    |
| Base        | SPEC 1 · PRD ChipCut v1.1          |

---

## Contexto

Esta SPEC cobre cinco pontos de melhoria identificados após a entrega da SPEC 1:

1. **Dashboard** — KPI cards e gráficos menores; tabela de leituras maior
2. **Aba de Leitura** — quebrada; redesenho completo para alta velocidade de leitura em massa
3. **Aba de Lotes** — confusa; simplificação visual e fluxo mais intuitivo
4. **Aba de Logs** — sem estrutura; adicionar DataTable organizado
5. **Responsividade** — garantir que todas as mudanças acima mantenham layout responsivo

---

## 1. Dashboard – Rebalancear Proporções

### 1.1 Problema

Os KPI cards e gráficos ocupam espaço demais, deixando a tabela de leituras (a parte mais utilizada operacionalmente) pequena e espremida.

### 1.2 Novo layout proporcional

```
┌──────────────────────────────────────────────────────────────┐
│  Filtro de data (barra compacta no topo)                     │
├──────────────────────────────────────────────────────────────┤
│  [KPI 1] [KPI 2] [KPI 3] [KPI 4]   ← altura máx: 90px      │
├─────────────────────┬────────────────────────────────────────┤
│  Gráfico linha      │  Gráfico donut   ← altura máx: 200px  │
│  (col-8)            │  (col-4)                               │
├─────────────────────┴────────────────────────────────────────┤
│                                                              │
│  Tabela últimas leituras          ← ocupa o restante         │
│  (DataTable completo, paginação 50 itens)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 KPI Cards – versão compacta

Reduzir de card grande para card horizontal compacto:

```html
<!-- Antes: card grande com padding generoso e número enorme -->
<!-- Depois: card compacto, linha única, ícone + número + label + delta -->

<div class="card border-0 shadow-sm" style="min-height: unset;">
    <div class="card-body py-2 px-3 d-flex align-items-center gap-3">
        <i class="bi bi-chip fs-4 text-primary"></i>
        <div>
            <div class="fw-bold lh-1" style="font-size:1.3rem;">{{ total }}</div>
            <div class="text-muted" style="font-size:0.72rem;">Lidos hoje</div>
        </div>
        <span class="ms-auto badge bg-success-subtle text-success" style="font-size:0.68rem;">
            ▲ {{ delta }}%
        </span>
    </div>
</div>
```

Altura do card: máximo **90px**. Quatro cards em `row-cols-2 row-cols-md-4`.

### 1.4 Gráficos – versão compacta

- Altura fixa dos gráficos via `Chart.js` options: `maintainAspectRatio: false` + container com `height: 200px`
- Gráfico de linha: remover legenda, deixar apenas o tooltip
- Gráfico donut: legenda embaixo em fonte pequena (`font-size: 0.7rem`), total no centro

```javascript
// Ambos os gráficos
options: {
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10 } }
    }
}
```

Container HTML:

```html
<div style="height: 200px; position: relative;">
    <canvas id="grafico-leituras"></canvas>
</div>
```

### 1.5 Tabela de últimas leituras – versão expandida

- Aumentar `pageLength` padrão para **50**
- Remover `max-height` se houver — deixar a tabela crescer naturalmente
- Adicionar coluna **Lote** com link clicável
- Adicionar coluna **Imagem** com thumbnail 32x32 e modal ao clicar
- A tabela deve ser a seção de maior destaque visual na página

### 1.6 Responsividade

- Em mobile (< 768px): cards em 2 colunas, gráficos empilhados, tabela com scroll horizontal
- Em tablet (768–1024px): cards em 4 colunas compactas, gráficos lado a lado reduzidos
- Em desktop (> 1024px): layout descrito em 1.2

---

## 2. Aba de Leitura – Redesenho Completo

### 2.1 Problema

A aba de leitura está quebrada e não funciona. Além da correção, o design precisa ser completamente repensado para suportar o cenário real: **fotografar centenas de chips de várias caixas em sequência**, com o mínimo de cliques e máxima velocidade.

### 2.2 Princípios de design para leitura em massa

- **Zero fricção:** após posicionar o chip, nada deve exigir clique do operador para avançar
- **Feedback imediato e claro:** o operador precisa saber em < 1 segundo se a leitura foi válida
- **Contador sempre visível:** o operador precisa saber quantos chips já leu nesta sessão
- **Fácil correção:** erros devem ser corrigíveis sem interromper o fluxo
- **Sessão persistente:** ao trocar de caixa/lote, não perde o que já foi lido

### 2.3 Layout da tela de leitura

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER DA SESSÃO                                            │
│  Lote ativo: [dropdown seletor de lote]  [+ Novo lote]      │
│  Chips nesta sessão: 47   Erros: 2   Sucesso: 45            │
├────────────────────────┬─────────────────────────────────────┤
│                        │                                     │
│   ÁREA DE CÂMERA       │   FILA DE LEITURAS                  │
│                        │   (últimos chips desta sessão)      │
│   [preview ao vivo]    │                                     │
│                        │   ✓ 8944...3021  1ª  14:32:01      │
│   STATUS ATUAL:        │   ✓ 8944...1892  1ª  14:31:58      │
│   ● AGUARDANDO CHIP    │   ⚠ 8944...----  2ª  14:31:44      │
│                        │   ✓ 8944...7741  1ª  14:31:40      │
│   [ICCID detectado]    │   ✗ ERRO         2x  14:31:22      │
│   [status da leitura]  │                                     │
│                        │   [Ver lote completo →]             │
└────────────────────────┴─────────────────────────────────────┘
```

### 2.4 Área de câmera (coluna esquerda)

**Preview ao vivo:**
- `<video>` element com stream da webcam/câmera USB via `getUserMedia`
- Overlay com guia de posicionamento (retângulo tracejado no centro da imagem)
- Resolução de exibição: 100% da largura da coluna, aspect ratio 4:3

**Painel de status central:**

O painel abaixo do preview exibe o estado atual da leitura com cor de fundo que muda:

| Estado                        | Cor de fundo     | Ícone          | Texto                          |
|-------------------------------|------------------|----------------|--------------------------------|
| Aguardando chip               | Cinza escuro     | `bi-camera`    | AGUARDANDO CHIP                |
| Detectando / processando      | Azul piscando    | `bi-arrow-repeat` (girando) | PROCESSANDO…    |
| Sucesso – 1ª tentativa        | Verde            | `bi-check-lg`  | LIDO — [ICCID]                 |
| Sucesso – 2ª tentativa        | Verde amarelado  | `bi-check-lg`  | LIDO (2ª tentativa) — [ICCID] |
| Erro – ambas falharam         | Vermelho piscando| `bi-x-lg`      | ERRO — REPOSICIONE O CHIP      |

**Duração do estado de resultado:** 2 segundos, depois volta automaticamente para "Aguardando chip".

**Correção manual rápida:**
- Ao ler com sucesso, exibir campo de texto pequeno com o ICCID por 2s
- Se o operador digitar/colar um número diferente antes dos 2s, substitui o ICCID detectado
- Atalho de teclado: `Tab` foca o campo de correção; `Escape` descarta e aceita o detectado

### 2.5 Fila de leituras (coluna direita)

Lista das últimas leituras desta sessão, em tempo real via HTMX SSE ou polling a cada 2s:

| Elemento  | Descrição                                                           |
|-----------|---------------------------------------------------------------------|
| Ícone     | ✓ verde (sucesso 1ª) · ⚠ amarelo (sucesso 2ª) · ✗ vermelho (erro) |
| ICCID     | Primeiros 4 e últimos 4 dígitos com `...` no meio para economizar espaço |
| Tentativa | Badge `1ª` / `2ª`                                                   |
| Horário   | `HH:MM:SS`                                                          |
| Ação      | Ícone de lápis para correção manual após leitura                    |

A lista exibe os **últimos 20 chips** desta sessão. Scroll automático para o topo a cada nova leitura.

### 2.6 Header da sessão

```
┌──────────────────────────────────────────────────────────────┐
│ Lote: [dropdown ▼ "Caixa A – 14/06"]  [+ Novo lote]        │
│                                                              │
│  47 lidos   45 ✓   2 ✗   Taxa: 95.7%                       │
└──────────────────────────────────────────────────────────────┘
```

- **Seletor de lote:** dropdown com lotes no status `aberto`. Ao trocar, a fila da sessão filtra para o lote selecionado
- **Botão "+ Novo lote":** abre modal inline para criar lote com nome e confirmar — sem sair da tela
- **Contadores:** atualizados em tempo real, sem reload

### 2.7 Modal de criação de lote inline

```html
<!-- Disparado por hx-get + hx-target="#modal-container" -->
<div class="modal fade" id="modalNovoLote">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header py-2">
                <h6 class="modal-title">Novo Lote</h6>
            </div>
            <div class="modal-body py-2">
                <input type="text" name="nome_lote" class="form-control"
                       placeholder="Ex: Caixa A – Junho" autofocus>
            </div>
            <div class="modal-footer py-2">
                <button hx-post="/lotes/criar/" hx-target="#header-sessao"
                        class="btn btn-primary btn-sm w-100">Criar e selecionar</button>
            </div>
        </div>
    </div>
</div>
```

### 2.8 Correção de bug: câmera não funciona

A aba de leitura provavelmente quebra por um ou mais dos seguintes motivos — o Claude deve verificar e corrigir todos:

| Causa provável                          | Solução                                                             |
|-----------------------------------------|---------------------------------------------------------------------|
| `getUserMedia` bloqueado sem HTTPS      | Garantir que em dev o servidor rode em `localhost` (não IP)         |
| View Django retornando 500              | Verificar se a view `/leitura/` tem tratamento de exceção correto   |
| JavaScript com erro de sintaxe          | Inspecionar console e corrigir erros JS na template                 |
| Câmera USB não listada como `videoinput`| Adicionar log de diagnóstico que lista dispositivos disponíveis     |
| HTMX conflito com JS da câmera          | Isolar o JS da câmera do ciclo de eventos HTMX                      |

**Diagnóstico obrigatório** — adicionar na tela de leitura um bloco de diagnóstico (visível apenas para `is_staff`):

```javascript
// Executar ao carregar a página — exibir no console E em div#diagnostico
navigator.mediaDevices.enumerateDevices().then(devices => {
    const cameras = devices.filter(d => d.kind === 'videoinput');
    console.log('Câmeras disponíveis:', cameras);
    document.getElementById('diagnostico').textContent =
        cameras.length ? `${cameras.length} câmera(s) encontrada(s)` : 'NENHUMA CÂMERA DETECTADA';
});
```

### 2.9 Atalhos de teclado

| Tecla       | Ação                                              |
|-------------|---------------------------------------------------|
| `Space`     | Forçar captura manual (sem sensor)                |
| `Tab`       | Focar campo de correção do ICCID atual            |
| `Escape`    | Descartar correção, aceitar ICCID detectado       |
| `Ctrl + N`  | Abrir modal de novo lote                          |
| `Ctrl + Z`  | Remover último chip da fila (desfazer)            |

---

## 3. Aba de Lotes – Simplificação Visual

### 3.1 Problema

A tela está confusa porque apresenta muitas informações ao mesmo tempo sem hierarquia clara. O operador não sabe imediatamente o que precisa de atenção.

### 3.2 Princípio de redesenho

**"O que precisa da minha ação agora"** deve estar primeiro e destacado. O histórico (executados, cancelados) fica dobrado por padrão.

### 3.3 Novo layout da listagem de lotes

```
┌──────────────────────────────────────────────────────────────┐
│  [+ Novo Lote]                    Busca: [_____________]     │
├──────────────────────────────────────────────────────────────┤
│  🔴  EM REVISÃO (3)     ← seção destaque, sempre aberta     │
│  "Aguardando sua aprovação"                                  │
│  [card lote] [card lote] [card lote]                        │
├──────────────────────────────────────────────────────────────┤
│  🟡  EM ANDAMENTO (2)   ← sempre aberta                     │
│  [card lote] [card lote]                                    │
├──────────────────────────────────────────────────────────────┤
│  🟢  APROVADOS (1)      ← sempre aberta                     │
│  [card lote]                                                │
├──────────────────────────────────────────────────────────────┤
│  ⚫  HISTÓRICO  ▶ (27)  ← fechado por padrão, accordion    │
│  Executados e cancelados                                     │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Card de lote

Substituir as linhas de tabela por **cards** nas seções ativas (Em Revisão, Em Andamento, Aprovados). Cards são mais intuitivos para ação:

```
┌─────────────────────────────────────────┐
│  📦 Caixa A – Junho          [Em Revisão]│
│  ─────────────────────────────────────  │
│  52 chips  ·  50 ✓  ·  2 ✗             │
│  Criado por Eurico · há 2 horas         │
│                                         │
│  [Ver detalhes]  [Aprovar]  [Cancelar]  │
└─────────────────────────────────────────┘
```

Cards em grid `row-cols-1 row-cols-md-2 row-cols-xl-3`.

### 3.5 Histórico — DataTable dentro do accordion

A seção "Histórico" ao ser expandida exibe um DataTable com lotes executados e cancelados:

| Coluna       | Campo                   |
|--------------|-------------------------|
| Nome         | `lote.nome_lote`        |
| Chips        | `lote.quantidade`       |
| Status       | Badge                   |
| Aprovado por | `aprovado_por.username` |
| Data         | `data_aprovacao`        |
| Ações        | Exportar CSV            |

### 3.6 Busca global de lotes

Campo de busca no topo (não dentro do DataTable) que filtra por nome do lote em tempo real via Alpine.js:

```javascript
// Alpine.js — filtra cards por nome sem request ao servidor
x-data="{ busca: '' }"
// Em cada card:
x-show="busca === '' || nome.toLowerCase().includes(busca.toLowerCase())"
```

---

## 4. Aba de Logs – DataTable Organizado

### 4.1 Problema

A tela de logs não tem estrutura de tabela interativa, dificultando investigação e auditoria.

### 4.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  FILTROS RÁPIDOS (pills):                                    │
│  [Todos] [Leituras] [Desligamentos] [Erros] [Aprovações]     │
├──────────────────────────────────────────────────────────────┤
│  DataTable de logs                                           │
│  Busca nativa DataTables + filtro de data range             │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Colunas do DataTable de logs

| Coluna    | Campo             | Observação                                       |
|-----------|-------------------|--------------------------------------------------|
| Data/hora | `log.data_hora`   | `DD/MM/YYYY HH:MM:SS` · ordenação padrão desc    |
| Ação      | `log.acao`        | Badge colorido por tipo (ver 4.4)                |
| ICCID     | `log.iccid`       | Monospace · copiável · vazio se ação for de lote |
| Usuário   | `log.usuario`     |                                                  |
| Resultado | `log.resultado`   | Resumo em 1 linha · botão "Ver detalhes" abre modal com JSON completo |
| Lote      | FK via ICCID      | Nome do lote se aplicável                        |

### 4.4 Badges de ação nos logs

| Valor `acao`          | Label              | Cor           |
|-----------------------|--------------------|---------------|
| `leitura`             | Leitura            | `primary`     |
| `leitura_erro`        | Erro de Leitura    | `danger`      |
| `desligamento`        | Desligamento       | `success`     |
| `correcao`            | Correção Manual    | `warning`     |
| `aprovacao_lote`      | Aprovação de Lote  | `info`        |
| `cancelamento_lote`   | Cancelamento       | `secondary`   |
| `renomear_lote`       | Renomeação         | `light`       |

### 4.5 Filtros pills

Filtro por tipo de ação sem reload — Alpine.js filtra o DataTable via `search()`:

```javascript
x-data="{ filtro: 'todos' }"

// Ao clicar em um pill:
@click="
    filtro = tipo;
    tabela.search(tipo === 'todos' ? '' : tipo).draw();
"
```

Pills como nav pills Bootstrap:

```html
<ul class="nav nav-pills gap-1 mb-3">
    <li><a class="nav-link active" @click="filtro='todos'">Todos</a></li>
    <li><a class="nav-link" @click="filtro='leitura'">Leituras</a></li>
    <li><a class="nav-link" @click="filtro='leitura_erro'">Erros</a></li>
    <li><a class="nav-link" @click="filtro='desligamento'">Desligamentos</a></li>
    <li><a class="nav-link" @click="filtro='aprovacao_lote'">Aprovações</a></li>
</ul>
```

### 4.6 Modal de detalhes do log

Ao clicar em "Ver detalhes" de qualquer linha, abre modal com o `resultado` JSONField formatado:

```html
<pre class="bg-dark text-light p-3 rounded" style="max-height:400px;overflow-y:auto;font-size:0.8rem;">
    {{ log.resultado | json_pretty }}
</pre>
```

Criar template filter `json_pretty`:

```python
# templatetags/chipcut_tags.py
import json
@register.filter
def json_pretty(value):
    try:
        return json.dumps(value, indent=2, ensure_ascii=False)
    except Exception:
        return str(value)
```

### 4.7 DataTable de logs – configurações específicas

```javascript
$('#tabela-logs').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json' },
    pageLength: 50,
    order: [[0, 'desc']],  // data_hora desc
    responsive: true,
    columnDefs: [
        { targets: 5, orderable: false },  // coluna resultado não ordenável
    ],
    dom: '<"row align-items-center mb-2"<"col-sm-6"l><"col-sm-6"f>>rtip',
});
```

---

## 5. Responsividade – Garantias Gerais

### 5.1 Breakpoints e comportamento esperado

| Tela           | Breakpoint | Dashboard              | Leitura                  | Lotes                   |
|----------------|------------|------------------------|--------------------------|-------------------------|
| Mobile         | < 576px    | Cards 2col, gráficos empilhados, tabela scroll | Câmera fullwidth, fila abaixo | Cards 1col             |
| Tablet         | 576–991px  | Cards 4col compactos   | Câmera 60% / fila 40%    | Cards 2col              |
| Desktop        | ≥ 992px    | Layout completo 1.2    | Layout completo 2.3      | Cards 3col              |

### 5.2 Regras obrigatórias

- Nenhuma coluna de tabela deve ter largura fixa em px — usar `%` ou deixar o DataTable calcular
- Sidebar deve colapsar em mobile para um hamburguer menu
- Câmera deve manter proporção 4:3 via `aspect-ratio: 4/3` — nunca distorcer
- Modais devem ter `max-width: 95vw` em mobile

### 5.3 Sidebar responsiva

```html
<!-- Em mobile: sidebar colapsável -->
<div class="offcanvas offcanvas-start" id="sidebarMenu">
    <!-- conteúdo da sidebar -->
</div>
<button class="btn d-md-none" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
    <i class="bi bi-list fs-4"></i>
</button>
```

---

## 6. Requisitos desta SPEC 2

| ID       | Descrição                                                                                       |
|----------|-------------------------------------------------------------------------------------------------|
| SPEC2001 | KPI cards com altura máxima de 90px, layout horizontal compacto                                 |
| SPEC2002 | Gráficos com altura máxima de 200px via `maintainAspectRatio: false`                            |
| SPEC2003 | Tabela de últimas leituras com `pageLength: 50` e altura irrestrita                             |
| SPEC2004 | Aba de leitura deve funcionar — corrigir todos os bugs que impedem o uso                        |
| SPEC2005 | Preview de câmera ao vivo com overlay de guia de posicionamento                                 |
| SPEC2006 | Painel de status com cores distintas por estado (aguardando / processando / sucesso / erro)     |
| SPEC2007 | Fila de leituras da sessão visível em tempo real ao lado da câmera                              |
| SPEC2008 | Contadores de sessão (total / sucesso / erro / taxa) atualizados em tempo real                  |
| SPEC2009 | Modal de novo lote acessível sem sair da tela de leitura                                        |
| SPEC2010 | Correção manual do ICCID disponível por 2s após cada leitura                                    |
| SPEC2011 | Atalhos de teclado implementados conforme tabela da seção 2.9                                   |
| SPEC2012 | Aba de lotes com cards nas seções ativas e accordion para histórico                             |
| SPEC2013 | Busca de lotes por nome em tempo real via Alpine.js sem reload                                  |
| SPEC2014 | Logs com DataTable, pills de filtro por tipo de ação e modal de detalhes JSON                   |
| SPEC2015 | Sidebar colapsável em mobile via Bootstrap Offcanvas                                            |
| SPEC2016 | Câmera com proporção 4:3 preservada em todos os breakpoints                                     |
| SPEC2017 | Diagnóstico de câmera visível para usuários `is_staff`                                          |

---

## 7. O que NÃO está no escopo desta SPEC 2

- Alteração na lógica de verificação em 2 etapas (PRD)
- Alteração no fluxo de aprovação de lotes (PRD)
- Criação de novos models de banco de dados
- Integração com hardware Arduino/ESP32
- Autenticação / gestão de usuários

---

## 8. Ordem de Implementação Sugerida

```
1. Corrigir bug da aba de leitura (diagnóstico → causa → fix)
2. Redesenhar layout da câmera + fila de leituras + header de sessão
3. Implementar atalhos de teclado e campo de correção rápida
4. Rebalancear dashboard (cards compactos → gráficos menores → tabela maior)
5. Redesenhar aba de lotes com cards + accordion histórico + busca Alpine
6. Implementar DataTable de logs + pills de filtro + modal JSON
7. Tornar sidebar responsiva com Offcanvas
8. Testes de responsividade nos 3 breakpoints

```

