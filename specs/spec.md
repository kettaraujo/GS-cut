# ChipCut – SPEC: Melhorias de Interface e Funcionalidades

> **Especificação técnica para implementação por IA (Claude)**
> Referência: PRD v1.1 – ChipCut

| Campo       | Valor                              |
|-------------|------------------------------------|
| Versão      | 1.0                                |
| Status      | Pronto para Implementação          |
| Autor       | Grupo GoldenSat                    |
| Base        | PRD ChipCut v1.1                   |

---

## Contexto do Sistema

O ChipCut é um sistema Django monolítico para leitura automática de ICCIDs de chips SIM Card via visão computacional e IA, com fluxo de aprovação manual antes do cancelamento em lote.

**Stack:**
- Backend: Python 3.12 · Django 5.x
- Frontend: Django Templates · HTMX · Alpine.js
- Banco: PostgreSQL
- Cache: Django Cache Framework (Redis)

**Modelos principais:**
- `Chip` — ICCID, imagem, status_leitura, status_revisao, status_desligamento, lote FK
- `Lote` — nome_lote, quantidade, status (`aberto` · `em_revisao` · `aprovado` · `executado` · `cancelado`), aprovado_por
- `Log` — ação, iccid, usuario, data_hora, resultado JSON

---

## Escopo desta SPEC

Esta spec cobre **exclusivamente melhorias de interface e funcionalidades de gestão**. Não altera fluxo de leitura de hardware, integração com IA nem processo de aprovação já especificados no PRD.

---

## 1. Dashboard – Tela Inicial

### 1.1 Objetivo

Substituir a tela inicial básica por um dashboard operacional completo que seja a primeira tela após o login.

