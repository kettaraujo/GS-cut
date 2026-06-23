# ChipCut – SPEC 4: Captura Contínua, Confirmação, Excluir Lote e Dark Mode

> **Especificação técnica para implementação por IA (Claude)**
> Continuação da SPEC 3 — não substitui, complementa e corrige.

| Campo   | Valor                                        |
|---------|----------------------------------------------|
| Versão  | 4.0                                          |
| Status  | Pronto para Implementação                    |
| Autor   | Grupo GoldenSat                              |
| Base    | SPEC 1 · SPEC 2 · SPEC 3 · PRD ChipCut v1.1 |

---

## Contexto

Esta SPEC cobre quatro pontos:

1. **Captura contínua** — a câmera não deve voltar para a tela inicial após cada foto; o operador deve conseguir fotografar N chips em sequência e só confirmar no final
2. **Tela de revisão pós-captura** — após encerrar a sessão, exibir tela de confirmação com todos os chips capturados antes de salvar/enviar
3. **Excluir lote** — botão de exclusão acessível dentro da tela de detalhes do lote
4. **Dark mode** — alternância de tema claro/escuro persistida por usuário

---

## 1. Captura Contínua – Sem Retorno à Tela da Câmera

### 1.1 Problema

Atualmente, após cada captura o sistema redireciona ou recarrega a página, forçando o operador a navegar de volta à tela de leitura para fotografar o próximo chip. Com centenas de chips por sessão isso é inviável.

### 1.2 Comportamento esperado

```
Operador entra na aba Leitura
        ↓
Câmera inicia automaticamente
        ↓
Posiciona chip → captura automática (ou botão manual)
        ↓
Feedback visual imediato (verde/vermelho) por ~1.5s
        ↓
Câmera PERMANECE ATIVA — volta ao estado "Aguardando chip"
        ↓
Operador posiciona próximo chip → repete
        ↓
        ...N chips depois...
        ↓
Operador clica "Finalizar sessão" → vai para tela de revisão
```

**A câmera nunca para, nunca redireciona, nunca recarrega a página entre capturas.**

### 1.3 Fluxo de estados da câmera (Alpine.js)

```javascript
// Estado da câmera — gerenciado inteiramente no frontend
x-data="{
    estado: 'aguardando',   // aguardando | processando | sucesso | erro
    iccidDetectado: '',
    ultimoChip: null,
    chips: [],              // lista de chips capturados na sessão
    totalSucesso: 0,
    totalErro: 0,

    async capturar() {
        this.estado = 'processando';
        const blob = await this.snapshot();          // captura frame da câmera
        const resultado = await this.enviarParaIA(blob);  // POST para Django

        if (resultado.ok) {
            this.iccidDetectado = resultado.iccid;
            this.estado = 'sucesso';
            this.chips.unshift(resultado);           // adiciona no topo da fila
            this.totalSucesso++;
        } else {
            this.estado = 'erro';
            this.totalErro++;
        }

        // Após 1.5s volta para aguardando — câmera continua ativa
        setTimeout(() => {
            this.estado = 'aguardando';
            this.iccidDetectado = '';
        }, 1500);
    }
}"
```

### 1.4 O que NÃO deve acontecer entre capturas

| Comportamento proibido                         | Motivo                                      |
|------------------------------------------------|---------------------------------------------|
| `window.location.href = ...` após captura      | Redireciona e mata o stream da câmera       |
| `window.location.reload()`                     | Idem                                        |
| `hx-boost` em formulário de captura            | HTMX swap pode destruir o elemento `<video>`|
| Re-inicializar `getUserMedia` após cada foto   | Causa delay e pisca a câmera                |

### 1.5 Endpoint de captura — resposta JSON, sem redirect

O endpoint Django deve retornar **sempre JSON**, nunca redirect:

