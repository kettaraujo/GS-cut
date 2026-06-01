from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404, redirect, render

from lotes.models import Lote

from .models import Chip
from .services import corrigir_iccid, processar_captura, remover_chip


@login_required
def capture(request, lote_id):
    """Tela mobile de captura/leitura de chips de um lote."""
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)

    if request.method == "POST":
        if not lote.editavel:
            messages.error(request, "Este lote não aceita mais leituras.")
            return redirect("lotes:review", lote_id=lote.id)

        imagem = request.FILES.get("imagem")
        if not imagem:
            messages.error(request, "Nenhuma imagem enviada.")
            return redirect("chips:capture", lote_id=lote.id)

        try:
            resultado = processar_captura(lote, imagem, request.user)
        except ValidationError as exc:
            messages.error(request, exc.messages[0])
            return redirect("chips:capture", lote_id=lote.id)

        if resultado["sucesso"]:
            nota = " (validado na 2ª tentativa)" if resultado["tentativas"] > 1 else ""
            messages.success(request, f"ICCID {resultado['iccid']} lido com sucesso{nota}.")
        else:
            messages.error(
                request,
                f"Não foi possível ler o ICCID após {resultado['tentativas']} tentativa(s). "
                f"{resultado['erro']} Reposicione o chip e tente novamente, "
                "ou corrija manualmente na revisão.",
            )
        return redirect("chips:capture", lote_id=lote.id)

    chips = lote.chips.filter(is_active=True).order_by("-sequencia")
    return render(request, "chips/capture.html", {"lote": lote, "chips": chips})


@login_required
def corrigir(request, chip_id):
    chip = get_object_or_404(Chip, pk=chip_id, is_active=True)
    if request.method == "POST":
        try:
            corrigir_iccid(chip, request.POST.get("iccid"), request.user)
        except ValidationError as exc:
            messages.error(request, f"ICCID inválido: {exc.messages[0]}")
        else:
            messages.success(request, "ICCID corrigido.")
    return redirect("lotes:review", lote_id=chip.lote_id)


@login_required
def remover(request, chip_id):
    chip = get_object_or_404(Chip, pk=chip_id, is_active=True)
    if request.method == "POST":
        try:
            remover_chip(chip, request.user)
        except ValidationError as exc:
            messages.error(request, exc.messages[0])
        else:
            messages.warning(request, "Chip removido do lote.")
    return redirect("lotes:review", lote_id=chip.lote_id)
