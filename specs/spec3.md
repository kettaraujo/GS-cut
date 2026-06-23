# ChipCut – SPEC 3: Supabase Storage, Lotes e Leitura

> **Especificação técnica para implementação por IA (Claude)**
> Continuação da SPEC 2 — não substitui, complementa e corrige.

| Campo   | Valor                               |
|---------|-------------------------------------|
| Versão  | 3.0                                 |
| Status  | Pronto para Implementação           |
| Autor   | Grupo GoldenSat                     |
| Base    | SPEC 1 · SPEC 2 · PRD ChipCut v1.1  |

---

## Contexto

Esta SPEC cobre três pontos de melhoria:

1. **Storage de imagens** — migrar de FileField local (disco do servidor) para Supabase Storage, evitando acúmulo de arquivos no ambiente de desenvolvimento e em produção
2. **Aba de Lotes** — tornar a tela mais intuitiva para o usuário final
3. **Aba de Leitura** — reduzir e melhorar visualmente a área de câmera

---

## 1. Migração de Imagens para Supabase Storage

### 1.1 Problema

As imagens dos chips (`chip.imagem` e `chip.imagem_tentativa_2`) estão sendo salvas como `FileField` no disco local do servidor (pasta `media/`). Com centenas de fotos por sessão, isso:

- Acumula arquivos no disco do VS Code / servidor de dev
- Não escala para produção
- Dificulta backup e recuperação
- Torna o deploy mais complexo (arquivos não versionáveis)

### 1.2 Solução

Usar **Supabase Storage** como backend de arquivos. Toda imagem capturada é enviada diretamente para um bucket no Supabase e apenas a **URL pública** é salva no banco PostgreSQL.

### 1.3 Arquitetura da solução

```
Câmera captura imagem
        ↓
Django recebe o arquivo em memória (não salva em disco)
        ↓
Serviço SupabaseStorageService envia para bucket via API REST
        ↓
Supabase retorna URL pública
        ↓
Django salva apenas a URL (CharField) no model Chip
        ↓
Template exibe <img src="{{ chip.imagem_url }}">
```

### 1.4 Alterações no model `Chip`

Substituir os dois `FileField` por `CharField` com a URL:

```python
# ANTES
imagem = models.FileField(upload_to='chips/')
imagem_tentativa_2 = models.FileField(upload_to='chips/', null=True, blank=True)

# DEPOIS
imagem_url = models.URLField(max_length=500, blank=True, null=True,
                              help_text="URL pública da imagem no Supabase Storage")
imagem_tentativa_2_url = models.URLField(max_length=500, blank=True, null=True,
                                          help_text="URL da 2ª tentativa no Supabase Storage")
```

> Gerar migration `0002_chip_supabase_storage.py` renomeando os campos.

### 1.5 Configuração do Supabase

Variáveis de ambiente necessárias no `.env`:

```env
SUPABASE_URL=https://<projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>   # não usar anon key — precisa de write
SUPABASE_STORAGE_BUCKET=chipcut-imagens
```

Em `settings.py`:

```python
import os

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
SUPABASE_STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'chipcut-imagens')
```

### 1.6 Service: `SupabaseStorageService`

Criar em `apps/core/services/supabase_storage.py`:

```python
import httpx
from django.conf import settings
from django.utils import timezone
import uuid


class SupabaseStorageService:
    """
    Envia imagens para o Supabase Storage e retorna a URL pública.
    Nunca salva arquivo em disco local.
    """

    BASE_URL = f"{settings.SUPABASE_URL}/storage/v1"
    BUCKET = settings.SUPABASE_STORAGE_BUCKET
    HEADERS = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
    }

    @classmethod
    def upload(cls, image_bytes: bytes, iccid: str, tentativa: int = 1) -> str:
        """
        Faz upload da imagem e retorna a URL pública.

        Args:
            image_bytes: conteúdo da imagem em bytes (sem salvar em disco)
            iccid: usado para nomear o arquivo de forma rastreável
            tentativa: 1 ou 2

        Returns:
            URL pública da imagem no Supabase Storage
        """
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{iccid}_{timestamp}_t{tentativa}_{uuid.uuid4().hex[:6]}.jpg"
        path = f"chips/{filename}"

        upload_url = f"{cls.BASE_URL}/object/{cls.BUCKET}/{path}"

        response = httpx.put(
            upload_url,
            headers={**cls.HEADERS, "Content-Type": "image/jpeg"},
            content=image_bytes,
            timeout=10.0,
        )
        response.raise_for_status()

        public_url = f"{cls.BASE_URL}/object/public/{cls.BUCKET}/{path}"
        return public_url

    @classmethod
    def delete(cls, url: str) -> None:
        """Remove uma imagem do Supabase pelo URL completo."""
        path = url.split(f"public/{cls.BUCKET}/")[-1]
        delete_url = f"{cls.BASE_URL}/object/{cls.BUCKET}/{path}"
        httpx.delete(delete_url, headers=cls.HEADERS, timeout=10.0)
```