```python
# apps/capture/views.py

from django.http import JsonResponse
from django.views.decorators.http import require_POST

@require_POST
def capturar_chip(request):
    """
    Recebe imagem, processa com IA, salva Chip e retorna JSON.
    NUNCA retorna redirect — o frontend gerencia o estado.
    """
    try:
        image_data = request.FILES.get('imagem') or request.body
        # ... lógica de OCR e validação ...
        chip = ChipService.processar(image_data, lote_id=request.POST.get('lote_id'))
        return JsonResponse({
            'ok': True,
            'iccid': chip.iccid,
            'tentativas': chip.tentativas,
            'imagem_url': chip.imagem_url,
            'chip_id': str(chip.pk),
            'status_leitura': chip.status_leitura,
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'erro': str(e)}, status=200)
        # status 200 mesmo em erro — o frontend decide o estado visual
```

### 1.6 Layout da tela de leitura em modo contínuo

```
┌──────────────────────────────────────────────────────────────────┐
│  Lote: [Caixa A – Junho ▼]  [+ Novo lote]                       │
│  47 lidos · 45 ✓ · 2 ✗ · 95.7%        [Finalizar sessão →]     │
├───────────────────┬──────────────────────────────────────────────┤
│                   │  FILA DE CHIPS CAPTURADOS (30 itens)         │
│  [preview 320px]  │                                              │
│                   │  [thumb] 8944...3021  1ª  14:32  ✓  [✕]    │
│  ● AGUARDANDO     │  [thumb] 8944...1892  1ª  14:31  ✓  [✕]    │
│                   │  [thumb] ERRO         2ª  14:30  ✗  [✕]    │
│  [campo ICCID]    │  ...                                         │
│  [captura manual] │                                              │
│                   │  [Ver todos os chips deste lote →]           │
└───────────────────┴──────────────────────────────────────────────┘
```

O botão **"Finalizar sessão"** fica no header da sessão, sempre visível, e leva para a tela de revisão (seção 2).

---

## 2. Tela de Revisão Pós-Captura

### 2.1 Objetivo

Ao clicar em "Finalizar sessão", o operador deve ver **todos os chips capturados nesta sessão** em uma tela de revisão antes de confirmar e salvar definitivamente o lote.

### 2.2 Fluxo completo

```
[Finalizar sessão] clicado
        ↓
Câmera para (stream encerrado)
        ↓
Navega para /leitura/revisao/<lote_id>/
        ↓
┌──────────────────────────────────────────────────────┐
│  REVISÃO DO LOTE: "Caixa A – Junho"                  │
│  52 chips capturados · 50 ✓ · 2 ✗                   │
├──────────────────────────────────────────────────────┤
│  DataTable com todos os chips:                       │
│  # | Thumb | ICCID | Tentativas | Status | Ação      │
│  ──────────────────────────────────────────────────  │
│  1 | [img] | 8944..3021 | 1ª | ✓ Lido   | [excluir] │
│  2 | [img] | 8944..1892 | 1ª | ✓ Lido   | [excluir] │
│  3 | [img] | ERRO       | 2ª | ✗ Erro   | [excluir] │
├──────────────────────────────────────────────────────┤
│           [← Voltar e continuar]  [✅ Confirmar lote]│
└──────────────────────────────────────────────────────┘
```

### 2.3 Ações disponíveis na tela de revisão

| Botão                    | Ação                                                                   |
|--------------------------|------------------------------------------------------------------------|
| `← Voltar e continuar`   | Reabre a câmera no mesmo lote — chips já capturados permanecem na fila |
| `✅ Confirmar lote`       | Salva o lote com status `em_revisao`, redireciona para `/lotes/<pk>/`  |
| `[excluir]` por chip     | Remove chip individual da lista (soft delete) antes de confirmar       |

### 2.4 Endpoint da tela de revisão

```
GET  /leitura/revisao/<lote_id>/   → renderiza template de revisão
POST /leitura/revisao/<lote_id>/confirmar/  → muda lote para em_revisao + redirect
DELETE /chips/<chip_id>/           → remove chip individual
```

