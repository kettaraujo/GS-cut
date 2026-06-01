from django.urls import path

from . import views

app_name = "lotes"

urlpatterns = [
    path("", views.lote_list, name="list"),
    path("novo/", views.lote_create, name="create"),
    path("<uuid:lote_id>/", views.lote_review, name="review"),
    path("<uuid:lote_id>/aprovar/", views.lote_aprovar, name="aprovar"),
    path("<uuid:lote_id>/cancelar/", views.lote_cancelar, name="cancelar"),
]