### 1.7 Integração no fluxo de leitura

No service de captura (`apps/capture/services.py`), substituir o `file.save()` pelo upload:

```python
from apps.core.services.supabase_storage import SupabaseStorageService

# ANTES
chip.imagem.save(filename, content)

# DEPOIS — imagem em memória, nunca toca o disco
image_bytes = captura_em_bytes()  # retorno da câmera como bytes
url = SupabaseStorageService.upload(image_bytes, iccid=iccid_extraido, tentativa=1)
chip.imagem_url = url
chip.save()
```

### 1.8 Configuração do bucket no Supabase

O bucket `chipcut-imagens` deve ser criado com as seguintes políticas:

| Política       | Configuração                                              |
|----------------|-----------------------------------------------------------|
| Visibilidade   | **Public** — URLs acessíveis sem autenticação para exibir nas telas |
| Upload         | Apenas via `service_role` (backend Django) — nunca direto do browser |
| Organização    | Pasta `chips/` para todas as imagens                      |
| Formato aceito | `image/jpeg` apenas                                       |

### 1.9 Exibição nas templates

Substituir todas as referências a `chip.imagem.url` por `chip.imagem_url`:

```html
<!-- ANTES -->
<img src="{{ chip.imagem.url }}" width="40" height="40">

<!-- DEPOIS -->
{% if chip.imagem_url %}
    <img src="{{ chip.imagem_url }}" width="40" height="40"
         class="rounded object-fit-cover"
         loading="lazy"
         onerror="this.src='/static/img/chip-placeholder.png'">
{% else %}
    <span class="text-muted">—</span>
{% endif %}
```

### 1.10 Dependência

Adicionar ao `requirements.txt`:

```
httpx>=0.27.0
```

> Não usar o SDK oficial `supabase-py` — o upload via `httpx` direto na API REST é mais simples, sem dependências extras e suficiente para este caso de uso.

### 1.11 Remover configuração de media files

Com Supabase Storage, as configurações abaixo deixam de ser necessárias:

```python
# settings.py — REMOVER ou comentar:
# MEDIA_URL = '/media/'
# MEDIA_ROOT = BASE_DIR / 'media'

# urls.py — REMOVER:
# + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## 2. Aba de Lotes – Melhorias de Intuitividade

### 2.1 Problema

A tela de lotes ainda confunde os usuários mesmo após as melhorias da SPEC 2. Os principais pontos de atrito são:

- Não fica claro **qual ação tomar** em cada lote
- O status é visualmente presente mas não guia o usuário
- Muita informação ao mesmo tempo nos cards

### 2.2 Princípio da mudança

Cada card de lote deve responder claramente à pergunta: **"O que eu faço agora com este lote?"**

A ação principal de cada status deve ser o botão mais destacado do card — não um entre vários.

### 2.3 Card de lote – nova hierarquia visual

```
┌──────────────────────────────────────────────────────┐
│  [badge status]                    há 2 horas        │
│                                                      │
│  📦  Caixa A – Junho                                 │
│      52 chips  ·  50 ✓  ·  2 ✗                     │
│      Criado por Eurico                               │
│                                                      │
│  ┌──────────────────────────────────┐               │
│  │  ✅  APROVAR LOTE                │  ← destaque   │
│  └──────────────────────────────────┘               │
│  [Ver detalhes]          [Cancelar]                  │
└──────────────────────────────────────────────────────┘
```

**Regra do botão principal por status:**

| Status do lote | Botão principal (destaque)         | Botões secundários              |
|----------------|------------------------------------|---------------------------------|
| `aberto`       | `Ir para Leitura` (azul)           | Ver detalhes                    |
| `em_revisao`   | `Aprovar Lote` (verde, grande)     | Ver detalhes · Cancelar (link)  |
| `aprovado`     | `Iniciar Cancelamento` (laranja)   | Ver detalhes                    |
| `executado`    | `Exportar CSV` (secundário)        | Ver histórico                   |
| `cancelado`    | `Exportar CSV` (secundário)        | Ver histórico                   |

### 2.4 Indicador de urgência nos cards `em_revisao`

Cards com status `em_revisao` devem ter borda esquerda vermelha/amarela e aparecer sempre no topo da listagem:

```css
.card-lote-em-revisao {
    border-left: 4px solid var(--chipcut-warning);
    background-color: #fffbf0;
}
```

### 2.5 Texto de contexto em cada seção

Adicionar uma linha de instrução abaixo do título de cada seção para guiar o usuário:

| Seção          | Texto de contexto                                              |
|----------------|----------------------------------------------------------------|
| Em Revisão     | `Estes lotes foram lidos e aguardam sua aprovação para cancelamento.` |
| Em Andamento   | `Lotes com leitura em progresso. Continue adicionando chips.`  |
| Aprovados      | `Prontos para cancelamento. Clique em "Iniciar Cancelamento".` |
| Histórico      | `Lotes já finalizados. Disponíveis apenas para consulta.`      |

### 2.6 Confirmação de ações destrutivas

Antes de executar **Aprovar Lote**, **Iniciar Cancelamento** ou **Cancelar Lote**, exibir modal de confirmação simples com resumo da ação:

```html
<!-- Modal de confirmação via Alpine.js + HTMX -->
<div x-data="{ aberto: false, acao: '', lote: '' }">

    <!-- Botão que abre o modal -->
    <button @click="acao='aprovar'; lote='Caixa A – Junho'; aberto=true"
            class="btn btn-success w-100">
        ✅ Aprovar Lote
    </button>

    <!-- Modal -->
    <div x-show="aberto" class="modal-backdrop-custom">
        <div class="card shadow p-4" style="max-width:400px">
            <h6>Confirmar ação</h6>
            <p>Você está prestes a <strong x-text="acao"></strong> o lote
               <strong x-text="lote"></strong>. Esta ação não pode ser desfeita.</p>
            <div class="d-flex gap-2 justify-content-end">
                <button @click="aberto=false" class="btn btn-secondary btn-sm">Cancelar</button>
                <button hx-post="/lotes/{{ lote.pk }}/aprovar/"
                        hx-target="#secao-em-revisao"
                        @click="aberto=false"
                        class="btn btn-success btn-sm">Confirmar</button>
            </div>
        </div>
    </div>