### 2.5 Persistência da sessão entre "Voltar e continuar"

Ao voltar para a câmera, o sistema deve:

1. Reabrir o stream da câmera (`getUserMedia` novamente)
2. Recarregar a fila com os chips já salvos no banco para este lote
3. Continuar acumulando novos chips normalmente

```javascript
// Ao inicializar a câmera com lote_id existente
async inicializar() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.$refs.video.srcObject = this.stream;

    // Carregar chips já salvos deste lote
    const resp = await fetch(`/api/chips/?lote_id=${this.loteId}`);
    const data = await resp.json();
    this.chips = data.chips;
    this.totalSucesso = data.chips.filter(c => c.status_leitura === 'sucesso').length;
    this.totalErro = data.chips.filter(c => c.status_leitura === 'erro').length;
}
```

---

## 3. Excluir Lote

### 3.1 Problema

Não existe botão de exclusão de lote na tela de detalhes. Operadores não conseguem remover lotes criados por engano ou lotes vazios.

### 3.2 Regras de negócio para exclusão

| Situação do lote          | Pode excluir? | Motivo                                                  |
|---------------------------|---------------|---------------------------------------------------------|
| `aberto` (sem chips)      | ✅ Sim         | Lote vazio, sem impacto                                 |
| `aberto` (com chips)      | ✅ Sim         | Com confirmação — chips também são soft-deletados       |
| `em_revisao`              | ✅ Sim         | Com confirmação reforçada                               |
| `aprovado`                | ❌ Não         | Processo já aprovado — não permitir exclusão            |
| `executado`               | ❌ Não         | Chips já cancelados — auditoria obrigatória             |
| `cancelado`               | ❌ Não         | Histórico deve ser preservado                           |

### 3.3 Posicionamento do botão

Na tela de **detalhes do lote** (`/lotes/<pk>/`), o botão de excluir fica no header da página, à direita, apenas para lotes nos status `aberto` e `em_revisao`:

```html
{% if lote.status in 'aberto,em_revisao' %}
<button class="btn btn-outline-danger btn-sm"
        @click="confirmarExclusao = true">
    <i class="bi bi-trash3"></i> Excluir lote
</button>
{% endif %}
```

Na tela de **listagem de lotes**, o botão aparece apenas no card — como ícone de lixeira discreta (não destaque):

```html
<!-- Canto inferior direito do card, apenas para status elegíveis -->
<button class="btn btn-link text-danger p-0" style="font-size:0.8rem;"
        @click="confirmarExclusao = true">
    <i class="bi bi-trash3"></i> Excluir
</button>
```

### 3.4 Modal de confirmação de exclusão

Modal com dois níveis de confirmação para lotes com chips:

**Lote sem chips (simples):**

```
Excluir lote "Caixa A"?
Esta ação não pode ser desfeita.
[Cancelar]  [Excluir]
```

**Lote com chips (reforçado):**

```
Excluir lote "Caixa A"?
Este lote contém 52 chips. Todos serão excluídos junto com o lote.
Para confirmar, digite o nome do lote abaixo:

[ campo de texto ]

[Cancelar]  [Excluir definitivamente]  ← habilitado só após digitar o nome correto
```

```html
<div x-data="{ nomeLote: '{{ lote.nome_lote }}', confirmacao: '', podeSalvar: false }">
    <input type="text" x-model="confirmacao"
           @input="podeSalvar = confirmacao === nomeLote"
           placeholder="Digite o nome do lote para confirmar"
           class="form-control form-control-sm">

    <button :disabled="!podeSalvar"
            hx-delete="/lotes/{{ lote.pk }}/"
            hx-target="body"
            hx-push-url="/lotes/"
            class="btn btn-danger btn-sm mt-2 w-100">
        Excluir definitivamente
    </button>
</div>
```

### 3.5 Endpoint de exclusão

