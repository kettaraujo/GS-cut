from datetime import date

from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .services import montar_contexto


def _parse_data(valor):
    try:
        return date.fromisoformat(valor) if valor else None
    except (ValueError, TypeError):
        return None


@login_required
def home(request):
    """Dashboard. Em requisições HTMX, devolve só o painel (para o filtro de data)."""
    di = _parse_data(request.GET.get("data_inicio"))
    df = _parse_data(request.GET.get("data_fim"))
    contexto = montar_contexto(di, df)

    if request.headers.get("HX-Request"):
        return render(request, "dashboard/_painel.html", contexto)
    return render(request, "dashboard/home.html", contexto)