</div>
```

---

## 3. Aba de Leitura – Reduzir Área da Câmera

### 3.1 Problema

A área de câmera ocupa espaço excessivo na tela, especialmente em monitores menores. O preview de vídeo é grande demais para a função que cumpre — o operador não precisa de um preview enorme, precisa apenas de confirmação visual de que o chip está bem posicionado.

### 3.2 Nova proporção da área de câmera

Reduzir de coluna `col-lg-6` para `col-lg-4`, dando mais espaço para a fila de leituras:

```
ANTES:
┌──────────────────┬──────────────────┐
│   Câmera (50%)   │  Fila (50%)      │
└──────────────────┴──────────────────┘

DEPOIS:
┌────────────┬────────────────────────┐
│ Câmera(35%)│  Fila de leituras(65%) │
└────────────┴────────────────────────┘
```

### 3.3 Preview de câmera – tamanho máximo

```css
/* Limitar o tamanho do preview */
#camera-preview-container {
    max-width: 320px;       /* Nunca maior que 320px */
    margin: 0 auto;
}

#camera-preview {
    width: 100%;
    aspect-ratio: 4/3;
    border-radius: 12px;
    border: 2px solid #dee2e6;
    background: #1a1a1a;
}
```

### 3.4 Layout compacto do painel de câmera

Reorganizar os elementos da coluna da câmera para ficarem mais compactos:

```
┌─────────────────────────────────┐
│  [preview câmera 320px × 240px] │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ● AGUARDANDO CHIP       │   │  ← status bar compacta (altura ~48px)
│  └─────────────────────────┘   │
│                                 │
│  [campo ICCID detectado]        │  ← input pequeno, sempre visível
│  [botão captura manual]         │  ← compacto, abaixo do campo
└─────────────────────────────────┘
```

**Status bar compacta:**

```html
<!-- Antes: painel grande com padding generoso -->
<!-- Depois: barra horizontal compacta abaixo do preview -->

<div id="status-bar" class="d-flex align-items-center gap-2 p-2 rounded mt-2"
     :class="statusClass">
    <i class="bi" :class="statusIcon" style="font-size:1.1rem;"></i>
    <span class="fw-semibold" style="font-size:0.85rem;" x-text="statusTexto"></span>
</div>
```

### 3.5 Overlay de guia no preview

O overlay de posicionamento deve ser mais sutil — apenas um retângulo tracejado fino, sem poluir o preview:

```css
#camera-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 55%;
    border: 2px dashed rgba(255, 255, 255, 0.6);
    border-radius: 6px;
    pointer-events: none;
}

