"""Regras de negócio dos lotes."""

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from audit.models import Log
from audit.services import log_action

from .models import Lote


def criar_lote(nome, usuario):
    """Cria um lote novo no status ABERTO."""
    nome = (nome or "").strip()
    if not nome:
        raise ValidationError("Informe um nome para o lote.")
    lote = Lote.objects.create(nome=nome, usuario=usuario)
    log_action(Log.Acao.CRIAR_LOTE, usuario=usuario,
               resultado={"lote_id": str(lote.id), "nome": lote.nome})
    return lote


@transaction.atomic
def aprovar_lote(lote, usuario):
    """Aprova o lote internamente (sem desligamento — fora do escopo do MVP)."""
    if not lote.editavel:
        raise ValidationError("Este lote não pode ser aprovado no status atual.")
    if lote.quantidade == 0:
        raise ValidationError("Não é possível aprovar um lote sem chips.")

    lote.status = Lote.Status.APROVADO
    lote.aprovado_por = usuario
    lote.data_aprovacao = timezone.now()
    lote.save(update_fields=["status", "aprovado_por", "data_aprovacao"])

    # Marca os chips ativos como aprovados na revisão.
    lote.chips.filter(is_active=True).update(status_revisao="aprovado")

    log_action(Log.Acao.APROVAR_LOTE, usuario=usuario,
               resultado={"lote_id": str(lote.id), "quantidade": lote.quantidade})
    return lote


def cancelar_lote(lote, usuario):
    """Cancela o lote sem executar nenhuma ação sobre os chips."""
    if lote.status in {Lote.Status.CANCELADO}:
        raise ValidationError("Lote já está cancelado.")
    lote.status = Lote.Status.CANCELADO
    lote.save(update_fields=["status"])
    log_action(Log.Acao.CANCELAR_LOTE, usuario=usuario,
               resultado={"lote_id": str(lote.id)})
    return lote
