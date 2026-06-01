"""Serviço de auditoria: ponto único para registrar operações."""

from .models import Log


def log_action(acao, usuario=None, iccid="", resultado=None):
    """Cria um registro de auditoria.

    Args:
        acao: um valor de ``Log.Acao``.
        usuario: ``User`` que executou a ação (ou ``None``).
        iccid: ICCID afetado, quando aplicável.
        resultado: dict serializável com detalhes da operação.
    """
    return Log.objects.create(
        acao=acao,
        usuario=usuario,
        iccid=iccid or "",
        resultado=resultado or {},
    )