```python
# apps/tickets/views.py (ou apps/lotes/views.py)

@require_http_methods(["DELETE"])
def excluir_lote(request, pk):
    lote = get_object_or_404(Lote, pk=pk)

    # Guard: não permitir exclusão de lotes em estado final
    if lote.status in ('aprovado', 'executado', 'cancelado'):
        return JsonResponse(
            {'erro': 'Lotes aprovados ou executados não podem ser excluídos.'},
            status=403
        )

    # Soft delete nos chips filhos
    lote.chips.all().update(is_active=False)

    # Soft delete no lote
    lote.is_active = False
    lote.save()

    # Registrar no log de auditoria
    Log.objects.create(
        acao='exclusao_lote',
        usuario=request.user,
        resultado={'lote_id': str(lote.pk), 'nome': lote.nome_lote, 'chips': lote.quantidade}
    )

    return JsonResponse({'ok': True})
```

---

## 4. Dark Mode

### 4.1 Objetivo

Alternância de tema claro/escuro com persistência por usuário (salvo no banco ou `localStorage`).

### 4.2 Estratégia de implementação

Usar **classes CSS no `<html>`** + variáveis CSS customizadas. Sem bibliotecas externas.

```css
/* base.html — variáveis de tema */

/* Tema claro (padrão) */
:root {
    --bg-body:       #f8f9fa;
    --bg-card:       #ffffff;
    --bg-sidebar:    #1a2332;
    --text-primary:  #1f2937;
    --text-muted:    #6b7280;
    --border-color:  #dee2e6;
    --input-bg:      #ffffff;
}

/* Tema escuro */
[data-theme="dark"] {
    --bg-body:       #0f1117;
    --bg-card:       #1a1f2e;
    --bg-sidebar:    #0d1117;
    --text-primary:  #e5e7eb;
    --text-muted:    #9ca3af;
    --border-color:  #374151;
    --input-bg:      #1f2937;
}

/* Aplicar variáveis */
body                { background-color: var(--bg-body); color: var(--text-primary); }
.card               { background-color: var(--bg-card); border-color: var(--border-color); }
.form-control       { background-color: var(--input-bg); color: var(--text-primary); border-color: var(--border-color); }
.table              { --bs-table-bg: var(--bg-card); color: var(--text-primary); }
.modal-content      { background-color: var(--bg-card); }
.dropdown-menu      { background-color: var(--bg-card); border-color: var(--border-color); }
```

### 4.3 Toggle no header

Botão de alternância fixo no header da aplicação, ao lado do usuário logado:

```html
<!-- No base.html, dentro do header -->
<button id="btn-dark-mode"
        onclick="toggleDarkMode()"
        class="btn btn-link text-muted p-1"
        title="Alternar tema">
    <i class="bi" id="icon-dark-mode"></i>
</button>
```

```javascript
// Executado ao carregar a página
function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    const icon = document.getElementById('icon-dark-mode');
    icon.className = tema === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    localStorage.setItem('chipcut-theme', tema);
}

function toggleDarkMode() {
    const atual = document.documentElement.getAttribute('data-theme') || 'light';
    aplicarTema(atual === 'dark' ? 'light' : 'dark');
}

// Inicializar com preferência salva (ou preferência do sistema)
const temaSalvo = localStorage.getItem('chipcut-theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
aplicarTema(temaSalvo);
```

> Usar `localStorage` para persistir o tema — não é necessário salvar no banco para este caso.

### 4.4 Dark mode na câmera

A área de câmera já tem fundo escuro (`background: #1a1a1a`) — manter em ambos os temas. Apenas o texto ao redor deve seguir a variável `--text-primary`.

### 4.5 Dark mode no DataTables

O DataTables usa classes Bootstrap — ao aplicar `[data-theme="dark"]` as variáveis CSS do Bootstrap serão sobrescritas:

