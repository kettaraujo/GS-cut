from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.http import HttpResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme

from core.services.camera import CameraError, capturar_frame
from lotes.models import Lote
from lotes.services import criar_lote

from .models import Chip
from .services import corrigir_iccid, processar_captura, remover_chip


def _safe_next(request, fallback):
    """Retorna o ``next`` do POST se for um caminho interno seguro."""
    nxt = request.POST.get("next")
    if nxt and url_has_allowed_host_and_scheme(nxt, allowed_hosts={request.get_host()}):
        return nxt
    return fallback

FILA_LIMITE = 30  # quantos chips recentes aparecem na fila da sessão (SPEC3016)


def _lotes_abertos():
    return Lote.objects.ativos().filter(
        status__in=[Lote.Status.ABERTO, Lote.Status.EM_REVISAO]
    ).order_by("-data_criacao")


def _sessao_ctx(lote):
    """Contadores e fila (últimos chips) do lote ativo da sessão de leitura."""
    if not lote:
        return {"fila": [], "contadores": None}
    chips = lote.chips.filter(is_active=True).select_related("usuario")
    total = chips.count()
    sucesso = chips.filter(status_leitura=Chip.StatusLeitura.SUCESSO).count()
    erro = chips.filter(status_leitura=Chip.StatusLeitura.ERRO).count()
    taxa = round(sucesso / total * 100, 1) if total else 0.0
    fila = list(chips.order_by("-data_leitura")[:FILA_LIMITE])
    return {
        "fila": fila,
        "contadores": {"total": total, "sucesso": sucesso, "erro": erro, "taxa": taxa},
    }


def _leitura_url(lote=None):
    url = reverse("chips:leitura")
    return f"{url}?lote={lote.id}" if lote else url


@login_required
def leitura(request):
    """Tela de leitura em massa: seletor de lote, câmera, fila e contadores."""
    lotes = _lotes_abertos()
    lote_id = request.GET.get("lote")
    lote = lotes.filter(pk=lote_id).first() if lote_id else None
    if lote is None:
        lote = lotes.first()
    contexto = {"lotes": lotes, "lote": lote, **_sessao_ctx(lote)}
    return render(request, "chips/leitura.html", contexto)


@login_required
def leitura_capturar(request):
    """Processa uma foto (HTMX) e devolve fila + painel de status + contadores (OOB)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    lote = get_object_or_404(Lote.objects.ativos(), pk=request.POST.get("lote"))

    estado = {"tipo": "aguardando"}
    imagem = request.FILES.get("imagem")
    if not lote.editavel:
        estado = {"tipo": "erro", "msg": "Este lote não aceita mais leituras."}
    elif not imagem:
        estado = {"tipo": "erro", "msg": "Nenhuma imagem enviada."}
    else:
        try:
            resultado = processar_captura(lote, imagem, request.user)
        except ValidationError as exc:
            estado = {"tipo": "erro", "msg": exc.messages[0]}
        else:
            if resultado["sucesso"]:
                tipo = "sucesso2" if resultado["tentativas"] > 1 else "sucesso"
                estado = {"tipo": tipo, "iccid": resultado["iccid"], "chip_id": resultado["chip"].id}
            else:
                estado = {"tipo": "erro", "msg": resultado["erro"] or "Não foi possível ler."}

    contexto = {"lote": lote, "estado": estado, **_sessao_ctx(lote)}
    return render(request, "chips/_captura_resposta.html", contexto)


@login_required
def camera_preview(request):
    """Proxy do snapshot da câmera IP (mesma origem) para preview ao vivo.

    Servir pelo Django evita problemas de credenciais/CORS/mixed-content e
    permite ao navegador desenhar o frame num canvas (detecção automática).
    """
    try:
        frame = capturar_frame(timeout=4)
    except CameraError:
        return HttpResponse(status=503)
    resp = HttpResponse(frame, content_type="image/jpeg")
    resp["Cache-Control"] = "no-store"
    return resp


@login_required
def leitura_capturar_camera(request):
    """Captura um frame da câmera IP (server-side) e processa via OCR (HTMX).

    Mesma resposta de ``leitura_capturar`` (fila + painel + contadores OOB),
    mas a imagem vem da câmera de bancada em vez de um upload do navegador.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    lote = get_object_or_404(Lote.objects.ativos(), pk=request.POST.get("lote"))

    if not lote.editavel:
        estado = {"tipo": "erro", "msg": "Este lote não aceita mais leituras."}
    else:
        try:
            frame = capturar_frame()
            resultado = processar_captura(
                lote, ContentFile(frame, name="camera.jpg"), request.user
            )
        except CameraError as exc:
            estado = {"tipo": "erro", "msg": str(exc)}
        except ValidationError as exc:
            estado = {"tipo": "erro", "msg": exc.messages[0]}
        else:
            if resultado["sucesso"]:
                tipo = "sucesso2" if resultado["tentativas"] > 1 else "sucesso"
                estado = {"tipo": tipo, "iccid": resultado["iccid"], "chip_id": resultado["chip"].id}
            else:
                estado = {"tipo": "erro", "msg": resultado["erro"] or "Não foi possível ler."}

    contexto = {"lote": lote, "estado": estado, **_sessao_ctx(lote)}
    return render(request, "chips/_captura_resposta.html", contexto)


