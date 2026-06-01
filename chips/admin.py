from django.contrib import admin

from .models import Chip


@admin.register(Chip)
class ChipAdmin(admin.ModelAdmin):
    list_display = ("sequencia", "iccid", "lote", "status_leitura", "tentativas", "data_leitura")
    list_filter = ("status_leitura", "status_revisao", "corrigido_manualmente")
    search_fields = ("iccid",)
    readonly_fields = ("id", "data_leitura")