/* Canto do guia — estilo scanner */
#camera-overlay::before,
#camera-overlay::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-color: #00e5ff;
    border-style: solid;
    border-width: 0;
}
#camera-overlay::before {
    top: -2px; left: -2px;
    border-top-width: 3px;
    border-left-width: 3px;
}
#camera-overlay::after {
    bottom: -2px; right: -2px;
    border-bottom-width: 3px;
    border-right-width: 3px;
}
```

### 3.6 Fila de leituras – aproveitar espaço extra

Com a câmera menor, a fila de leituras ganha mais espaço. Aproveitar para:

- Aumentar de 20 para **30 itens visíveis** na fila
- Exibir o ICCID **completo** (não truncado) — agora há espaço
- Adicionar coluna de **imagem thumbnail** (32×32) na fila para confirmação visual rápida

```html
<!-- Item da fila de leituras — versão expandida -->
<div class="d-flex align-items-center gap-2 p-2 border-bottom">
    <img src="{{ chip.imagem_url }}" width="32" height="32"
         class="rounded object-fit-cover flex-shrink-0">
    <span class="badge" :class="badgeClass">{{ tentativa }}</span>
    <span class="font-monospace flex-grow-1" style="font-size:0.8rem;">{{ iccid }}</span>
    <span class="text-muted" style="font-size:0.75rem;">{{ horario }}</span>
    <i class="bi bi-pencil text-muted cursor-pointer" @click="corrigir(id)"></i>
</div>
```

---

## 4. Requisitos desta SPEC 3

| ID       | Descrição                                                                                       |
|----------|-------------------------------------------------------------------------------------------------|
| SPEC3001 | `FileField` substituído por `URLField` nos campos de imagem do model `Chip`                    |
| SPEC3002 | Migration gerada para renomear `imagem` → `imagem_url` e `imagem_tentativa_2` → `imagem_tentativa_2_url` |
| SPEC3003 | `SupabaseStorageService` implementado em `apps/core/services/supabase_storage.py`              |
| SPEC3004 | Variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` no `.env`     |
| SPEC3005 | Nenhuma imagem salva em disco local — todo upload via Supabase Storage                          |
| SPEC3006 | `MEDIA_URL` e `MEDIA_ROOT` removidos do settings e urls.py                                     |
| SPEC3007 | Templates atualizadas para usar `chip.imagem_url` com fallback para placeholder                |
| SPEC3008 | `httpx` adicionado ao `requirements.txt`                                                        |
| SPEC3009 | Card de lote com botão principal destacado conforme status (tabela seção 2.3)                  |
| SPEC3010 | Modal de confirmação antes de aprovar, iniciar cancelamento ou cancelar lote                    |
| SPEC3011 | Texto de contexto instrutivo abaixo do título de cada seção da tela de lotes                   |
| SPEC3012 | Cards `em_revisao` com borda esquerda destacada e sempre no topo                               |
| SPEC3013 | Área da câmera reduzida para `col-lg-4` com `max-width: 320px` no preview                     |
| SPEC3014 | Status bar da câmera compacta (altura ~48px) substituindo painel grande                        |
| SPEC3015 | Overlay de guia sutil com estilo scanner (cantos coloridos, borda fina)                        |
| SPEC3016 | Fila de leituras exibe 30 itens com ICCID completo e thumbnail da imagem                       |

---

## 5. O que NÃO está no escopo desta SPEC 3

- Alteração no fluxo de verificação em 2 etapas (PRD)
- Autenticação com o Supabase (apenas Storage — o banco continua PostgreSQL direto)
- Alteração no processo de aprovação de lotes já especificado
- Criação de bucket automático — deve ser criado manualmente no painel do Supabase antes do deploy

---

## 6. Ordem de Implementação Sugerida

```
1. Criar bucket "chipcut-imagens" no Supabase (manual, via painel)
2. Adicionar variáveis de ambiente no .env
3. Implementar SupabaseStorageService e testar upload isoladamente
4. Gerar e aplicar migration de renomeação dos campos
5. Atualizar service de captura para usar SupabaseStorageService
6. Atualizar todas as templates que referenciam chip.imagem.url
7. Remover MEDIA_URL / MEDIA_ROOT do settings e urls.py
8. Implementar melhorias nos cards de lote (botão principal + modal + texto de contexto)
9. Reduzir área da câmera e ajustar CSS do preview e overlay
10. Expandir fila de leituras com thumbnail e ICCID completo
```
