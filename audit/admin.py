from django.contrib import admin

from .models import Log


@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    list_display = ("data_hora", "acao", "iccid", "usuario")
    list_filter = ("acao", "data_hora")
    search_fields = ("iccid",)
    readonly_fields = ("id", "acao", "iccid", "usuario", "data_hora", "resultado")
    ordering = ("-data_hora",)
