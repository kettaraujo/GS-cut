import uuid

from django.conf import settings
from django.db import models


class LoteQuerySet(models.QuerySet):
    def ativos(self):
        return self.filter(is_active=True)


class Lote(models.Model):
    """Agrupamento de chips lidos para revisão e aprovação em conjunto."""

    class Status(models.TextChoices):
        ABERTO = "aberto", "Aberto"
        EM_REVISAO = "em_revisao", "Em revisão"
        APROVADO = "aprovado", "Aprovado"
        EXPORTADO = "exportado", "Exportado"
        CANCELADO = "cancelado", "Cancelado"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ABERTO
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="lotes",
    )
    aprovado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lotes_aprovados",
    )
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_aprovacao = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    objects = LoteQuerySet.as_manager()

    class Meta:
        ordering = ["-data_criacao"]
        verbose_name = "Lote"
        verbose_name_plural = "Lotes"

    def __str__(self):
        return self.nome

    @property
    def quantidade(self):
        """Total de chips ativos no lote."""
        return self.chips.filter(is_active=True).count()

    @property
    def editavel(self):
        """O lote ainda pode receber/alterar chips?"""
        return self.status in {self.Status.ABERTO, self.Status.EM_REVISAO}
