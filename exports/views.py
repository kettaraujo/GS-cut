from urllib.parse import quote

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from lotes.models import Lote

from .services import exportar_lote_excel, exportar_todos_excel

XLSX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)


def _xlsx_response(conteudo, nome_arquivo):
    response = HttpResponse(conteudo, content_type=XLSX_CONTENT_TYPE)
    response["Content-Disposition"] = (
        f"attachment; filename*=UTF-8''{quote(nome_arquivo)}"
    )
    return response


@login_required
def lote_excel(request, lote_id):
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    conteudo = exportar_lote_excel(lote, request.user)
    return _xlsx_response(conteudo, f"lote_{lote.nome}.xlsx".replace(" ", "_"))


@login_required
def todos_excel(request):
    """Exporta os ICCIDs de todos os lotes ativos numa única planilha."""
    conteudo = exportar_todos_excel(request.user)
    return _xlsx_response(conteudo, "todos_os_lotes_iccids.xlsx")