### 1.2 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: ChipCut logo · usuário logado · logout             │
├──────────┬──────────────────────────────────────────────────┤
│          │  ROW 1 – KPI Cards (4 cards)                     │
│ SIDEBAR  │  ROW 2 – Gráfico de leituras + Gráfico de status │
│          │  ROW 3 – Tabela: últimas leituras do dia         │
└──────────┴──────────────────────────────────────────────────┘
```

### 1.3 KPI Cards (Row 1)

Quatro cards lado a lado, cada um com ícone, número grande e label:

| Card                | Fonte de dados                                    | Cor do ícone |
|---------------------|---------------------------------------------------|--------------|
| Chips lidos hoje    | `Chip.objects.filter(data_leitura__date=today)`   | Azul         |
| Chips cancelados    | `status_desligamento='executado'` hoje            | Verde        |
| Em revisão          | `status_revisao='aguardando_aprovacao'`           | Amarelo      |
| Erros de leitura    | `status_leitura='erro'` hoje                      | Vermelho     |

Cada card deve ter variação de comparação com o dia anterior (ex: `▲ 12% vs ontem`).

### 1.4 Gráficos (Row 2)

**Gráfico 1 – Leituras por dia (últimos 7 dias)**
- Tipo: linha ou barra
- Eixo X: datas
- Eixo Y: quantidade de chips lidos
- Dados: `Chip.objects.values('data_leitura__date').annotate(total=Count('id'))`

**Gráfico 2 – Distribuição de status atual**
- Tipo: rosca (donut)
- Segmentos: `aguardando_aprovacao` · `aprovado` · `executado` · `cancelado` · `erro`
- Exibe total no centro

**Biblioteca:** Chart.js via CDN — sem instalação de pacotes adicionais.

### 1.5 Tabela de últimas leituras (Row 3)

DataTable com as 50 leituras mais recentes:

| Coluna       | Campo                    | Observação                          |
|--------------|--------------------------|-------------------------------------|
| ICCID        | `chip.iccid`             | Monospace, copiável ao clicar       |
| Lote         | `chip.lote.nome_lote`    | Link para a tela do lote            |
| Tentativas   | `chip.tentativas`        | Badge `1ª` verde · `2ª` amarelo     |
| Status       | `chip.status_revisao`    | Badge colorido (ver seção 4)        |
| Operador     | `chip.usuario.username`  |                                     |
| Data/hora    | `chip.data_leitura`      | Formato `DD/MM/YYYY HH:MM`          |

### 1.6 Filtro por data no dashboard

Campo de calendário (date range picker) no topo da página que filtra **todos os dados** da dashboard simultaneamente: KPI cards, gráficos e tabela.

- Implementação: `<input type="date">` nativo + HTMX para re-renderizar os blocos via `hx-get` com parâmetros `data_inicio` e `data_fim`
- Default: hoje
- Presets rápidos: `Hoje` · `Últimos 7 dias` · `Este mês`

### 1.7 Cache da dashboard

- Todos os queries da dashboard cacheados com `cache.get_or_set(key, callable, timeout)`
- Timeout: **60 segundos**
- Cache key: `dashboard_{usuario_id}_{data_inicio}_{data_fim}`
- Invalidar cache ao salvar novo `Chip` ou `Lote` via `post_save` signal
- Backend de cache: Redis (`django-redis`)

```python
# settings.py
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        "TIMEOUT": 60,
    }
}
```

---

## 2. Tela de Lotes – Listagem

### 2.1 Objetivo

A tela de listagem de lotes (`/lotes/`) deve substituir uma listagem simples por uma tela com separação visual por status e DataTable por seção.

### 2.2 Estrutura da página

A página deve ser dividida em **4 seções visuais separadas**, cada uma com seu próprio DataTable:

```
┌─────────────────────────────────────┐
│  [Seção 1] Em Revisão               │  ← prioridade visual máxima, topo
│  DataTable de lotes aguardando OK   │
├─────────────────────────────────────┤
│  [Seção 2] Abertos / Em andamento   │
│  DataTable de lotes ativos          │
├─────────────────────────────────────┤
│  [Seção 3] Aprovados                │
│  DataTable de lotes aprovados       │
├─────────────────────────────────────┤
│  [Seção 4] Executados / Cancelados  │
│  DataTable de lotes finalizados     │
└─────────────────────────────────────┘
```

### 2.3 Colunas do DataTable de lotes

| Coluna       | Campo                        | Observação                               |
|--------------|------------------------------|------------------------------------------|
| Nome do lote | `lote.nome_lote`             | Editável inline (ver seção 3)            |
| Chips        | `lote.quantidade`            | Total de chips no lote                   |
| Cancelados   | count chips `executado`      | Quantos chips já foram cancelados        |
| Erros        | count chips `erro`           | Chips com falha de leitura no lote       |
| Status       | `lote.status`                | Badge colorido (ver seção 4)             |
| Criado por   | `lote.usuario.username`      |                                          |
| Data criação | `lote.data_criacao`          | Formato `DD/MM/YYYY HH:MM`               |
| Aprovado por | `lote.aprovado_por.username` | Vazio se ainda não aprovado              |
| Ações        | —                            | Botões: Ver · Renomear · Aprovar (se aplicável) |

### 2.4 DataTable – configurações

Usar **DataTables.js** via CDN para todas as tabelas:

```html
<!-- No base.html -->
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
```

Configuração padrão para todas as tabelas do sistema:

```javascript
$('.chipcut-datatable').DataTable({
    language: {
        url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json'
    },
    pageLength: 25,
    order: [[/* coluna data */], ['desc']],
    responsive: true,
    dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>rtip',
});
```

### 2.5 Filtro por data nos lotes

Cada seção deve ter um filtro de data range independente no topo da seção, implementado com HTMX:

```html
<input type="date" name="data_inicio" hx-get="/lotes/?secao=em_revisao" hx-target="#tabela-em-revisao" hx-trigger="change">
```

### 2.6 Cache da listagem de lotes

- Cache key: `lotes_listagem_{status}_{data_inicio}_{data_fim}`
- Timeout: **30 segundos**
- Invalidar ao salvar qualquer `Lote`

---

## 3. Renomear Lote

### 3.1 Objetivo

Permitir edição inline do nome do lote diretamente na listagem, sem necessidade de abrir página separada.

### 3.2 Comportamento

1. Na coluna "Nome do lote" da tabela, exibir um ícone de lápis `✏` ao lado do nome
2. Ao clicar no ícone (ou no nome), o campo vira um `<input text>` editável com Alpine.js
3. Ao pressionar `Enter` ou clicar fora, dispara `hx-patch` para o endpoint de renomeação
4. Exibe feedback inline: check verde (sucesso) ou X vermelho (erro)
5. Atualiza o nome na tabela sem reload

### 3.3 Endpoint

```
PATCH /lotes/<uuid:pk>/renomear/
Body: { "nome_lote": "Novo Nome" }
Response: { "ok": true, "nome_lote": "Novo Nome" }
```

### 3.4 Validações

- Nome não pode ser vazio
- Mínimo 3 caracteres, máximo 100
- Registrar alteração no `Log` com `acao='renomear_lote'`

### 3.5 Implementação Alpine.js

```html
<td x-data="{ editando: false, nome: '{{ lote.nome_lote }}' }">
    <span x-show="!editando" @click="editando = true">
        [[ nome ]] <i class="bi bi-pencil-fill text-muted small ms-1"></i>
    </span>
    <input x-show="editando" x-model="nome" x-ref="input"
           @keyup.enter="salvar()" @blur="salvar()"
           x-effect="if (editando) $nextTick(() => $refs.input.focus())"
           class="form-control form-control-sm d-inline-block" style="width:200px">
