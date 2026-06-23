# GS Cut – SPEC: Limpeza de Histórico, Reorganização de Detalhes do Lote e Câmera Automática

> **Especificação técnica para implementação por IA (Claude)**

| Campo   | Valor                                |
|---------|--------------------------------------|
| Versão  | 1.0                                  |
| Status  | Pronto para Implementação            |
| Autor   | Grupo GoldenSat                      |
| Escopo  | GS Cut — lotes, detalhes e leitura   |

---

## Visão Geral

Esta SPEC cobre quatro pontos:

1. **Limpeza do histórico** — apagar todos os lotes antigos do banco para começar do zero
2. **Reorganização da tela de detalhes do lote** — abas internas + botões padronizados no canto superior direito
3. **Câmera automática** — remover placeholders e botões desnecessários, captura automática ao detectar chip
4. **Fluxo de sessão** — câmera ativa até o operador clicar em "Finalizar sessão"

---

## 1. Limpeza do Histórico de Lotes

### 1.1 Objetivo

Apagar todos os lotes existentes no banco (histórico, aprovados, em andamento, em revisão) para iniciar do zero sem dados antigos.

### 1.2 Comando via Django shell

Executar no servidor antes do deploy das demais alterações:

```python
# Executar via: python manage.py shell

from gscut.models import Lote, Chip, Log  # ajustar imports para os models reais

# Apagar chips primeiro (FK para lote)
total_chips = Chip.objects.all().count()
Chip.objects.all().delete()
print(f'{total_chips} chips deletados.')

# Apagar lotes
total_lotes = Lote.objects.all().count()
Lote.objects.all().delete()
print(f'{total_lotes} lotes deletados.')

# Apagar logs relacionados (opcional)
total_logs = Log.objects.all().count()
Log.objects.all().delete()
print(f'{total_logs} logs deletados.')

print('Limpeza concluída.')
```

### 1.3 Alternativa via migration de dados

Se preferir rastreabilidade, criar uma migration de dados:

```python
# gscut/migrations/000X_limpar_historico.py

from django.db import migrations

def limpar_lotes(apps, schema_editor):
    Chip = apps.get_model('gscut', 'Chip')
    Lote = apps.get_model('gscut', 'Lote')
    Log  = apps.get_model('gscut', 'Log')
    Chip.objects.all().delete()
    Lote.objects.all().delete()
    Log.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [('gscut', '000X_anterior')]  # ajustar

    operations = [
        migrations.RunPython(limpar_lotes, migrations.RunPython.noop),
    ]
```

> **Instrução ao Claude:** usar o shell como primeira opção por ser mais simples. A migration é recomendada se o projeto usar CI/CD com deploy automático.

### 1.4 Também limpar no Supabase Storage

Se as imagens estão no Supabase, limpar o bucket `chips/` antes de rodar o shell:

1. Acessar o painel do Supabase → Storage → `chipcut-imagens` (ou nome do bucket)
2. Selecionar a pasta `chips/`
3. Deletar todos os arquivos

---

## 2. Tela de Detalhes do Lote — Reorganização com Abas

### 2.1 Problema atual

Dentro de "Ver detalhes" (`/lotes/<pk>/`), os chips ficam todos misturados numa tabela única sem separação por status de revisão.

### 2.2 Estrutura com abas — padrão DevDesk

Igual ao padrão do Board da Sprint e da tela principal de lotes:

```
┌──────────────────────────────────────────────────────────────────────┐
│  Lote: "Caixa A – Junho"           [Aprovar] [Exportar] [Excluir]   │
│  52 chips · Criado por Eurico · 14/06/2025                          │
├─────────────────────────────────────────────────────────────────────┤
│                   [Aguardando] [Aprovados] [Rejeitados]              │
├─────────────────────────────────────────────────────────────────────┤
│  Conteúdo da aba ativa                                               │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 As três abas internas

| Aba               | Filtro                            | Cor da borda ativa |
|-------------------|-----------------------------------|--------------------|
| Aguardando        | `status_revisao='aguardando_aprovacao'` | Amarelo âmbar  |
| Aprovados         | `status_revisao='aprovado'`       | Verde              |
| Rejeitados        | `status_revisao='rejeitado'`      | Vermelho           |

### 2.4 Header da tela de detalhes — botões padronizados

Botões no **canto superior direito**, visíveis e organizados conforme o status do lote:

```html
<!-- Header da tela de detalhes /lotes/<pk>/ -->

