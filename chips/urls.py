from django.urls import path

from . import views

app_name = "chips"

urlpatterns = [
    # Tela de leitura em massa (sessão)
    path("", views.leitura, name="leitura"),
    path("capturar/", views.leitura_capturar, name="leitura_capturar"),
    path("capturar-camera/", views.leitura_capturar_camera, name="leitura_capturar_camera"),
    path("camera/preview/", views.camera_preview, name="camera_preview"),
    path("corrigir/<uuid:chip_id>/", views.leitura_corrigir, name="leitura_corrigir"),
    path("remover/<uuid:chip_id>/", views.leitura_remover, name="leitura_remover"),
    path("novo-lote/", views.leitura_novo_lote, name="leitura_novo_lote"),
    # Revisão pós-captura (SPEC4)
    path("revisao/<uuid:lote_id>/", views.revisao, name="revisao"),
    path("revisao/<uuid:lote_id>/confirmar/", views.revisao_confirmar, name="revisao_confirmar"),
    # Compatibilidade (redireciona para a leitura com o lote ativo)
    path("lote/<uuid:lote_id>/ler/", views.capture, name="capture"),
    # Ações sobre chips individuais (revisão do lote)
    path("<uuid:chip_id>/corrigir/", views.corrigir, name="corrigir"),
    path("<uuid:chip_id>/remover/", views.remover, name="remover"),
]
