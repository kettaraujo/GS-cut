from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404, redirect, render

from .models import Lote
from .services import aprovar_lote, cancelar_lote, criar_lote


@login_required
def lote_list(request):
    lotes = Lote.objects.ativos()
    return render(request, "lotes/lote_list.html", {"lotes": lotes})


@login_required
def lote_create(request):
    if request.method == "POST":
        try:
            lote = criar_lote(request.POST.get("nome"), request.user)
        except ValidationError as exc:
            messages.error(request, exc.messages[0])
            return render(request, "lotes/lote_form.html",
                          {"nome": request.POST.get("nome", "")})
        messages.success(request, f"Lote “{lote.nome}” criado.")
        return redirect("chips:capture", lote_id=lote.id)
    return render(request, "lotes/lote_form.html")


@login_required
def lote_review(request, lote_id):
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    chips = lote.chips.filter(is_active=True).order_by("sequencia")
    return render(request, "lotes/lote_review.html", {"lote": lote, "chips": chips})


@login_required
def lote_aprovar(request, lote_id):
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    if request.method == "POST":
        try:
            aprovar_lote(lote, request.user)
        except ValidationError as exc:
            messages.error(request, exc.messages[0])
        else:
            messages.success(request, f"Lote “{lote.nome}” aprovado.")
    return redirect("lotes:review", lote_id=lote.id)


@login_required
def lote_cancelar(request, lote_id):
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    if request.method == "POST":
        try:
            cancelar_lote(lote, request.user)
        except ValidationError as exc:
            messages.error(request, exc.messages[0])
        else:
            messages.warning(request, f"Lote “{lote.nome}” cancelado.")
    return redirect("lotes:review", lote_id=lote.id)
