from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import Log

# A DataTable pagina no cliente; carregamos os registros mais recentes.
LOG_LIMITE = 1000


@login_required
def log_list(request):
    logs = Log.objects.select_related("usuario").all()[:LOG_LIMITE]
    return render(request, "audit/log_list.html", {"logs": logs, "limite": LOG_LIMITE})
