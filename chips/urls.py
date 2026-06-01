from django.urls import path

from . import views

app_name = "chips"

urlpatterns = [
    path("lote/<uuid:lote_id>/ler/", views.capture, name="capture"),
    path("<uuid:chip_id>/corrigir/", views.corrigir, name="corrigir"),
    path("<uuid:chip_id>/remover/", views.remover, name="remover"),
]
