import uuid

from django.conf import settings
from django.db import models


class Log(models.Model):
    """Registro de auditoria de uma operação realizada no sistema."""

    class Acao(models.TextChoices):
        CRIAR_LOTE = "criar_lote", "Criar lote"
        RENOMEAR_LOTE = "renomear_lote", "Renomear lote"
        LEITURA = "leitura", "Leitura de ICCID"
        CORRECAO = "correcao", "Correção manual"
        REMOVER_CHIP = "remover_chip", "Remover chip"
        APROVAR_LOTE = "aprovar_lote", "Aprovar lote"
        CANCELAR_LOTE = "cancelar_lote", "Cancelar lote"
        EXCLUIR_LOTE = "exclusao_lote", "Excluir lote"
        EXPORTAR = "exportar", "Exportar lote"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    acao = models.CharField(max_length=50, choices=Acao.choices)
    iccid = models.CharField(max_length=22, blank=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="logs",
    )
    data_hora = models.DateTimeField(auto_now_add=True)
    resultado = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-data_hora"]
        verbose_name = "Log"
        verbose_name_plural = "Logs"

    def __str__(self):
        return f"{self.get_acao_display()} — {self.data_hora:%d/%m/%Y %H:%M}"
