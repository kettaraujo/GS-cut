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


def renomear_lote(lote, novo_nome, usuario):
    """Renomeia o lote (3–100 caracteres) e registra a alteração."""
    novo_nome = (novo_nome or "").strip()
    if len(novo_nome) < 3:
        raise ValidationError("O nome deve ter pelo menos 3 caracteres.")
    if len(novo_nome) > 100:
        raise ValidationError("O nome deve ter no máximo 100 caracteres.")

    anterior = lote.nome
    lote.nome = novo_nome
    lote.save(update_fields=["nome"])
    log_action(Log.Acao.RENOMEAR_LOTE, usuario=usuario,
               resultado={"lote_id": str(lote.id), "anterior": anterior, "novo": novo_nome})
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


# Status finais que NÃO podem ser excluídos (SPEC4010) — preservam histórico/
# auditoria. Só lotes editáveis (aberto/em_revisao) podem ser excluídos.
EXCLUIVEIS = {Lote.Status.ABERTO, Lote.Status.EM_REVISAO}


@transaction.atomic
def excluir_lote(lote, usuario):
    """Soft-delete do lote e de todos os chips filhos (SPEC4012).

    Permitido apenas para lotes em ``aberto`` ou ``em_revisao``. Lotes
    aprovados, exportados ou cancelados são preservados para auditoria.
    """
    if lote.status not in EXCLUIVEIS:
        raise ValidationError(
            "Lotes aprovados, exportados ou cancelados não podem ser excluídos."
        )

    n_chips = lote.chips.filter(is_active=True).count()
    lote.chips.filter(is_active=True).update(is_active=False)
    lote.is_active = False
    lote.save(update_fields=["is_active"])

    log_action(Log.Acao.EXCLUIR_LOTE, usuario=usuario,
               resultado={"lote_id": str(lote.id), "nome": lote.nome, "chips": n_chips})
    return lote
