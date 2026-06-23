"""URL configuration for the ChipCut project."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # Autenticação (templates em templates/registration/)
    path("login/", auth_views.LoginView.as_view(), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    # Apps
    path("", include("dashboard.urls")),
    path("lotes/", include("lotes.urls")),
    path("chips/", include("chips.urls")),
    path("exportar/", include("exports.urls")),
    path("auditoria/", include("audit.urls")),
]

# Imagens dos chips agora ficam no Supabase Storage (SPEC3 §1.11), então não há
# mais MEDIA para servir. Apenas os estáticos em desenvolvimento.
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / "static")
