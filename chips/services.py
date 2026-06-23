"""Regras de negócio dos chips: leitura por IA, correção e remoção."""

import logging

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max

from audit.models import Log
from audit.services import log_action
from core.services.supabase_storage import (
    SupabaseStorageError,
    SupabaseStorageService,
)
from ocr.services import OCRBackendError, ler_iccid
from ocr.validation import validar_iccid

from .models import Chip

logger = logging.getLogger(__name__)

MAX_TENTATIVAS = 2


def _proxima_sequencia(lote):
    atual = lote.chips.aggregate(m=Max("sequencia"))["m"] or 0
    return atual + 1


@transaction.atomic
def processar_captura(lote, imagem_file, usuario, max_tentativas=MAX_TENTATIVAS):
    """Lê o ICCID da imagem (até ``max_tentativas`` chamadas à IA) e cria o Chip.

    Retorna um dict com ``chip``, ``sucesso``, ``tentativas``, ``iccid`` e ``erro``.
    O chip é sempre persistido — mesmo em caso de erro — para permitir correção
    manual ou nova foto pelo operador.
    """
    if not lote.editavel:
        raise ValidationError("Este lote não aceita mais leituras.")

    image_bytes = imagem_file.read()
    if not image_bytes:
        raise ValidationError("Imagem vazia.")

    iccid = ""
    erro = ""
    sucesso = False
    tentativa = 0

    for tentativa in range(1, max_tentativas + 1):
        try:
            leitura = ler_iccid(image_bytes)
        except OCRBackendError as exc:
            erro = str(exc)
            logger.warning("OCR tentativa %s: falha de backend: %s", tentativa, exc)
            continue
        resultado = validar_iccid(leitura)
        logger.info(
            "OCR tentativa %s: leitura=%r valido=%s erro=%s",
            tentativa, leitura, resultado.is_valid, resultado.error,
        )
        iccid = resultado.iccid or iccid
        if resultado.is_valid:
            sucesso = True
            erro = ""
            break
        erro = resultado.error

    # Por padrão a FOTO NÃO é salva: a imagem é usada só para o OCR e descartada
    # — apenas o ICCID/infos vão ao banco. Para arquivar as imagens no Supabase,
    # defina CHIP_SALVAR_IMAGEM=True no .env.
    imagem_url = None
    if settings.CHIP_SALVAR_IMAGEM:
        try:
            imagem_url = SupabaseStorageService.upload(
                image_bytes, iccid=iccid, tentativa=tentativa or 1
            )
        except SupabaseStorageError:
            imagem_url = None

    chip = Chip(
        lote=lote,
        sequencia=_proxima_sequencia(lote),
        iccid=iccid if sucesso else "",
        imagem_url=imagem_url or "",
        tentativas=tentativa or 1,
        status_leitura=Chip.StatusLeitura.SUCESSO if sucesso else Chip.StatusLeitura.ERRO,
        usuario=usuario,
    )
    chip.save()

    # O lote entra em revisão assim que recebe a primeira leitura.
    if lote.status == lote.Status.ABERTO:
        lote.status = lote.Status.EM_REVISAO
        lote.save(update_fields=["status"])

    log_action(
        Log.Acao.LEITURA,
        usuario=usuario,
        iccid=chip.iccid,
        resultado={
            "lote_id": str(lote.id),
            "chip_id": str(chip.id),
            "sucesso": sucesso,
            "tentativas": chip.tentativas,
            "erro": erro,
        },
    )

    return {
        "chip": chip,
        "sucesso": sucesso,
        "tentativas": chip.tentativas,
        "iccid": chip.iccid,
        "erro": erro,
    }


def corrigir_iccid(chip, novo_valor, usuario):
    """Aplica correção manual ao ICCID, validando o novo valor."""
    if not chip.lote.editavel:
        raise ValidationError("O lote não permite mais alterações.")

    resultado = validar_iccid(novo_valor)
    if not resultado.is_valid:
        raise ValidationError(resultado.error)

    anterior = chip.iccid
    chip.iccid = resultado.iccid
    chip.corrigido_manualmente = True
    chip.status_leitura = Chip.StatusLeitura.SUCESSO
    chip.save(update_fields=["iccid", "corrigido_manualmente", "status_leitura"])

    log_action(
        Log.Acao.CORRECAO,
        usuario=usuario,
        iccid=chip.iccid,
        resultado={"chip_id": str(chip.id), "anterior": anterior, "novo": chip.iccid},
    )
    return chip


def remover_chip(chip, usuario):
    """Remove o chip do lote (soft delete)."""
    if not chip.lote.editavel:
        raise ValidationError("O lote não permite mais alterações.")
    chip.is_active = False
    chip.save(update_fields=["is_active"])
    log_action(
        Log.Acao.REMOVER_CHIP,
        usuario=usuario,
        iccid=chip.iccid,
        resultado={"chip_id": str(chip.id), "lote_id": str(chip.lote_id)},
    )
    return chip