<div class="d-flex justify-content-between align-items-start mb-4">

    <!-- Info do lote à esquerda -->
    <div>
        <h4 class="fw-bold mb-1" style="color: var(--gs-navy);">
            <i class="bi bi-archive me-2" style="color: var(--gs-amber);"></i>
            {{ lote.nome_lote }}
        </h4>
        <div class="d-flex align-items-center gap-3 text-muted" style="font-size:0.82rem;">
            <span><i class="bi bi-layers me-1"></i>{{ lote.quantidade }} chips</span>
            <span><i class="bi bi-person me-1"></i>{{ lote.usuario }}</span>
            <span><i class="bi bi-calendar me-1"></i>{{ lote.data_criacao|date:"d/m/Y H:i" }}</span>
            <span class="badge
                {% if lote.status == 'em_revisao' %}bg-warning text-dark
                {% elif lote.status == 'aprovado' %}bg-success
                {% elif lote.status == 'aberto' %}bg-primary
                {% else %}bg-secondary{% endif %}">
                {{ lote.get_status_display }}
            </span>
        </div>
    </div>

    <!-- Botões à direita — condicionais ao status -->
    <div class="d-flex align-items-center gap-2">

        {% if lote.status == 'em_revisao' %}
        <button class="btn btn-success btn-sm"
                hx-post="{% url 'gscut_aprovar_lote' lote.pk %}"
                hx-confirm="Aprovar este lote e iniciar o cancelamento dos chips?">
            <i class="bi bi-check-circle me-1"></i> Aprovar
        </button>
        {% endif %}

        {% if lote.status in 'aprovado,executado' %}
        <a href="{% url 'gscut_exportar_lote' lote.pk %}"
           class="btn btn-outline-secondary btn-sm">
            <i class="bi bi-file-earmark-excel me-1"></i> Exportar
        </a>
        {% endif %}

        {% if lote.status in 'aberto,em_revisao' %}
        <button class="btn btn-outline-danger btn-sm"
                hx-delete="{% url 'gscut_excluir_lote' lote.pk %}"
                hx-confirm="Excluir este lote? Esta ação não pode ser desfeita.">
            <i class="bi bi-trash3 me-1"></i> Excluir
        </button>
        {% endif %}

    </div>
</div>
```

### 2.5 Abas internas com query param

```html
<!-- Abas internas — canto superior direito acima da tabela -->

<div class="d-flex justify-content-between align-items-center mb-3">
    <span class="text-muted small">
        Mostrando chips da aba selecionada
    </span>

    <div class="d-flex gap-1">

        <a href="?aba=aguardando"
           class="btn btn-sm px-3 aba-lote
           {% if aba_ativa == 'aguardando' %}aba-ativa aba-amarela{% else %}aba-inativa{% endif %}">
            <i class="bi bi-clock-history me-1"></i>
            Aguardando
            {% if count_aguardando > 0 %}
            <span class="badge bg-warning text-dark ms-1" style="font-size:0.65rem;">
                {{ count_aguardando }}
            </span>
            {% endif %}
        </a>

        <a href="?aba=aprovados"
           class="btn btn-sm px-3 aba-lote
           {% if aba_ativa == 'aprovados' %}aba-ativa aba-verde{% else %}aba-inativa{% endif %}">
            <i class="bi bi-check-circle me-1"></i>
            Aprovados
            {% if count_aprovados > 0 %}
            <span class="badge bg-success ms-1" style="font-size:0.65rem;">
                {{ count_aprovados }}
            </span>
            {% endif %}
        </a>

        <a href="?aba=rejeitados"
           class="btn btn-sm px-3 aba-lote
           {% if aba_ativa == 'rejeitados' %}aba-ativa aba-vermelha{% else %}aba-inativa{% endif %}">
            <i class="bi bi-x-circle me-1"></i>
            Rejeitados
            {% if count_rejeitados > 0 %}
            <span class="badge bg-danger ms-1" style="font-size:0.65rem;">
                {{ count_rejeitados }}
            </span>
            {% endif %}
        </a>

    </div>
