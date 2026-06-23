from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.db.models import Count, Q
from django.http import HttpResponse, HttpResponseNotAllowed, QueryDict
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from .models import Lote
from .services import (
    aprovar_lote,
    cancelar_lote,
    criar_lote,
    excluir_lote,
    renomear_lote,
)

# Abas da listagem de lotes (spec5), em ordem de prioridade visual. Cada aba
# filtra por um status ativo; o texto de contexto guia o usuário (SPEC3011).
# A aba padrão é "em_revisao" (maior prioridade operacional).
ABAS = [
    {"aba": "em_revisao", "titulo": "Em Revisão",
     "subtitulo": "Estes lotes foram lidos e aguardam sua aprovação para cancelamento.",
     "status": [Lote.Status.EM_REVISAO]},
    {"aba": "em_andamento", "titulo": "Em Andamento",
     "subtitulo": "Lotes com leitura em progresso. Continue adicionando chips.",
     "status": [Lote.Status.ABERTO]},
    {"aba": "aprovados", "titulo": "Aprovados",
     "subtitulo": 'Prontos para cancelamento. Clique em "Iniciar Cancelamento".',
     "status": [Lote.Status.APROVADO]},
]
ABAS_VALIDAS = {a["aba"] for a in ABAS}
ABA_PADRAO = "em_revisao"
# Histórico (accordion fechado): finalizados. Fora das 3 abas (spec5 §8).
STATUS_HISTORICO = [Lote.Status.EXPORTADO, Lote.Status.CANCELADO]


def _base_lotes():
    return (
        Lote.objects.ativos()
        .select_related("usuario", "aprovado_por")
        .annotate(
            n_chips=Count("chips", filter=Q(chips__is_active=True), distinct=True),
            n_erros=Count(
                "chips",
                filter=Q(chips__is_active=True, chips__status_leitura="erro"),
                distinct=True,
            ),
        )
    )


@login_required
def lote_list(request):
    """Lotes em abas por status ativo (spec5) + histórico em accordion.

    A aba ativa vem do query param ?aba=; valor inválido cai para o padrão.
    As 3 listas são sempre renderizadas — a troca de aba é feita no cliente
    (Alpine + history.pushState), sem recarregar a página.
    """
    aba_ativa = request.GET.get("aba", ABA_PADRAO)
    if aba_ativa not in ABAS_VALIDAS:
        aba_ativa = ABA_PADRAO

    todos = list(_base_lotes())

    def por_status(status):
        return [lote for lote in todos if lote.status in status]

    secoes = [
        {"aba": a["aba"], "titulo": a["titulo"], "subtitulo": a["subtitulo"],
         "lotes": por_status(a["status"])}
        for a in ABAS
    ]
    contagens = {s["aba"]: len(s["lotes"]) for s in secoes}
    historico = por_status(STATUS_HISTORICO)
    return render(request, "lotes/lote_list.html", {
        "secoes": secoes,
        "aba_ativa": aba_ativa,
        "count_em_revisao": contagens["em_revisao"],
        "count_em_andamento": contagens["em_andamento"],
        "count_aprovados": contagens["aprovados"],
        "historico": historico,
    })


@login_required
def lote_renomear(request, lote_id):
    """Renomear lote inline (HTMX click-to-edit). GET=form, PATCH=aplica."""
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)

    if request.method == "PATCH":
        params = QueryDict(request.body)
        try:
            renomear_lote(lote, params.get("nome"), request.user)
        except ValidationError as exc:
            return render(request, "lotes/_nome_edit.html", {"lote": lote, "erro": exc.messages[0]})
        return render(request, "lotes/_nome_display.html", {"lote": lote})

    if request.method == "GET":
        template = "lotes/_nome_edit.html" if request.GET.get("edit") else "lotes/_nome_display.html"
        return render(request, template, {"lote": lote})

    return HttpResponseNotAllowed(["GET", "PATCH"])


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


# Abas internas da tela de detalhes do lote (spec5 §2): cada uma filtra os
# chips por status de revisão. A aba padrão é "aguardando".
REVISAO_ABAS = [
    {"status": "aguardando_aprovacao", "aba": "aguardando", "titulo": "Aguardando",
     "cor": "aba-amarela", "icone": "bi-clock-history", "badge": "bg-warning text-dark"},
    {"status": "aprovado", "aba": "aprovados", "titulo": "Aprovados",
     "cor": "aba-verde", "icone": "bi-check-circle", "badge": "bg-success"},
    {"status": "rejeitado", "aba": "rejeitados", "titulo": "Rejeitados",
     "cor": "aba-vermelha", "icone": "bi-x-circle", "badge": "bg-danger"},
]
REVISAO_ABAS_VALIDAS = {a["aba"] for a in REVISAO_ABAS}


@login_required
def lote_review(request, lote_id):
    """Detalhe do lote: chips separados por status de revisão em abas (spec5 §2).

    Os três grupos são sempre renderizados; a troca de aba é no cliente
    (gsTabs + ?aba=), sem recarregar a página.
    """
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    aba = request.GET.get("aba", "aguardando")
    if aba not in REVISAO_ABAS_VALIDAS:
        aba = "aguardando"

    chips = lote.chips.filter(is_active=True).select_related("usuario").order_by("sequencia")
    secoes = [
        {**a, "chips": [c for c in chips if c.status_revisao == a["status"]]}
        for a in REVISAO_ABAS
    ]
    contagens = {s["aba"]: len(s["chips"]) for s in secoes}
    return render(request, "lotes/lote_review.html", {
        "lote": lote,
        "secoes": secoes,
        "aba_ativa": aba,
        "count_aguardando": contagens["aguardando"],
        "count_aprovados": contagens["aprovados"],
        "count_rejeitados": contagens["rejeitados"],
    })


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


@login_required
def lote_excluir(request, lote_id):
    """Exclui (soft delete) o lote e seus chips (SPEC4012). Aceita POST ou
    DELETE; com HTMX responde HX-Redirect para a listagem."""
    if request.method not in ("POST", "DELETE"):
        return HttpResponseNotAllowed(["POST", "DELETE"])
    lote = get_object_or_404(Lote.objects.ativos(), pk=lote_id)
    try:
        excluir_lote(lote, request.user)
    except ValidationError as exc:
        messages.error(request, exc.messages[0])
        if request.headers.get("HX-Request"):
            resp = HttpResponse(status=204)
            resp["HX-Redirect"] = reverse("lotes:review", args=[lote.id])
            return resp
        return redirect("lotes:review", lote_id=lote.id)

    messages.warning(request, f"Lote “{lote.nome}” excluído.")
    if request.headers.get("HX-Request"):
        resp = HttpResponse(status=204)
        resp["HX-Redirect"] = reverse("lotes:list")
        return resp
    return redirect("lotes:list")