</td>
```

---

## 4. Sistema de Badges de Status

### 4.1 Objetivo

Padronizar a representação visual de todos os status do sistema com badges coloridos e ícones.

### 4.2 Tabela de badges – `status_revisao` (Chip)

| Valor                    | Label                | Cor Bootstrap | Ícone Bootstrap Icons |
|--------------------------|----------------------|---------------|-----------------------|
| `aguardando_aprovacao`   | Aguardando Aprovação | `warning`     | `bi-clock-history`    |
| `aprovado`               | Aprovado             | `success`     | `bi-check-circle`     |
| `rejeitado`              | Rejeitado            | `danger`      | `bi-x-circle`         |

### 4.3 Tabela de badges – `status_leitura` (Chip)

| Valor      | Label             | Cor Bootstrap | Ícone              |
|------------|-------------------|---------------|--------------------|
| `sucesso`  | Lido              | `success`     | `bi-check2`        |
| `erro`     | Erro de Leitura   | `danger`      | `bi-exclamation`   |
| `pendente` | Pendente          | `secondary`   | `bi-hourglass`     |

### 4.4 Tabela de badges – `status` (Lote)

| Valor        | Label        | Cor Bootstrap | Ícone                  |
|--------------|--------------|---------------|------------------------|
| `aberto`     | Aberto       | `primary`     | `bi-folder2-open`      |
| `em_revisao` | Em Revisão   | `warning`     | `bi-eye`               |
| `aprovado`   | Aprovado     | `info`        | `bi-clipboard-check`   |
| `executado`  | Executado    | `success`     | `bi-check-all`         |
| `cancelado`  | Cancelado    | `secondary`   | `bi-slash-circle`      |

### 4.5 Template tag para badges

Criar template tag `{% status_badge valor tipo %}` que renderiza o badge correto:

```python
# templatetags/chipcut_tags.py
@register.inclusion_tag('components/status_badge.html')
def status_badge(valor, tipo='revisao'):
    mapa = { ... }  # dicionários acima
    return {'config': mapa[tipo].get(valor, {'label': valor, 'cor': 'secondary', 'icone': 'bi-question'})}
```

```html
<!-- components/status_badge.html -->
<span class="badge text-bg-{{ config.cor }} d-inline-flex align-items-center gap-1">
    <i class="bi {{ config.icone }}"></i> {{ config.label }}