</div>
```

### 2.6 CSS adicional para aba vermelha

```css
/* Adicionar ao CSS existente das abas */
.aba-ativa.aba-vermelha { border-bottom-color: #dc3545 !important; }
```

### 2.7 View de detalhes atualizada

```python
# gscut/views.py

@login_required
def lote_detalhe(request, pk):
    lote = get_object_or_404(Lote, pk=pk, is_active=True)

    aba = request.GET.get('aba', 'aguardando')
    if aba not in ('aguardando', 'aprovados', 'rejeitados'):
        aba = 'aguardando'

    STATUS_ABA = {
        'aguardando': 'aguardando_aprovacao',
        'aprovados':  'aprovado',
        'rejeitados': 'rejeitado',
    }

    chips = Chip.objects.filter(
        lote=lote,
        status_revisao=STATUS_ABA[aba],
        is_active=True
    ).order_by('-data_leitura')

    return render(request, 'gscut/lote_detalhe.html', {
        'lote':             lote,
        'chips':            chips,
        'aba_ativa':        aba,
        'count_aguardando': lote.chips.filter(status_revisao='aguardando_aprovacao', is_active=True).count(),
        'count_aprovados':  lote.chips.filter(status_revisao='aprovado',             is_active=True).count(),
        'count_rejeitados': lote.chips.filter(status_revisao='rejeitado',            is_active=True).count(),
    })
```

---

## 3. Câmera — Abertura Automática e Captura Sem Clique

### 3.1 Remover da tela de leitura

| O que remover                          | Onde está                              |
|----------------------------------------|----------------------------------------|
| Texto placeholder "Toque para fotografar" | Dentro da área da câmera             |
| Botão "Tirar foto do chip"             | Qualquer botão com este texto          |
| Texto/estado "Aguardando chip"         | Painel de status abaixo do preview     |
| Botão "Capturar câmera IP"             | Renomear apenas para **"Capturar"**    |

### 3.2 Câmera abre automaticamente

Ao entrar na tela de leitura, o stream da câmera inicia **sem nenhum clique**:

```javascript
// Ao carregar a página — sem aguardar interação do usuário
document.addEventListener('DOMContentLoaded', async function () {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width:  { ideal: 1280 },
                height: { ideal: 720  },
                facingMode: 'environment'  // câmera traseira em mobile
            }
        });
        const video = document.getElementById('camera-preview');
        video.srcObject = stream;
        video.play();

        // Iniciar detecção automática após câmera abrir
        iniciarDeteccaoAutomatica(video);

    } catch (err) {
        console.error('Erro ao acessar câmera:', err);
        document.getElementById('camera-erro').style.display = 'block';
    }
});
```

### 3.3 Captura automática ao detectar chip

Usar análise de frame para detectar quando um objeto (chip) é posicionado na área de leitura e disparar a captura automaticamente — sem o operador clicar em nada:

```javascript
function iniciarDeteccaoAutomatica(video) {
    const canvas  = document.createElement('canvas');
    const ctx     = canvas.getContext('2d');
    let frameAnterior = null;
    let cooldown  = false;   // evita múltiplas capturas seguidas

    const INTERVALO_MS      = 200;   // analisar a cada 200ms
    const COOLDOWN_MS       = 3000;  // aguardar 3s após cada captura
    const THRESHOLD_MUDANCA = 0.08;  // 8% de mudança nos pixels = chip detectado

    setInterval(() => {
        if (cooldown || video.readyState < 2) return;

        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const frameAtual = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (frameAnterior) {
            const mudanca = calcularMudancaFrame(frameAnterior.data, frameAtual.data);

            if (mudanca > THRESHOLD_MUDANCA) {
                // Chip detectado — aguardar 400ms para estabilizar e capturar
                cooldown = true;
                setTimeout(() => {
                    capturarFrame(canvas, ctx, video);
                    setTimeout(() => { cooldown = false; }, COOLDOWN_MS);
                }, 400);
            }
        }

        frameAnterior = frameAtual;
    }, INTERVALO_MS);
}

function calcularMudancaFrame(dados1, dados2) {
    let pixelsDiferentes = 0;
    const total = dados1.length / 4;  // total de pixels

    for (let i = 0; i < dados1.length; i += 4) {
        const difR = Math.abs(dados1[i]     - dados2[i]);
        const difG = Math.abs(dados1[i + 1] - dados2[i + 1]);
        const difB = Math.abs(dados1[i + 2] - dados2[i + 2]);
        if (difR + difG + difB > 30) pixelsDiferentes++;
    }

    return pixelsDiferentes / total;
}

function capturarFrame(canvas, ctx, video) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
        const form = new FormData();
        form.append('imagem', blob, 'chip.jpg');
        form.append('lote_id', document.getElementById('lote-id-input').value);
        form.append('csrfmiddlewaretoken', getCsrf());

        // Indicar visualmente que está processando
        setStatusCamera('processando');

        fetch('/gscut/capturar/', { method: 'POST', body: form })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setStatusCamera('sucesso', data.iccid);
                    adicionarNaFila(data);
                    atualizarContadores();
                } else {
                    setStatusCamera('erro');
                }
                // Volta para aguardando após 1.5s
                setTimeout(() => setStatusCamera('aguardando'), 1500);
            })
            .catch(() => {
                setStatusCamera('erro');
                setTimeout(() => setStatusCamera('aguardando'), 1500);
            });
    }, 'image/jpeg', 0.92);
}
```

### 3.4 Estados visuais da câmera (simplificados)

Remover o estado "Aguardando chip" como texto visível. O preview da câmera aberto já indica que está aguardando:

| Estado          | Visual                                      |
|-----------------|---------------------------------------------|
| `processando`   | Overlay azul piscando sobre o preview       |
| `sucesso`       | Flash verde rápido (0.5s) + ICCID exibido  |
| `erro`          | Flash vermelho (1s) + mensagem breve        |
| `aguardando`    | Preview limpo sem overlay — câmera aberta  |

```javascript
function setStatusCamera(estado, iccid = '') {
    const overlay = document.getElementById('camera-overlay-status');

    const configs = {
        aguardando:   { classe: '',                texto: ''                         },
        processando:  { classe: 'overlay-azul',    texto: 'Processando...'           },
        sucesso:      { classe: 'overlay-verde',   texto: iccid || 'Lido!'           },
        erro:         { classe: 'overlay-vermelho', texto: 'Reposicione o chip'      },
    };

    const cfg = configs[estado] || configs.aguardando;
    overlay.className = `camera-overlay ${cfg.classe}`;
    overlay.textContent = cfg.texto;
}
```

### 3.5 CSS dos overlays

```css
.camera-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 12px;
    transition: background 0.2s ease, opacity 0.2s ease;
    pointer-events: none;
    opacity: 0;
}

