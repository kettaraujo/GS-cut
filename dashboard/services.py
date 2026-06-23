"""Agregações para o dashboard operacional.

As agregações leves (KPIs, séries dos gráficos) são cacheadas por 60s via
``core.cache`` (invalidado por signals). As leituras recentes (registros reais)
vêm sempre do banco, conforme a regra do projeto.
"""

from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from chips.models import Chip
from core.cache import get_or_set_versioned
from lotes.models import Lote

CACHE_TIMEOUT = 60


def _intervalo(data_inicio=None, data_fim=None):
    """Normaliza o intervalo; default = hoje. Garante início <= fim."""
    hoje = timezone.localdate()
    di = data_inicio or hoje
    df = data_fim or hoje
    if df < di:
        di, df = df, di
    return di, df


def _variacao(atual, anterior):
    """Variação percentual vs período anterior (None se não comparável)."""
    if anterior == 0:
        return 100.0 if atual else 0.0
    return round((atual - anterior) / anterior * 100, 1)


def kpis(data_inicio=None, data_fim=None):
    """4 KPIs do período, com variação vs período anterior de mesmo tamanho.

    'Cancelados' da spec foi omitido (desligamento fora do MVP); no lugar
    usamos 'Lotes em aberto'.
    """
    di, df = _intervalo(data_inicio, data_fim)

    def _calc():
        dias = (df - di).days + 1
        prev_df = di - timedelta(days=1)
        prev_di = prev_df - timedelta(days=dias - 1)

        def _conta(ini, fim):
            chips = Chip.objects.filter(is_active=True, data_leitura__date__range=(ini, fim))
            return {
                "lidos": chips.count(),
                "erros": chips.filter(status_leitura=Chip.StatusLeitura.ERRO).count(),
                "em_revisao": chips.filter(status_revisao=Chip.StatusRevisao.AGUARDANDO).count(),
            }

        atual = _conta(di, df)
        anterior = _conta(prev_di, prev_df)
        lotes_aberto = (
            Lote.objects.ativos()
            .filter(status__in=[Lote.Status.ABERTO, Lote.Status.EM_REVISAO])
            .count()
        )
        return {
            "lidos": {"valor": atual["lidos"], "var": _variacao(atual["lidos"], anterior["lidos"])},
            "em_revisao": {"valor": atual["em_revisao"], "var": _variacao(atual["em_revisao"], anterior["em_revisao"])},
            "erros": {"valor": atual["erros"], "var": _variacao(atual["erros"], anterior["erros"])},
            "lotes_aberto": {"valor": lotes_aberto, "var": None},
        }

    return get_or_set_versioned("dash_kpis", [di, df], _calc, CACHE_TIMEOUT)


def serie_leituras(data_inicio=None, data_fim=None):
    """Leituras por dia para o gráfico de linha.

    Se o intervalo for de um único dia (default), mostra os últimos 7 dias.
    """
    di, df = _intervalo(data_inicio, data_fim)
    if di == df:
        df = timezone.localdate()
        di = df - timedelta(days=6)

    def _calc():
        qs = (
            Chip.objects.filter(is_active=True, data_leitura__date__range=(di, df))
            .values("data_leitura__date")
            .annotate(total=Count("id"))
        )
        mapa = {r["data_leitura__date"]: r["total"] for r in qs}
        labels, valores, dia = [], [], di
        while dia <= df:
            labels.append(dia.strftime("%d/%m"))
            valores.append(mapa.get(dia, 0))
            dia += timedelta(days=1)
        return {"labels": labels, "valores": valores}

    return get_or_set_versioned("dash_serie", [di, df], _calc, CACHE_TIMEOUT)


def distribuicao_status():
    """Distribuição atual dos chips por status (donut)."""

    def _calc():
        base = Chip.objects.filter(is_active=True)
        segmentos = [
            ("Aguardando", base.filter(status_revisao=Chip.StatusRevisao.AGUARDANDO).count(), "#ffc107"),
            ("Aprovado", base.filter(status_revisao=Chip.StatusRevisao.APROVADO).count(), "#198754"),
            ("Rejeitado", base.filter(status_revisao=Chip.StatusRevisao.REJEITADO).count(), "#dc3545"),
            ("Erro de leitura", base.filter(status_leitura=Chip.StatusLeitura.ERRO).count(), "#6c757d"),
        ]
        return {
            "labels": [s[0] for s in segmentos],
            "valores": [s[1] for s in segmentos],
            "cores": [s[2] for s in segmentos],
            "total": base.count(),
        }

    return get_or_set_versioned("dash_distrib", [], _calc, CACHE_TIMEOUT)


def leituras_recentes(limite=50):
    """50 leituras mais recentes — sempre do banco (não cacheado)."""
    return list(
        Chip.objects.filter(is_active=True)
        .select_related("lote", "usuario")
        .order_by("-data_leitura")[:limite]
    )


def _presets():
    """Atalhos de período para o filtro (Hoje · Últimos 7 dias · Este mês)."""
    hoje = timezone.localdate()
    return {
        "hoje": {"di": hoje, "df": hoje},
        "semana": {"di": hoje - timedelta(days=6), "df": hoje},
        "mes": {"di": hoje.replace(day=1), "df": hoje},
    }


def montar_contexto(data_inicio=None, data_fim=None):
    """Monta todo o contexto do dashboard para a view."""
    di, df = _intervalo(data_inicio, data_fim)
    return {
        "data_inicio": di,
        "data_fim": df,
        "kpis": kpis(di, df),
        "serie": serie_leituras(data_inicio, data_fim),
        "distrib": distribuicao_status(),
        "leituras": leituras_recentes(),
        "presets": _presets(),
    }