</span>
```

---

## 5. Tela Interna do Lote (Detalhe)

### 5.1 Objetivo

A tela de detalhe de um lote (`/lotes/<pk>/`) deve exibir os chips do lote separados visualmente por status, com DataTable por seção — espelhando a lógica da listagem de lotes.

### 5.2 Estrutura

```
┌──────────────────────────────────────────────────────┐
│  HEADER DO LOTE: nome (editável) · status · botões   │
│  Criado por: X  |  Data: XX/XX  |  Aprovado por: Y   │
├──────────────────────────────────────────────────────┤
│  [Tab ou seção] Aguardando Aprovação  (N chips)      │
│  DataTable com chips pendentes                       │
├──────────────────────────────────────────────────────┤
│  [Tab ou seção] Aprovados             (N chips)      │
│  DataTable com chips aprovados                       │
├──────────────────────────────────────────────────────┤
│  [Tab ou seção] Cancelados / Rejeitados (N chips)    │
│  DataTable com chips finalizados                     │
└──────────────────────────────────────────────────────┘
```

### 5.3 Colunas do DataTable de chips (dentro do lote)

| Coluna      | Campo                      | Observação                              |
|-------------|----------------------------|-----------------------------------------|
| `#`         | Sequência no lote          | Ordem de leitura                        |
| ICCID       | `chip.iccid`               | Monospace, copiável                     |
| Tentativas  | `chip.tentativas`          | Badge `1ª` / `2ª`                       |
| Leitura     | `chip.status_leitura`      | Badge (seção 4.3)                       |
| Revisão     | `chip.status_revisao`      | Badge (seção 4.2)                       |
| Desligamento| `chip.status_desligamento` | Badge                                   |
| Operador    | `chip.usuario.username`    |                                         |
| Data leitura| `chip.data_leitura`        | `DD/MM/YYYY HH:MM`                      |
| Imagem      | `chip.imagem`              | Thumbnail 40x40 com modal ao clicar     |

### 5.4 Botões de ação no header do lote

Exibir botões condicionalmente ao `status` do lote:

| Status do lote | Botões disponíveis                              |
|----------------|-------------------------------------------------|
| `aberto`       | Renomear · Fechar lote para revisão             |
| `em_revisao`   | Renomear · **Aprovar lote** · Cancelar lote     |
| `aprovado`     | Renomear · Iniciar cancelamento                 |
| `executado`    | Exportar CSV · Ver histórico                    |
| `cancelado`    | Exportar CSV · Ver histórico                    |

---

## 6. Melhorias Gerais de Interface

### 6.1 Tema visual

- **Framework CSS:** Bootstrap 5.3
- **Ícones:** Bootstrap Icons 1.11
- **Fonte:** Inter (Google Fonts)
- Sidebar fixa com navegação: Dashboard · Lotes · Leitura · Logs · Configurações
- Cores primárias: usar variáveis CSS customizadas no `base.html`

```css
:root {
    --chipcut-primary: #0d6efd;
    --chipcut-success: #198754;
    --chipcut-warning: #ffc107;
    --chipcut-danger:  #dc3545;
    --chipcut-sidebar-bg: #1a2332;   /* Navy do padrão GoldenSat */
    --chipcut-sidebar-text: #d4a574; /* Amber do padrão GoldenSat */
}
```

### 6.2 Feedback de ações (toasts)

Toda ação do usuário (renomear lote, aprovar, cancelar) deve exibir um toast no canto inferior direito:

```html
<!-- Usando Bootstrap Toast via Alpine.js -->
<div x-data="toast()" x-show="visivel" class="toast-container position-fixed bottom-0 end-0 p-3">
    <div class="toast show" :class="tipo === 'sucesso' ? 'bg-success' : 'bg-danger'">
        <div class="toast-body text-white" x-text="mensagem"></div>
    </div>
</div>
```

### 6.3 Loading states

Toda requisição HTMX deve ter indicador de loading:

```html
<!-- No base.html, exibe spinner global durante requisições HTMX -->
<div id="loading-indicator" class="htmx-indicator position-fixed top-0 start-50">
    <div class="spinner-border text-primary" role="status"></div>
</div>
```

Adicionar `hx-indicator="#loading-indicator"` em todos os elementos com `hx-get` / `hx-post` / `hx-patch`.

### 6.4 Páginas vazias (empty states)

Quando uma seção não tiver dados, exibir empty state com ícone e mensagem ao invés de tabela vazia:

```html
{% if not chips %}
<div class="text-center py-5 text-muted">
    <i class="bi bi-inbox fs-1"></i>
    <p class="mt-2">Nenhum chip nesta seção.</p>
</div>
{% endif %}
```

### 6.5 ICCID copiável

Em toda tabela onde o ICCID aparecer, ao clicar no número ele deve ser copiado para a área de transferência com feedback visual:

