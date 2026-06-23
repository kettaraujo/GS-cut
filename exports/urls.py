from django.urls import path

from . import views

app_name = "exports"

urlpatterns = [
    path("lote/<uuid:lote_id>/excel/", views.lote_excel, name="lote_excel"),
    path("todos/excel/", views.todos_excel, name="todos_excel"),
]