@login_required
def leitura_corrigir(request, chip_id):
    """Correção rápida de um chip a partir da sessão de leitura (HTMX)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    chip = get_object_or_404(Chip, pk=chip_id, is_active=True)
    lote = chip.lote
    try:
        corrigir_iccid(chip, request.POST.get("iccid"), request.user)
        estado = {"tipo": "sucesso", "iccid": chip.iccid}
    except ValidationError as exc:
        estado = {"tipo": "erro", "msg": exc.messages[0]}
    contexto = {"lote": lote, "estado": estado, **_sessao_ctx(lote)}
    return render(request, "chips/_captura_resposta.html", contexto)


@login_required
def leitura_remover(request, chip_id):
    """Remove (desfaz) um chip a partir da sessão de leitura — atalho Ctrl+Z (HTMX)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    chip = get_object_or_404(Chip, pk=chip_id, is_active=True)
    lote = chip.lote
    try:
        remover_chip(chip, request.user)
        estado = {"tipo": "aguardando"}
    except ValidationError as exc:
        estado = {"tipo": "erro", "msg": exc.messages[0]}
    contexto = {"lote": lote, "estado": estado, **_sessao_ctx(lote)}
    return render(request, "chips/_captura_resposta.html", contexto)


@login_required
def leitura_novo_lote(request):
    """Cria um lote a partir do modal da tela de leitura e seleciona-o."""
    if request.method == "POST":
        try:
            lote = criar_lote(request.POST.get("nome"), request.user)
        except ValidationError as exc:
            messages.error(request, exc.messages[0])
            return redirect("chips:leitura")
        messages.success(request, f"Lote “{lote.nome}” criado.")
        return redirect(_leitura_url(lote))
    return redirect("chips:leitura")


@login_required
def capture(request, lote_id):
    """Compatibilidade: a captura per-lote agora é a tela de leitura com o lote ativo."""
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    return redirect(_leitura_url(lote))


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
    return redirect(_safe_next(request, reverse("lotes:review", args=[chip.lote_id])))


@login_required
def revisao(request, lote_id):
    """Tela de revisão pós-captura: todos os chips da sessão antes de confirmar
    o lote (SPEC4005)."""
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    chips = lote.chips.filter(is_active=True).select_related("usuario").order_by("sequencia")
    total = chips.count()
    sucesso = sum(1 for c in chips if c.status_leitura == Chip.StatusLeitura.SUCESSO)
    contadores = {
        "total": total,
        "sucesso": sucesso,
        "erro": total - sucesso,
        "taxa": round(sucesso / total * 100, 1) if total else 0.0,
    }
    contexto = {"lote": lote, "chips": chips, "contadores": contadores}
    return render(request, "chips/revisao.html", contexto)


@login_required
def revisao_confirmar(request, lote_id):
    """Confirma a sessão: garante status em_revisao e vai para o lote (SPEC4007)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    if lote.status == Lote.Status.ABERTO:
        lote.status = Lote.Status.EM_REVISAO
        lote.save(update_fields=["status"])
    messages.success(request, f"Lote “{lote.nome}” confirmado e pronto para aprovação.")
    return redirect("lotes:review", lote_id=lote.id)
