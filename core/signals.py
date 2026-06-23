"""Invalidação de cache ao modificar Chips e Lotes (SPEC008).

Qualquer alteração nos dados que alimentam dashboard/listagens incrementa a
versão do cache, tornando as entradas antigas inalcançáveis.
"""

from django.db.models.signals import post_delete, post_save

from chips.models import Chip
from lotes.models import Lote

from .cache import bump_version


def _invalidar_cache(sender, **kwargs):
    bump_version()


for _signal in (post_save, post_delete):
    for _model in (Chip, Lote):
        _signal.connect(
            _invalidar_cache,
            sender=_model,
            dispatch_uid=f"chipcut_cache_{_signal}_{_model.__name__}",
        )
