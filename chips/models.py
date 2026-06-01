import uuid

from django.conf import settings
from django.db import models

from lotes.models import Lote


def chip_imagem_path(instance, filename):
    return f"chips/{instance.lote_id}/{filename}"


class Chip(models.Model):
    """Um chip SIM lido, vinculado a um lote."""

    class StatusLeitura(models.TextChoices):
        SUCESSO = "sucesso", "Sucesso"
        ERRO = "erro", "Erro"
        PENDENTE = "pendente", "Pendente"

    class StatusRevisao(models.TextChoices):
        AGUARDANDO = "aguardando_aprovacao", "Aguardando aprovação"
        APROVADO = "aprovado", "Aprovado"
        REJEITADO = "rejeitado", "Rejeitado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE, related_name="chips")
    sequencia = models.PositiveIntegerField(default=1)
    iccid = models.CharField(max_length=22, blank=True)
    imagem = models.ImageField(upload_to=chip_imagem_path)
    imagem_tentativa_2 = models.ImageField(
        upload_to=chip_imagem_path, null=True, blank=True
    )
    tentativas = models.PositiveSmallIntegerField(default=1)
    status_leitura = models.CharField(
        max_length=10, choices=StatusLeitura.choices, default=StatusLeitura.PENDENTE
    )
    status_revisao = models.CharField(
        max_length=20, choices=StatusRevisao.choices, default=StatusRevisao.AGUARDANDO
    )
    corrigido_manualmente = models.BooleanField(default=False)
    data_leitura = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="chips_lidos",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["lote", "sequencia"]
        verbose_name = "Chip"
        verbose_name_plural = "Chips"

    def __str__(self):
        return self.iccid or f"Chip #{self.sequencia} (sem leitura)"
