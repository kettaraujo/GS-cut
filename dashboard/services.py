"""Agregações para o dashboard operacional."""

from django.utils import timezone

from chips.models import Chip
from lotes.models import Lote


def indicadores():
    """Retorna os indicadores em tempo real do dia atual."""
    hoje = timezone.localdate()
    chips_hoje = Chip.objects.filter(is_active=True, data_leitura__date=hoje)

    total_hoje = chips_hoje.count()
    sucesso_hoje = chips_hoje.filter(status_leitura=Chip.StatusLeitura.SUCESSO).count()
    erro_hoje = chips_hoje.filter(status_leitura=Chip.StatusLeitura.ERRO).count()
    taxa = round((sucesso_hoje / total_hoje) * 100, 1) if total_hoje else 0.0

    lotes_qs = Lote.objects.ativos()
    em_aberto = lotes_qs.filter(
        status__in=[Lote.Status.ABERTO, Lote.Status.EM_REVISAO]
    ).count()

    return {
        "chips_hoje": total_hoje,
        "sucesso_hoje": sucesso_hoje,
        "erro_hoje": erro_hoje,
        "taxa_sucesso": taxa,
        "lotes_em_aberto": em_aberto,
        "total_lotes": lotes_qs.count(),
    }


def lotes_recentes(limite=5):
    return Lote.objects.ativos()[:limite]