```html
<span x-data x-on:click="
    navigator.clipboard.writeText('{{ chip.iccid }}');
    $el.classList.add('text-success');
    setTimeout(() => $el.classList.remove('text-success'), 1000)
" class="font-monospace cursor-pointer" title="Clique para copiar">
    {{ chip.iccid }}
</span>
```

---

## 7. Cache – Estratégia Completa

### 7.1 O que cachear

| View / Query                    | Cache key pattern                           | Timeout  |
|---------------------------------|---------------------------------------------|----------|
| KPIs do dashboard               | `dash_kpis_{uid}_{di}_{df}`                 | 60s      |
| Dados do gráfico de leituras    | `dash_chart_leituras_{di}_{df}`             | 60s      |
| Dados do gráfico de status      | `dash_chart_status_{di}_{df}`               | 60s      |
| Listagem de lotes por status    | `lotes_{status}_{di}_{df}`                  | 30s      |
| Detalhe de lote (chips)         | `lote_detalhe_{lote_id}_{status}`           | 30s      |
| Contagens do header/sidebar     | `sidebar_counts_{uid}`                      | 120s     |

### 7.2 Invalidação de cache

Usar signals para invalidar ao modificar dados:

```python
# signals.py
from django.db.models.signals import post_save
from django.core.cache import cache

@receiver(post_save, sender=Chip)
def invalidar_cache_chip(sender, instance, **kwargs):
    cache.delete_pattern('dash_*')
    cache.delete_pattern(f'lote_detalhe_{instance.lote_id}_*')

@receiver(post_save, sender=Lote)
def invalidar_cache_lote(sender, instance, **kwargs):
    cache.delete_pattern('dash_*')
    cache.delete_pattern(f'lotes_*')
    cache.delete_pattern(f'lote_detalhe_{instance.pk}_*')
```

> `cache.delete_pattern` requer `django-redis`. Se usar outro backend, iterar manualmente pelas keys.

---

## 8. Requisitos Adicionais desta SPEC

| ID      | Descrição                                                                                      |
|---------|------------------------------------------------------------------------------------------------|
| SPEC001 | Tela inicial deve ser o dashboard com KPIs, gráficos e tabela de leituras recentes            |
| SPEC002 | Filtro de data com calendário deve estar presente no dashboard e em cada seção de lotes       |
| SPEC003 | Nome do lote deve ser renomeável inline sem reload de página                                   |
| SPEC004 | Tela de lotes deve separar visualmente por status em seções independentes com DataTable        |
| SPEC005 | Tela interna do lote deve separar chips por status em seções com DataTable                     |
| SPEC006 | Todos os status devem ser representados por badges com ícone e cor conforme tabela da seção 4 |
| SPEC007 | DataTables devem ter busca, paginação (25/página) e ordenação em PT-BR                        |
| SPEC008 | Cache Redis obrigatório para queries do dashboard e listagem de lotes                          |
| SPEC009 | Toda ação deve exibir toast de feedback (sucesso ou erro)                                      |
| SPEC010 | Loading spinner global deve aparecer durante requisições HTMX                                  |
| SPEC011 | ICCID em qualquer tabela deve ser copiável ao clicar                                           |
| SPEC012 | Empty states com ícone e mensagem em seções sem dados                                          |

---

## 9. O que NÃO está no escopo desta SPEC

- Alteração no fluxo de leitura de hardware
- Alteração na lógica de verificação em 2 etapas
- Alteração no processo de aprovação de lotes
- Integração com novos serviços de IA ou OCR
- Criação de novos modelos de banco de dados
- Autenticação / gestão de usuários

---

## 10. Ordem de Implementação Sugerida

```
1. Configurar Redis e django-redis no settings.py
2. Criar template tag `status_badge`
3. Criar base.html com sidebar, Bootstrap 5.3, BI Icons, HTMX, Alpine.js, DataTables
4. Implementar dashboard (KPIs → Gráficos → Tabela → Filtro de data → Cache)
5. Implementar listagem de lotes com seções separadas e DataTables
6. Implementar endpoint PATCH de renomeação de lote + Alpine.js inline
7. Implementar tela de detalhe do lote com seções por status
8. Adicionar toasts, loading states, ICCID copiável e empty states
9. Configurar signals de invalidação de cache
```