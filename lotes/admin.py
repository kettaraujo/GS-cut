from django.contrib import admin

from .models import Lote


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ("nome", "status", "quantidade", "usuario", "data_criacao")
    list_filter = ("status", "data_criacao")
    search_fields = ("nome",)
    readonly_fields = ("id", "data_criacao", "data_aprovacao")
