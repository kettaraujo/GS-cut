from django.urls import path

from .views import LogListView

app_name = "audit"

urlpatterns = [
    path("", LogListView.as_view(), name="list"),
]
