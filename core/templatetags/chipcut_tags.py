"""Template tags do ChipCut."""

import json
import os

from django import template
from django.contrib.staticfiles import finders
from django.templatetags.static import static as static_url

register = template.Library()


@register.filter
def mascarar_iccid(value):
    """Mostra os 4 primeiros e 4 últimos dígitos (ex.: 8944…4068) p/ economizar espaço."""
    s = str(value or "")
    if len(s) <= 9:
        return s
    return f"{s[:4]}…{s[-4:]}"


@register.filter
def json_pretty(value):
    """Formata um valor (JSONField) de forma legível para o modal de detalhes."""
    try:
        return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True)
    except (TypeError, ValueError):
        return str(value)


@register.simple_tag
def static_v(path):
    """Como {% static %}, mas anexa ?v=<mtime> para invalidar o cache do
    navegador automaticamente sempre que o arquivo muda (evita CSS velho)."""
    url = static_url(path)
    caminho = finders.find(path)
    if caminho and os.path.exists(caminho):
        try:
            versao = int(os.path.getmtime(caminho))
        except OSError:
            return url
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}v={versao}"
    return url

# Mapas de badge por tipo de status (spec 4.2–4.4), com os valores REAIS do
# schema atual (ex.: lote usa 'exportado', não 'executado').
BADGES = {
    "revisao": {
        "aguardando_aprovacao": {"label": "Aguardando Aprovação", "cor": "warning", "icone": "bi-clock-history"},
        "aprovado": {"label": "Aprovado", "cor": "success", "icone": "bi-check-circle"},
        "rejeitado": {"label": "Rejeitado", "cor": "danger", "icone": "bi-x-circle"},
    },
    "leitura": {
        "sucesso": {"label": "Lido", "cor": "success", "icone": "bi-check2"},
        "erro": {"label": "Erro de Leitura", "cor": "danger", "icone": "bi-exclamation-triangle"},
        "pendente": {"label": "Pendente", "cor": "secondary", "icone": "bi-hourglass"},
    },
    "lote": {
        "aberto": {"label": "Aberto", "cor": "primary", "icone": "bi-folder2-open"},
        "em_revisao": {"label": "Em Revisão", "cor": "warning", "icone": "bi-eye"},
        "aprovado": {"label": "Aprovado", "cor": "info", "icone": "bi-clipboard-check"},
        "exportado": {"label": "Exportado", "cor": "success", "icone": "bi-check-all"},
        "cancelado": {"label": "Cancelado", "cor": "secondary", "icone": "bi-slash-circle"},
    },
    # Badge por tipo de ação de log (spec2 4.4, adaptado aos Log.Acao reais).
    "log": {
        "leitura": {"label": "Leitura", "cor": "primary", "icone": "bi-camera"},
        "correcao": {"label": "Correção Manual", "cor": "warning", "icone": "bi-pencil"},
        "criar_lote": {"label": "Criação de Lote", "cor": "primary", "icone": "bi-folder-plus"},
        "renomear_lote": {"label": "Renomeação", "cor": "light", "icone": "bi-input-cursor-text"},
        "aprovar_lote": {"label": "Aprovação de Lote", "cor": "info", "icone": "bi-check-circle"},
        "cancelar_lote": {"label": "Cancelamento", "cor": "secondary", "icone": "bi-x-circle"},
        "exclusao_lote": {"label": "Exclusão de Lote", "cor": "danger", "icone": "bi-trash3"},
        "remover_chip": {"label": "Remoção de Chip", "cor": "danger", "icone": "bi-trash"},
        "exportar": {"label": "Exportação", "cor": "success", "icone": "bi-file-earmark-excel"},
    },
}

_PADRAO = {"label": "", "cor": "secondary", "icone": "bi-question"}


@register.inclusion_tag("components/status_badge.html")
def status_badge(valor, tipo="revisao"):
    """Renderiza o badge correto para um valor de status."""
    config = BADGES.get(tipo, {}).get(valor, {**_PADRAO, "label": valor or "—"})
    return {"config": config}