```css
[data-theme="dark"] .dataTables_wrapper {
    color: var(--text-primary);
}
[data-theme="dark"] table.dataTable thead th {
    background-color: #1f2937;
    border-color: var(--border-color);
}
[data-theme="dark"] table.dataTable tbody tr:hover {
    background-color: #2d3748;
}
[data-theme="dark"] .dataTables_filter input,
[data-theme="dark"] .dataTables_length select {
    background-color: var(--input-bg);
    color: var(--text-primary);
    border-color: var(--border-color);
}
```

### 4.6 Dark mode nos badges de status

Os badges Bootstrap (`bg-success`, `bg-warning`, etc.) têm bom contraste em fundo escuro — não precisam de override. Apenas garantir que não haja `background-color` hardcoded em inline style nos templates.

---

## 5. Requisitos desta SPEC 4

| ID       | Descrição                                                                                            |
|----------|------------------------------------------------------------------------------------------------------|
| SPEC4001 | Câmera permanece ativa após cada captura — nenhum redirect ou reload entre fotos                    |
| SPEC4002 | Endpoint `/capturar/` retorna sempre JSON — nunca redirect                                           |
| SPEC4003 | Estado da câmera gerenciado por Alpine.js com ciclo: aguardando → processando → resultado → aguardando |
| SPEC4004 | Botão "Finalizar sessão" visível no header da tela de leitura                                       |
| SPEC4005 | Tela de revisão em `/leitura/revisao/<lote_id>/` com DataTable de chips e dois botões de ação       |
| SPEC4006 | Botão "Voltar e continuar" reabre câmera no mesmo lote sem perder chips já capturados               |
| SPEC4007 | Botão "Confirmar lote" muda status para `em_revisao` e redireciona para detalhes do lote            |
| SPEC4008 | Chips individuais podem ser excluídos na tela de revisão antes de confirmar                         |
| SPEC4009 | Botão de excluir lote visível na tela de detalhes e na listagem para status `aberto` e `em_revisao` |
| SPEC4010 | Lotes com status `aprovado`, `executado` ou `cancelado` não podem ser excluídos                     |
| SPEC4011 | Exclusão de lote com chips exige confirmação digitando o nome do lote                               |
| SPEC4012 | Endpoint `DELETE /lotes/<pk>/` faz soft delete no lote e em todos os chips filhos                   |
| SPEC4013 | Exclusão de lote registrada no `Log` de auditoria                                                   |
| SPEC4014 | Botão de dark mode no header com ícone lua/sol alternando                                           |
| SPEC4015 | Tema persistido em `localStorage` com chave `chipcut-theme`                                         |
| SPEC4016 | Tema inicializado com `prefers-color-scheme` do sistema se não houver preferência salva             |
| SPEC4017 | Variáveis CSS cobrindo: body, cards, sidebar, inputs, tabelas, modais, dropdowns                    |
| SPEC4018 | DataTables com estilos de dark mode explícitos (sem depender de herança Bootstrap)                  |

---

## 6. O que NÃO está no escopo desta SPEC 4

- Sincronização do tema entre abas ou dispositivos
- Preferência de tema salva no banco de dados
- Alteração na lógica de OCR/IA
- Alteração nos modelos de banco de dados além do soft delete de chips na exclusão

---

## 7. Ordem de Implementação Sugerida

```
1. Corrigir endpoint de captura para retornar JSON puro (sem redirect)
2. Refatorar frontend da câmera para ciclo Alpine.js com estado local
3. Criar endpoint GET /api/chips/?lote_id=X para recarregar fila
4. Criar view e template da tela de revisão (/leitura/revisao/<lote_id>/)
5. Implementar endpoint POST de confirmação e DELETE de chip individual
6. Adicionar botão "Excluir lote" na tela de detalhes com modal de confirmação
7. Implementar endpoint DELETE /lotes/<pk>/ com guards de status
8. Implementar dark mode: variáveis CSS + toggle + localStorage
9. Adicionar CSS de dark mode para DataTables

10. Testar ciclo completo: capturar N chips → finalizar → revisar → confirmar
```