.camera-overlay.overlay-azul    { background: rgba(13, 110, 253, 0.35); opacity: 1; color: #fff; }
.camera-overlay.overlay-verde   { background: rgba(25, 135, 84,  0.45); opacity: 1; color: #fff; }
.camera-overlay.overlay-vermelho{ background: rgba(220, 53, 69,  0.45); opacity: 1; color: #fff; }
```

---

## 4. Fluxo de Sessão — Só Avança ao Clicar em "Finalizar Sessão"

### 4.1 Comportamento

- A câmera fica ativa e capturando chips continuamente
- Nenhuma ação é necessária entre chips — posiciona, captura automática, posiciona o próximo
- O operador só sai da tela de leitura ao clicar em **"Finalizar sessão"**
- Ao clicar, a câmera para e navega para a tela de revisão do lote

### 4.2 Botão de finalizar sessão

Sempre visível no header da sessão de leitura:

```html
<!-- No header da tela de leitura -->

<div class="d-flex justify-content-between align-items-center mb-3">
    <div>
        <span class="fw-semibold">Lote: {{ lote.nome_lote }}</span>
        <span class="text-muted ms-3 small" id="contador-sessao">
            0 lidos · 0 erros
        </span>
    </div>

    <button id="btn-finalizar"
            class="btn btn-primary btn-sm"
            onclick="finalizarSessao()">
        <i class="bi bi-check-lg me-1"></i>
        Finalizar sessão
    </button>
</div>
```

```javascript
function finalizarSessao() {
    // Parar o stream da câmera
    const video = document.getElementById('camera-preview');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    // Navegar para a tela de revisão
    const loteId = document.getElementById('lote-id-input').value;
    window.location.href = `/gscut/leitura/revisao/${loteId}/`;
}
```

---

## 5. O que NÃO alterar

- Lógica de aprovação de lotes
- Modelos de banco de dados
- Tela de revisão pós-sessão
- Integração com IA/OCR
- Outros apps do sistema

---

## 6. Checklist de implementação

```
[ ] Executar limpeza do banco via shell (Chip, Lote, Log)
[ ] Limpar pasta chips/ no Supabase Storage
[ ] Atualizar view lote_detalhe para suportar ?aba=aguardando/aprovados/rejeitados
[ ] Adicionar abas internas no template /lotes/<pk>/ com badges de contagem
[ ] Reorganizar botões de ação (Aprovar, Exportar, Excluir) no canto superior direito
[ ] Adicionar CSS .aba-ativa.aba-vermelha ao arquivo de estilos
[ ] Remover placeholder "Toque para fotografar" do template de leitura
[ ] Remover botão "Tirar foto do chip" e estado "Aguardando chip"
[ ] Renomear "Capturar câmera IP" para somente "Capturar"
[ ] Implementar abertura automática da câmera no DOMContentLoaded
[ ] Implementar iniciarDeteccaoAutomatica() com análise de mudança de frame
[ ] Implementar overlays de status (azul/verde/vermelho) sem texto de "aguardando"
[ ] Garantir que câmera não redireciona entre chips — só "Finalizar sessão" avança
[ ] Implementar finalizarSessao() parando o stream e redirecionando para revisão
[ ] Testar: entrar na leitura → câmera abre sozinha sem clique
[ ] Testar: posicionar chip → captura automática em até 1s
[ ] Testar: chip em qualquer orientação → captura funciona
[ ] Testar: vários chips em sequência → nenhum clique necessário entre eles
[ ] Testar: clicar "Finalizar sessão" → câmera para, vai para revisão do lote
[ ] Testar: /lotes/<pk>/?aba=aguardando → chips aguardando aparecendo
[ ] Testar: /lotes/<pk>/?aba=aprovados → chips aprovados aparecendo
[ ] Testar: /lotes/<pk>/?aba=rejeitados → chips rejeitados aparecendo
[ ] Confirmar que histórico foi limpo e banco está vazio
```
