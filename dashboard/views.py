from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .services import indicadores, lotes_recentes


@login_required
def home(request):
    contexto = {
        "ind": indicadores(),
        "lotes": lotes_recentes(),
    }
    return render(request, "dashboard/home.html", contexto)
